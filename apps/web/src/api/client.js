const API_BASE = import.meta.env.VITE_API_URL || '/api';

let _getAccessToken = () => null;
let _onUnauthorized = () => {};

export function configureClient({ getAccessToken, onUnauthorized }) {
  if (getAccessToken) _getAccessToken = getAccessToken;
  if (onUnauthorized) _onUnauthorized = onUnauthorized;
}

async function request(method, path, { body, headers: extraHeaders, query, ...opts } = {}) {
  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = _getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    credentials: 'include',
    ...opts,
  };

  if (body && method !== 'GET') {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response = await fetch(url, config);

  if (response.status === 401) {
    _onUnauthorized();
  }

  return response;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return response;
}

export const apiClient = {
  async get(path, options) {
    const res = await request('GET', path, options);
    return parseResponse(res);
  },
  async post(path, body, options) {
    const res = await request('POST', path, { body, ...options });
    return parseResponse(res);
  },
  async put(path, body, options) {
    const res = await request('PUT', path, { body, ...options });
    return parseResponse(res);
  },
  async patch(path, body, options) {
    const res = await request('PATCH', path, { body, ...options });
    return parseResponse(res);
  },
  async delete(path, options) {
    const res = await request('DELETE', path, options);
    return parseResponse(res);
  },
  raw: request,
};

export default apiClient;
