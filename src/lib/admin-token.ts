// ============================================================
// ADMIN TOKEN UTILITY — extracted from AdminGate to avoid
// circular dependency: galera-api → AdminGate → react-router
// ============================================================

const ADMIN_TOKEN_KEY = 'power_admin_token';

/**
 * Returns the admin token from localStorage.
 * Used by galera-api for admin-protected endpoints.
 */
export function getAdminToken(): string {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

/**
 * Saves admin token to localStorage.
 * Called by AdminGate after successful authentication.
 */
export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

/**
 * Clears admin token from localStorage.
 */
export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
