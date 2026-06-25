import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12);
  const dancerHash = await bcrypt.hash('dancer123', 12);
  const viewerHash = await bcrypt.hash('viewer123', 12);

  // Crear configuración de plataforma
  await prisma.platformConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { commissionRate: 0.20, minWithdrawal: 10, maxWithdrawal: 500 },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dancepay.ec' },
    update: {},
    create: {
      email: 'admin@dancepay.ec',
      username: 'admin',
      passwordHash: adminHash,
      role: 'ADMIN',
      wallet: { create: { balanceUSD: 0, totalEarned: 0, totalWithdrawn: 0 } },
    },
  });

  // Bailarina de prueba
  const dancerUser = await prisma.user.upsert({
    where: { email: 'valentina@dancepay.ec' },
    update: {},
    create: {
      email: 'valentina@dancepay.ec',
      username: 'valentina_dance',
      passwordHash: dancerHash,
      role: 'DANCER',
      wallet: { create: { balanceUSD: 45.60, totalEarned: 120.00, totalWithdrawn: 74.40 } },
      dancer: {
        create: {
          displayName: 'Valentina 💃',
          bio: 'Bailarina profesional de salsa y merengue. ¡Envíame stickers para que baile tu canción favorita!',
          isVerified: true,
          contentLevel: 'BASIC',
        },
      },
    },
    include: { dancer: true },
  });

  if (dancerUser.dancer) {
    // Sticker packs de la bailarina
    await prisma.stickerPack.createMany({
      data: [
        {
          dancerId: dancerUser.dancer.id,
          name: 'Saludo',
          emoji: '👋',
          description: 'Te saludo y digo tu nombre',
          priceUSD: 1.00,
          contentLevel: 'BASIC',
        },
        {
          dancerId: dancerUser.dancer.id,
          name: 'Baile Básico',
          emoji: '💃',
          description: '30 segundos de baile',
          priceUSD: 3.00,
          contentLevel: 'BASIC',
        },
        {
          dancerId: dancerUser.dancer.id,
          name: 'Baile Premium',
          emoji: '🔥',
          description: '1 minuto de baile sensual',
          priceUSD: 10.00,
          contentLevel: 'PREMIUM',
        },
        {
          dancerId: dancerUser.dancer.id,
          name: 'Show Exclusivo',
          emoji: '💎',
          description: 'Show privado de 5 minutos',
          priceUSD: 50.00,
          contentLevel: 'EXCLUSIVE',
        },
      ],
    });
  }

  // Viewer de prueba
  await prisma.user.upsert({
    where: { email: 'viewer@dancepay.ec' },
    update: {},
    create: {
      email: 'viewer@dancepay.ec',
      username: 'fan_ecuador',
      passwordHash: viewerHash,
      role: 'VIEWER',
      wallet: { create: { balanceUSD: 50.00, totalEarned: 0, totalWithdrawn: 0 } },
    },
  });

  console.log('✅ Seed completado');
  console.log('   Admin: admin@dancepay.ec / admin123');
  console.log('   Bailarina: valentina@dancepay.ec / dancer123');
  console.log('   Viewer: viewer@dancepay.ec / viewer123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
