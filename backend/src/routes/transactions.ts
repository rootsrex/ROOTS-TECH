import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();
const prisma = new PrismaClient();

const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE || '0.20');

const sendStickerSchema = z.object({
  dancerId: z.string().uuid(),
  stickerPackId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  sessionId: z.string().uuid().optional(),
  message: z.string().max(100).optional(),
});

// Enviar sticker (tip) a una bailarina
router.post('/send', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = sendStickerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { dancerId, stickerPackId, quantity, sessionId, message } = parsed.data;

  const [dancer, stickerPack, senderWallet] = await Promise.all([
    prisma.dancer.findUnique({ where: { id: dancerId } }),
    prisma.stickerPack.findUnique({ where: { id: stickerPackId } }),
    prisma.wallet.findUnique({ where: { userId: req.user!.id } }),
  ]);

  if (!dancer) { res.status(404).json({ error: 'Bailarina no encontrada' }); return; }
  if (!stickerPack || !stickerPack.isActive || stickerPack.dancerId !== dancerId) {
    res.status(404).json({ error: 'Sticker no encontrado o inactivo' });
    return;
  }
  if (!senderWallet) { res.status(404).json({ error: 'Billetera no encontrada' }); return; }

  const totalUSD = stickerPack.priceUSD * quantity;
  if (senderWallet.balanceUSD < totalUSD) {
    res.status(402).json({ error: 'Saldo insuficiente', required: totalUSD, balance: senderWallet.balanceUSD });
    return;
  }

  const platformFee = totalUSD * COMMISSION_RATE;
  const dancerEarning = totalUSD - platformFee;

  const [transaction] = await prisma.$transaction([
    prisma.stickerTransaction.create({
      data: {
        senderId: req.user!.id,
        dancerId,
        stickerPackId,
        sessionId: sessionId || null,
        quantity,
        totalUSD,
        platformFee,
        dancerEarning,
        message: message || '',
        status: 'COMPLETED',
      },
      include: {
        sender: { select: { username: true } },
        stickerPack: { select: { name: true, emoji: true, priceUSD: true } },
      },
    }),
    prisma.wallet.update({
      where: { userId: req.user!.id },
      data: { balanceUSD: { decrement: totalUSD } },
    }),
    prisma.wallet.update({
      where: { userId: dancer.userId },
      data: {
        balanceUSD: { increment: dancerEarning },
        totalEarned: { increment: dancerEarning },
      },
    }),
    ...(sessionId ? [
      prisma.liveSession.update({
        where: { id: sessionId },
        data: { totalEarned: { increment: dancerEarning } },
      }),
    ] : []),
  ]);

  // Emitir evento en tiempo real al cuarto de la sesión
  if (sessionId) {
    io.to(`session:${sessionId}`).emit('sticker:received', {
      transaction: {
        id: transaction.id,
        sender: transaction.sender,
        stickerPack: transaction.stickerPack,
        quantity,
        totalUSD,
        dancerEarning,
        message: message || '',
        createdAt: transaction.createdAt,
      },
    });
  }

  io.to(`dancer:${dancerId}`).emit('earning:update', { dancerEarning, totalUSD });

  res.status(201).json({
    transaction: {
      id: transaction.id,
      totalUSD,
      platformFee,
      dancerEarning,
    },
  });
});

// Historial de transacciones del usuario
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  const transactions = await prisma.stickerTransaction.findMany({
    where: { senderId: req.user!.id },
    include: {
      stickerPack: { select: { name: true, emoji: true } },
      dancer: { select: { displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  res.json(transactions);
});

export default router;
