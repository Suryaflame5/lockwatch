import pg from 'pg';
import { config } from '../config.js';
import { Logger } from '../logger.js';

const { Pool } = pg;

export class PostgresService {
  private static instance: PostgresService;
  private pool: pg.Pool | null = null;

  private constructor() {
    if (config.databaseUrl) {
      const isRemote = config.databaseUrl.includes('neon.tech') || config.databaseUrl.includes('sslmode=require') || !config.databaseUrl.includes('localhost');
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });

      this.pool.on('error', (err: Error) => {
        Logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
      });
    }
  }

  public static getInstance(): PostgresService {
    if (!PostgresService.instance) {
      PostgresService.instance = new PostgresService();
    }
    return PostgresService.instance;
  }

  public getPool(): pg.Pool | null {
    return this.pool;
  }

  public async testConnection(): Promise<{
    connected: boolean;
    database?: string;
    user?: string;
    serverVersion?: string;
    latencyMs?: number;
    error?: string;
  }> {
    if (!this.pool) {
      return {
        connected: false,
        error: 'DATABASE_URL not configured'
      };
    }

    const start = Date.now();
    try {
      const client = await this.pool.connect();
      try {
        const res = await client.query('SELECT current_database() as db, current_user as usr, version() as ver;');
        const latencyMs = Date.now() - start;
        const row = res.rows[0];
        return {
          connected: true,
          database: row.db,
          user: row.usr,
          serverVersion: row.ver.split(' ')[1] || row.ver,
          latencyMs
        };
      } finally {
        client.release();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        connected: false,
        error: message
      };
    }
  }

  public async query<T extends pg.QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<pg.QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Please set DATABASE_URL.');
    }
    return this.pool.query<T>(text, params);
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
