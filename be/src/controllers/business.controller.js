const { pool } = require('../config/db');
const { generateUniquePin } = require('../utils/pinGenerator');

/**
 * Register a new business
 */
async function registerBusiness(req, res, next) {
  try {
    const {
      phone,
      ownerName,
      shopName,
      category,
      addressLine,
      state,
      stateCode,
      district,
      districtCode,
      city,
      pincode,
      landmark,
      latitude,
      longitude,
      shopLogoUrl,
      shopImages,
      docType,
      docNumber,
      docFileUrl,
    } = req.body;

    if (!phone || !shopName || !ownerName) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, shop name, and owner name are required.',
      });
    }

    const cleanPhone = phone.trim();
    const cleanShop = shopName.trim();
    const cleanOwner = ownerName.trim();

    // Check if user exists in users table, or create business user
    const [existingUsers] = await pool.query(
      'SELECT id, phone, role FROM users WHERE phone = ? LIMIT 1',
      [cleanPhone]
    );

    let userId = null;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      await pool.query(
        "UPDATE users SET role = 'business', shop_name = ? WHERE id = ?",
        [cleanShop, userId]
      );
    } else {
      const [insertUser] = await pool.query(
        "INSERT INTO users (phone, full_name, shop_name, role, is_verified) VALUES (?, ?, ?, 'business', TRUE)",
        [cleanPhone, cleanOwner, cleanShop]
      );
      userId = insertUser.insertId;
    }

    const serializedImages = Array.isArray(shopImages) ? JSON.stringify(shopImages) : shopImages || '[]';

    // Insert into business_registrations
    const [result] = await pool.query(
      `INSERT INTO business_registrations (
        user_id, phone, shop_name, owner_name, category, address_line,
        state, state_code, district, district_code, city, pincode, landmark,
        latitude, longitude, shop_logo_url, shop_images, doc_type, doc_number, doc_file_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        cleanPhone,
        cleanShop,
        cleanOwner,
        category || 'Retail & Shopping',
        addressLine || '',
        state || 'West Bengal',
        stateCode || 'WB',
        district || 'Hooghly',
        districtCode || '09',
        city || '',
        pincode || '',
        landmark || '',
        latitude || 22.7126,
        longitude || 88.3524,
        shopLogoUrl || null,
        serializedImages,
        docType || 'GSTIN',
        docNumber || '',
        docFileUrl || null,
      ]
    );

    const businessId = result.insertId;

    // Create real notification announcing new business submission
    await pool.query(
      `INSERT INTO app_notifications (user_phone, title, message, type, action_type)
       VALUES (?, ?, ?, 'business_alert', 'nearby')`,
      [
        cleanPhone,
        `Business Application Submitted: ${cleanShop}`,
        `Your business verification documents (${docType || 'GSTIN'}: ${docNumber || 'Submitted'}) are under review.`,
      ]
    );

    // Fetch the created record
    const [rows] = await pool.query(
      'SELECT * FROM business_registrations WHERE id = ? LIMIT 1',
      [businessId]
    );

    return res.status(201).json({
      success: true,
      message: 'Business application submitted successfully! It is under verification.',
      businessRegistration: rows[0],
    });
  } catch (error) {
    console.error('registerBusiness error:', error);
    next(error);
  }
}

/**
 * Get business status by phone
 */
async function getMyBusiness(req, res, next) {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required' });
    }

    const cleanPhone = phone.trim();
    const [rows] = await pool.query(
      'SELECT * FROM business_registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        businessRegistration: null,
      });
    }

    const item = rows[0];
    if (typeof item.shop_images === 'string') {
      try {
        item.shop_images = JSON.parse(item.shop_images);
      } catch (e) {
        item.shop_images = [];
      }
    }

    return res.status(200).json({
      success: true,
      businessRegistration: item,
    });
  } catch (error) {
    console.error('getMyBusiness error:', error);
    next(error);
  }
}

module.exports = {
  registerBusiness,
  getMyBusiness,
};
