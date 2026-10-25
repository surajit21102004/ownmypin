const { pool } = require('../config/db');
const { generateUniquePin } = require('../utils/pinGenerator');

/**
 * List all registrations for Admin review + overview metrics
 */
async function getRegistrations(req, res, next) {
  try {
    const { status } = req.query;

    let query = `
      SELECT r.*, p.pin_code as issued_pin
      FROM registrations r
      LEFT JOIN pins p ON p.registration_id = r.id
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' WHERE r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.id DESC';

    const [rows] = await pool.query(query, params);

    // Compute metrics
    const [pendingCnt] = await pool.query("SELECT COUNT(*) as cnt FROM registrations WHERE status = 'pending'");
    const [approvedTodayCnt] = await pool.query(
      "SELECT COUNT(*) as cnt FROM registrations WHERE status = 'approved' AND DATE(updated_at) = CURDATE()"
    );
    const [rejectedCnt] = await pool.query("SELECT COUNT(*) as cnt FROM registrations WHERE status = 'rejected'");

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const idx = url.indexOf('/uploads/');
  if (idx !== -1) {
    return url.substring(idx);
  }
  return url;
}

    const parsedRows = rows.map((r) => {
      if (typeof r.property_photos === 'string') {
        try {
          r.property_photos = JSON.parse(r.property_photos);
        } catch (e) {
          r.property_photos = [];
        }
      }
      if (Array.isArray(r.property_photos)) {
        r.property_photos = r.property_photos.map(normalizeUrl);
      }
      if (r.selfie_url) {
        r.selfie_url = normalizeUrl(r.selfie_url);
      }
      return r;
    });

    return res.status(200).json({
      success: true,
      metrics: {
        pending: pendingCnt[0].cnt,
        approvedToday: approvedTodayCnt[0].cnt,
        rejected: rejectedCnt[0].cnt,
        total: rows.length,
      },
      registrations: parsedRows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get registration by ID
 */
async function getRegistrationById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT r.*, p.pin_code as issued_pin
       FROM registrations r
       LEFT JOIN pins p ON p.registration_id = r.id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const reg = rows[0];
    if (typeof reg.property_photos === 'string') {
      try {
        reg.property_photos = JSON.parse(reg.property_photos);
      } catch (e) {
        reg.property_photos = [];
      }
    }
    if (Array.isArray(reg.property_photos)) {
      reg.property_photos = reg.property_photos.map(normalizeUrl);
    }
    if (reg.selfie_url) {
      reg.selfie_url = normalizeUrl(reg.selfie_url);
    }

    return res.status(200).json({ success: true, registration: reg });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve registration & generate verified OwnMyPin
 */
async function approveRegistration(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const reg = rows[0];

    // Generate unique non-patterned DIGIPIN
    const { pinCode, stateCode, districtCode, uniqueCode } = await generateUniquePin(
      reg.state_code || 'WB',
      reg.district_code || '09',
      pool
    );

    // Update registration status and pin_code
    await pool.query(
      "UPDATE registrations SET status = 'approved', pin_code = ?, updated_at = NOW() WHERE id = ?",
      [pinCode, id]
    );

    // Insert into pins table
    await pool.query(
      'INSERT INTO pins (registration_id, pin_code, state_code, district_code, unique_code) VALUES (?, ?, ?, ?, ?)',
      [id, pinCode, stateCode, districtCode, uniqueCode]
    );

    return res.status(200).json({
      success: true,
      message: 'Registration approved and DIGIPIN generated successfully!',
      pinCode,
      registrationId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject registration
 */
async function rejectRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    await pool.query(
      "UPDATE registrations SET status = 'rejected', rejection_reason = ?, updated_at = NOW() WHERE id = ?",
      [reason || 'Details could not be verified with government records', id]
    );

    return res.status(200).json({
      success: true,
      message: 'Registration rejected',
      registrationId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request changes from applicant
 */
async function requestChanges(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    await pool.query(
      "UPDATE registrations SET status = 'changes_requested', rejection_reason = ?, updated_at = NOW() WHERE id = ?",
      [note || 'Please re-upload a clearer selfie and confirm landmark.', id]
    );

    return res.status(200).json({
      success: true,
      message: 'Changes requested from applicant',
      registrationId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create news
 */
async function createNews(req, res, next) {
  try {
    const { headline, summary, content, category, image_url, source } = req.body;
    if (!headline || !summary) {
      return res.status(400).json({ success: false, message: 'Headline and summary are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO news (headline, summary, content, category, image_url, source, time_ago) 
       VALUES (?, ?, ?, ?, ?, ?, 'Just now')`,
      [
        headline.trim(),
        summary.trim(),
        content ? content.trim() : null,
        category || 'Daily News',
        image_url || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=60',
        source || 'OwnMyPin Admin',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'News posted successfully',
      id: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete news
 */
async function deleteNews(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM news WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create ad / notification
 */
async function createAd(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      type,
      image_url,
      link_url,
      business_name,
      distance,
      address,
      latitude,
      longitude,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO ads (title, description, category, type, image_url, link_url, business_name, distance, address, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        category || 'Sponsored',
        type || 'banner', // 'banner' | 'nearby_shop' | 'notification'
        image_url || null,
        link_url || null,
        business_name || null,
        distance || '0.5 km',
        address || null,
        latitude || 22.71260000,
        longitude || 88.35240000,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Ad / Notification created successfully',
      id: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete ad
 */
async function deleteAd(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ads WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Ad deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get app monetization settings
 */
async function getSettings(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM app_settings');
    const settings = {};
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update app monetization settings (toggle Manual vs Google Ads)
 */
async function updateSettings(req, res, next) {
  try {
    const { ad_mode, google_ads_enabled, google_ad_unit_id, google_banner_html, app_notice } = req.body;

    const updates = [
      { key: 'ad_mode', val: ad_mode },
      { key: 'google_ads_enabled', val: String(google_ads_enabled) },
      { key: 'google_ad_unit_id', val: google_ad_unit_id },
      { key: 'google_banner_html', val: google_banner_html },
      { key: 'app_notice', val: app_notice },
    ];

    for (const item of updates) {
      if (item.val !== undefined && item.val !== null) {
        await pool.query(
          `INSERT INTO app_settings (setting_key, setting_value) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [item.key, item.val, item.val]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create Nearby Business
 */
async function createNearbyBusiness(req, res, next) {
  try {
    const { name, category, distance, address, rating, pin_code, latitude, longitude } = req.body;
    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Business name and address required' });
    }

    const [result] = await pool.query(
      `INSERT INTO nearby_businesses (name, category, distance, address, rating, pin_code, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category || 'Store',
        distance || '0.5 km',
        address.trim(),
        rating || 4.8,
        pin_code || null,
        latitude || 22.7126,
        longitude || 88.3524,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Nearby business added successfully',
      id: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete Nearby Business
 */
async function deleteNearbyBusiness(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM nearby_businesses WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Business removed successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: List all business applications
 */
async function getBusinesses(req, res, next) {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM business_registrations';
    const params = [];
    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);

    const parsed = rows.map((r) => {
      if (typeof r.shop_images === 'string') {
        try {
          r.shop_images = JSON.parse(r.shop_images);
        } catch (e) {
          r.shop_images = [];
        }
      }
      return r;
    });

    return res.status(200).json({
      success: true,
      businesses: parsed,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Approve Business application
 */
async function approveBusiness(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM business_registrations WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const biz = rows[0];
    const { pinCode } = await generateUniquePin(biz.state_code || 'WB', biz.district_code || '09', pool);

    await pool.query(
      "UPDATE business_registrations SET status = 'approved', pin_code = ?, updated_at = NOW() WHERE id = ?",
      [pinCode, id]
    );

    // Also insert into nearby_businesses so it appears in the app
    await pool.query(
      `INSERT INTO nearby_businesses (name, category, distance, address, rating, pin_code, latitude, longitude, image_url, is_verified)
       VALUES (?, ?, '0.3 km', ?, 4.9, ?, ?, ?, ?, TRUE)`,
      [
        biz.shop_name,
        biz.category || 'Retail & Shopping',
        biz.address_line || `${biz.city || 'Rishra'}, ${biz.district || 'Hooghly'}`,
        pinCode,
        biz.latitude || 22.7126,
        biz.longitude || 88.3524,
        biz.shop_logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60',
      ]
    );

    // Real notification to user
    await pool.query(
      `INSERT INTO app_notifications (user_phone, title, message, type, target_pin, action_type)
       VALUES (?, ?, ?, 'business_alert', ?, 'profile')`,
      [
        biz.phone,
        `🎉 Business Verified: ${biz.shop_name}`,
        `Congratulations! Your verified business DIGIPIN is ${pinCode}. Your store is now listed on Nearby Verified Businesses.`,
        pinCode,
      ]
    );

    // Also broadcast to all users that a new business joined nearby
    await pool.query(
      `INSERT INTO app_notifications (user_phone, title, message, type, target_pin, action_type)
       VALUES (NULL, ?, ?, 'business_alert', ?, 'nearby')`,
      [
        `New Business Nearby: ${biz.shop_name}`,
        `${biz.shop_name} has registered their verified business pin in ${biz.city || 'your area'}. Tap to explore.`,
        pinCode,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Business approved and verified PIN generated successfully!',
      pinCode,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Reject Business application
 */
async function rejectBusiness(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const [rows] = await pool.query('SELECT * FROM business_registrations WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    await pool.query(
      "UPDATE business_registrations SET status = 'rejected', rejection_reason = ?, updated_at = NOW() WHERE id = ?",
      [reason || 'Business verification documents could not be validated.', id]
    );

    await pool.query(
      `INSERT INTO app_notifications (user_phone, title, message, type, action_type)
       VALUES (?, ?, ?, 'business_alert', 'profile')`,
      [
        rows[0].phone,
        `Business Verification Notice: ${rows[0].shop_name}`,
        `Your business documents could not be validated. Reason: ${reason || 'Details could not be verified'}. Please re-upload.`,
      ]
    );

    return res.status(200).json({ success: true, message: 'Business application rejected' });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get App Start Popup Settings
 */
async function getPopupSettings(req, res, next) {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key LIKE 'popup_%'");
    const popup = {};
    rows.forEach((r) => {
      popup[r.setting_key] = r.setting_value;
    });
    return res.status(200).json({ success: true, popup });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update App Start Popup Settings
 */
async function updatePopupSettings(req, res, next) {
  try {
    const { enabled, title, message, imageUrl, buttonText, action, actionUrl } = req.body;

    const items = [
      { key: 'popup_enabled', val: String(enabled !== false && enabled !== 'false') },
      { key: 'popup_title', val: title || 'Special Offer: Refer & Earn!' },
      { key: 'popup_message', val: message || '' },
      { key: 'popup_image_url', val: imageUrl || '' },
      { key: 'popup_button_text', val: buttonText || 'Explore' },
      { key: 'popup_action', val: action || 'refer' },
      { key: 'popup_action_url', val: actionUrl || '' },
    ];

    for (const item of items) {
      await pool.query(
        'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [item.key, item.val, item.val]
      );
    }

    return res.status(200).json({ success: true, message: 'App launch popup settings updated!' });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Send Broadcast Notification
 */
async function sendBroadcastNotification(req, res, next) {
  try {
    const { title, message, type, action_type, action_url, target_phone } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO app_notifications (user_phone, title, message, type, action_type, action_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        target_phone ? target_phone.trim() : null,
        title.trim(),
        message.trim(),
        type || 'admin_broadcast',
        action_type || 'profile',
        action_url || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Notification sent successfully!',
      id: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete Notification
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM app_notifications WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  requestChanges,
  createNews,
  deleteNews,
  createAd,
  deleteAd,
  getSettings,
  updateSettings,
  createNearbyBusiness,
  deleteNearbyBusiness,
  getBusinesses,
  approveBusiness,
  rejectBusiness,
  getPopupSettings,
  updatePopupSettings,
  sendBroadcastNotification,
  deleteNotification,
};
