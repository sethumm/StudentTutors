import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { createCheckoutSession, getPaymentHistory } from '../controllers/payments.controller';

const router = Router();

// POST /api/payments/checkout — customer initiates Stripe Checkout
router.post('/checkout', authenticate, requireRole('customer'), createCheckoutSession);

// GET /api/payments/history — customer's payment history
router.get('/history', authenticate, requireRole('customer'), getPaymentHistory);

export default router;
