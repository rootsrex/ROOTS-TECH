import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y _'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['VIEWER', 'DANCER']),
  displayName: z.string().min(2).max(50).optional(),
  whatsapp: z.string().optional(),
  takenos: z.string().optional(),
  cedula: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ─── Email + Password ────────────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, username, password, role, displayName, whatsapp, takenos, cedula } = parsed.data;

  if (role === 'DANCER') {
    if (!whatsapp) { res.status(400).json({ error: 'El número de WhatsApp es requerido' }); return; }
    if (!takenos) { res.status(400).json({ error: 'El ID de TakeNos es requerido' }); return; }
    if (!cedula) { res.status(400).json({ error: 'La cédula es requerida' }); return; }
  }

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
            whatsapp: whatsapp || '',
            takenos: takenos || '',
            cedula: cedula || '',
          },
        },
      } : {}),
    },
  });

  res.status(201).json({ token: issueToken(user), user: { id: user.id, email, username, role } });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  res.json({ token: issueToken(user), user: { id: user.id, email: user.email, username: user.username, role: user.role } });
});

// ─── Google OAuth ────────────────────────────────────────────────────────────

router.get('/google', (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: 'Google OAuth no configurado. Agrega GOOGLE_CLIENT_ID al servidor.' });
    return;
  }
  const role = (['VIEWER', 'DANCER'].includes(req.query.role as string) ? req.query.role : 'VIEWER') as string;
  const state = Buffer.from(JSON.stringify({ role })).toString('base64');

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code) {
    res.redirect(`${FRONTEND_URL}/login?error=google_cancelled`);
    return;
  }

  try {
    let role = 'VIEWER';
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      role = decoded.role || 'VIEWER';
    } catch { /* ignore bad state */ }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) throw new Error('No access token from Google');

    // Get Google user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser = await userRes.json() as { sub: string; email: string; name: string; picture: string };

    if (!gUser.sub || !gUser.email) throw new Error('Invalid Google profile');

    // Find existing user by googleId or email
    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId: gUser.sub }, { email: gUser.email }] },
    });

    if (existing) {
      if (!existing.googleId) {
        await prisma.user.update({ where: { id: existing.id }, data: { googleId: gUser.sub } });
      }
      const token = issueToken(existing);
      res.redirect(`${FRONTEND_URL}/oauth-callback?token=${token}`);
      return;
    }

    // New user — issue a short-lived setup token
    const setupToken = jwt.sign(
      { googleId: gUser.sub, email: gUser.email, name: gUser.name, picture: gUser.picture, role, type: 'google_setup' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    res.redirect(`${FRONTEND_URL}/oauth-setup?setup_token=${setupToken}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
});

// POST /auth/oauth/setup — complete registration for new Google users
router.post('/oauth/setup', async (req: Request, res: Response) => {
  const { setup_token, username, role, displayName } = req.body;

  if (!setup_token || !username || !role) {
    res.status(400).json({ error: 'Datos incompletos' });
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    res.status(400).json({ error: 'Username inválido: solo letras, números y _ (3-30 caracteres)' });
    return;
  }

  try {
    const payload = jwt.verify(setup_token, process.env.JWT_SECRET!) as any;
    if (payload.type !== 'google_setup') {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username: username.toLowerCase() }, { googleId: payload.googleId }, { email: payload.email }] },
    });
    if (exists) {
      res.status(409).json({ error: exists.username === username.toLowerCase() ? 'Username ya en uso' : 'Email ya registrado' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        username: username.toLowerCase(),
        passwordHash: '',
        googleId: payload.googleId,
        role: role as string,
        wallet: { create: { balanceUSD: 0, totalEarned: 0, totalWithdrawn: 0 } },
        ...(role === 'DANCER' ? {
          dancer: {
            create: {
              displayName: displayName || username,
              avatarUrl: payload.picture || '',
            },
          },
        } : {}),
      },
    });

    res.status(201).json({
      token: issueToken(user),
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar con Google.' });
    } else {
      res.status(400).json({ error: 'Token inválido' });
    }
  }
});

// ─── /me ─────────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { dancer: true, wallet: true },
  });
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  const { passwordHash: _, googleId: __, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
