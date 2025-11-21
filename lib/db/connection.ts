import { Pool } from 'pg';

// NeonDB connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8ocwkTKfJX9z@ep-cold-flower-a4k2fh2k-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('[Database] Connected to NeonDB');
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client', err);
});

export default pool;

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[Database] Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[Database] Query error', { text, error });
    throw error;
  }
}

// Helper function to get a client from the pool for transactions
export async function getClient() {
  const client = await pool.connect();
  return client;
}

