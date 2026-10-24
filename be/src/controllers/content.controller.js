const { pool } = require('../config/db');

/**
 * Get daily news items (DSC Screen)
 */
async function getNews(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, headline, summary, content, category, image_url, source, time_ago, published_at FROM news ORDER BY id DESC LIMIT 50'
    );
    return res.status(200).json({
      success: true,
      news: rows,
    });
  } catch (error) {
    console.error('getNews error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve news' });
  }
}

/**
 * Get active ads and current ad monetization settings
 */
async function getAds(req, res, next) {
  try {
    const [adRows] = await pool.query(
      'SELECT * FROM ads WHERE is_active = TRUE ORDER BY id DESC'
    );

    const [settingsRows] = await pool.query('SELECT setting_key, setting_value FROM app_settings');
    const settings = {};
    settingsRows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });

    const bannerAds = adRows.filter((a) => a.type === 'banner');
    const shopAds = adRows.filter((a) => a.type === 'nearby_shop');
    const notificationAds = adRows.filter((a) => a.type === 'notification');

    return res.status(200).json({
      success: true,
      settings: {
        adMode: settings.ad_mode || 'manual', // 'manual' | 'google_ads'
        googleAdsEnabled: settings.google_ads_enabled === 'true',
        googleAdUnitId: settings.google_ad_unit_id || 'ca-app-pub-3940256099942544/6300978111',
        googleBannerHtml: settings.google_banner_html || '',
      },
      ads: adRows,
      bannerAds,
      shopAds,
      notificationAds,
    });
  } catch (error) {
    console.error('getAds error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ads' });
  }
}

/**
 * Get notification items for mobile app notification bell
 */
async function getNotifications(req, res, next) {
  try {
    const [adNotifications] = await pool.query(
      "SELECT id, title, description, category, type, image_url, business_name, distance, latitude, longitude, created_at FROM ads WHERE is_active = TRUE AND (type = 'notification' OR type = 'nearby_shop') ORDER BY id DESC LIMIT 20"
    );

    const formatted = adNotifications.map((item) => ({
      id: `ad_${item.id}`,
      title: item.title,
      message: item.description,
      type: 'promo',
      shopName: item.business_name || 'Nearby Shop',
      distance: item.distance || '0.5 km',
      latitude: item.latitude,
      longitude: item.longitude,
      imageUrl: item.image_url,
      time: 'New',
    }));

    // Add standard welcome / system notice
    const notifications = [
      {
        id: 'sys_1',
        title: 'OwnMyPin Registration Status',
        message: 'Your OwnMyPin DIGIPIN is active and verified for navigation and delivery.',
        type: 'system',
        time: 'Today',
      },
      ...formatted,
    ];

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications' });
  }
}

/**
 * Get nearby verified businesses (matches Screenshot 5)
 */
async function getNearbyBusinesses(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, category, distance, address, rating, pin_code, latitude, longitude, image_url, is_verified FROM nearby_businesses ORDER BY id ASC'
    );
    return res.status(200).json({
      success: true,
      businesses: rows,
    });
  } catch (error) {
    console.error('getNearbyBusinesses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve nearby businesses' });
  }
}

module.exports = {
  getNews,
  getAds,
  getNotifications,
  getNearbyBusinesses,
};
