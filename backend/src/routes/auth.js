import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { login, register, me } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again after 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  login
);

router.post(
  '/register',
  authenticate,
  authorize('institution_admin'),
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  register
);

router.get('/me', authenticate, me);

export default router;
