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
      wallet: { create: { balanceUSD: 50.00, coinBalance: 500, totalEarned: 0, totalWithdrawn: 0 } },
    },
  });

  // Paquetes de monedas
  const coinPackages = [
    { name: 'Inicio', coins: 100, priceUSD: 1.00, bonus: 0, sortOrder: 1 },
    { name: 'Básico', coins: 500, priceUSD: 4.50, bonus: 50, sortOrder: 2 },
    { name: 'Popular', coins: 1000, priceUSD: 8.00, bonus: 200, sortOrder: 3 },
    { name: 'Premium', coins: 3000, priceUSD: 22.00, bonus: 800, sortOrder: 4 },
    { name: 'VIP', coins: 10000, priceUSD: 70.00, bonus: 3000, sortOrder: 5 },
  ];

  for (const pkg of coinPackages) {
    await prisma.coinPackage.upsert({
      where: { id: pkg.name.toLowerCase() },
      update: {},
      create: { id: pkg.name.toLowerCase(), ...pkg },
    });
  }

  // Catálogo de regalos
  const gifts = [
    { id: 'rose',     name: 'Rosa',        emoji: '🌹', coinCost: 10,   category: 'BASIC',     animation: 'float',     sortOrder: 1 },
    { id: 'heart',    name: 'Corazón',     emoji: '❤️',  coinCost: 20,   category: 'BASIC',     animation: 'pop',       sortOrder: 2 },
    { id: 'fire',     name: 'Fuego',       emoji: '🔥', coinCost: 50,   category: 'BASIC',     animation: 'pop',       sortOrder: 3 },
    { id: 'kiss',     name: 'Beso',        emoji: '💋', coinCost: 80,   category: 'BASIC',     animation: 'float',     sortOrder: 4 },
    { id: 'star',     name: 'Estrella',    emoji: '⭐', coinCost: 100,  category: 'BASIC',     animation: 'rain',      sortOrder: 5 },
    { id: 'cake',     name: 'Pastel',      emoji: '🎂', coinCost: 150,  category: 'PREMIUM',   animation: 'pop',       sortOrder: 6 },
    { id: 'diamond',  name: 'Diamante',    emoji: '💎', coinCost: 300,  category: 'PREMIUM',   animation: 'explosion', sortOrder: 7 },
    { id: 'crown',    name: 'Corona',      emoji: '👑', coinCost: 500,  category: 'PREMIUM',   animation: 'float',     sortOrder: 8 },
    { id: 'rocket',   name: 'Cohete',      emoji: '🚀', coinCost: 800,  category: 'EXCLUSIVE', animation: 'explosion', sortOrder: 9 },
    { id: 'trophy',   name: 'Trofeo',      emoji: '🏆', coinCost: 1000, category: 'EXCLUSIVE', animation: 'rain',      sortOrder: 10 },
    { id: 'unicorn',  name: 'Unicornio',   emoji: '🦄', coinCost: 2000, category: 'EXCLUSIVE', animation: 'explosion', sortOrder: 11 },
    { id: 'galaxy',   name: 'Galaxia',     emoji: '🌌', coinCost: 5000, category: 'EXCLUSIVE', animation: 'explosion', sortOrder: 12 },
  ];

  for (const gift of gifts) {
    await prisma.gift.upsert({
      where: { id: gift.id },
      update: {},
      create: gift,
    });
  }

  console.log('✅ Seed completado');
  console.log('   Admin: admin@dancepay.ec / admin123');
  console.log('   Bailarina: valentina@dancepay.ec / dancer123');
  console.log('   Viewer: viewer@dancepay.ec / viewer123');
  console.log('   Monedas viewer: 500 🪙');
}

main().catch(console.error).finally(() => prisma.$disconnect());
