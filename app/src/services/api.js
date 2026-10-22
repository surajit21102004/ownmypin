import { Platform } from 'react-native';

// For local testing:
// Android Emulator uses 10.0.2.2, iOS Simulator & Web use localhost
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
 * Fetch general backend health
 */
export async function checkBackendHealth() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${currentBaseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    const latency = Date.now() - startTime;
    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      latency,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Network request failed',
    };
  }
}

/**
 * Fetch database connectivity test from backend
 */
export async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${currentBaseUrl}/api/health/db`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    const latency = Date.now() - startTime;
    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      latency,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Network request failed',
    };
  }
}
