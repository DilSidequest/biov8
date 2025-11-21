import pool from './connection';
import fs from 'fs';
import path from 'path';

/**
 * Initialize the database by running the schema.sql file
 * This creates all tables, indexes, and triggers
 */
export async function initializeDatabase() {
  try {
    console.log('[Database Init] Starting database initialization...');
    
    // Read the schema.sql file
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('[Database Init] ✅ Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('[Database Init] ❌ Error initializing database:', error);
    throw error;
  }
}

/**
 * Check if database tables exist
 */
export async function checkDatabaseExists() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      );
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error('[Database] Error checking database existence:', error);
    return false;
  }
}

/**
 * Initialize database if it doesn't exist
 */
export async function ensureDatabaseInitialized() {
  const exists = await checkDatabaseExists();
  
  if (!exists) {
    console.log('[Database] Tables do not exist. Initializing...');
    await initializeDatabase();
  } else {
    console.log('[Database] Tables already exist. Skipping initialization.');
  }
}

