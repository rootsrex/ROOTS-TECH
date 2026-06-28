import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Dashboard con métricas globales
router.get('/stats', requireAuth, requireRole('ADMIN'), async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalDancers, totalTransactions, pendingWithdrawals] = await Promise.all([
    prisma.user.count(),
    prisma.dancer.count(),
    prisma.stickerTransaction.aggregate({
      _sum: { totalUSD: true, platformFee: true, dancerEarning: true },
      _count: true,
    }),
    prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: { wallet: { include: { user: { select: { username: true } } } } },
    }),
  ]);

  res.json({
    totalUsers,
    totalDancers,
    totalTransactions: totalTransactions._count,
    totalVolume: totalTransactions._sum.totalUSD || 0,
    totalRevenue: totalTransactions._sum.platformFee || 0,
    totalDancerEarnings: totalTransactions._sum.dancerEarning || 0,
    pendingWithdrawals,
  });
});

// Aprobar/rechazar retiro
router.put('/withdrawals/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { status, reference, notes } = req.body;
  if (!['COMPLETED', 'REJECTED'].includes(status)) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: req.params.id } });
  if (!withdrawal) { res.status(404).json({ error: 'Retiro no encontrado' }); return; }
  if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
    res.status(409).json({ error: 'El retiro ya fue procesado' });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.update({
      where: { id: req.params.id },
      data: { status, reference: reference || null, notes: notes || '', processedAt: new Date() },
    });

    // Si se rechaza, devolver el dinero
    if (status === 'REJECTED') {
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balanceUSD: { increment: withdrawal.amountUSD },
          totalWithdrawn: { decrement: withdrawal.amountUSD },
        },
      });
    }
    return w;
  });

  res.json(updated);
});

// Verificar bailarina
router.put('/dancers/:id/verify', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const dancer = await prisma.dancer.update({
    where: { id: req.params.id },
    data: { isVerified: req.body.verified ?? true },
  });
  res.json(dancer);
});

// ─── Gestión de monedas ───────────────────────────────────────────────────────

// Listar recargas pendientes
router.get('/coin-topups', requireAuth, requireRole('ADMIN'), async (_req: AuthRequest, res: Response) => {
  const topUps = await prisma.coinTopUp.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { username: true, email: true } }, package: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(topUps);
});

// Aprobar/rechazar recarga
router.put('/coin-topups/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { status, notes } = req.body;
  if (!['COMPLETED', 'REJECTED'].includes(status)) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }

  const topUp = await prisma.coinTopUp.findUnique({ where: { id: req.params.id } });
  if (!topUp || topUp.status !== 'PENDING') {
    res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.coinTopUp.update({
      where: { id: req.params.id },
      data: { status, notes: notes || '', processedAt: new Date() },
    });
    if (status === 'COMPLETED') {
      const totalCoins = topUp.coins + topUp.bonusCoins;
      await tx.wallet.update({
        where: { userId: topUp.userId },
        data: { coinBalance: { increment: totalCoins } },
      });
    }
    return t;
  });

  res.json(updated);
});

// Crear regalo en el catálogo
router.post('/gifts', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { name, emoji, description, coinCost, category, animation, sortOrder } = req.body;
  if (!name || !emoji || !coinCost) {
    res.status(400).json({ error: 'name, emoji y coinCost son requeridos' });
    return;
  }
  const gift = await prisma.gift.create({
    data: { name, emoji, description: description || '', coinCost: Number(coinCost),
      category: category || 'BASIC', animation: animation || 'pop', sortOrder: sortOrder || 0 },
  });
  res.status(201).json(gift);
});

// Crear paquete de monedas
router.post('/coin-packages', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { name, coins, priceUSD, bonus, sortOrder } = req.body;
  if (!name || !coins || !priceUSD) {
    res.status(400).json({ error: 'name, coins y priceUSD son requeridos' });
    return;
  }
  const pkg = await prisma.coinPackage.create({
    data: { name, coins: Number(coins), priceUSD: Number(priceUSD), bonus: Number(bonus || 0), sortOrder: sortOrder || 0 },
  });
  res.status(201).json(pkg);
});

// Actualizar configuración de pagos de la plataforma
router.put('/config', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { takenosAdminId, bankName, bankAccount, bankAccountHolder, usdtWallet, usdtNetwork, takenosBonusCoins, commissionRate } = req.body;
  const config = await prisma.platformConfig.upsert({
    where: { id: 'singleton' },
    update: {
      ...(takenosAdminId !== undefined && { takenosAdminId }),
      ...(bankName !== undefined && { bankName }),
      ...(bankAccount !== undefined && { bankAccount }),
      ...(bankAccountHolder !== undefined && { bankAccountHolder }),
      ...(usdtWallet !== undefined && { usdtWallet }),
      ...(usdtNetwork !== undefined && { usdtNetwork }),
      ...(takenosBonusCoins !== undefined && { takenosBonusCoins: Number(takenosBonusCoins) }),
      ...(commissionRate !== undefined && { commissionRate: Number(commissionRate) }),
    },
    create: { id: 'singleton', takenosAdminId: takenosAdminId || '', bankName: bankName || '', bankAccount: bankAccount || '', bankAccountHolder: bankAccountHolder || '', usdtWallet: usdtWallet || '', usdtNetwork: usdtNetwork || 'TRC20', takenosBonusCoins: 0.5 },
  });
  res.json(config);
});

// GET config pública (métodos de pago)
router.get('/config', requireAuth, requireRole('ADMIN'), async (_req: AuthRequest, res: Response) => {
  const config = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });
  res.json(config);
});

// Listar todos los cobros pendientes de bailarinas (miércoles)
router.get('/payouts', requireAuth, requireRole('ADMIN'), async (_req: AuthRequest, res: Response) => {
  const dancers = await prisma.dancer.findMany({
    include: {
      user: { include: { wallet: true } },
    },
    where: {
      user: { wallet: { coinBalance: { gt: 0 } } },
    },
    orderBy: { displayName: 'asc' },
  });

  const payouts = dancers.map(d => ({
    dancerId: d.id,
    displayName: d.displayName,
    takenos: d.takenos,
    whatsapp: d.whatsapp,
    coinBalance: d.user.wallet?.coinBalance ?? 0,
    estimatedUSD: (d.user.wallet?.coinBalance ?? 0) * 0.01,
  }));

  res.json(payouts);
});

export default router;
