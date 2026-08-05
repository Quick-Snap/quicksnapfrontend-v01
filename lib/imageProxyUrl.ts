/**
 * Rewrites cross-origin CDN URLs through our same-origin proxy so WebGL
 * (MorphSlider) can upload textures without CORS / tainted-canvas errors.
 */
export function toWebglSafeImageUrl(src: string | undefined | null): string {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';

  if (typeof window === 'undefined') {
    return trimmed;
  }

  try {
    const absolute = new URL(trimmed, window.location.href);
    if (absolute.origin === window.location.origin) {
      return absolute.href;
    }
    if (absolute.protocol !== 'http:' && absolute.protocol !== 'https:') {
      return trimmed;
    }
    return `/api/image-proxy?url=${encodeURIComponent(absolute.href)}`;
  } catch {
    return trimmed;
  }
}
