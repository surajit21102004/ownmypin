const { pool } = require('../src/config/db');

async function initDatabase() {
  console.log('Initializing MySQL database tables for OwnMyPin...');
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        full_name VARCHAR(150) NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(' Table `users` ready.');

    // 2. OTPs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone_otp (phone, otp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(' Table `otps` ready.');

    // 3. Registrations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        phone VARCHAR(20) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        dob VARCHAR(50) NOT NULL,
        guardian_name VARCHAR(150) NULL,
        property_type VARCHAR(50) NOT NULL DEFAULT 'House',
        ownership_type VARCHAR(50) NOT NULL DEFAULT 'Own',
        address_line TEXT NOT NULL,
        state VARCHAR(100) NOT NULL DEFAULT 'West Bengal',
        state_code VARCHAR(5) NOT NULL DEFAULT 'WB',
        district VARCHAR(100) NOT NULL DEFAULT 'Hooghly',
        district_code VARCHAR(5) NOT NULL DEFAULT '09',
        city VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        landmark VARCHAR(200) NULL,
        latitude DECIMAL(10, 8) DEFAULT 22.7126,
        longitude DECIMAL(11, 8) DEFAULT 88.3524,
        selfie_url LONGTEXT NULL,
        property_photos JSON NULL,
        status ENUM('pending', 'approved', 'rejected', 'changes_requested') DEFAULT 'pending',
        pin_code VARCHAR(30) NULL,
        rejection_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_reg_phone (phone),
        INDEX idx_reg_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(' Table `registrations` ready.');

    // 4. Pins table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NOT NULL,
        pin_code VARCHAR(30) NOT NULL UNIQUE,
        state_code VARCHAR(5) NOT NULL,
        district_code VARCHAR(5) NOT NULL,
        unique_code VARCHAR(15) NOT NULL,
        is_vip BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pin_code (pin_code),
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(' Table `pins` ready.');

    // Seed sample pending registration if table is empty so Admin panel immediately has realistic review data matching the screenshots!
    const [existing] = await connection.query('SELECT COUNT(*) as cnt FROM registrations');
    if (existing[0].cnt === 0) {
      console.log('Seeding initial sample registrations for demo...');
      await connection.query(`
        INSERT INTO registrations (
          phone, full_name, dob, guardian_name, property_type, ownership_type,
          address_line, state, state_code, district, district_code, city, pincode, landmark,
          latitude, longitude, status
        ) VALUES 
        (
          '+919876543210', 'Rahul Sharma', '15/08/2000', NULL, 'House', 'Own',
          '42 Rabindra Sarani, Morepukur', 'West Bengal', 'WB', 'Hooghly', '09', 'Rishra', '712248', 'Near Hanuman Mandir',
          22.71260000, 88.35240000, 'pending'
        ),
        (
          '+919812345678', 'Priya Roy', '22/04/1998', NULL, 'Flat', 'Own',
          'Flat 3B, Sunshine Towers, GT Road', 'West Bengal', 'WB', 'Howrah', '08', 'Howrah', '711101', 'Opposite Clock Tower',
          22.59580000, 88.26360000, 'pending'
        ),
        (
          '+919833445566', 'Amit Mukherjee', '10/12/2002', NULL, 'Shop', 'Rent',
          'Shop 12, Municipal Market', 'West Bengal', 'WB', 'Kolkata', '01', 'Kolkata', '700001', 'Near City Post Office',
          22.57260000, 88.36390000, 'pending'
        );
      `);
      console.log(' Sample registrations seeded successfully.');
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

initDatabase();
