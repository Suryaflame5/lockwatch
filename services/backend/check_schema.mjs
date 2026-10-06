import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5BMRxWC4jets@ep-still-mouse-b3fv9dd2-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const cols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'classes' ORDER BY ordinal_position"
  );
  console.log('classes columns:', cols.rows.map(r => r.column_name));
  await pool.end();
}

main().catch(console.error);
