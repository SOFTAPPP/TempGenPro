import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import webhookRoutes from './routes/webhookRoutes';
import adminRoutes from './routes/adminRoutes';
import { visitorLogger } from './middlewares/visitorLogger';

import { createServer } from 'http';
import { initSocket } from './utils/socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Trust proxy is required if running behind Nginx
app.set('trust proxy', 1);

// ⚡ COMPRESSION FIRST: Ensures all responses get gzipped (including API JSON)
app.use(compression({ level: 6, threshold: 1024 }));

// ⚡ SECURITY: Helmet + strict CORS in production
app.use(helmet({
  contentSecurityPolicy: false, // Managed by Nginx
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['https://tempgenpro.com', 'https://www.tempgenpro.com'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-secret'],
  credentials: false,
}));

// ⚡ Parse JSON (10mb limit for large email payloads)
app.use(express.json({ limit: '10mb' }));

// ⚡ Rate Limiting: Webhook gets higher limit, API gets standard
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Per-IP limit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health', // Never rate-limit health checks
});
app.use('/api/', limiter);

// ⚡ Visitor logging (non-blocking, throttled)
app.use(visitorLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[Error] ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
