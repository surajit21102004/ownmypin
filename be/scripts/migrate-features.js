const { pool } = require('../src/config/db');

async function migrate() {
  console.log('Running database migrations for new features...');

  // 1. Add password, role, and business fields to users table
  try {
    const [userCols] = await pool.query('DESCRIBE users');
    const existingCols = userCols.map((c) => c.Field);

    if (!existingCols.includes('password')) {
      await pool.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER full_name');
      console.log('Added password column to users');
    }
    if (!existingCols.includes('role')) {
      await pool.query("ALTER TABLE users ADD COLUMN role ENUM('user', 'business') DEFAULT 'user' AFTER password");
      console.log('Added role column to users');
    }
    if (!existingCols.includes('shop_name')) {
      await pool.query('ALTER TABLE users ADD COLUMN shop_name VARCHAR(200) NULL AFTER role');
      console.log('Added shop_name column to users');
    }
  } catch (err) {
    console.error('Error modifying users table:', err.message);
  }

  // 2. Create business_registrations table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        phone VARCHAR(20) NOT NULL,
        shop_name VARCHAR(200) NOT NULL,
        owner_name VARCHAR(150) NOT NULL,
        category VARCHAR(100) DEFAULT 'Retail & Shopping',
        address_line TEXT,
        state VARCHAR(100) DEFAULT 'West Bengal',
        state_code VARCHAR(5) DEFAULT 'WB',
        district VARCHAR(100) DEFAULT 'Hooghly',
        district_code VARCHAR(5) DEFAULT '09',
        city VARCHAR(100),
        pincode VARCHAR(10),
        landmark VARCHAR(200),
        latitude DECIMAL(10,8) DEFAULT 22.7126,
        longitude DECIMAL(11,8) DEFAULT 88.3524,
        shop_logo_url TEXT,
        shop_images LONGTEXT,
        doc_type ENUM('GSTIN', 'PAN', 'UDYAM') DEFAULT 'GSTIN',
        doc_number VARCHAR(100),
        doc_file_url TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        pin_code VARCHAR(30) NULL,
        rejection_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created / verified business_registrations table');
  } catch (err) {
    console.error('Error creating business_registrations table:', err.message);
  }

  // 3. Create app_notifications table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_phone VARCHAR(20) NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('pin_status', 'business_alert', 'admin_broadcast', 'offer') DEFAULT 'admin_broadcast',
        target_pin VARCHAR(30) NULL,
        action_type VARCHAR(50) NULL,
        action_url TEXT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created / verified app_notifications table');
  } catch (err) {
    console.error('Error creating app_notifications table:', err.message);
  }

  // 4. Seed initial notifications
  try {
    const [notifCount] = await pool.query('SELECT COUNT(*) as count FROM app_notifications');
    if (notifCount[0].count === 0) {
      await pool.query(`
        INSERT INTO app_notifications (title, message, type, action_type) VALUES
        ('DIGIPIN Active & Certified', 'Your doorstep PIN WB-09-45896524 is verified and ready for postal and map delivery.', 'pin_status', 'profile'),
        ('New Nearby Business Joined', 'Aroma Bakery & Cafe in Rishra has registered their digital business pin near you!', 'business_alert', 'nearby'),
        ('Refer & Earn Special Offer', 'Invite 2 neighbors to claim their digital address and earn 3 months of free VIP status!', 'offer', 'refer')
      `);
      console.log('Seeded sample app_notifications');
    }
  } catch (err) {
    console.error('Error seeding notifications:', err.message);
  }

  // 5. Seed Popup settings in app_settings
  const popupSettings = [
    { key: 'popup_enabled', val: 'true' },
    { key: 'popup_title', val: 'Special Offer: Refer & Earn!' },
    { key: 'popup_message', val: 'Invite your friends or neighbors to claim their verified digital address and earn rewards.' },
    { key: 'popup_image_url', val: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60' },
    { key: 'popup_button_text', val: 'Refer & Earn' },
    { key: 'popup_action', val: 'refer' },
    { key: 'popup_action_url', val: '' },
  ];

  for (const s of popupSettings) {
    try {
      await pool.query(
        'INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
        [s.key, s.val]
      );
    } catch (err) {
      // ignore
    }
  }
  console.log('Seeded popup settings in app_settings');

  console.log('Migration completed successfully!');
  await pool.end();
}

migrate();
