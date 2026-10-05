const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const ML_BASE_URL = import.meta.env.VITE_ML_URL || '';

//jwt token backend ekata yawana hama request ekatam alawala yawanne meken
export async function fetchBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Unable to reach SmartAgri backend');
  return response.json();
}

// One refresh at a time: every request that gets a 401 while a refresh is in
// flight waits for that same refresh instead of logging the user out.
let _refreshPromise = null;

function _refreshOnce() {
  if (!_refreshPromise) {
    _refreshPromise = _doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

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

// FastAPI reports invalid input as a list of {loc, msg}; turn it into a
// sentence a person can read instead of showing the raw JSON.
export function errorMessage(detail, fallback = 'Request failed') {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === 'string') return item;
      const field = Array.isArray(item?.loc)
        ? item.loc.filter((p) => !['body', 'query', 'path'].includes(p)).join('.').replace(/_/g, ' ')
        : '';
      const msg = String(item?.msg ?? '').replace(/^Value error, /, '');
      return field ? `${field}: ${msg}` : msg;
    }).filter(Boolean);
    return parts.length ? parts.join('; ') : fallback;
  }
  return JSON.stringify(detail);
}

// Authenticated request against either service (main backend or ML service).
async function requestTo(baseUrl, path, options = {}, _retry = true) {
  const { token } = getAuthSession();
  const response = await fetch(`${baseUrl}${path}`, {
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
    if (_retry && path !== '/auth/refresh') {
      if (await _refreshOnce()) return requestTo(baseUrl, path, options, false);
    }
    const msg = data?.detail ?? data?.message ?? 'Session expired. Please log in again.';
    if (window.location.pathname !== '/login') {
      clearAuthSession();
      window.location.href = '/login';
    }
    throw new Error(msg);
  }

  if (!response.ok) {
    throw new Error(errorMessage(data?.detail ?? data?.message ?? data?.error));
  }

  return data;
}

function request(path, options = {}) {
  return requestTo(API_BASE_URL, path, options);
}

export { request, requestTo };

export function saveAuthSession({ access_token: accessToken, refresh_token: refreshToken, user }) {
  localStorage.setItem('smartagri_token', accessToken);
  if (refreshToken) localStorage.setItem('smartagri_refresh', refreshToken);
  localStorage.setItem('smartagri_user', JSON.stringify(user));
}

export function getAuthSession() {
  const token = localStorage.getItem('smartagri_token');
  const rawUser = localStorage.getItem('smartagri_user');
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    // A damaged entry must not crash every page that reads the session.
    user = null;
  }
  return { token, user };
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

export const ACTIVE_ROLE_EVENT = 'sa-active-role-change';

export function setActiveRole(role) {
  localStorage.setItem('sa-active-role', role);
  // Components outside the one that switched roles (e.g. the Navbar) re-read the role on this event.
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ACTIVE_ROLE_EVENT));
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
export function markNotificationRead(id) {
  return request(`/api/notifications/${id}/read`, { method: 'POST' });
}
export function markAllNotificationsRead() {
  return request('/api/notifications/read-all', { method: 'POST' });
}

// ── Admin exports ─────────────────────────────────────────────────────────────
export async function downloadAdminCSV(type) {
  const download = () => fetch(`${API_BASE_URL}/api/admin/export/${type}.csv`, {
    headers: { Authorization: `Bearer ${getAuthSession().token}` },
  });
  let response = await download();
  // An export is often the first click after the page has sat open for a while.
  if (response.status === 401 && await _refreshOnce()) response = await download();
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smartagri_${type}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
