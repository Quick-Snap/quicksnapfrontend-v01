import { CredentialsSignin } from 'next-auth';

/**
 * Thrown when our backend rejects the Google ID token (401, 503, invalid body, etc.).
 * NextAuth surfaces this as a failed sign-in on the configured error page.
 */
export class BackendAuthError extends CredentialsSignin {
  code = 'backend_auth';

  constructor(message?: string) {
    super(message);
    this.message =
      message ??
      'We could not verify your Google account with our servers. Please try again or sign in with email.';
  }
}
