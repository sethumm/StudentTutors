import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getDashboard,
  listUsers,
  updateUserStatus,
  listAllReviews,
  removeReview,
  getAuditLog,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', getDashboard);

// GET /api/admin/users
router.get('/users', listUsers);

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', updateUserStatus);

// GET /api/admin/reviews
router.get('/reviews', listAllReviews);

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', removeReview);

// GET /api/admin/audit
router.get('/audit', getAuditLog);

export default router;
