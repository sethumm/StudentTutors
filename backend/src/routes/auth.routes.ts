import { Router } from 'express';
import {
  registerTutor,
  registerCustomer,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register/tutor', registerTutor);
router.post('/register/customer', registerCustomer);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
