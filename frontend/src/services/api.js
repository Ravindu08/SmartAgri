const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error('Unable to reach SmartAgri backend');
  }

  return response.json();
}

async function request(path, options = {}) {
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

  if (!response.ok) {
    const rawMessage = data?.detail ?? data?.message ?? data ?? 'Request failed';
    const message = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
    throw new Error(message);
  }

  return data;
}

// Export request for other services
export { request };

export function saveAuthSession({ access_token: accessToken, user }) {
  localStorage.setItem('smartagri_token', accessToken);
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
  localStorage.removeItem('smartagri_user');
}

export function registerUser(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
