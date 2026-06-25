import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const stickerPackSchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().min(1).max(10),
  description: z.string().max(200).optional(),
  priceUSD: z.number().min(0.5).max(500),
  contentLevel: z.enum(['BASIC', 'PREMIUM', 'EXCLUSIVE']).default('BASIC'),
});

// Crear sticker pack (solo bailarinas)
router.post('/', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  if (!dancer) { res.status(404).json({ error: 'Perfil de bailarina no encontrado' }); return; }

  const parsed = stickerPackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const pack = await prisma.stickerPack.create({
    data: { ...parsed.data, dancerId: dancer.id },
  });
  res.status(201).json(pack);
});

// Listar sticker packs de una bailarina
router.get('/dancer/:dancerId', async (req, res) => {
  const packs = await prisma.stickerPack.findMany({
    where: { dancerId: req.params.dancerId, isActive: true },
    orderBy: { priceUSD: 'asc' },
  });
  res.json(packs);
});

// Mis sticker packs
router.get('/my', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  if (!dancer) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }

  const packs = await prisma.stickerPack.findMany({
    where: { dancerId: dancer.id },
    orderBy: { priceUSD: 'asc' },
  });
  res.json(packs);
});

// Actualizar sticker pack
router.put('/:id', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  const pack = await prisma.stickerPack.findUnique({ where: { id: req.params.id } });

  if (!dancer || !pack || pack.dancerId !== dancer.id) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const parsed = stickerPackSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const updated = await prisma.stickerPack.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(updated);
});

// Desactivar sticker pack
router.delete('/:id', requireAuth, requireRole('DANCER'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.findUnique({ where: { userId: req.user!.id } });
  const pack = await prisma.stickerPack.findUnique({ where: { id: req.params.id } });

  if (!dancer || !pack || pack.dancerId !== dancer.id) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  await prisma.stickerPack.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ message: 'Sticker desactivado' });
});

export default router;
