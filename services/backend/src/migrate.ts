import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { config } from './config.js';
import { Logger } from './logger.js';

const { Client } = pg;

export async function runMigrations(): Promise<void> {
  const dbUrl = config.databaseUrl || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set. Cannot run migrations.');
  }

  Logger.info('Starting LockWatch production database migrations...');

  const client = new Client({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')
      ? { rejectUnauthorized: false }
      : false
  });

  await client.connect();

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Discover migration directory
    const candidateDirs = [
      path.resolve(process.cwd(), 'database/migrations'),
      path.resolve(process.cwd(), '../database/migrations'),
      path.resolve(process.cwd(), '../../database/migrations'),
      path.resolve(__dirname, '../../../database/migrations'),
      path.resolve(__dirname, '../../database/migrations'),
      path.resolve(__dirname, '../database/migrations')
    ];

    let migrationsDir = '';
    for (const d of candidateDirs) {
      if (fs.existsSync(d)) {
        migrationsDir = d;
        break;
      }
    }

    if (!migrationsDir) {
      throw new Error('Could not locate database/migrations directory.');
    }

    Logger.info(`Found migrations directory at: ${migrationsDir}`);

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const check = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1;', [file]);
      if (check.rows.length > 0) {
        Logger.info(`Migration already applied: ${file} (Skipping)`);
        continue;
      }

      Logger.info(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
        await client.query('COMMIT');
        Logger.info(`✔ Migration applied successfully: ${file}`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw new Error(`Failed to apply migration ${file}: ${err.message}`);
      }
    }

    Logger.info('All database migrations applied and verified.');
  } finally {
    await client.end();
  }
}

// Allow standalone execution: node dist/migrate.js
if (typeof require !== 'undefined' && require.main === module || process.argv[1]?.endsWith('migrate.js') || process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}
