import express from 'express';
import http from 'http';
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
import { setupSocket } from './socket/socket';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/dancers', dancerRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`DancePay API running on port ${PORT}`);
});

export { io };
