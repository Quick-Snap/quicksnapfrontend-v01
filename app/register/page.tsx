'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores';
import { Camera, Loader2, Mail, Lock as LockIcon, User, CheckCircle, ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Script from 'next/script';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  const handlePhoneEmailCallback = useCallback(async (userObj: { user_json_url: string }) => {
    setVerifying(true);
    try {
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

  useEffect(() => {
    window.phoneEmailReceiver = handlePhoneEmailCallback;
    return () => {
      delete window.phoneEmailReceiver;
    };
  }, [handlePhoneEmailCallback]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'email' && value !== verifiedEmail) {
      setEmailVerified(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified) {
      toast.error('Please verify your email first');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please agree to the Terms & Conditions');
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
      router.push('/register-face');
    } catch (error: any) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || user) {
    return (
      <div className="min-h-screen bg-[#1a1625] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Script src="https://www.phone.email/verify_email_v1.js" strategy="afterInteractive" />

      <div className="min-h-screen bg-[#1a1625] flex items-center justify-center p-4">
        {/* Main Card Container */}
        <div className="w-full max-w-[950px] bg-[#252136] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col lg:flex-row">
          
          {/* Left Side - Image Section */}
          <div className="lg:w-[45%] relative min-h-[200px] lg:min-h-[580px]">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')`,
              }}
            />
            {/* Purple Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-900/40 via-violet-900/60 to-[#252136]" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-6 lg:p-8">
              {/* Logo & Back Link */}
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-bold text-lg">QuickSnap</span>
                </Link>
                <Link 
                  href="/" 
                  className="hidden lg:flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
                >
                  Back to website <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Bottom Text */}
              <div className="mt-auto lg:mt-0">
                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  Capturing Moments,
                </h2>
                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  Creating Memories
                </h2>
                
                {/* Dots Indicator */}
                <div className="flex gap-2 mt-6">
                  <div className="w-8 h-1.5 rounded-full bg-white/30" />
                  <div className="w-8 h-1.5 rounded-full bg-white/30" />
                  <div className="w-8 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="lg:w-[55%] p-6 lg:p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Create an account</h1>
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">
                  Log in
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full bg-[#1a1625] border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Field with Verification */}
              <div>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    disabled={emailVerified}
                    className={`w-full bg-[#1a1625] border rounded-xl py-3.5 px-4 text-white placeholder-gray-500 focus:ring-1 transition-all outline-none ${
                      emailVerified 
                        ? 'border-emerald-500/50 bg-emerald-500/5 pr-10' 
                        : 'border-white/10 focus:border-violet-500 focus:ring-violet-500'
                    }`}
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {emailVerified && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                  )}
                </div>

                {/* Email Verification Widget */}
                {!emailVerified ? (
                  <div className="mt-3">
                    {verifying ? (
                      <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                        <span className="text-sm text-violet-300">Verifying email...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <p className="text-xs text-amber-200">Email verification required to continue</p>
                        </div>
                        <div className="pe_verify_email" data-client-id="12610092153433741136" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Email verified successfully
                    </span>
                    <button
                      type="button"
                      onClick={() => { 
                        setEmailVerified(false); 
                        setVerifiedEmail(''); 
                        setFormData(prev => ({ ...prev, email: '' })); 
                      }}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-[#1a1625] border border-white/10 rounded-xl py-3.5 px-4 pr-12 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-[#1a1625] border border-white/10 rounded-xl py-3.5 px-4 pr-12 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAgreeTerms(!agreeTerms)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    agreeTerms 
                      ? 'bg-violet-600 border-violet-600' 
                      : 'bg-transparent border-2 border-white/20 hover:border-white/40'
                  }`}
                >
                  {agreeTerms && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </button>
                <label className="text-sm text-gray-400">
                  I agree to the{' '}
                  <Link href="/terms" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                    Terms & Conditions
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !emailVerified || !agreeTerms}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-600 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</>
                ) : (
                  'Create account'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#252136] text-gray-500">Or register with</span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1a1625] border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1a1625] border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .pe_verify_email { 
          width: 100%; 
          min-height: 50px;
        }
        .pe_verify_email button,
        .pe_verify_email .pe_button,
        .pe_verify_email a,
        .pe_verify_email > div > button,
        .pe_verify_email > div > a {
          width: 100% !important;
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%) !important;
          border: none !important;
          border-radius: 12px !important;
          padding: 14px 24px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: white !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          text-decoration: none !important;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3) !important;
        }
        .pe_verify_email button:hover,
        .pe_verify_email .pe_button:hover,
        .pe_verify_email a:hover,
        .pe_verify_email > div > button:hover,
        .pe_verify_email > div > a:hover {
          background: linear-gradient(135deg, #8b5cf6 0%, #818cf8 100%) !important;
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4) !important;
          transform: translateY(-1px) !important;
        }
        .pe_verify_email iframe { 
          border-radius: 12px !important; 
        }
      `}</style>
    </>
  );
}
