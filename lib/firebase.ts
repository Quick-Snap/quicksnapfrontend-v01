import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyC7d5YBt_kxGT_7ztJR10ndEZ2jgpJ28Y0',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'roopixo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'roopixo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'roopixo.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '213384071306',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:213384071306:web:75a2d5b2463830d735c573',
};

// Safe singleton client initialization
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(firebaseApp);

/**
 * Initializes invisible reCAPTCHA verifier attached to an HTML container id.
 * Uses window singleton to avoid double-binding errors across re-renders.
 */
export function initRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be initialized in the browser.');
  }

  // Clear previous verifier if present on window
  const win = window as any;
  if (win.recaptchaVerifier) {
    try {
      win.recaptchaVerifier.clear();
    } catch {
      // ignore clear error
    }
    win.recaptchaVerifier = null;
  }

  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
    callback: () => {
      // Invisible reCAPTCHA solved automatically
    },
    'expired-callback': () => {
      console.warn('[Firebase Auth] Invisible reCAPTCHA expired, will retry on next submit');
    },
  });

  win.recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Send real SMS verification OTP using Firebase Phone Auth.
 * Format: +919876543210 (E.164)
 */
export async function sendPhoneVerificationOtp(
  phoneE164: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(firebaseAuth, phoneE164, verifier);
}

/**
 * Confirm 6-digit OTP code against Firebase verification session.
 */
export async function confirmPhoneVerificationOtp(
  confirmation: ConfirmationResult,
  otpCode: string
) {
  const result = await confirmation.confirm(otpCode);
  return result.user;
}
