import { Pool } from 'pg';

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://alertio:alertio_dev@localhost:5432/alertio',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(process.env.NODE_ENV === 'production' ? { ssl: { rejectUnauthorized: true } } : {}),
});

export async function query(text: string, params?: unknown[]) {
  const res = await pool.query(text, params);
  return res;
}
