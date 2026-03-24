export interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

export async function sendMagicLink(_email: string): Promise<{ error: string | null }> {
  return { error: null };
}

export async function verifyOtpCode(_email: string, _token: string): Promise<{ error: string | null }> {
  return { error: null };
}

export async function signOut(): Promise<void> {}

export async function getCurrentUser(): Promise<UserProfile | null> {
  return null;
}

export async function getAccessToken(): Promise<string | null> {
  return null;
}

export function onAuthChange(_callback: (user: UserProfile | null, accessToken?: string) => void): () => void {
  return () => {};
}
