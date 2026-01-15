'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores';
import { Camera, Loader2, Mail, Lock as LockIcon, User, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Script from 'next/script';

// Declare global type for phoneEmailReceiver
declare global {
  interface Window {
    phoneEmailReceiver?: (userObj: { user_json_url: string }) => void;
  }
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  // Set up the phone email receiver callback
  const handlePhoneEmailCallback = useCallback(async (userObj: { user_json_url: string }) => {
    setVerifying(true);
    try {
      // Fetch the verified email from the JSON URL
      const response = await fetch(userObj.user_json_url);
      const data = await response.json();
      
      if (data.user_email_id) {
        setVerifiedEmail(data.user_email_id);
        setFormData(prev => ({ ...prev, email: data.user_email_id }));
        setEmailVerified(true);
        toast.success('Email verified successfully!');
      } else {
        toast.error('Failed to verify email. Please try again.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('Failed to verify email. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, []);

  // Register the callback globally when component mounts
  useEffect(() => {
    window.phoneEmailReceiver = handlePhoneEmailCallback;
    return () => {
      delete window.phoneEmailReceiver;
    };
  }, [handlePhoneEmailCallback]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // If email is changed after verification, reset verification
    if (name === 'email' && value !== verifiedEmail) {
      setEmailVerified(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 33, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 10) return { strength: 66, label: 'Medium', color: 'bg-amber-500' };
    return { strength: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailVerified) {
      toast.error('Please verify your email first');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      // Redirect to face registration after successful registration
      router.push('/register-face');
    } catch (error: any) {
      // Error already handled by auth context with toast
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (!initialized || user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Load Phone Email Verification Script */}
      <Script
        src="https://www.phone.email/verify_email_v1.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>
        </div>

        {/* Animated Blobs */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-float delay-200"></div>
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-[100px] animate-float delay-400"></div>

        {/* Register Card */}
        <div className="max-w-md w-full relative z-10 animate-slide-up">
          {/* Glass Card */}
          <div className="card-glass rounded-2xl p-8 shadow-2xl">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transform hover:scale-110 transition-all duration-300">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gradient-purple mb-2">
                Join QuickSnap
              </h2>
              <p className="text-gray-400 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Create your account and start finding your photos
              </p>
            </div>

            {/* Register Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name Input */}
              <div className="animate-slide-up delay-100">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input pl-12"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Input with Verification */}
              <div className="animate-slide-up delay-200">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={emailVerified}
                    className={`input pl-12 ${emailVerified ? 'pr-12 bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : ''}`}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {emailVerified && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                  )}
                </div>

                {/* Email Verification Section */}
                {!emailVerified ? (
                  <div className="mt-3">
                    {verifying ? (
                      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                        <span className="text-sm text-violet-300">Verifying email...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verify your email to continue
                        </p>
                        {/* Phone Email Verification Widget */}
                        <div 
                          className="pe_verify_email" 
                          data-client-id="12610092153433741136"
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Email verified successfully</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailVerified(false);
                        setVerifiedEmail('');
                        setFormData(prev => ({ ...prev, email: '' }));
                      }}
                      className="ml-auto text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="animate-slide-up delay-400">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input pl-12"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength</span>
                      <span className={`text-xs font-medium ${passwordStrength.strength === 100 ? 'text-emerald-400' :
                        passwordStrength.strength === 66 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="animate-slide-up delay-500">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input pl-12"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 animate-slide-up delay-600">
                <button
                  type="submit"
                  disabled={loading || !emailVerified}
                  className="btn-gradient w-full py-3.5 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : !emailVerified ? (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Verify email to continue
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-6 animate-fade-in delay-500">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#111111]/80 text-gray-500 rounded-full">
                    Already have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="mt-6 text-center animate-fade-in delay-600">
              <Link
                href="/login"
                className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                Sign in instead →
              </Link>
            </div>
          </div>

          {/* Footer Text */}
          <p className="mt-6 text-center text-sm text-gray-500 animate-fade-in delay-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-violet-400 hover:text-violet-300 transition-colors">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Custom Styles for Phone Email Widget */}
      <style jsx global>{`
        .pe_verify_email {
          width: 100%;
        }
        .pe_verify_email button,
        .pe_verify_email .pe_button {
          width: 100% !important;
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%) !important;
          border: none !important;
          border-radius: 12px !important;
          padding: 12px 20px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: white !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.25) !important;
        }
        .pe_verify_email button:hover,
        .pe_verify_email .pe_button:hover {
          background: linear-gradient(135deg, #8b5cf6 0%, #818cf8 100%) !important;
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4) !important;
          transform: translateY(-1px) !important;
        }
        .pe_verify_email iframe {
          border-radius: 12px !important;
        }
      `}</style>
    </>
  );
}
