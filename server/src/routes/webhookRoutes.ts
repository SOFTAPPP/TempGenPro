import { Router } from 'express';
import { receiveEmail } from '../controllers/webhookController';

const router = Router();

router.post('/email', receiveEmail);

export default router;
