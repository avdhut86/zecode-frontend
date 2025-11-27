// src/lib/prisma.ts
import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://directus:directuspassword@localhost:5432/zecode';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Optimized connection pool settings for serverless
const poolConfig: pg.PoolConfig = {
  connectionString,
  max: 10, // Maximum connections in pool
  min: 2, // Minimum connections to keep
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout after 10 seconds if can't connect
  allowExitOnIdle: true, // Allow process to exit when idle
};

// Create connection pool
const pool = globalForPrisma.pool ?? new pg.Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Create adapter
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

// Graceful shutdown helper
export async function disconnectPrisma() {
  await prisma.$disconnect();
  await pool.end();
}

export default prisma;
