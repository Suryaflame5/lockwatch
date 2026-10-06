import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5BMRxWC4jets@ep-still-mouse-b3fv9dd2-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const facultyId = '33333333-3333-3333-3333-333333333333';
  const instId = '11111111-1111-1111-1111-111111111111';

  // Insert Cyber Security Lab class
  await pool.query(
    `INSERT INTO classes (id, institution_id, created_by, name, subject, section, department, class_code, status, year, semester)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT DO NOTHING`,
    ['88888888-8888-8888-8888-888888888001', instId, facultyId,
     'Cyber Security Lab', 'Network Security', 'A', 'Computer Science & Engineering', 'CS&E-A-2FQA', 'ACTIVE', 3, 6]
  );

  // Insert AIML class  
  await pool.query(
    `INSERT INTO classes (id, institution_id, created_by, name, subject, section, department, class_code, status, year, semester)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT DO NOTHING`,
    ['88888888-8888-8888-8888-888888888002', instId, facultyId,
     'Artificial Intelligence Lab', 'AIML', 'E', 'Artificial Intelligence', 'AIML-E-8K42', 'ACTIVE', 3, 5]
  );

  // Insert Computer Networks class
  await pool.query(
    `INSERT INTO classes (id, institution_id, created_by, name, subject, section, department, class_code, status, year, semester)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT DO NOTHING`,
    ['88888888-8888-8888-8888-888888888003', instId, facultyId,
     'Computer Networks', 'CS501 - Computer Networks', 'A', 'Computer Science & Engineering', 'NET-A-1234', 'ACTIVE', 3, 5]
  );

  console.log('Classes inserted!');
  const classes = await pool.query('SELECT id, name, class_code, status FROM classes ORDER BY name');
  console.log('All classes now:', classes.rows);
  await pool.end();
}

main().catch(console.error);
