import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface SocketUser {
  id: string;
  role: string;
  username: string;
}

export function setupSocket(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Permitir viewers anónimos con acceso limitado
      (socket as any).user = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUser | null = (socket as any).user;

    // Unirse a sala de sesión
    socket.on('session:join', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('viewer:joined', {
        count: io.sockets.adapter.rooms.get(`session:${sessionId}`)?.size || 0,
      });
    });

    // Salir de sesión
    socket.on('session:leave', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('viewer:left', {
        count: io.sockets.adapter.rooms.get(`session:${sessionId}`)?.size || 0,
      });
    });

    // Bailarina escucha su canal personal
    socket.on('dancer:listen', (dancerId: string) => {
      if (user?.role === 'DANCER') {
        socket.join(`dancer:${dancerId}`);
      }
    });

    // Chat en tiempo real en la sesión
    socket.on('chat:message', ({ sessionId, message }: { sessionId: string; message: string }) => {
      if (!user || !message?.trim() || message.length > 200) return;
      io.to(`session:${sessionId}`).emit('chat:message', {
        userId: user.id,
        username: user.username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      // Cleanup automático por Socket.io
    });
  });
}
