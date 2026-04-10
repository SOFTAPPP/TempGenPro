import { Router } from 'express';
import { 
  getUserEmails, 
  createEmail, 
  deleteEmail, 
  getEmailMessages, 
  generateSimulationOTP, 
  deleteMessage 
} from '../controllers/emailController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getUserEmails as any);
router.post('/generate', createEmail as any);
router.delete('/:id', deleteEmail as any);
router.delete('/messages/:id', deleteMessage as any);
router.get('/:id/messages', getEmailMessages as any);
router.post('/:id/otp', generateSimulationOTP as any);

export default router;
