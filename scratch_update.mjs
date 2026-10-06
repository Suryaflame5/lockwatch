import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5BMRxWC4jets@ep-still-mouse-b3fv9dd2-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("UPDATE students SET phone_number = '+919876543210', phone_verified_at = CURRENT_TIMESTAMP WHERE register_number = '23AIML104';");
  await client.query("UPDATE students SET phone_number = '+919876543118', phone_verified_at = CURRENT_TIMESTAMP WHERE register_number = '23AIML118';");
  await client.query("UPDATE students SET phone_number = '+919876543007', phone_verified_at = CURRENT_TIMESTAMP WHERE register_number = '23AIML007';");
  const s = await client.query("SELECT register_number, phone_number FROM students;");
  console.log('UPDATED STUDENTS IN DB:', s.rows);
  await client.end();
}

run().catch(console.error);
