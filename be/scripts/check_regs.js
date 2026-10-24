const { pool } = require('../src/config/db');

async function checkRegs() {
  try {
    const [rows] = await pool.query('SELECT id, full_name, selfie_url, property_photos, status, phone FROM registrations ORDER BY id DESC LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err.message);
    process.exit(1);
  }
}

checkRegs();
