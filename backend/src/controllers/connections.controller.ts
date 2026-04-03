import { Request, Response } from 'express';
import { ZodError } from 'zod';
import prisma from '../lib/prisma';
import { createConnectionSchema, updateConnectionSchema } from '../validators/connections.validators';

// ─── Task 7.1: POST /api/connections ─────────────────────────────────────────

export async function createConnection(req: Request, res: Response): Promise<void> {
  let body: ReturnType<typeof createConnectionSchema.parse>;
  try {
    body = createConnectionSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const { tutorProfileId } = body;
  const userId = req.user!.id;

  // Verify tutor profile exists and is active
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    include: { user: { select: { emailVerified: true, deletedAt: true } } },
  });

  if (
    !tutorProfile ||
    !tutorProfile.isActive ||
    !tutorProfile.user.emailVerified ||
    tutorProfile.user.deletedAt !== null
  ) {
    res.status(404).json({ error: 'Tutor not found' });
    return;
  }

  // Get the customer's profile
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    res.status(404).json({ error: 'Customer profile not found' });
    return;
  }

  // Check for existing connection
  const existing = await prisma.connection.findFirst({
    where: {
      customerId: customerProfile.id,
      tutorProfileId,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    if (existing.status === 'pending' || existing.status === 'accepted') {
      res.status(409).json({ error: 'A connection already exists' });
      return;
    }

    if (existing.status === 'declined' && existing.declinedAt) {
      const daysSinceDeclined =
        (Date.now() - existing.declinedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDeclined < 30) {
        const daysRemaining = Math.ceil(30 - daysSinceDeclined);
        res.status(409).json({ error: 'Connection request not allowed', daysRemaining });
        return;
      }
    }
  }

  // Create the connection
  const connection = await prisma.connection.create({
    data: {
      customerId: customerProfile.id,
      tutorProfileId,
      status: 'pending',
    },
    select: {
      id: true,
      customerId: true,
      tutorProfileId: true,
      status: true,
      createdAt: true,
    },
  });

  res.status(201).json(connection);
}

// ─── Task 7.3: PATCH /api/connections/:id ────────────────────────────────────

export async function updateConnection(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.id;

  let body: ReturnType<typeof updateConnectionSchema.parse>;
  try {
    body = updateConnectionSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  // Find the connection
  const connection = await prisma.connection.findUnique({
    where: { id },
    include: {
      tutorProfile: { select: { userId: true } },
    },
  });

  if (!connection) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }

  // Verify the authenticated tutor owns the tutor profile on this connection
  if (connection.tutorProfile.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Verify connection is pending
  if (connection.status !== 'pending') {
    res.status(400).json({ error: 'Connection has already been accepted or declined' });
    return;
  }

  const { action } = body;

  const updated = await prisma.connection.update({
    where: { id },
    data:
      action === 'accept'
        ? { status: 'accepted' }
        : { status: 'declined', declinedAt: new Date() },
    select: {
      id: true,
      customerId: true,
      tutorProfileId: true,
      status: true,
      declinedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(200).json(updated);
}

// ─── Task 7.5: GET /api/connections ──────────────────────────────────────────

export async function listConnections(req: Request, res: Response): Promise<void> {
  const { id: userId, role } = req.user!;

  if (role === 'customer') {
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!customerProfile) {
      res.status(404).json({ error: 'Customer profile not found' });
      return;
    }

    const connections = await prisma.connection.findMany({
      where: { customerId: customerProfile.id },
      select: {
        id: true,
        customerId: true,
        tutorProfileId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tutorProfile: {
          select: {
            fullName: true,
            subjects: {
              include: { subject: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      connections: connections.map((c: typeof connections[number]) => ({
        id: c.id,
        customerId: c.customerId,
        tutorProfileId: c.tutorProfileId,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        tutor: {
          fullName: c.tutorProfile.fullName,
          subjects: c.tutorProfile.subjects.map((s: typeof c.tutorProfile.subjects[number]) => s.subject.name),
        },
      })),
    });
    return;
  }

  if (role === 'tutor') {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!tutorProfile) {
      res.status(404).json({ error: 'Tutor profile not found' });
      return;
    }

    const connections = await prisma.connection.findMany({
      where: { tutorProfileId: tutorProfile.id },
      select: {
        id: true,
        customerId: true,
        tutorProfileId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      connections: connections.map((c: typeof connections[number]) => ({
        id: c.id,
        customerId: c.customerId,
        tutorProfileId: c.tutorProfileId,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        customer: {
          fullName: c.customer.fullName,
        },
      })),
    });
    return;
  }

  // Admin or other roles — return empty
  res.status(200).json({ connections: [] });
}
