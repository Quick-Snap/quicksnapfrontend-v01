'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function messageForAuthParams(error: string | null, code: string | null): string | null {
  if (code === 'backend_auth') {
    return 'We could not verify your Google account with our servers. Try again or use email sign-in.';
  }
  if (error === 'Configuration') {
    return 'Sign-in is misconfigured. Check server environment variables.';
  }
  if (error === 'AccessDenied') {
    return 'Access was denied. Try a different account or sign in with email.';
  }
  if (error === 'OAuthAccountNotLinked' || error === 'OAuthSignin' || error === 'OAuthCallback') {
    return 'Google sign-in did not complete. Please try again.';
  }
  if (error === 'CredentialsSignin') {
    return 'Sign-in failed. Please try again or use email.';
  }
  if (error || code) {
    return 'Sign-in failed. Please try again.';
  }
  return null;
}

export function LoginAuthError() {
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const error = searchParams.get('error');
    const code = searchParams.get('code');
    const msg = messageForAuthParams(error, code);
    if (msg) {
      shown.current = true;
      toast.error(msg);
    }
  }, [searchParams]);

  return null;
}
