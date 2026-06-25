import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const MIN_WITHDRAWAL = parseFloat(process.env.MIN_WITHDRAWAL || '10');
const MAX_WITHDRAWAL = parseFloat(process.env.MAX_WITHDRAWAL || '500');

// Ver billetera
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
  if (!wallet) { res.status(404).json({ error: 'Billetera no encontrada' }); return; }
  res.json(wallet);
});

// Recargar créditos (en producción esto conectaría a un gateway de pago)
const addCreditsSchema = z.object({
  amountUSD: z.number().min(1).max(1000),
});

router.post('/add-credits', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = addCreditsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }

  const wallet = await prisma.wallet.update({
    where: { userId: req.user!.id },
    data: { balanceUSD: { increment: parsed.data.amountUSD } },
  });
  res.json({ balance: wallet.balanceUSD, added: parsed.data.amountUSD });
});

// Solicitar retiro (bailarinas)
const withdrawalSchema = z.object({
  amountUSD: z.number().min(MIN_WITHDRAWAL).max(MAX_WITHDRAWAL),
  method: z.enum(['TAKENOS', 'BANK_TRANSFER', 'PAYPHONE']),
  destination: z.string().min(5).max(100),
});

router.post('/withdraw', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'DANCER') {
    res.status(403).json({ error: 'Solo bailarinas pueden retirar' });
    return;
  }

  const parsed = withdrawalSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }

  const { amountUSD, method, destination } = parsed.data;
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });

  if (!wallet || wallet.balanceUSD < amountUSD) {
    res.status(402).json({ error: 'Saldo insuficiente', balance: wallet?.balanceUSD || 0 });
    return;
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.create({
      data: {
        walletId: wallet.id,
        amountUSD,
        method,
        destination,
        status: 'PENDING',
      },
    });
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceUSD: { decrement: amountUSD },
        totalWithdrawn: { increment: amountUSD },
      },
    });
    return w;
  });

  res.status(201).json({
    withdrawal: {
      id: withdrawal.id,
      amountUSD: withdrawal.amountUSD,
      method: withdrawal.method,
      destination: withdrawal.destination,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt,
    },
    message: 'Retiro solicitado. Se procesará en 1-2 días hábiles.',
  });
});

// Historial de retiros
router.get('/withdrawals', requireAuth, async (req: AuthRequest, res: Response) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
  if (!wallet) { res.status(404).json({ error: 'Billetera no encontrada' }); return; }

  const withdrawals = await prisma.withdrawal.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(withdrawals);
});

export default router;
