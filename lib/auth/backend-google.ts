/**
 * Server-only helpers for exchanging a Google ID token with our Express API.
 */

export function getBackendGoogleAuthUrl(): string {
  const backendOrigin = process.env.BACKEND_URL?.replace(/\/$/, '');
  if (backendOrigin) {
    return `${backendOrigin}/api/auth/google`;
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5001/api';
  return `${apiBase}/auth/google`;
}

export interface BackendGoogleAuthData {
  user: Record<string, unknown>;
  token: string;
}

export interface BackendGoogleAuthResponse {
  success: boolean;
  data?: BackendGoogleAuthData;
  message?: string;
  error?: string;
}

export async function exchangeGoogleIdToken(
  idToken: string
): Promise<BackendGoogleAuthData> {
  const url = getBackendGoogleAuthUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const json = (await res.json().catch(() => ({}))) as BackendGoogleAuthResponse;

  if (!res.ok || !json.success || !json.data?.token) {
    const detail =
      json.message ||
      json.error ||
      `Our servers could not complete sign-in (${res.status}).`;
    const err = new Error(detail);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  return json.data;
}
