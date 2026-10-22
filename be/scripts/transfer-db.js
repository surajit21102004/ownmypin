const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const SOURCE_CONFIG = {
  host: 's1-nnvp.crazzydns.com',
  port: 3306,
  user: 'ecompone_sasthayu',
  password: 'Surajit@21',
  database: 'ecompone_ownmypin',
};

const TARGET_CONFIG = {
  host: 's4-coaz.crazzydns.com',
  port: 3306,
  user: 'studein_admin',
  password: 'Surajit@21',
  database: 'studein_ownmypin',
};

async function transferDatabase() {
  console.log('====================================================');
  console.log('🔄 OwnMyPin Database Transfer Tool');
  console.log(`Source Database: ${SOURCE_CONFIG.database} on ${SOURCE_CONFIG.host}`);
  console.log(`Target Database: ${TARGET_CONFIG.database} (User: ${TARGET_CONFIG.user})`);
  console.log('====================================================');

  let sourceConn;
  let targetConn;

  try {
    // 1. Connect to source
    console.log('\n[1/4] Connecting to source database...');
    sourceConn = await mysql.createConnection(SOURCE_CONFIG);
    console.log(' Connected to source database!');

    // 2. Connect to target
    console.log('\n[2/4] Connecting to target database...');
    targetConn = await mysql.createConnection(TARGET_CONFIG);
    console.log(' Connected to target database!');

    // 3. Create schema on target
    console.log('\n[3/4] Initializing schema on target database...');
    await targetConn.query(`
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

    await targetConn.query(`
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

    await targetConn.query(`
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

    await targetConn.query(`
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
    console.log(' Target tables created successfully.');

    // 4. Transfer data
    console.log('\n[4/4] Transferring data rows...');
    const tables = ['users', 'otps', 'registrations', 'pins'];
    for (const tbl of tables) {
      const [rows] = await sourceConn.query(`SELECT * FROM ${tbl}`);
      console.log(`- Transferring ${rows.length} rows from table '${tbl}'...`);
      for (const row of rows) {
        const keys = Object.keys(row);
        const values = Object.values(row).map((v) =>
          typeof v === 'object' && v !== null && !(v instanceof Date)
            ? JSON.stringify(v)
            : v
        );
        const placeholders = keys.map(() => '?').join(', ');
        const updateClause = keys.map((k) => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');

        const sql = `INSERT INTO \`${tbl}\` (\`${keys.join('`, `')}\`) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
        await targetConn.query(sql, values);
      }
    }

    console.log('\n SUCCESS! All tables and data transferred to studein_ownmypin!');
  } catch (error) {
    console.error('\n❌ Transfer failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n👉 NOTE: In your cPanel dashboard:');
      console.error('   1. Go to "Remote MySQL" and add "%" (or your IP 202.142.100.215) to allowed hosts.');
      console.error('   2. Go to "MySQL Databases" -> "Add User to Database" -> Select "studein_admin" and "studein_ownmypin", and grant ALL PRIVILEGES.');
    }
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

transferDatabase();
