import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();
const prisma = new PrismaClient();

// GET /api/gifts — catálogo de regalos activos
router.get('/', async (_req, res: Response) => {
  const gifts = await prisma.gift.findMany({
    where: { isActive: true },
    orderBy: [{ coinCost: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(gifts);
});

// GET /api/gifts/packages — paquetes de monedas
router.get('/packages', async (_req, res: Response) => {
  const packages = await prisma.coinPackage.findMany({
    where: { isActive: true },
    orderBy: { coins: 'asc' },
  });
  res.json(packages);
});

// POST /api/gifts/topup — solicitar recarga de monedas
router.post('/topup', requireAuth, async (req: AuthRequest, res: Response) => {
  const { packageId, reference } = req.body;
  if (!packageId || !reference) {
    res.status(400).json({ error: 'Paquete y referencia TakeNos requeridos' });
    return;
  }

  const pkg = await prisma.coinPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) {
    res.status(404).json({ error: 'Paquete no encontrado' });
    return;
  }

  const topUp = await prisma.coinTopUp.create({
    data: {
      userId: req.user!.id,
      packageId: pkg.id,
      coins: pkg.coins + pkg.bonus,
      priceUSD: pkg.priceUSD,
      method: 'TAKENOS',
      reference: reference.trim(),
      status: 'PENDING',
    },
  });

  res.status(201).json({ topUp, message: 'Solicitud enviada. El admin aprobará en breve.' });
});

// GET /api/gifts/my-topups — mis solicitudes de recarga
router.get('/my-topups', requireAuth, async (req: AuthRequest, res: Response) => {
  const topUps = await prisma.coinTopUp.findMany({
    where: { userId: req.user!.id },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(topUps);
});

// POST /api/gifts/send — enviar regalo a una bailarina
router.post('/send', requireAuth, async (req: AuthRequest, res: Response) => {
  const { giftId, dancerId, sessionId, quantity = 1, message = '' } = req.body;

  if (!giftId || !dancerId) {
    res.status(400).json({ error: 'Datos incompletos' });
    return;
  }

  const [gift, dancer, wallet] = await Promise.all([
    prisma.gift.findUnique({ where: { id: giftId } }),
    prisma.dancer.findUnique({ where: { id: dancerId } }),
    prisma.wallet.findUnique({ where: { userId: req.user!.id } }),
  ]);

  if (!gift || !gift.isActive) { res.status(404).json({ error: 'Regalo no encontrado' }); return; }
  if (!dancer) { res.status(404).json({ error: 'Bailarina no encontrada' }); return; }
  if (!wallet) { res.status(400).json({ error: 'No tienes billetera' }); return; }

  const totalCoins = gift.coinCost * quantity;
  if (wallet.coinBalance < totalCoins) {
    res.status(400).json({ error: `Monedas insuficientes. Necesitas ${totalCoins}, tienes ${wallet.coinBalance}` });
    return;
  }

  // commission 20% stays on platform, 80% to dancer as coins
  const coinsEarned = Math.floor(totalCoins * 0.8);

  const [tx] = await prisma.$transaction([
    prisma.giftTransaction.create({
      data: {
        senderId: req.user!.id,
        dancerId,
        sessionId: sessionId || null,
        giftId,
        quantity,
        coinsCost: totalCoins,
        coinsEarned,
        message,
      },
      include: { gift: true, sender: { select: { username: true } } },
    }),
    prisma.wallet.update({
      where: { userId: req.user!.id },
      data: { coinBalance: { decrement: totalCoins } },
    }),
    prisma.wallet.update({
      where: { userId: dancer.userId },
      data: { coinBalance: { increment: coinsEarned } },
    }),
  ]);

  // Emitir evento de regalo en tiempo real
  if (sessionId) {
    io.to(`session:${sessionId}`).emit('gift_received', {
      gift: gift,
      sender: req.user!.id,
      senderName: (tx as any).sender?.username,
      quantity,
      message,
      animation: gift.animation,
    });
  }

  res.status(201).json({ transaction: tx, newCoinBalance: wallet.coinBalance - totalCoins });
});

export default router;
