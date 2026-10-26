const { pool } = require('../config/db');

const DEFAULT_BASE_URL = 'https://verify.cgpey.com';

function getCredentials() {
  const merchantId = (process.env.DIGILOCKER_MERCHANT_ID || '6a59d442baaa8e8724540fc9').trim();
  let apiKey = (process.env.DIGILOCKER_API_KEY || 'pk_b48b62c60d0131a7ea1dad209e1fe760').trim();
  if (apiKey.startsWith('Pk_')) {
    apiKey = 'pk_' + apiKey.slice(3);
  }
  const secretKey = (process.env.DIGILOCKER_SECRET_KEY || '00110eff39dd0e9dc09a859266e9dfeb0568ff8ee4696eeaf95b2fb8da41db55').trim();
  const baseUrl = (process.env.DIGILOCKER_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

  return { merchantId, apiKey, secretKey, baseUrl };
}

function getServerOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}`;
}

/**
 * 1. Initiate DigiLocker Aadhaar Verification Session
 * POST /api/digilocker/initiate
 */
async function initiateDigilocker(req, res, next) {
  try {
    const { phone, mobileNumber, redirectUrl } = req.body;
    const cleanPhone = (phone || mobileNumber || '').trim();

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number / mobileNumber is required to initiate DigiLocker verification.',
      });
    }

    const { merchantId, apiKey, secretKey, baseUrl } = getCredentials();
    const serverOrigin = getServerOrigin(req);
    // Use client redirectUrl or default to backend redirect handler
    const finalRedirectUrl = redirectUrl && redirectUrl.trim()
      ? redirectUrl.trim()
      : `${serverOrigin}/api/digilocker/redirect`;

    // Only send 10-digit mobile number to cgpey if it has country code prefix
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    const mobile10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

    const requestPayload = {
      mobileNumber: mobile10,
      redirectUrl: finalRedirectUrl,
    };

    console.log('[DigiLocker] Initiating session on CGPey for mobile:', mobile10, 'redirectUrl:', finalRedirectUrl);

    const cgResponse = await fetch(`${baseUrl}/api/v1/digilocker/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchantId,
        'x-api-key': apiKey,
        'x-secret-key': secretKey,
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await cgResponse.json();

    if (!cgResponse.ok || !data.success) {
      console.error('[DigiLocker] Initiation error from provider:', data);
      return res.status(cgResponse.status || 400).json({
        success: false,
        message: data.message || 'Failed to initiate DigiLocker session with provider.',
        error: data.error || null,
      });
    }

    const { recordId, publicId, authUrl, state } = data.data || {};

    // Store in `digilocker_verifications` table
    try {
      await pool.query(
        `INSERT INTO digilocker_verifications (phone, record_id, public_id, state, status, auth_url)
         VALUES (?, ?, ?, ?, 'INITIATED', ?)
         ON DUPLICATE KEY UPDATE 
           public_id = VALUES(public_id),
           state = VALUES(state),
           status = 'INITIATED',
           auth_url = VALUES(auth_url),
           updated_at = NOW()`,
        [cleanPhone, recordId, publicId || null, state || null, authUrl || null]
      );
    } catch (dbErr) {
      console.error('[DigiLocker] Error caching session in DB:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: data.message || 'DigiLocker session initiated. Redirect user to authUrl',
      data: {
        recordId,
        publicId,
        authUrl,
        state,
        redirectUrl: finalRedirectUrl,
      },
    });
  } catch (error) {
    console.error('[DigiLocker] Initiate exception:', error);
    next(error);
  }
}

/**
 * 2. DigiLocker Callback: Send auth code and verifier
 * POST /api/digilocker/callback
 */
