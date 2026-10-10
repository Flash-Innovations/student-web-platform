/**
 * AI Mock Interview API Client
 * Communicates with the dedicated AI-backend service (Express + Gemini Live API).
 * Reuses the existing SIPS JWT token for secure, authenticated student sessions.
 */

const AI_API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AI_API_URL) || '';

const getAuthToken = () => {
  try {
    let token = localStorage.getItem('sips_token');
    if (!token) return null;
    token = token.trim();
    if (token.startsWith('Bearer ') || token.startsWith('bearer ')) {
      token = token.slice(7).trim();
    }
    token = token.replace(/^["']|["']$/g, '').trim();
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  } catch (e) {
    return null;
  }
};

async function aiRequest(endpoint, options = {}) {
  // If AI_API_BASE_URL is specified (e.g. http://localhost:5055), prepend it.
  // Otherwise, use relative endpoint so Vite's proxy forwards to http://localhost:5055.
  const base = AI_API_BASE_URL ? AI_API_BASE_URL.replace(/\/+$/, '') : '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;
  const token = getAuthToken();

  const headers = {
    ...options.headers
  };

  // Attach standard SIPS Bearer token
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set JSON Content-Type if body is an object and not FormData
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkError) {
    const err = new Error('Unable to connect to the AI Mock Interview service. Please verify the AI backend is running on port 5055.');
    err.status = 0;
    err.isNetworkError = true;
    err.originalError = networkError;
    throw err;
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data !== null && (data.message || data.error)) ||
      response.statusText ||
      'AI Mock Interview request failed.';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.code = (typeof data === 'object' && data !== null && data.code) || (response.status === 401 ? 'TOKEN_INVALID' : undefined);
    err.data = data;
    throw err;
  }

  return data;
}

export const aiApi = {
  get: (endpoint, options = {}) => aiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => aiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => aiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => aiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => aiRequest(endpoint, { ...options, method: 'DELETE' }),
  baseUrl: AI_API_BASE_URL
};
