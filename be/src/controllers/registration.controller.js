const { pool } = require('../config/db');

/**
 * Submit a new registration (from mobile app)
 */
async function createRegistration(req, res, next) {
  try {
    const {
      phone,
      full_name,
      dob,
      guardian_name,
      property_type,
      ownership_type,
      address_line,
      state,
      state_code,
      district,
      district_code,
      city,
      pincode,
      landmark,
      latitude,
      longitude,
      selfie_url,
      property_photos,
    } = req.body;

    if (!phone || !full_name || !dob || !address_line || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phone, full_name, dob, address_line, city, pincode',
      });
    }

    const cleanState = (state || 'West Bengal').trim();
    const cleanStateCode = (state_code || 'WB').trim().toUpperCase();
    const cleanDistrict = (district || 'Hooghly').trim();
    const cleanDistrictCode = String(district_code || '09').padStart(2, '0');

    function normalizeUploadPath(u) {
      if (!u || typeof u !== 'string') return u;
      const idx = u.indexOf('/uploads/');
      return idx !== -1 ? u.substring(idx) : u;
    }

    const cleanSelfieUrl = selfie_url ? normalizeUploadPath(selfie_url) : null;
    const cleanPropPhotos = Array.isArray(property_photos)
      ? property_photos.map(normalizeUploadPath)
      : property_photos
      ? [normalizeUploadPath(property_photos)]
      : null;

    // Link with user if exists
    const [users] = await pool.query('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone]);
    const userId = users.length > 0 ? users[0].id : null;

    const [insertResult] = await pool.query(
      `INSERT INTO registrations (
        user_id, phone, full_name, dob, guardian_name, property_type, ownership_type,
        address_line, state, state_code, district, district_code, city, pincode, landmark,
        latitude, longitude, selfie_url, property_photos, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        phone.trim(),
        full_name.trim(),
        dob.trim(),
        guardian_name ? guardian_name.trim() : null,
        property_type || 'House',
        ownership_type || 'Own',
        address_line.trim(),
        cleanState,
        cleanStateCode,
        cleanDistrict,
        cleanDistrictCode,
        city.trim(),
        pincode.trim(),
        landmark ? landmark.trim() : null,
        latitude || 22.7126,
        longitude || 88.3524,
        cleanSelfieUrl,
        cleanPropPhotos ? JSON.stringify(cleanPropPhotos) : null,
      ]
    );

    const registrationId = insertResult.insertId;

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Pending verification.',
      registrationId,
      status: 'pending',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's latest registration and status
 */
async function getMyRegistration(req, res, next) {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const [rows] = await pool.query(
      `SELECT r.*, p.pin_code as verified_pin_code
       FROM registrations r
       LEFT JOIN pins p ON p.registration_id = r.id
       WHERE r.phone = ?
       ORDER BY r.id DESC LIMIT 1`,
      [phone.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registration found for this phone number',
      });
    }

    const reg = rows[0];
    if (typeof reg.property_photos === 'string') {
      try {
        reg.property_photos = JSON.parse(reg.property_photos);
      } catch (e) {
        // keep as is
      }
    }
    if (typeof reg.social_profiles === 'string') {
      try {
        reg.social_profiles = JSON.parse(reg.social_profiles);
      } catch (e) {
        // keep as is
      }
    }

    return res.status(200).json({
      success: true,
      registration: reg,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user's profile details (Social media links, Privacy mode, details)
 */
async function updateRegistrationProfile(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required to update profile' });
    }

    const {
      full_name,
      address_line,
      city,
      district,
      state,
      pincode,
      selfie_url,
      social_profiles,
      privacy_mode,
    } = req.body;

    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (address_line !== undefined) {
      updates.push('address_line = ?');
      values.push(address_line);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city);
    }
    if (district !== undefined) {
      updates.push('district = ?');
      values.push(district);
    }
    if (state !== undefined) {
      updates.push('state = ?');
      values.push(state);
    }
    if (pincode !== undefined) {
      updates.push('pincode = ?');
      values.push(pincode);
    }
    if (selfie_url !== undefined) {
      updates.push('selfie_url = ?');
      values.push(selfie_url);
    }
    if (social_profiles !== undefined) {
      updates.push('social_profiles = ?');
      values.push(typeof social_profiles === 'string' ? social_profiles : JSON.stringify(social_profiles));
    }
    if (privacy_mode !== undefined) {
      updates.push('privacy_mode = ?');
      values.push(privacy_mode ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(phone.trim());
      await pool.query(
        `UPDATE registrations SET ${updates.join(', ')} WHERE phone = ? ORDER BY id DESC LIMIT 1`,
        values
      );
    }

    // Fetch updated record
    const [rows] = await pool.query(
      `SELECT r.*, p.pin_code as verified_pin_code
       FROM registrations r
       LEFT JOIN pins p ON p.registration_id = r.id
       WHERE r.phone = ?
       ORDER BY r.id DESC LIMIT 1`,
      [phone.trim()]
    );

    const updated = rows[0] || null;
    if (updated && typeof updated.social_profiles === 'string') {
      try {
        updated.social_profiles = JSON.parse(updated.social_profiles);
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      registration: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRegistration,
  getMyRegistration,
  updateRegistrationProfile,
};
