import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { editReview } from '../controllers/reviews.controller';

const router = Router();

// PUT /api/reviews/:id — customer edits own review
router.put('/:id', authenticate, requireRole('customer'), editReview);

export default router;
