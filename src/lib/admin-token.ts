// ============================================================
// ADMIN TOKEN UTILITY — extracted from AdminGate to avoid
// circular dependency: galera-api → AdminGate → react-router
// ============================================================

const ADMIN_TOKEN_KEY = 'power_admin_token';

// In-memory only — never persisted to localStorage in plaintext
let _memoryToken = '';

/**
 * Returns the admin token.
 * Uses in-memory store first, falls back to sessionStorage (tab-scoped).
 */
export function getAdminToken(): string {
  if (_memoryToken) return _memoryToken;
  // Fallback: sessionStorage (dies when tab closes)
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

/**
 * Saves admin token — kept in memory + sessionStorage only.
 * Never stored in localStorage (persists too long, visible in F12).
 */
export function setAdminToken(token: string): void {
  _memoryToken = token;
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  // Clean up any legacy plaintext token from localStorage
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Clears admin token from all stores.
 */
export function clearAdminToken(): void {
  _memoryToken = '';
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
