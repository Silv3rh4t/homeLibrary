// Thin fetch wrappers around the JSON API.

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Auth
export const checkAuth  = ()             => request('/api/auth/check');
export const login      = (username, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logout     = ()             =>
  request('/api/auth/logout', { method: 'POST' });

// Books
export function listBooks(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return request(`/api/books${qs ? `?${qs}` : ''}`);
}

export const getBook    = (id)      => request(`/api/books/${id}`);
export const lookupIsbn = (isbn)    => request(`/api/lookup/${encodeURIComponent(isbn)}`);
export const createBook = (body)    =>
  request('/api/books', { method: 'POST', body: JSON.stringify(body) });
export const updateBook = (id, body) =>
  request(`/api/books/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteBook = (id)      => request(`/api/books/${id}`, { method: 'DELETE' });
