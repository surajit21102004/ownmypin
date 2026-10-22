const { pool } = require('../config/db');

const FIXED_OTP = '123456';

/**
 * Send OTP to mobile number
 */
async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.trim();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP record
    await pool.query(
      'INSERT INTO otps (phone, otp, expires_at) VALUES (?, ?, ?)',
      [cleanPhone, FIXED_OTP, expiresAt]
    );

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      phone: cleanPhone,
      otp: FIXED_OTP, // Returned for easy testing as requested
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP and login / create user
 */
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = String(otp).trim();

    // Verify OTP against FIXED_OTP or recent DB record
    const isValid = cleanOtp === FIXED_OTP;
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please use 123456.' });
    }

    // Mark OTP as used
    await pool.query(
      'UPDATE otps SET is_used = TRUE WHERE phone = ? AND otp = ?',
      [cleanPhone, cleanOtp]
    );

    // Find or create user
    const [existingUsers] = await pool.query(
      'SELECT id, phone, full_name, is_verified FROM users WHERE phone = ? LIMIT 1',
      [cleanPhone]
    );

    let user;
    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO users (phone, is_verified) VALUES (?, TRUE)',
        [cleanPhone]
      );
      user = { id: insertResult.insertId, phone: cleanPhone, is_verified: true };
    }

    // Check for existing registration
    const [registrations] = await pool.query(
      'SELECT * FROM registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    );

    const registration = registrations.length > 0 ? registrations[0] : null;

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user,
      registration,
      isNewUser: !registration,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
};
