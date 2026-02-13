import { Pool } from 'pg';

let pool: Pool | null = null;

// Wrapper to make PostgreSQL API similar to better-sqlite3
class DatabaseWrapper {
  private pool: Pool;

  constructor(p: Pool) {
    this.pool = p;
  }

  prepare(sql: string) {
    const self = this;
    // Convert ? placeholders to $1, $2, etc for PostgreSQL
    let paramIndex = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
    
    return {
      async run(...params: any[]) {
        const result = await self.pool.query(pgSql, params);
        return { changes: result.rowCount || 0 };
      },
      async get(...params: any[]) {
        const result = await self.pool.query(pgSql, params);
        return result.rows[0] || undefined;
      },
      async all(...params: any[]) {
        const result = await self.pool.query(pgSql, params);
        return result.rows;
      }
    };
  }

  async exec(sql: string) {
    await this.pool.query(sql);
  }

  transaction<T>(fn: (items: T[]) => Promise<void>) {
    return async (items: T[]) => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await fn(items);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    };
  }
}

let dbWrapper: DatabaseWrapper | null = null;

export async function initializeDatabase(): Promise<void> {
  console.log('Connecting to PostgreSQL...');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Test connection
  await pool.query('SELECT NOW()');
  console.log('PostgreSQL connected successfully');

  dbWrapper = new DatabaseWrapper(pool);

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      is_private INTEGER DEFAULT 0,
      language TEXT DEFAULT 'en',
      theme TEXT DEFAULT 'system',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      is_private INTEGER DEFAULT 0,
      parent_id TEXT,
      max_items INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      external_id TEXT,
      external_type TEXT,
      notes TEXT,
      rank INTEGER NOT NULL,
      is_private INTEGER DEFAULT 0,
      deleted_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('📦 Database initialized');
}

export function getDb(): DatabaseWrapper {
  if (!dbWrapper) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbWrapper;
}
