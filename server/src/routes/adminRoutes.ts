import express from 'express';
import {
  getAllUserData,
  getStats,
  getVisitorLogs,
  deleteUser,
  updateUser,
  resetUserPassword,
  deleteTempEmail,
  toggleBanUser,
  deleteMessage,
  createUser
} from '../controllers/adminController.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All routes here require authentication and admin role
router.use(authenticateToken as any);
router.use(isAdmin as any);

router.get('/users', getAllUserData as any);
router.get('/stats', getStats as any);
router.get('/visitors', getVisitorLogs as any);
router.post('/users', createUser as any);

// User Management
router.patch('/users/:id', updateUser as any);
router.delete('/users/:id', deleteUser as any);
router.put('/users/:id/password', resetUserPassword as any);
router.post('/users/:id/ban', toggleBanUser as any);

// Email/Message Management
router.delete('/emails/:id', deleteTempEmail as any);
router.delete('/messages/:id', deleteMessage as any);

export default router;
