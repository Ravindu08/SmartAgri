const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const ML_BASE_URL = import.meta.env.VITE_ML_URL || '';

export async function fetchBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Unable to reach SmartAgri backend');
  return response.json();
}

let _isRefreshing = false;

async function _doRefresh() {
  const refreshToken = localStorage.getItem('smartagri_refresh');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('smartagri_token', data.access_token);
    localStorage.setItem('smartagri_refresh', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function request(path, options = {}, _retry = true) {
  const { token } = getAuthSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    // Try to refresh once before giving up
    if (_retry && !_isRefreshing && path !== '/auth/refresh') {
      _isRefreshing = true;
      const refreshed = await _doRefresh();
      _isRefreshing = false;
      if (refreshed) return request(path, options, false);
    }
    const msg = data?.detail ?? data?.message ?? 'Session expired. Please log in again.';
    if (window.location.pathname !== '/login') {
      clearAuthSession();
      window.location.href = '/login';
    }
    throw new Error(msg);
  }

  if (!response.ok) {
    const rawMessage = data?.detail ?? data?.message ?? data ?? 'Request failed';
    const message = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
    throw new Error(message);
  }

  return data;
}

export { request };

export function saveAuthSession({ access_token: accessToken, refresh_token: refreshToken, user }) {
  localStorage.setItem('smartagri_token', accessToken);
  if (refreshToken) localStorage.setItem('smartagri_refresh', refreshToken);
  localStorage.setItem('smartagri_user', JSON.stringify(user));
}

export function getAuthSession() {
  const token = localStorage.getItem('smartagri_token');
  const rawUser = localStorage.getItem('smartagri_user');
  return {
    token,
    user: rawUser ? JSON.parse(rawUser) : null,
  };
}

export function clearAuthSession() {
  localStorage.removeItem('smartagri_token');
  localStorage.removeItem('smartagri_refresh');
  localStorage.removeItem('smartagri_user');
  localStorage.removeItem('sa-active-role');
}

// Returns the role the user is currently acting as.
// For dual-role users this is set by RoleSelectPage; for single-role it falls back to user.role.
export function getActiveRole() {
  const stored = localStorage.getItem('sa-active-role');
  if (stored) return stored;
  const { user } = getAuthSession();
  return user?.role ?? null;
}

export function setActiveRole(role) {
  localStorage.setItem('sa-active-role', role);
}

export function getUserRoles() {
  const { user } = getAuthSession();
  if (!user) return [];
  return user.roles?.length ? user.roles : [user.role];
}

export function isDualRole() {
  return getUserRoles().length > 1;
}

export function registerUser(payload) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export function loginUser(payload) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export function resendVerificationEmail(email) {
  return request(`/auth/resend-verification?email=${encodeURIComponent(email)}`, { method: 'POST' });
}

export function verifyEmail(email, code) {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function forgotPassword(email) {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export function resetPassword(token, new_password) {
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) });
}

export function updateUserProfile(payload) {
  return request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) });
}

export function changePassword(payload) {
  return request('/auth/me/password', { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteAccount() {
  return request('/auth/me', { method: 'DELETE' });
}

export function updateUserInSession(user) {
  localStorage.setItem('smartagri_user', JSON.stringify(user));
}

export function updateUserAvatar(profile_image) {
  return request('/auth/me', { method: 'PUT', body: JSON.stringify({ profile_image }) });
}

export function submitFeedback(payload) {
  return request('/api/admin/submit-feedback', { method: 'POST', body: JSON.stringify(payload) });
}

// Admin API helpers
export function adminRequest(path, options = {}) {
  return request(`/api/admin${path}`, options);
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function fetchNotifications() {
  return request('/api/notifications');
}
export function fetchUnreadCount() {
  return request('/api/notifications/unread-count');
}
export function markNotificationRead(id) {
  return request(`/api/notifications/${id}/read`, { method: 'POST' });
}
export function markAllNotificationsRead() {
  return request('/api/notifications/read-all', { method: 'POST' });
}

// ── Ratings ───────────────────────────────────────────────────────────────────
export function submitRating(orderId, payload) {
  return request(`/api/ratings/orders/${orderId}`, { method: 'POST', body: JSON.stringify(payload) });
}
export function fetchOrderRating(orderId) {
  return request(`/api/ratings/orders/${orderId}`);
}
export function fetchUserRating(userId) {
  return request(`/api/ratings/users/${userId}`);
}

// ── Marketplace (with filters) ────────────────────────────────────────────────
export function fetchListings(params = {}) {
  const qs = new URLSearchParams();
  if (params.search)    qs.set('search', params.search);
  if (params.crop_type) qs.set('crop_type', params.crop_type);
  if (params.min_price) qs.set('min_price', params.min_price);
  if (params.max_price) qs.set('max_price', params.max_price);
  if (params.district)  qs.set('district', params.district);
  const q = qs.toString();
  return request(`/api/marketplace/listings${q ? `?${q}` : ''}`);
}

// ── Admin exports ─────────────────────────────────────────────────────────────
export async function downloadAdminCSV(type) {
  const { token } = getAuthSession();
  const response = await fetch(`${API_BASE_URL}/api/admin/export/${type}.csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smartagri_${type}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
