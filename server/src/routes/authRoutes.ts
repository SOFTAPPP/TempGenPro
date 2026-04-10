import { Router } from 'express';
import { register, login, getUserProfile } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getUserProfile);

export default router;
