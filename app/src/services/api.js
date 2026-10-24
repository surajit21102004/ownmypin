import { Platform, NativeModules } from 'react-native';

const BACKEND_PORT = 5000;
// Your computer's current Wi-Fi IP address
export const LOCAL_PC_IP = '192.168.0.100';

/**
 * Automatically determine the backend URL:
 * 1. If running in Expo Go on a physical device, Metro bundle URL contains the computer's IP!
 * 2. If running on Web, uses current window location or localhost
 * 3. Fallbacks to the known local PC Wi-Fi IP
 */
function resolveBackendBaseUrl() {
  // If running in Web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:${BACKEND_PORT}`;
  }

  // If running on Mobile (iOS / Android), extract host from the bundle URL
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL && typeof scriptURL === 'string') {
      const parts = scriptURL.split('://');
      if (parts.length > 1) {
        const hostWithPort = parts[1].split('/')[0];
        const host = hostWithPort.split(':')[0];
        if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
          return `http://${host}:${BACKEND_PORT}`;
        }
      }
    }
  } catch (err) {
    // ignore
  }

  // Fallback for physical phone on Wi-Fi: use computer's LAN IP
  return `http://${LOCAL_PC_IP}:${BACKEND_PORT}`;
}

let currentBaseUrl = resolveBackendBaseUrl();

export function setApiBaseUrl(url) {
  if (!url) return;
  currentBaseUrl = url.trim().replace(/\/+$/, '');
  console.log('[API Client] Backend URL set to:', currentBaseUrl);
}

export function getApiBaseUrl() {
  return currentBaseUrl;
}

export function getPinQrCodeUrl(pin) {
  const clean = (pin || 'WB-09-45896524').trim().toUpperCase();
  return `${currentBaseUrl}/api/pins/qr/${encodeURIComponent(clean)}?format=png`;
}

export function getPinLocationUrl(pin) {
  const clean = (pin || 'WB-09-45896524').trim().toUpperCase();
  return `${currentBaseUrl}/location?pin=${encodeURIComponent(clean)}`;
}

/**
 * Send OTP
 */
export async function sendOtp(phone) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ phone }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${currentBaseUrl} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Verify OTP
 */
export async function verifyOtp(phone, otp) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ phone, otp }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${currentBaseUrl} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Upload Image to server (selfie or property photo)
 */
export async function uploadImageToServer(imageUri, type = 'property', base64 = null) {
  try {
    // 1. Try base64 upload if available
    if (base64) {
      const res = await fetch(`${currentBaseUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          image: `data:image/jpeg;base64,${base64}`,
          type,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        return `${currentBaseUrl}${data.url}`;
      }
    }

    // 2. Try FormData multipart upload
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || `${type}_${Date.now()}.jpg`;
    formData.append('type', type);
    formData.append('image', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      name: filename,
      type: 'image/jpeg',
    });

    const res = await fetch(`${currentBaseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.url) {
      return `${currentBaseUrl}${data.url}`;
    }

    // Fallback to local URI
    return imageUri;
  } catch (err) {
    console.warn('Image upload error, using local URI fallback:', err.message);
    return imageUri;
  }
}

/**
 * Submit Registration
 */
export async function submitRegistration(registrationData) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${currentBaseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(registrationData),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${currentBaseUrl} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Get registration status for phone
 */
export async function getMyRegistration(phone) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/registrations/my-status/${encodeURIComponent(phone)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${currentBaseUrl} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Update registration profile details (social profiles, privacy mode, etc.)
 */
export async function updateProfileOnServer(updateData) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/registrations/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(updateData),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to update profile (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Quick Health Check
 */
export async function checkBackendHealth() {
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${currentBaseUrl}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    const data = await response.json();
    return { ok: response.ok, latency, data, url: currentBaseUrl };
  } catch (error) {
    return { ok: false, error: error.message, url: currentBaseUrl };
  }
}

/**
 * Search PIN or Location Profile
 */
export async function searchPin(query) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/pins/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to search pin (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Get Daily News (DSC)
 */
export async function getDailyNews() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/content/news`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return { success: false, news: [], message: error.message };
  }
}

/**
 * Get Ads & Monetization Settings
 */
export async function getAdsAndSettings() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/content/ads`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return { success: false, ads: [], settings: { adMode: 'manual' }, message: error.message };
  }
}

/**
 * Get Notifications & Shop Ads
 */
export async function getNotifications() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/content/notifications`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return { success: false, notifications: [], unreadCount: 0, message: error.message };
  }
}

/**
 * Get Nearby Businesses
 */
export async function getNearbyBusinesses() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${currentBaseUrl}/api/content/nearby`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (error) {
    return { success: false, businesses: [], message: error.message };
  }
}