async function callbackDigilocker(req, res, next) {
  try {
    const { code, state, codeVerifier, recordId: rawRecordId } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required.',
      });
    }

    let recordId = rawRecordId;
    let cachedPhone = null;

    // If recordId is missing, look up by state in DB
    if (!recordId && state) {
      const [rows] = await pool.query(
        'SELECT record_id, phone FROM digilocker_verifications WHERE state = ? ORDER BY id DESC LIMIT 1',
        [state]
      );
      if (rows.length > 0) {
        recordId = rows[0].record_id;
        cachedPhone = rows[0].phone;
      }
    }

    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: 'recordId could not be determined for this callback.',
      });
    }

    const { baseUrl } = getCredentials();

    const cgResponse = await fetch(`${baseUrl}/api/v1/digilocker/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state: state || '',
        codeVerifier: codeVerifier || '',
        recordId,
      }),
    });

    const data = await cgResponse.json();

    if (!cgResponse.ok || !data.success) {
      console.error('[DigiLocker] Callback error from provider:', data);
      const [vRows] = await pool.query(
        'SELECT status FROM digilocker_verifications WHERE record_id = ? LIMIT 1',
        [recordId]
      );
      if (vRows.length > 0 && (vRows[0].status === 'VERIFIED' || vRows[0].status === 'PENDING')) {
        return res.status(200).json({
          success: true,
          message: 'Authorization code already processed.',
          data: { recordId, status: vRows[0].status },
        });
      }
      return res.status(cgResponse.status || 400).json({
        success: false,
        message: data.message || 'DigiLocker callback exchange failed with provider.',
        error: data.error || null,
      });
    }

    // Update status in DB (only if not already verified)
    await pool.query(
      "UPDATE digilocker_verifications SET status = 'PENDING', updated_at = NOW() WHERE record_id = ? AND status != 'VERIFIED'",
      [recordId]
    );

    return res.status(200).json({
      success: true,
      message: data.message || 'Authorization code received. Complete verification to fetch Aadhaar.',
      data: {
        recordId,
        status: 'PENDING',
        phone: cachedPhone,
      },
    });
  } catch (error) {
    console.error('[DigiLocker] Callback exception:', error);
    next(error);
  }
}

/**
 * 3. Complete DigiLocker Verification and Retrieve Aadhaar Data
 * POST /api/digilocker/complete
 */
async function completeDigilocker(req, res, next) {
  try {
    const { recordId, phone } = req.body;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: 'recordId is required to complete verification.',
      });
    }

    console.log('[DigiLocker] Completing verification for recordId:', recordId);

    // 1. First check if this record is ALREADY verified in DB (e.g. via parallel browser redirect)
    const [existingRows] = await pool.query(
      'SELECT * FROM digilocker_verifications WHERE record_id = ? LIMIT 1',
      [recordId]
    );

    if (existingRows.length > 0 && existingRows[0].status === 'VERIFIED') {
      console.log(`[DigiLocker] Record ${recordId} already VERIFIED in database! Returning verified details.`);
      const existing = existingRows[0];
      const targetPhone = phone || existing.phone;

      if (targetPhone) {
        await pool.query(
          `UPDATE users 
           SET is_aadhaar_verified = 1,
               aadhaar_verified_name = COALESCE(?, aadhaar_verified_name),
               digilocker_record_id = ?,
               digilocker_verified_at = NOW()
           WHERE phone = ?`,
          [existing.aadhaar_name, recordId, targetPhone]
        );
        await pool.query(
          `UPDATE registrations 
           SET is_aadhaar_verified = 1,
               aadhaar_verified_name = COALESCE(?, aadhaar_verified_name),
               digilocker_record_id = ?,
               digilocker_verified_at = NOW()
           WHERE phone = ?`,
          [existing.aadhaar_name, recordId, targetPhone]
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Aadhaar verified successfully via DigiLocker!',
        data: {
          recordId,
          transactionId: existing.transaction_id,
          status: 'VERIFIED',
          isDigilockerVerified: true,
          aadhaarData: {
            name: existing.aadhaar_name,
            dateOfBirth: existing.aadhaar_dob,
            gender: existing.aadhaar_gender,
            address: existing.aadhaar_address,
            state: existing.aadhaar_state,
            district: existing.aadhaar_district,
            pincode: existing.aadhaar_pincode,
          },
        },
      });
    }

    const { merchantId, apiKey, secretKey, baseUrl } = getCredentials();

    const cgResponse = await fetch(`${baseUrl}/api/v1/digilocker/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchantId,
        'x-api-key': apiKey,
        'x-secret-key': secretKey,
      },
      body: JSON.stringify({ recordId }),
    });

    const result = await cgResponse.json();

    if (!cgResponse.ok || !result.success) {
      console.error('[DigiLocker] Complete error from provider:', result);

      // Provider returned an error (e.g. Reference key retrieval failed due to parallel consumption).
      // Check if DB was updated to VERIFIED by the browser redirect handler in the meantime!
      const [retryRows] = await pool.query(
        'SELECT * FROM digilocker_verifications WHERE record_id = ? LIMIT 1',
        [recordId]
      );
      if (retryRows.length > 0 && retryRows[0].status === 'VERIFIED') {
        console.log(`[DigiLocker] Record ${recordId} was verified via parallel redirect! Returning success.`);
        const v = retryRows[0];
        const targetPhone = phone || v.phone;
        if (targetPhone) {
          await pool.query(
            `UPDATE users 
             SET is_aadhaar_verified = 1,
                 aadhaar_verified_name = COALESCE(?, aadhaar_verified_name),
                 digilocker_record_id = ?,
                 digilocker_verified_at = NOW()
             WHERE phone = ?`,
            [v.aadhaar_name, recordId, targetPhone]
          );
          await pool.query(
            `UPDATE registrations 
             SET is_aadhaar_verified = 1,
                 aadhaar_verified_name = COALESCE(?, aadhaar_verified_name),
                 digilocker_record_id = ?,
                 digilocker_verified_at = NOW()
             WHERE phone = ?`,
            [v.aadhaar_name, recordId, targetPhone]
          );
        }

        return res.status(200).json({
          success: true,
          message: 'Aadhaar verified successfully via DigiLocker!',
          data: {
            recordId,
            transactionId: v.transaction_id,
            status: 'VERIFIED',
            isDigilockerVerified: true,
            aadhaarData: {
              name: v.aadhaar_name,
              dateOfBirth: v.aadhaar_dob,
              gender: v.aadhaar_gender,
              address: v.aadhaar_address,
              state: v.aadhaar_state,
              district: v.aadhaar_district,
              pincode: v.aadhaar_pincode,
            },
          },
        });
      }

      return res.status(cgResponse.status || 400).json({
        success: false,
        message: result.message || 'Failed to complete DigiLocker verification with provider.',
        error: result.error || null,
      });
    }

    const {
      transactionId,
      aadhaarVerificationId,
      service,
      aadhaarData = {},
      status,
    } = result.data || {};

    const verifiedName = aadhaarData.name || null;
    const verifiedDob = aadhaarData.dateOfBirth || null;
    const verifiedGender = aadhaarData.gender || null;
    const verifiedAddress = aadhaarData.address || null;
    const verifiedState = aadhaarData.state || null;
    const verifiedDistrict = aadhaarData.district || null;
    const verifiedPincode = aadhaarData.pincode || null;

    // Lookup phone from `digilocker_verifications` if not provided in body
    let targetPhone = phone;
    if (!targetPhone) {
      const [vRows] = await pool.query(
        'SELECT phone FROM digilocker_verifications WHERE record_id = ? LIMIT 1',
        [recordId]
      );
      if (vRows.length > 0) {
        targetPhone = vRows[0].phone;
      }
    }

    // 1. Update `digilocker_verifications`
    await pool.query(
      `UPDATE digilocker_verifications 
       SET status = 'VERIFIED',
           transaction_id = ?,
           aadhaar_verification_id = ?,
           aadhaar_name = ?,
           aadhaar_dob = ?,
           aadhaar_gender = ?,
           aadhaar_address = ?,
           aadhaar_state = ?,
           aadhaar_district = ?,
           aadhaar_pincode = ?,
           raw_response = ?,
           updated_at = NOW()
       WHERE record_id = ?`,
      [
        transactionId || null,
        aadhaarVerificationId || null,
        verifiedName,
        verifiedDob,
        verifiedGender,
        verifiedAddress,
        verifiedState,
        verifiedDistrict,
        verifiedPincode,
        JSON.stringify(result.data),
        recordId,
      ]
    );

    // 2. Update `users` table if phone is known
    if (targetPhone) {
      await pool.query(
        `UPDATE users 
         SET is_aadhaar_verified = 1,
             aadhaar_verified_name = COALESCE(?, aadhaar_verified_name),
             digilocker_record_id = ?,
             digilocker_verified_at = NOW()
         WHERE phone = ?`,
        [verifiedName, recordId, targetPhone]
      );

      // 3. Update `registrations` table
      await pool.query(
        `UPDATE registrations 
         SET is_aadhaar_verified = 1,
             aadhaar_verified_name = COALESCE(?, aadhaar_verified_name),
             digilocker_record_id = ?,
             digilocker_verified_at = NOW()
         WHERE phone = ?`,
        [verifiedName, recordId, targetPhone]
      );

      // 4. Create an in-app notification
      try {
        await pool.query(
          `INSERT INTO app_notifications (user_phone, title, message, type, action_type)
           VALUES (?, 'DigiLocker Identity Verified!', ?, 'pin_status', 'profile')`,
          [
            targetPhone,
            `Congratulations ${verifiedName || ''}! Your identity has been successfully verified via Government of India DigiLocker. The DigiLocker Verified badge is now live on your DIGIPIN profile.`,
          ]
        );
      } catch (notifErr) {
        console.error('[DigiLocker] Notification error:', notifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Aadhaar verified successfully via DigiLocker!',
      data: {
        recordId,
        transactionId,
        status: 'VERIFIED',
        isDigilockerVerified: true,
        aadhaarData: {
          name: verifiedName,
          dateOfBirth: verifiedDob,
          gender: verifiedGender,
          address: verifiedAddress,
          state: verifiedState,
          district: verifiedDistrict,
          pincode: verifiedPincode,
        },
      },
    });
  } catch (error) {
    console.error('[DigiLocker] Complete exception:', error);
    next(error);
  }
}

