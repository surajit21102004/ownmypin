import { Platform } from 'react-native';

const DEFAULT_PORT = 5000;
export const DEFAULT_BASE_URL = Platform.select({
  android: `http://10.0.2.2:${DEFAULT_PORT}`,
  ios: `http://localhost:${DEFAULT_PORT}`,
  default: `http://localhost:${DEFAULT_PORT}`,
});

let currentBaseUrl = DEFAULT_BASE_URL;

export function setApiBaseUrl(url) {
  currentBaseUrl = url.replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  return currentBaseUrl;
}

/**
 * Send OTP
 */
export async function sendOtp(phone) {
  try {
    const res = await fetch(`${currentBaseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
}

/**
 * Verify OTP
 */
export async function verifyOtp(phone, otp) {
  try {
    const res = await fetch(`${currentBaseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
}

/**
 * Submit Registration
 */
export async function submitRegistration(registrationData) {
  try {
    const res = await fetch(`${currentBaseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
}

/**
 * Get registration status for phone
 */
export async function getMyRegistration(phone) {
  try {
    const res = await fetch(`${currentBaseUrl}/api/registrations/my-status/${encodeURIComponent(phone)}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
}

/**
 * Health checks
 */
export async function checkBackendHealth() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${currentBaseUrl}/api/health`);
    const latency = Date.now() - startTime;
    const data = await response.json();
    return { ok: response.ok, latency, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${currentBaseUrl}/api/health/db`);
    const latency = Date.now() - startTime;
    const data = await response.json();
    return { ok: response.ok, latency, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
