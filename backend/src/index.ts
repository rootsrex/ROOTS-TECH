import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server as SocketServer } from 'socket.io';

import authRoutes from './routes/auth';
import dancerRoutes from './routes/dancers';
import stickerRoutes from './routes/stickers';
import sessionRoutes from './routes/sessions';
import transactionRoutes from './routes/transactions';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import giftRoutes from './routes/gifts';
import { setupSocket } from './socket/socket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === 'production';

// En producción el frontend compilado vive en ../frontend/dist (relativo al proyecto)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const hasFrontend = isProduction && fs.existsSync(frontendDist);

const allowedOrigins = isProduction
  ? [process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '*']
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

const io = new SocketServer(server, {
  cors: { origin: isProduction ? '*' : allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: isProduction ? '*' : allowedOrigins, credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

// Servir frontend estático en producción
if (hasFrontend) {
  app.use(express.static(frontendDist));
}

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

// SPA fallback: cualquier ruta no-API sirve index.html
if (hasFrontend) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

setupSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`DancePay running on port ${PORT} [${isProduction ? 'production' : 'development'}]`);
});

export { io };
