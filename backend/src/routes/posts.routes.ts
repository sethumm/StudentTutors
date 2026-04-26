import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { listPosts, createPost, deletePost } from '../controllers/posts.controller';

const router = Router();

router.get('/', listPosts);
router.post('/', authenticate, requireRole('tutor'), createPost);
router.delete('/:id', authenticate, requireRole('tutor'), deletePost);

export default router;
