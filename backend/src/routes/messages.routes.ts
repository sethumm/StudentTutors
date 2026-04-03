import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMessages, sendMessage } from '../controllers/messages.controller';

const router = Router();

// GET /api/messages/:connectionId — fetch chat history
router.get('/:connectionId', authenticate, getMessages);

// POST /api/messages/:connectionId — send a text message (REST fallback)
router.post('/:connectionId', authenticate, sendMessage);

export default router;
