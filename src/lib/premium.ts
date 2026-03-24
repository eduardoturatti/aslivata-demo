export const STRIPE_CHECKOUT_URL = '#';
export const WHATSAPP_LINK = '#';

export function isPremium(): boolean {
  return true; // Demo mode: everyone is premium
}

export async function checkPremiumStatus(): Promise<boolean> {
  return true;
}

export function clearPremiumCache(): void {}
