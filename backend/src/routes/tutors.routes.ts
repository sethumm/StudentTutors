import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  listTutors,
  searchTutors,
  getTutorProfile,
  updateTutorProfile,
  updateAvailability,
} from '../controllers/tutors.controller';
import { submitReview, getReviews } from '../controllers/reviews.controller';

const router = Router();

// GET /api/tutors — paginated listing (must be before /:id)
router.get('/', listTutors);

// GET /api/tutors/search — search by subject/yearGroup/day (must be before /:id)
router.get('/search', searchTutors);

// GET /api/tutors/:id — public profile
router.get('/:id', getTutorProfile);

// PUT /api/tutors/:id/profile — authenticated tutor updates own profile
router.put('/:id/profile', authenticate, requireRole('tutor'), updateTutorProfile);

// PUT /api/tutors/:id/availability — authenticated tutor updates own availability
router.put('/:id/availability', authenticate, requireRole('tutor'), updateAvailability);

// POST /api/tutors/:id/reviews — customer submits review
router.post('/:id/reviews', authenticate, requireRole('customer'), submitReview);

// GET /api/tutors/:id/reviews — public review listing
router.get('/:id/reviews', getReviews);

export default router;
