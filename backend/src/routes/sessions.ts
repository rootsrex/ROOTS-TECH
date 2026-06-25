import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();
const prisma = new PrismaClient();

// Sesiones en vivo activas
router.get('/live', async (_req, res) => {
  const sessions = await prisma.liveSession.findMany({
    where: { endedAt: null },
    include: {
      dancer: {
        select: { displayName: true, avatarUrl: true, contentLevel: true },
      },
    },
    orderBy: { viewerCount: 'desc' },
  });
  res.json(sessions);
});

// Info de sesión específica
router.get('/:id', async (req, res) => {
  const session = await prisma.liveSession.findUnique({
    where: { id: req.params.id },
    include: {
      dancer: {
        include: {
          stickerPacks: { where: { isActive: true }, orderBy: { priceUSD: 'asc' } },
        },
      },
    },
  });
  if (!session) { res.status(404).json({ error: 'Sesión no encontrada' }); return; }
  res.json(session);
});

const startSessionSchema = z.object({
  title: z.string().min(3).max(100),
});

// Iniciar sesión en vivo
router.post('/start', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  if (!dancer) { res.status(404).json({ error: 'Perfil de bailarina no encontrado' }); return; }

  const activeSession = await prisma.liveSession.findFirst({
    where: { dancerId: dancer.id, endedAt: null },
  });
  if (activeSession) { res.status(409).json({ error: 'Ya tienes una sesión activa', sessionId: activeSession.id }); return; }

  const parsed = startSessionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }

  const session = await prisma.liveSession.create({
    data: { dancerId: dancer.id, title: parsed.data.title },
  });

  await prisma.dancer.update({ where: { id: dancer.id }, data: { isLive: true } });

  io.emit('session:started', { sessionId: session.id, dancerId: dancer.id, title: session.title });

  res.status(201).json(session);
});

// Finalizar sesión
router.post('/:id/end', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });

  if (!dancer || !session || session.dancerId !== dancer.id) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const updated = await prisma.liveSession.update({
    where: { id: session.id },
    data: { endedAt: new Date() },
  });
  await prisma.dancer.update({ where: { id: dancer.id }, data: { isLive: false } });

  io.to(`session:${session.id}`).emit('session:ended', { sessionId: session.id });

  res.json(updated);
});

export default router;
