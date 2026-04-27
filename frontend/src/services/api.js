const BASE = import.meta.env.VITE_API_URL || '';

// ─── Helper ───────────────────────────────────────────────────────────────────
async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Raw fetch for multipart (AI image upload)
async function requestRaw(path, options = {}, token = null) {
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signUp:               (body)         => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  signIn:               (body)         => request('/auth/signin', { method: 'POST', body: JSON.stringify(body) }),
  signOut:              (token)        => request('/auth/signout', { method: 'POST' }, token),
  getSession:           (token)        => request('/auth/session', {}, token),
  resetPassword:        (body)         => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  updatePassword:       (body, token)  => request('/auth/update-password', { method: 'POST', body: JSON.stringify(body) }, token),
  resendVerification:   (body)         => request('/auth/resend-verification', { method: 'POST', body: JSON.stringify(body) }),
  deleteAccount:        (token)        => request('/auth/delete-account', { method: 'DELETE' }, token),
};

// ─── Collection ───────────────────────────────────────────────────────────────
export const collectionApi = {
  getAll: () => request('/collection'),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get:          (token)        => request('/profile', {}, token),
  update:       (body, token)  => request('/profile', { method: 'PUT', body: JSON.stringify(body) }, token),
  getSettings:  (token)        => request('/profile/settings', {}, token),
  saveSettings: (body, token)  => request('/profile/settings', { method: 'PUT', body: JSON.stringify(body) }, token),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers:   (token)              => request('/admin/users', {}, token),
  banUser:    (userId, body, token) => request(`/admin/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  addVaultItem: (body, token)      => request('/admin/vault', { method: 'POST', body: JSON.stringify(body) }, token),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistApi = {
  get:    (token)          => request('/wishlist', {}, token),
  add:    (itemId, token)  => request(`/wishlist/${itemId}`, { method: 'POST' }, token),
  remove: (itemId, token)  => request(`/wishlist/${itemId}`, { method: 'DELETE' }, token),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  get:         (token, history = false) => request(`/notifications?history=${history}`, {}, token),
  acknowledge: (id, token)              => request(`/notifications/${id}/acknowledge`, { method: 'PATCH' }, token),
  dismiss:     (id, token)              => request(`/notifications/${id}/dismiss`, { method: 'PATCH' }, token),
  inquire:     (body, token)            => request('/notifications/inquire', { method: 'POST', body: JSON.stringify(body) }, token),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  extract: (formData, token) => requestRaw('/ai/extract', { method: 'POST', body: formData }, token),
};

// ─── Countries ────────────────────────────────────────────────────────────────
export const countriesApi = {
  get: () => request('/countries'),
};
