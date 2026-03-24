// ============================
// IMAGE OPTIMIZATION UTILITIES
// ============================
// Provides optimized image URLs using Supabase Storage image transformation
// OR wsrv.nl CDN proxy for external images (singular.live, etc.).
// All public-facing <img> tags for logos/photos should use getOptimizedUrl().
// EXCEPTION: DisplayView (broadcast) must use original URLs for max quality.

import { projectId } from '../utils/supabase/info';

const SUPABASE_STORAGE_HOST = `${projectId}.supabase.co/storage`;

// Domains that are safe to proxy via wsrv.nl for resizing/WebP conversion.
// wsrv.nl is a free, fast, open-source image CDN (images.weserv.nl).
const PROXY_ELIGIBLE_HOSTS = [
  'image.singular.live',
  'singular.live',
  'jornalforcadovale.com.br',
];

/**
 * Returns an optimized image URL.
 * - Supabase Storage images: native transformation (WebP, resize).
 * - External images (singular.live, etc.): proxied via wsrv.nl for resize + WebP.
 * - Other URLs: returned as-is.
 * - Returns empty string for null/undefined.
 */
export function getOptimizedUrl(
  originalUrl: string | null | undefined,
  displaySize: number,
  options?: { quality?: number; format?: 'webp' | 'origin'; skipProxy?: boolean }
): string {
  if (!originalUrl) return '';

  // Supabase Storage: use native transformation
  if (originalUrl.includes(SUPABASE_STORAGE_HOST)) {
    try {
      const url = new URL(originalUrl);
      const renderPath = url.pathname.replace('/object/public/', '/render/image/public/');
      url.pathname = renderPath;
      url.searchParams.set('width', String(displaySize));
      url.searchParams.set('height', String(displaySize));
      url.searchParams.set('resize', 'contain');
      url.searchParams.set('quality', String(options?.quality ?? 80));
      return url.toString();
    } catch {
      return originalUrl;
    }
  }

  // External images: proxy via wsrv.nl for resize + WebP
  if (!options?.skipProxy) {
    try {
      const urlObj = new URL(originalUrl);
      const isEligible = PROXY_ELIGIBLE_HOSTS.some(h => urlObj.hostname.includes(h));
      if (isEligible) {
        // Use 2x size for retina, capped at 256px
        const proxySize = Math.min(displaySize * 2, 256);
        const q = options?.quality ?? 75;
        return `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=${proxySize}&h=${proxySize}&fit=contain&output=webp&q=${q}&default=1`;
      }
    } catch {
      // Invalid URL, return as-is
    }
  }

  return originalUrl;
}

/**
 * Shorthand for logo URLs at common sizes.
 */
export function logoUrl(url: string | null | undefined, size: number): string {
  return getOptimizedUrl(url, size);
}

/**
 * Shorthand for player photos.
 */
export function photoUrl(url: string | null | undefined, size: number): string {
  return getOptimizedUrl(url, size);
}

/**
 * For news article images — proxy + resize for display width.
 */
export function newsImageUrl(url: string | null | undefined, width: number): string {
  if (!url) return '';
  try {
    const q = 70;
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=${q}&default=1`;
  } catch {
    return url;
  }
}
