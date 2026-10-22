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

    const parsedRows = rows.map((r) => {
      if (typeof r.property_photos === 'string') {
        try {
          r.property_photos = JSON.parse(r.property_photos);
        } catch (e) {
          r.property_photos = [];
        }
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

module.exports = {
  getRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  requestChanges,
};
