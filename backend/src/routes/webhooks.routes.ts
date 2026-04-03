import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from '../controllers/payments.controller';

const router = Router();

// POST /api/webhooks/stripe — Stripe webhook handler (no auth, raw body required)
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
