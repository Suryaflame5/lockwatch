import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5BMRxWC4jets@ep-still-mouse-b3fv9dd2-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const studentHash = bcrypt.hashSync('StudentPassword123!', 10);
  const facultyHash = bcrypt.hashSync('FacultyPassword123!', 10);
  const pinHash = bcrypt.hashSync('123456', 10);

  console.log('studentHash:', studentHash);
  console.log('facultyHash:', facultyHash);
  console.log('pinHash:', pinHash);

  await pool.query('UPDATE users SET password_hash = $1, pin_hash = $2 WHERE role = $3', [facultyHash, pinHash, 'FACULTY']);
  await pool.query('UPDATE users SET password_hash = $1 WHERE role = $2', [studentHash, 'STUDENT']);

  console.log('Update completed!');

  const rows = await pool.query('SELECT email, role, password_hash, pin_hash FROM users');
  for (const r of rows.rows) {
    const match = r.role === 'FACULTY'
      ? bcrypt.compareSync('FacultyPassword123!', r.password_hash)
      : bcrypt.compareSync('StudentPassword123!', r.password_hash);
    console.log(r.email, r.role, 'Matches expected password:', match);
  }

  await pool.end();
}

main().catch(console.error);
