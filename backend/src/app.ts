import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import dancerRoutes from './routes/dancers';
import stickerRoutes from './routes/stickers';
import sessionRoutes from './routes/sessions';
import transactionRoutes from './routes/transactions';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import giftRoutes from './routes/gifts';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://roots-tech-frontend-g4ur.vercel.app',
];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: isProduction ? '*' : allowedOrigins, credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/dancers', dancerRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gifts', giftRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
