import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y _'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['VIEWER', 'DANCER']),
  displayName: z.string().min(2).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, username, password, role, displayName } = parsed.data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (exists) {
    res.status(409).json({ error: 'Email o username ya registrado' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role,
      wallet: { create: { balanceUSD: 0, totalEarned: 0, totalWithdrawn: 0 } },
      ...(role === 'DANCER' ? {
        dancer: {
          create: {
            displayName: displayName || username,
          },
        },
      } : {}),
    },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(201).json({ token, user: { id: user.id, email, username, role } });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      dancer: true,
      wallet: true,
    },
  });
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
