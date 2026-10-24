const { pool } = require('../src/config/db');

async function initNewsAdsDb() {
  console.log('Initializing News, Ads, Settings and Nearby Businesses tables...');
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. News table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        headline VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        content LONGTEXT NULL,
        category VARCHAR(100) DEFAULT 'Daily News',
        image_url TEXT NULL,
        source VARCHAR(100) DEFAULT 'OwnMyPin Team',
        time_ago VARCHAR(50) DEFAULT 'Just now',
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_news_pub (published_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `news` ready.');

    // 2. Ads & Promotions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'Sponsored',
        type ENUM('banner', 'nearby_shop', 'notification') DEFAULT 'banner',
        image_url TEXT NULL,
        link_url TEXT NULL,
        phone VARCHAR(50) NULL,
        business_name VARCHAR(200) NULL,
        distance VARCHAR(50) DEFAULT '0.5 km',
        rating DECIMAL(2,1) DEFAULT 4.8,
        address VARCHAR(255) NULL,
        latitude DECIMAL(10,8) DEFAULT 22.71260000,
        longitude DECIMAL(11,8) DEFAULT 88.35240000,
        is_verified BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ad_type (type, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `ads` ready.');

    // 3. App Settings (Toggle Google Ads vs Manual Ads, AdMob Unit ID)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `app_settings` ready.');

    // 4. Nearby Businesses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS nearby_businesses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        distance VARCHAR(50) NOT NULL,
        address VARCHAR(255) NOT NULL,
        rating DECIMAL(2,1) DEFAULT 4.8,
        pin_code VARCHAR(50) NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        image_url TEXT NULL,
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_biz_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `nearby_businesses` ready.');

    // Seed default settings if not exists
    const [existingSettings] = await connection.query('SELECT COUNT(*) as cnt FROM app_settings');
    if (existingSettings[0].cnt === 0) {
      console.log('Seeding default app settings...');
      await connection.query(`
        INSERT INTO app_settings (setting_key, setting_value) VALUES
        ('ad_mode', 'manual'),
        ('google_ads_enabled', 'false'),
        ('google_ad_unit_id', 'ca-app-pub-3940256099942544/6300978111'),
        ('google_banner_html', '<div style="background:#f1f5f9;border:1px dashed #475569;padding:12px;text-align:center;font-size:12px;color:#334155;border-radius:8px;"><strong>Google Ads</strong><br>Responsive Display Ad Unit (Mock)</div>'),
        ('app_notice', 'Welcome to OwnMyPin! Digitize your home and shop location with guaranteed DIGIPIN.')
      `);
    }

    // Seed sample news if empty
    const [existingNews] = await connection.query('SELECT COUNT(*) as cnt FROM news');
    if (existingNews[0].cnt === 0) {
      console.log('Seeding initial news items...');
      await connection.query(`
        INSERT INTO news (headline, summary, content, category, image_url, source, time_ago) VALUES
        (
          'West Bengal Launches Unified Digital Pin Portal with OwnMyPin',
          'Citizens can now register their residential and commercial properties for tamper-proof digital addresses.',
          'The state government alongside postal authorities has announced complete synchronization with modern geospatial standards. Property owners receive instant geo-verified pins.',
          'Government & Postal',
          'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=60',
          'OwnMyPin News Desk',
          '2h ago'
        ),
        (
          'Emergency Services Adopt DIGIPIN for Faster 10-Minute Response',
          'Ambulances and fire departments integrate OwnMyPin navigation to reach exact doorstep locations in congested areas.',
          'In narrow lanes and unmapped areas, OwnMyPin navigation gives first responders exact GPS doorstep routing down to 1-meter accuracy.',
          'Safety & Services',
          'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=800&auto=format&fit=crop&q=60',
          'Civic Bulletin',
          '4h ago'
        ),
        (
          'Local Commercial Hubs in Hooghly District Go Fully Digital',
          'Over 500 local traders and shops registered their business pins for delivery partner accuracy.',
          'Local business owners reported a 35% decrease in delivery failure rates after attaching OwnMyPin QR codes to their store fronts.',
          'Local Business',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60',
          'Business Daily',
          '1d ago'
        );
      `);
    }

    // Seed sample ads if empty
    const [existingAds] = await connection.query('SELECT COUNT(*) as cnt FROM ads');
    if (existingAds[0].cnt === 0) {
      console.log('Seeding initial ads and shop notifications...');
      await connection.query(`
        INSERT INTO ads (title, description, category, type, image_url, business_name, distance, rating, address, latitude, longitude) VALUES
        (
          'Super Mart Mega Savings Festival',
          'Get 20% flat discount on daily groceries, fresh vegetables and household essentials.',
          'Retail & Grocery',
          'banner',
          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=60',
          'Super Mart Rishra',
          '0.4 km',
          4.8,
          '18 Morepukur Main Road, Rishra, Hooghly',
          22.71350000,
          88.35310000
        ),
        (
          'City Diagnostic Center & Pharmacy',
          '24x7 Emergency medicine delivery and free blood pressure checkup for registered pin holders.',
          'Health & Pharmacy',
          'banner',
          'https://images.unsplash.com/photo-1586015555751-63c252277d70?w=800&auto=format&fit=crop&q=60',
          'City Medico Rishra',
          '0.8 km',
          4.9,
          'GT Road Near Rishra Railway Station',
          22.71180000,
          88.35120000
        ),
        (
          'Special Offer: Fresh Organic Farm Milk',
          'Pure cow milk delivered to your door pin every morning. First week free sample!',
          'Nearby Shop',
          'notification',
          'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=60',
          'Kishan Dairy Farm',
          '0.3 km',
          4.7,
          'Station Road, Morepukur, Rishra',
          22.71420000,
          88.35400000
        );
      `);
    }

    // Seed sample nearby businesses matching Screenshot 5
    const [existingBiz] = await connection.query('SELECT COUNT(*) as cnt FROM nearby_businesses');
    if (existingBiz[0].cnt === 0) {
      console.log('Seeding initial nearby businesses matching screenshot 5...');
      await connection.query(`
        INSERT INTO nearby_businesses (name, category, distance, address, rating, pin_code, latitude, longitude) VALUES
        ('Roy Medical & Diagnostics', 'Pharmacy & Health', '0.4 km', '42 Rabindra Sarani, Rishra', 4.8, 'WB-09-45896524', 22.71260000, 88.35240000),
        ('Annapurna Grocery & Daily Needs', 'Supermarket', '0.9 km', 'GT Road, Near City Clock Tower, Rishra', 4.7, 'WB-09-78677628', 22.71500000, 88.35600000),
        ('Bengal Sweets & Bakery', 'Confectionery', '1.3 km', 'Station Road Bazaar, Rishra', 4.9, 'WB-09-54254718', 22.71020000, 88.34900000),
        ('Techno Care Electronics & Mobile', 'Electronics Repair', '1.8 km', 'Subhas Nagar, Rishra', 4.6, 'WB-09-62641760', 22.71800000, 88.35900000);
      `);
    }

    console.log('News, Ads, Settings and Nearby Businesses initialized successfully!');
  } catch (error) {
    console.error('Error during initNewsAdsDb:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

initNewsAdsDb();
