import { Request, Response } from 'express';
import Stripe from 'stripe';
import { z, ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16',
});

// ─── Validators ───────────────────────────────────────────────────────────────

const createPaymentRequestSchema = z.object({
  connectionId: z.string().uuid(),
  amount: z.number().positive(),
});

const checkoutSchema = z.object({
  paymentRequestId: z.string().uuid(),
});

// ─── Task 10.1: POST /api/payment-requests ────────────────────────────────────

export async function createPaymentRequest(req: Request, res: Response): Promise<void> {
  let body: z.infer<typeof createPaymentRequestSchema>;
  try {
    body = createPaymentRequestSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const { connectionId, amount } = body;
  const userId = req.user!.id;

  // Find connection
  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
    include: {
      tutorProfile: { select: { id: true, userId: true } },
      customer: { select: { id: true, userId: true } },
    },
  });

  if (!connection) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }

  // Verify the tutor owns the tutorProfile on this connection
  if (connection.tutorProfile.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Verify connection status is accepted
  if (connection.status !== 'accepted') {
    res.status(400).json({ error: 'Connection is not accepted' });
    return;
  }

  const tutorProfileId = connection.tutorProfile.id;

  // Create message and payment request in a single transaction
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const message = await tx.message.create({
      data: {
        connectionId,
        senderId: userId,
        content: `Payment request: £${amount}`,
        messageType: 'payment_request',
        isRead: false,
      },
      select: {
        id: true,
        content: true,
        messageType: true,
        createdAt: true,
      },
    });

    const paymentRequest = await tx.paymentRequest.create({
      data: {
        connectionId,
        tutorProfileId,
        messageId: message.id,
        amount,
        currency: 'gbp',
        status: 'pending',
      },
      select: {
        id: true,
        connectionId: true,
        tutorProfileId: true,
        messageId: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    return { message, paymentRequest };
  });

  res.status(201).json({
    paymentRequest: result.paymentRequest,
    message: result.message,
  });
}

// ─── Task 10.3: POST /api/payments/checkout ───────────────────────────────────

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  let body: z.infer<typeof checkoutSchema>;
  try {
    body = checkoutSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const { paymentRequestId } = body;
  const userId = req.user!.id;

  // Find payment request
  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
    include: {
      connection: {
        include: {
          customer: { select: { id: true, userId: true } },
        },
      },
    },
  });

  if (!paymentRequest) {
    res.status(404).json({ error: 'Payment request not found' });
    return;
  }

  // Verify status is pending
  if (paymentRequest.status !== 'pending') {
    res.status(400).json({ error: 'Payment request is no longer pending' });
    return;
  }

  // Verify the customer is the one connected to this payment request
  if (paymentRequest.connection.customer.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const customerProfile = paymentRequest.connection.customer;
  const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';

  // Create Stripe Checkout Session
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: Math.round(Number(paymentRequest.amount) * 100),
            product_data: { name: 'Tutoring Session' },
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
      metadata: {
        paymentRequestId,
        customerId: customerProfile.id,
        tutorProfileId: paymentRequest.tutorProfileId,
      },
    });
  } catch (err) {
    res.status(502).json({ error: 'Failed to create checkout session' });
    return;
  }

  // Store stripeSessionId on the payment request via a Payment record placeholder
  // (The actual Payment record is created by the webhook on completion)
  // We update the paymentRequest to track the session id for lookup later
  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: { updatedAt: new Date() },
  });

  res.status(200).json({ sessionUrl: session.url });
}

// ─── Task 10.4: POST /api/webhooks/stripe ─────────────────────────────────────

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { paymentRequestId, customerId, tutorProfileId } = session.metadata ?? {};

    if (paymentRequestId && customerId && tutorProfileId) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.paymentRequest.update({
          where: { id: paymentRequestId },
          data: { status: 'paid' },
        });

        await tx.payment.create({
          data: {
            customerId,
            tutorProfileId,
            paymentRequestId,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | undefined,
            status: 'completed',
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: 'gbp',
          },
        });
      });
    }
  }

  // For payment_intent.payment_failed and all other events, leave status as-is
  res.status(200).json({ received: true });
}

// ─── Task 10.6: GET /api/payments/history ─────────────────────────────────────

export async function getPaymentHistory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!customerProfile) {
    res.status(404).json({ error: 'Customer profile not found' });
    return;
  }

  const payments = await prisma.payment.findMany({
    where: { customerId: customerProfile.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
      tutorProfile: {
        select: { fullName: true },
      },
    },
  });

  type PaymentRow = (typeof payments)[number];

  res.status(200).json({
    payments: payments.map((p: PaymentRow) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
      tutorProfile: { fullName: p.tutorProfile.fullName },
    })),
  });
}
