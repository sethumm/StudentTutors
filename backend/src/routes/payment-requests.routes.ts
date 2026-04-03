import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { createPaymentRequest } from '../controllers/payments.controller';

const router = Router();

// POST /api/payment-requests — tutor sends a payment request
router.post('/', authenticate, requireRole('tutor'), createPaymentRequest);

export default router;
