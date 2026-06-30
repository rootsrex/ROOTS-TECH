import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';
import { setupSocket } from './socket/socket';
import { setIo } from './ioManager';

dotenv.config();

const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === 'production';

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const hasFrontend = isProduction && fs.existsSync(frontendDist);

if (hasFrontend) {
  const express = require('express');
  app.use(express.static(frontendDist));
  app.get('*', (_req: any, res: any) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const io = new SocketServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
});

setIo(io);
setupSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`DancePay running on port ${PORT} [${isProduction ? 'production' : 'development'}]`);
});

export { io };
