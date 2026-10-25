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
        adMode: settings.ad_mode || 'manual',
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
 * Get App Launch / Startup Special Offer Popup Settings
 */
async function getPopup(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key LIKE 'popup_%'"
    );

    const popup = {
      enabled: true,
      title: 'Special Offer: Refer & Earn!',
      message: 'Invite your friends or neighbors to claim their verified digital address and earn rewards.',
      imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60',
      buttonText: 'Refer & Earn',
      action: 'refer', // 'refer' | 'scanner' | 'register' | 'nearby' | 'dsc' | 'external'
      actionUrl: '',
    };

    rows.forEach((r) => {
      if (r.setting_key === 'popup_enabled') popup.enabled = r.setting_value === 'true' || r.setting_value === '1';
      if (r.setting_key === 'popup_title') popup.title = r.setting_value;
      if (r.setting_key === 'popup_message') popup.message = r.setting_value;
      if (r.setting_key === 'popup_image_url') popup.imageUrl = r.setting_value;
      if (r.setting_key === 'popup_button_text') popup.buttonText = r.setting_value;
      if (r.setting_key === 'popup_action') popup.action = r.setting_value;
      if (r.setting_key === 'popup_action_url') popup.actionUrl = r.setting_value;
    });

    return res.status(200).json({
      success: true,
      popup,
    });
  } catch (error) {
    console.error('getPopup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve popup settings' });
  }
}

/**
 * Get real notification items for mobile app notification bell
 */
async function getNotifications(req, res, next) {
  try {
    const phone = req.query.phone ? req.query.phone.trim() : null;

    let query = 'SELECT * FROM app_notifications WHERE user_phone IS NULL';
    const params = [];

    if (phone) {
      query += ' OR user_phone = ?';
      params.push(phone);
    }

    query += ' ORDER BY id DESC LIMIT 30';

    const [notifRows] = await pool.query(query, params);

    // If user provided phone, also check their registration PIN status
    const customUserNotifs = [];
    if (phone) {
      const [reg] = await pool.query(
        'SELECT status, pin_code FROM registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
        [phone]
      );
      if (reg.length > 0) {
        if (reg[0].status === 'approved') {
          customUserNotifs.push({
            id: 'pin_appr',
            title: `PIN ${reg[0].pin_code || 'WB-09-45896524'} Approved & Live`,
            message: 'Your certified doorstep DIGIPIN is officially active and ready for navigation and parcel delivery.',
            type: 'pin_status',
            time: 'Active',
          });
        } else if (reg[0].status === 'pending') {
          customUserNotifs.push({
            id: 'pin_pend',
            title: 'Doorstep Registration Under Review',
            message: 'Your GPS calibration and doorstep photos are currently being verified by the government verification desk.',
            type: 'pin_status',
            time: 'In Progress',
          });
        }
      }

      // Also check business registration status
      const [biz] = await pool.query(
        'SELECT status, pin_code, shop_name FROM business_registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
        [phone]
      );
      if (biz.length > 0) {
        if (biz[0].status === 'approved') {
          customUserNotifs.push({
            id: 'biz_appr',
            title: `Business Verified: ${biz[0].shop_name}`,
            message: `Your business PIN ${biz[0].pin_code || ''} is now verified and listed on Nearby Shops!`,
            type: 'business_alert',
            time: 'Active',
          });
        } else if (biz[0].status === 'pending') {
          customUserNotifs.push({
            id: 'biz_pend',
            title: `Business Under Verification: ${biz[0].shop_name}`,
            message: 'Our verification team is validating your GSTIN / PAN / Udyam documents.',
            type: 'business_alert',
            time: 'Pending',
          });
        }
      }
    }

    const formatted = notifRows.map((n) => {
      let timeStr = 'Recent';
      if (n.created_at) {
        const diffMs = Date.now() - new Date(n.created_at).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) timeStr = `${mins <= 1 ? 'Just now' : `${mins}m ago`}`;
        else if (mins < 1440) timeStr = `${Math.floor(mins / 60)}h ago`;
        else timeStr = `${Math.floor(mins / 1440)}d ago`;
      }
      return {
        id: `db_${n.id}`,
        title: n.title,
        message: n.message,
        desc: n.message,
        type: n.type || 'system',
        actionType: n.action_type || 'profile',
        actionUrl: n.action_url || null,
        time: timeStr,
      };
    });

    const combined = [...customUserNotifs, ...formatted];

    return res.status(200).json({
      success: true,
      notifications: combined,
      unreadCount: combined.length,
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
  getPopup,
  getNotifications,
  getNearbyBusinesses,
};
