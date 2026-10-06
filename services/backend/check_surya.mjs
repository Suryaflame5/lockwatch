import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5BMRxWC4jets@ep-still-mouse-b3fv9dd2-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const users = await pool.query("SELECT id, email, password_hash FROM users WHERE email = 'suryaflame2007@gmail.com'");
  console.log('Surya user:', users.rows[0]);
  if (users.rows[0]) {
    console.log('Matches StudentPassword123!:', bcrypt.compareSync('StudentPassword123!', users.rows[0].password_hash));
    // Let's set it to StudentPassword123!
    const newHash = bcrypt.hashSync('StudentPassword123!', 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'suryaflame2007@gmail.com'", [newHash]);
    console.log('Updated Surya password hash to StudentPassword123!');
  }
  await pool.end();
}

main().catch(console.error);
