const { pool } = require('../src/config/db');

async function migrateDigilocker() {
  console.log('Running DigiLocker database migrations...');
  try {
    // 1. Check & update `users` table
    const [userCols] = await pool.query('DESCRIBE users');
    const existingUserCols = userCols.map((c) => c.Field);

    if (!existingUserCols.includes('is_aadhaar_verified')) {
      await pool.query('ALTER TABLE users ADD COLUMN is_aadhaar_verified TINYINT(1) DEFAULT 0');
      console.log('Added is_aadhaar_verified column to users');
    }
    if (!existingUserCols.includes('aadhaar_verified_name')) {
      await pool.query('ALTER TABLE users ADD COLUMN aadhaar_verified_name VARCHAR(150) NULL');
      console.log('Added aadhaar_verified_name column to users');
    }
    if (!existingUserCols.includes('digilocker_record_id')) {
      await pool.query('ALTER TABLE users ADD COLUMN digilocker_record_id VARCHAR(100) NULL');
      console.log('Added digilocker_record_id column to users');
    }
    if (!existingUserCols.includes('digilocker_verified_at')) {
      await pool.query('ALTER TABLE users ADD COLUMN digilocker_verified_at TIMESTAMP NULL');
      console.log('Added digilocker_verified_at column to users');
    }

    // 2. Check & update `registrations` table
    const [regCols] = await pool.query('DESCRIBE registrations');
    const existingRegCols = regCols.map((c) => c.Field);

    if (!existingRegCols.includes('is_aadhaar_verified')) {
      await pool.query('ALTER TABLE registrations ADD COLUMN is_aadhaar_verified TINYINT(1) DEFAULT 0');
      console.log('Added is_aadhaar_verified column to registrations');
    }
    if (!existingRegCols.includes('aadhaar_verified_name')) {
      await pool.query('ALTER TABLE registrations ADD COLUMN aadhaar_verified_name VARCHAR(150) NULL');
      console.log('Added aadhaar_verified_name column to registrations');
    }
    if (!existingRegCols.includes('digilocker_record_id')) {
      await pool.query('ALTER TABLE registrations ADD COLUMN digilocker_record_id VARCHAR(100) NULL');
      console.log('Added digilocker_record_id column to registrations');
    }
    if (!existingRegCols.includes('digilocker_verified_at')) {
      await pool.query('ALTER TABLE registrations ADD COLUMN digilocker_verified_at TIMESTAMP NULL');
      console.log('Added digilocker_verified_at column to registrations');
    }

    // 3. Ensure digilocker_verifications table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS digilocker_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NULL,
        phone VARCHAR(20) NOT NULL,
        record_id VARCHAR(100) NOT NULL UNIQUE,
        public_id VARCHAR(100) NULL,
        state VARCHAR(150) NULL,
        status VARCHAR(50) DEFAULT 'INITIATED',
        auth_url TEXT NULL,
        transaction_id VARCHAR(100) NULL,
        aadhaar_verification_id VARCHAR(100) NULL,
        aadhaar_name VARCHAR(150) NULL,
        aadhaar_dob VARCHAR(50) NULL,
        aadhaar_gender VARCHAR(20) NULL,
        aadhaar_address TEXT NULL,
        aadhaar_state VARCHAR(100) NULL,
        aadhaar_district VARCHAR(100) NULL,
        aadhaar_pincode VARCHAR(20) NULL,
        raw_response LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dlv_phone (phone),
        INDEX idx_dlv_record (record_id),
        INDEX idx_dlv_state (state)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Verified digilocker_verifications table structure.');

    console.log('DigiLocker database migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrateDigilocker();
