import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Listar bailarinas activas
router.get('/', async (_req, res) => {
  const dancers = await prisma.dancer.findMany({
    include: {
      user: { select: { username: true, createdAt: true } },
      stickerPacks: { where: { isActive: true } },
      _count: { select: { sessions: true, receivedStickers: true } },
    },
    orderBy: { isLive: 'desc' },
  });
  res.json(dancers);
});

// Ver perfil de bailarina
router.get('/:id', async (req, res) => {
  const dancer = await prisma.dancer.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { username: true, createdAt: true } },
      stickerPacks: { where: { isActive: true } },
      sessions: {
        orderBy: { startedAt: 'desc' },
        take: 5,
        where: { endedAt: { not: null } },
      },
    },
  });
  if (!dancer) { res.status(404).json({ error: 'Bailarina no encontrada' }); return; }
  res.json(dancer);
});

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  takenos: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  cedula: z.string().length(10).optional(),
});

// Actualizar perfil (solo la propia bailarina)
router.put('/profile', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  if (!dancer) { res.status(404).json({ error: 'Perfil de bailarina no encontrado' }); return; }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const updated = await prisma.dancer.update({
    where: { id: dancer.id },
    data: parsed.data,
  });
  res.json(updated);
});

// Obtener earnings de la bailarina
router.get('/profile/earnings', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  if (!dancer) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
  const recentTransactions = await prisma.stickerTransaction.findMany({
    where: { dancerId: dancer.id },
    include: {
      sender: { select: { username: true } },
      stickerPack: { select: { name: true, emoji: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({ wallet, recentTransactions });
});

export default router;
