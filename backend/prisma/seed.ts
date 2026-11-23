import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Admin user
  await prisma.adminUser.upsert({
    where: { email: 'admin@er-analyzer.local' },
    update: {},
    create: {
      name: 'Chief Analyst',
      email: 'admin@er-analyzer.local',
      passwordHash: 'argon2-hashed-secure-secret',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user verified. No dummy accounts seeded.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
