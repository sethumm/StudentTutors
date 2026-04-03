import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { deleteCustomer } from '../controllers/customers.controller';

const router = Router();

// DELETE /api/customers/:id — soft-delete (GDPR)
router.delete('/:id', authenticate, deleteCustomer);

export default router;