/**
 * 4. Browser OAuth Redirect Handler (when user completes DigiLocker login in browser / webview)
 * GET /api/digilocker/redirect
 */
async function handleBrowserRedirect(req, res, next) {
  try {
    const { code, state, codeVerifier, error, error_description } = req.query;

    if (error) {
      return res.status(400).send(renderStatusHtml({
        success: false,
        title: 'DigiLocker Verification Cancelled',
        message: error_description || 'You cancelled the DigiLocker Aadhaar verification process.',
      }));
    }

    if (!code) {
      return res.status(400).send(renderStatusHtml({
        success: false,
        title: 'Missing Authorization Code',
        message: 'No authorization code was returned by DigiLocker. Please try again.',
      }));
    }

    // Find recordId in DB by state
    const [rows] = await pool.query(
      'SELECT record_id, phone FROM digilocker_verifications WHERE state = ? ORDER BY id DESC LIMIT 1',
      [state]
    );

    if (rows.length === 0) {
      return res.status(404).send(renderStatusHtml({
        success: false,
        title: 'Session Not Found',
        message: 'No active DigiLocker verification session found matching this state. Please restart verification.',
      }));
    }

    const { record_id: recordId, phone } = rows[0];
    const { merchantId, apiKey, secretKey, baseUrl } = getCredentials();

    // Call /callback on cgpey
    const cbRes = await fetch(`${baseUrl}/api/v1/digilocker/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state: state || '',
        codeVerifier: codeVerifier || '',
        recordId,
      }),
    });

    const cbData = await cbRes.json();
    if (!cbRes.ok || !cbData.success) {
      console.error('[DigiLocker Redirect] Callback error:', cbData);
      return res.status(400).send(renderStatusHtml({
        success: false,
        title: 'Callback Verification Failed',
        message: cbData.message || 'Could not verify the authorization code with DigiLocker.',
      }));
    }

    // Call /complete on cgpey
    const compRes = await fetch(`${baseUrl}/api/v1/digilocker/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchantId,
        'x-api-key': apiKey,
        'x-secret-key': secretKey,
      },
      body: JSON.stringify({ recordId }),
    });

    const compData = await compRes.json();
    if (!compRes.ok || !compData.success) {
      console.error('[DigiLocker Redirect] Complete error:', compData);
      return res.status(400).send(renderStatusHtml({
        success: false,
        title: 'Aadhaar Retrieval Incomplete',
        message: compData.message || 'Could not retrieve Aadhaar details from DigiLocker.',
      }));
    }

    const {
      transactionId,
      aadhaarVerificationId,
      aadhaarData = {},
    } = compData.data || {};

    const verifiedName = aadhaarData.name || 'Verified Resident';

    // Update DB
    await pool.query(
      `UPDATE digilocker_verifications 
       SET status = 'VERIFIED',
           transaction_id = ?,
           aadhaar_verification_id = ?,
           aadhaar_name = ?,
           aadhaar_dob = ?,
           aadhaar_gender = ?,
           aadhaar_address = ?,
           aadhaar_state = ?,
           aadhaar_district = ?,
           aadhaar_pincode = ?,
           raw_response = ?,
           updated_at = NOW()
       WHERE record_id = ?`,
      [
        transactionId || null,
        aadhaarVerificationId || null,
        verifiedName,
        aadhaarData.dateOfBirth || null,
        aadhaarData.gender || null,
        aadhaarData.address || null,
        aadhaarData.state || null,
        aadhaarData.district || null,
        aadhaarData.pincode || null,
        JSON.stringify(compData.data),
        recordId,
      ]
    );

    if (phone) {
      await pool.query(
        'UPDATE users SET is_aadhaar_verified = 1, aadhaar_verified_name = ?, digilocker_record_id = ?, digilocker_verified_at = NOW() WHERE phone = ?',
        [verifiedName, recordId, phone]
      );
      await pool.query(
        'UPDATE registrations SET is_aadhaar_verified = 1, aadhaar_verified_name = ?, digilocker_record_id = ?, digilocker_verified_at = NOW() WHERE phone = ?',
        [verifiedName, recordId, phone]
      );
    }

    return res.status(200).send(renderStatusHtml({
      success: true,
      title: 'Aadhaar Verified by DigiLocker',
      name: verifiedName,
      message: 'Your Government of India Aadhaar identity has been successfully authenticated.',
      recordId,
    }));
  } catch (error) {
    console.error('[DigiLocker Redirect] Exception:', error);
    return res.status(500).send(renderStatusHtml({
      success: false,
      title: 'Verification Server Error',
      message: error.message || 'An unexpected error occurred during verification.',
    }));
  }
}

