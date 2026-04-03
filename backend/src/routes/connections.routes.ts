import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  createConnection,
  updateConnection,
  listConnections,
} from '../controllers/connections.controller';

const router = Router();

// POST /api/connections — customer sends a connection request
router.post('/', authenticate, requireRole('customer'), createConnection);

// PATCH /api/connections/:id — tutor accepts or declines
router.patch('/:id', authenticate, requireRole('tutor'), updateConnection);

// GET /api/connections — list connections for the logged-in user
router.get('/', authenticate, listConnections);

export default router;
