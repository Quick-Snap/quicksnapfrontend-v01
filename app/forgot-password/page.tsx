'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Loader2, Mail, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setEmailSent(true);
      toast.success('Password reset link sent!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset link. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>
      </div>

      {/* Animated Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-float delay-200"></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] animate-float delay-300"></div>

      {/* Card */}
      <div className="max-w-md w-full relative z-10 animate-slide-up">
        {/* Glass Card */}
        <div className="card-glass rounded-2xl p-8 shadow-2xl">
          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transform hover:scale-110 transition-all duration-300">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-2">
              {emailSent ? 'Check Your Email' : 'Forgot Password?'}
            </h2>
            <p className="text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              {emailSent 
                ? "We've sent you a reset link" 
                : "No worries, we'll help you reset it"
              }
            </p>
          </div>

          {emailSent ? (
            // Success State
            <div className="space-y-6 animate-slide-up">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Email Sent Successfully!</h3>
                <p className="text-gray-400 text-sm">
                  We've sent a password reset link to{' '}
                  <span className="text-violet-400 font-medium">{email}</span>
                </p>
                <p className="text-gray-500 text-xs mt-3">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full py-3 px-4 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 rounded-xl font-medium transition-all"
                >
                  Try a different email
                </button>
                <Link
                  href="/login"
                  className="btn-gradient w-full py-3.5 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            // Form State
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="animate-slide-up delay-100">
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
                    className="input pl-12"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter the email address associated with your account.
                </p>
              </div>

              {/* Submit Button */}
              <div className="animate-slide-up delay-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full py-3.5 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="mt-6 animate-slide-up delay-300">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#111111]/80 text-gray-500 rounded-full">
                  Remember your password?
                </span>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center animate-slide-up delay-400">
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
          Need help?{' '}
          <Link href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}

