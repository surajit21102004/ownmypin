import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_PORT = 5000;
// Your computer's current Wi-Fi LAN IP address
export const LOCAL_PC_IP = '192.168.1.6';

/**
 * Extracts IPv4 address or hostname from an arbitrary URI/URL string
 */
function extractHost(str) {
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.replace(/^[a-z]+:\/\//i, '');
  const hostWithPort = cleaned.split('/')[0];
  const host = hostWithPort.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
    return host;
  }
  return null;
}

/**
 * Automatically determine the backend URL:
 * 1. If running in Expo Go on a physical device, Metro bundle URL contains the computer's IP!
 * 2. If running on Web, uses current window location or localhost
 * 3. Fallbacks to the known local PC Wi-Fi IP (192.168.1.6)
 */
function resolveBackendBaseUrl() {
  // If running in Web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:${BACKEND_PORT}`;
  }

  // 1. Try Expo Go manifest hostUri (most reliable on physical phone)
  try {
    const host =
      extractHost(Constants.expoConfig?.hostUri) ||
      extractHost(Constants.manifest2?.extra?.expoGo?.debuggerHost) ||
      extractHost(Constants.manifest?.debuggerHost) ||
      extractHost(Constants.experienceUrl) ||
      extractHost(Constants.linkingUri);

    if (host) {
      console.log(`[API Client] Auto-detected backend host from Expo: http://${host}:${BACKEND_PORT}`);
      return `http://${host}:${BACKEND_PORT}`;
    }
  } catch (err) {
    // ignore
  }

  // 2. Try NativeModules SourceCode bundle URL
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    const host = extractHost(scriptURL);
    if (host) {
      console.log(`[API Client] Auto-detected backend host from bundle scriptURL: http://${host}:${BACKEND_PORT}`);
      return `http://${host}:${BACKEND_PORT}`;
    }
  } catch (err) {
    // ignore
  }

  // 3. Fallback for physical phone on Wi-Fi: use computer's LAN IP
  console.log(`[API Client] Using fallback LAN IP: http://${LOCAL_PC_IP}:${BACKEND_PORT}`);
  return `http://${LOCAL_PC_IP}:${BACKEND_PORT}`;
}

let currentBaseUrl = resolveBackendBaseUrl();

export function setApiBaseUrl(url) {
  if (!url) return;
  currentBaseUrl = url.trim().replace(/\/+$/, '');
  console.log('[API Client] Backend URL set to:', currentBaseUrl);
}

export function getApiBaseUrl() {
  if (!currentBaseUrl || currentBaseUrl.includes('10.133.68.219')) {
    currentBaseUrl = resolveBackendBaseUrl();
  }
  return currentBaseUrl;
}

export function getPinQrCodeUrl(pin) {
  const clean = (pin || 'WB-09-45896524').trim().toUpperCase();
  return `${getApiBaseUrl()}/api/pins/qr/${encodeURIComponent(clean)}?format=png`;
}

export function getPinLocationUrl(pin) {
  const clean = (pin || 'WB-09-45896524').trim().toUpperCase();
  return `${getApiBaseUrl()}/location?pin=${encodeURIComponent(clean)}`;
}

/**
 * Resilient fetch helper:
 * Tries current resolved base URL. If it fails with network error,
 * attempts fallback LAN IP (http://192.168.1.6:5000).
 */
async function apiFetch(endpoint, options = {}, timeoutMs = 8000) {
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${base}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    const fallbackBase = `http://${LOCAL_PC_IP}:${BACKEND_PORT}`;
    if (base !== fallbackBase) {
      console.warn(`[API Client] Call to ${fullUrl} failed (${err.message}). Retrying fallback: ${fallbackBase}${path}`);
      try {
        const fallbackRes = await fetch(`${fallbackBase}${path}`, options);
        currentBaseUrl = fallbackBase;
        return fallbackRes;
      } catch (fallbackErr) {
        throw new Error(`Failed to reach backend at ${base} or ${fallbackBase}`);
      }
    }
    throw err;
  }
}

/**
 * Send OTP
 */
