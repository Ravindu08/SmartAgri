/**
 * Frontend unit tests — pure logic helpers from api.js
 * Run with: npm run test (in frontend/)
 *
 * Uses Vitest in Node environment. No DOM or network calls needed.
 * import.meta.env is handled by Vitest's Vite transform; missing VITE_* vars default to ''.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── localStorage stub (Node has no localStorage) ─────────────────────────────
// Must be set before any test function runs. api.js only reads localStorage
// inside function bodies (not at module load), so this timing is safe.
const _store = {};
vi.stubGlobal('localStorage', {
  getItem:    (k) => _store[k] ?? null,
  setItem:    (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear:      () => { Object.keys(_store).forEach(k => delete _store[k]); },
});

import {
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  getActiveRole,
  getUserRoles,
  isDualRole,
} from './api.js';

beforeEach(() => localStorage.clear());

// ── getAuthSession ─────────────────────────────────────────────────────────────

describe('getAuthSession', () => {
  it('returns null token and user when storage is empty', () => {
    const { token, user } = getAuthSession();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it('returns stored token and parsed user object', () => {
    const u = { id: 1, email: 'lo@test.com', role: 'Land Owner', roles: ['Land Owner'] };
    localStorage.setItem('smartagri_token', 'mytoken');
    localStorage.setItem('smartagri_user', JSON.stringify(u));
    const { token, user } = getAuthSession();
    expect(token).toBe('mytoken');
    expect(user.email).toBe('lo@test.com');
  });
});

// ── saveAuthSession ───────────────────────────────────────────────────────────

describe('saveAuthSession', () => {
  it('stores access token, refresh token, and user', () => {
    const u = { id: 2, email: 'tr@test.com', role: 'Trader', roles: ['Trader'] };
    saveAuthSession({ access_token: 'acc', refresh_token: 'ref', user: u });
    expect(localStorage.getItem('smartagri_token')).toBe('acc');
    expect(localStorage.getItem('smartagri_refresh')).toBe('ref');
    expect(JSON.parse(localStorage.getItem('smartagri_user')).email).toBe('tr@test.com');
  });

  it('skips refresh token when not provided', () => {
    const u = { id: 3, email: 'x@x.com', role: 'Land Owner', roles: ['Land Owner'] };
    saveAuthSession({ access_token: 'acc2', user: u });
    expect(localStorage.getItem('smartagri_refresh')).toBeNull();
  });
});

// ── clearAuthSession ──────────────────────────────────────────────────────────

describe('clearAuthSession', () => {
  it('removes all four auth keys', () => {
    localStorage.setItem('smartagri_token', 't');
    localStorage.setItem('smartagri_refresh', 'r');
    localStorage.setItem('smartagri_user', '{}');
    localStorage.setItem('sa-active-role', 'Trader');
    clearAuthSession();
    expect(localStorage.getItem('smartagri_token')).toBeNull();
    expect(localStorage.getItem('smartagri_refresh')).toBeNull();
    expect(localStorage.getItem('smartagri_user')).toBeNull();
    expect(localStorage.getItem('sa-active-role')).toBeNull();
  });
});

// ── getActiveRole ─────────────────────────────────────────────────────────────

describe('getActiveRole', () => {
  it('returns the stored active role when set', () => {
    localStorage.setItem('sa-active-role', 'Trader');
    expect(getActiveRole()).toBe('Trader');
  });

  it('falls back to user.role when no active role is stored', () => {
    const u = { id: 1, email: 'lo@test.com', role: 'Land Owner', roles: ['Land Owner'] };
    localStorage.setItem('smartagri_user', JSON.stringify(u));
    expect(getActiveRole()).toBe('Land Owner');
  });

  it('returns null when nothing is stored', () => {
    expect(getActiveRole()).toBeNull();
  });
});

// ── getUserRoles ──────────────────────────────────────────────────────────────

describe('getUserRoles', () => {
  it('returns empty array when not logged in', () => {
    expect(getUserRoles()).toEqual([]);
  });

  it('returns user.roles array for multi-role users', () => {
    const u = { id: 1, role: 'Land Owner', roles: ['Land Owner', 'Trader'] };
    localStorage.setItem('smartagri_user', JSON.stringify(u));
    expect(getUserRoles()).toEqual(['Land Owner', 'Trader']);
  });

  it('falls back to [user.role] when user.roles is empty', () => {
    const u = { id: 2, role: 'Trader', roles: [] };
    localStorage.setItem('smartagri_user', JSON.stringify(u));
    expect(getUserRoles()).toEqual(['Trader']);
  });
});

// ── isDualRole ────────────────────────────────────────────────────────────────

describe('isDualRole', () => {
  it('returns true when user has two roles', () => {
    const u = { id: 1, role: 'Land Owner', roles: ['Land Owner', 'Trader'] };
    localStorage.setItem('smartagri_user', JSON.stringify(u));
    expect(isDualRole()).toBe(true);
  });

  it('returns false for single-role users', () => {
    const u = { id: 2, role: 'Trader', roles: ['Trader'] };
    localStorage.setItem('smartagri_user', JSON.stringify(u));
    expect(isDualRole()).toBe(false);
  });
});
