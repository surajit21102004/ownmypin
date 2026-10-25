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
      otp: FIXED_OTP, // Returned for easy testing
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
    const { phone, otp, password, role, fullName, shopName } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = String(otp).trim();

    // Verify OTP against FIXED_OTP
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
      'SELECT id, phone, full_name, role, shop_name, is_verified, password FROM users WHERE phone = ? LIMIT 1',
      [cleanPhone]
    );

    let user;
    const userRole = role === 'business' ? 'business' : 'user';

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      const updates = [];
      const params = [];

      if (password) {
        updates.push('password = ?');
        params.push(password);
      }
      if (role && role !== user.role) {
        updates.push('role = ?');
        params.push(userRole);
      }
      if (fullName && !user.full_name) {
        updates.push('full_name = ?');
        params.push(fullName);
      }
      if (shopName) {
        updates.push('shop_name = ?');
        params.push(shopName);
      }

      if (updates.length > 0) {
        params.push(user.id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        user = { ...user, role: userRole, shop_name: shopName || user.shop_name };
      }
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO users (phone, password, role, full_name, shop_name, is_verified) VALUES (?, ?, ?, ?, ?, TRUE)',
        [cleanPhone, password || null, userRole, fullName || null, shopName || null]
      );
      user = {
        id: insertResult.insertId,
        phone: cleanPhone,
        role: userRole,
        full_name: fullName || null,
        shop_name: shopName || null,
        is_verified: true,
      };
    }

    // Fetch user registration (residential / doorstep)
    const [registrations] = await pool.query(
      'SELECT * FROM registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    );
    const registration = registrations.length > 0 ? registrations[0] : null;

    // Fetch business registration (if business)
    const [bizRegistrations] = await pool.query(
      'SELECT * FROM business_registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    );
    const businessRegistration = bizRegistrations.length > 0 ? bizRegistrations[0] : null;

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user,
      registration,
      businessRegistration,
      isNewUser: !registration && !businessRegistration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Password Login (for both User and Business)
 */
async function loginWithPassword(req, res, next) {
  try {
    const { phone, password, role } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required.',
      });
    }

    const cleanPhone = phone.trim();

    const [users] = await pool.query(
      'SELECT id, phone, full_name, role, shop_name, is_verified, password FROM users WHERE phone = ? LIMIT 1',
      [cleanPhone]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number. Please register first.',
      });
    }

    const user = users[0];

    // If user has not set a password yet, inform them to set password or use OTP
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'No password has been set for this account yet. Please login with OTP to create your password.',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify and try again.',
      });
    }

    // Fetch user registration
    const [registrations] = await pool.query(
      'SELECT * FROM registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    );
    const registration = registrations.length > 0 ? registrations[0] : null;

    // Fetch business registration
    const [bizRegistrations] = await pool.query(
      'SELECT * FROM business_registrations WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    );
    const businessRegistration = bizRegistrations.length > 0 ? bizRegistrations[0] : null;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        shop_name: user.shop_name,
        is_verified: user.is_verified,
      },
      registration,
      businessRegistration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register Account with Phone, OTP, and Password
 */
async function registerAccount(req, res, next) {
  try {
    const { phone, otp, password, role, fullName, shopName } = req.body;

    if (!phone || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, OTP, and password are required.',
      });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = String(otp).trim();

    if (cleanOtp !== FIXED_OTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please enter 123456.',
      });
    }

    const userRole = role === 'business' ? 'business' : 'user';

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT id, phone, role FROM users WHERE phone = ? LIMIT 1',
      [cleanPhone]
    );

    let user;
    if (existingUsers.length > 0) {
      await pool.query(
        'UPDATE users SET password = ?, role = ?, full_name = COALESCE(?, full_name), shop_name = COALESCE(?, shop_name) WHERE id = ?',
        [password, userRole, fullName || null, shopName || null, existingUsers[0].id]
      );
      user = {
        id: existingUsers[0].id,
        phone: cleanPhone,
        role: userRole,
        full_name: fullName,
        shop_name: shopName,
      };
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO users (phone, password, role, full_name, shop_name, is_verified) VALUES (?, ?, ?, ?, ?, TRUE)',
        [cleanPhone, password, userRole, fullName || null, shopName || null]
      );
      user = {
        id: insertResult.insertId,
        phone: cleanPhone,
        role: userRole,
        full_name: fullName,
        shop_name: shopName,
        is_verified: true,
      };
    }

    // Add welcome notification
    await pool.query(
      `INSERT INTO app_notifications (user_phone, title, message, type, action_type)
       VALUES (?, ?, ?, 'admin_broadcast', 'profile')`,
      [
        cleanPhone,
        `Welcome to ownMyPin ${userRole === 'business' ? 'Business' : ''}!`,
        userRole === 'business'
          ? 'Complete your shop location and document verification to receive your verified Business PIN.'
          : 'You are now ready to register your certified doorstep DIGIPIN.',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user,
      registration: null,
      businessRegistration: null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  loginWithPassword,
  registerAccount,
};
