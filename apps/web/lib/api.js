// API URL Configuration
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

/**
 * Helper function to build API URLs
 * @param {string} path - API endpoint path (e.g., '/groups/123')
 * @returns {string} Full API URL
 */
export function apiUrl(path) {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
}

/**
 * Helper function for authenticated fetch requests
 * @param {string} path - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(apiUrl(path), {
    ...options,
    headers,
  });
}