/**
 * 5. Check DigiLocker Status for a Phone Number
 * GET /api/digilocker/status/:phone
 */
async function getDigilockerStatus(req, res, next) {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required.' });
    }

    const cleanPhone = phone.trim();

    // Check user & latest verification
    const [userRows] = await pool.query(
      'SELECT id, phone, full_name, is_aadhaar_verified, aadhaar_verified_name, digilocker_record_id, digilocker_verified_at FROM users WHERE phone = ? LIMIT 1',
      [cleanPhone]
    );

    const [vRows] = await pool.query(
      'SELECT * FROM digilocker_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    );

    const user = userRows.length > 0 ? userRows[0] : null;
    const session = vRows.length > 0 ? vRows[0] : null;

    const isVerified = Boolean(
      (user && user.is_aadhaar_verified) ||
      (session && session.status === 'VERIFIED')
    );

    return res.status(200).json({
      success: true,
      isVerified,
      verifiedName: (user && user.aadhaar_verified_name) || (session && session.aadhaar_name) || null,
      verifiedAt: (user && user.digilocker_verified_at) || (session && session.updated_at) || null,
      recordId: (user && user.digilocker_record_id) || (session && session.record_id) || null,
      details: isVerified && session ? {
        dob: session.aadhaar_dob,
        gender: session.aadhaar_gender,
        district: session.aadhaar_district,
        state: session.aadhaar_state,
        pincode: session.aadhaar_pincode,
      } : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Render Responsive HTML confirmation for browser / webview callback
 */
function renderStatusHtml({ success, title, name, message, recordId }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>${title} | OwnMyPin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      max-width: 440px;
      width: 100%;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .badge-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
      background: ${success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      border: 2px solid ${success ? '#10b981' : '#ef4444'};
    }
    .dl-logo-wrap {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.06);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .name-pill {
      display: inline-block;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      font-weight: 700;
      font-size: 15px;
      padding: 6px 16px;
      border-radius: 30px;
      margin: 8px 0 16px;
    }
    .desc {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      background: ${success ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #475569, #334155)'};
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }
    .footer-note {
      margin-top: 16px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="dl-logo-wrap">
      <span>🛡️ Government of India</span>
      <span>•</span>
      <span>DigiLocker</span>
    </div>
    <div class="badge-icon">
      ${success ? '✓' : '✕'}
    </div>
    <h1 class="title">${title}</h1>
    ${name ? `<div class="name-pill">${name}</div>` : ''}
    <p class="desc">${message}</p>
    <a href="ownmypin://digilocker-complete?recordId=${encodeURIComponent(recordId || '')}&success=${success}" class="btn" onclick="notifyApp();">
      Return to ownMyPin App
    </a>
    <p class="footer-note">Official Verified Identity Badge has been registered.</p>
  </div>
  <script>
    function notifyApp() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DIGILOCKER_COMPLETE',
          success: ${success},
          recordId: '${recordId || ''}',
          name: '${name || ''}'
        }));
      }
    }
    // Auto notify WebView
    setTimeout(notifyApp, 500);
  </script>
</body>
</html>`;
}

module.exports = {
  initiateDigilocker,
  callbackDigilocker,
  completeDigilocker,
  handleBrowserRedirect,
  getDigilockerStatus,
};