export async function sendOtp(phone) {
  try {
    const res = await apiFetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${getApiBaseUrl()} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Verify OTP
 */
export async function verifyOtp(phone, otp) {
  try {
    const res = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${getApiBaseUrl()} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Upload Image to server (selfie or property photo)
 */
export async function uploadImageToServer(imageUri, type = 'property', base64 = null) {
  const base = getApiBaseUrl();
  try {
    // 1. Try base64 upload if available
    if (base64) {
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          image: `data:image/jpeg;base64,${base64}`,
          type,
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        return `${base}${data.url}`;
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

    const res = await apiFetch('/api/upload', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.url) {
      return `${base}${data.url}`;
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
    const res = await apiFetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(registrationData),
    }, 12000);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${getApiBaseUrl()} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Get registration status for phone
 */
export async function getMyRegistration(phone) {
  try {
    const res = await apiFetch(`/api/registrations/my-status/${encodeURIComponent(phone)}`);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend at ${getApiBaseUrl()} (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Update registration profile details (social profiles, privacy mode, etc.)
 */
export async function updateProfileOnServer(updateData) {
  try {
    const res = await apiFetch('/api/registrations/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(updateData),
    });
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
  const base = getApiBaseUrl();
  try {
    const startTime = Date.now();
    const response = await apiFetch('/api/health', {}, 5000);
    const latency = Date.now() - startTime;
    const data = await response.json();
    return { ok: response.ok, latency, data, url: base };
  } catch (error) {
    return { ok: false, error: error.message, url: base };
  }
}

/**
 * Search PIN, Resident Profiles, and Categorized Addresses (House, Flat, Own, Rent, Commercial)
 * Supports type scope: 'user' | 'business' | 'all'
 */
export async function searchPin(query = '', category = '', type = 'all') {
  try {
    const qParam = query ? `q=${encodeURIComponent(query)}` : '';
    const catParam = category && category !== 'all' ? `category=${encodeURIComponent(category)}` : '';
    const typeParam = type && type !== 'all' ? `type=${encodeURIComponent(type)}` : '';
    const queryString = [qParam, catParam, typeParam].filter(Boolean).join('&');
    const path = `/api/pins/search${queryString ? '?' + queryString : ''}`;
    const res = await apiFetch(path);
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
    const res = await apiFetch('/api/content/news');
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
    const res = await apiFetch('/api/content/ads');
    return await res.json();
  } catch (error) {
    return { success: false, ads: [], settings: { adMode: 'manual' }, message: error.message };
  }
}

/**
 * Get Notifications (supports user phone filtering)
 */
export async function getNotifications(phone = null) {
  try {
    const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    const res = await apiFetch(`/api/content/notifications${query}`);
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
    const res = await apiFetch('/api/content/nearby');
    return await res.json();
  } catch (error) {
    return { success: false, businesses: [], message: error.message };
  }
}

/**
 * Get App Launch / Special Offer Popup Config
 */
export async function getAppLaunchPopup() {
  try {
    const res = await apiFetch('/api/content/popup', {}, 6000);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      popup: {
        enabled: false,
        title: '',
        message: '',
        imageUrl: '',
        buttonText: '',
        action: 'none',
      },
    };
  }
}

/**
 * Password Login (supports role 'user' or 'business')
 */
export async function loginWithPassword(phone, password, role = 'user') {
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone, password, role }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Register Account with Phone, OTP, and Password
 */
export async function registerAccountWithPassword({ phone, otp, password, role = 'user', fullName, shopName }) {
  try {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phone, otp, password, role, fullName, shopName }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to backend (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Submit Business Registration (Shop details + GSTIN / PAN / Udyam)
 */
export async function registerBusinessAccount(businessData) {
  try {
    const res = await apiFetch('/api/business/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(businessData),
    }, 12000);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to submit business registration (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Get Business Registration Status
 */
export async function getMyBusiness(phone) {
  try {
    const res = await apiFetch(`/api/business/my-status/${encodeURIComponent(phone)}`);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch business status (${error.message || 'Network error'})`,
    };
  }
}

/**
 * Decode QR Code (from live scan text or picked image)
 */
export async function decodeQrCode(text, imageBase64 = null) {
  try {
    const res = await apiFetch('/api/pins/decode-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ text, imageBase64 }),
    }, 10000);
    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: `Failed to decode QR code (${error.message || 'Network error'})`,
    };
  }
}



