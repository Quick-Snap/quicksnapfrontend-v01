'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores';
import { Camera, Loader2, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  
  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[200px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-[1000px] relative z-10">
        {/* Animated Border Beam */}
        <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
          <div className="absolute inset-0 rounded-2xl border border-white/10" />
          <div 
            className="absolute w-[200px] h-[200px] animate-border-beam"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, #8b5cf6 10%, #6366f1 20%, transparent 30%)',
              filter: 'blur(8px)',
            }}
          />
        </div>
        
        {/* Card Content */}
        <div className="bg-[#0f0f0f] rounded-2xl overflow-hidden flex flex-col lg:flex-row border border-white/10 relative shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        
        {/* Left Side - Image Section */}
        <div className="lg:w-[45%] relative min-h-[200px] lg:min-h-[560px]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-violet-900/40 to-[#0f0f0f]" />
          
          <div className="relative h-full flex flex-col justify-between p-8">
            {/* Logo & Back Link */}
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-sm flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-light tracking-[0.15em]">QUICKSNAP</span>
              </Link>
              <Link 
                href="/" 
                className="hidden lg:flex items-center gap-1 text-white/60 hover:text-white text-sm font-light tracking-wider transition-colors"
              >
                Back to website <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Bottom Text */}
            <div className="mt-auto">
              <h2 className="text-3xl lg:text-4xl font-light text-white leading-tight tracking-wide">
                Welcome Back,
              </h2>
              <h2 className="text-3xl lg:text-4xl font-light text-white leading-tight tracking-wide">
                We Missed You
              </h2>
              
              <div className="flex gap-2 mt-8">
                <div className="w-8 h-1 rounded-full bg-white" />
                <div className="w-8 h-1 rounded-full bg-white/20" />
                <div className="w-8 h-1 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="lg:w-[55%] p-8 lg:p-12 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-white mb-2 tracking-wide">Sign in to your account</h1>
            <p className="text-white/50 text-sm font-light tracking-wide">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <input
                type="email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 px-4 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all font-light tracking-wide"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 px-4 pr-12 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all font-light tracking-wide"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    rememberMe 
                      ? 'bg-violet-600 border-violet-600' 
                      : 'bg-transparent border-white/20 hover:border-white/40'
                  }`}
                >
                  {rememberMe && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </button>
                <label className="text-sm text-white/50 font-light">Remember me</label>
              </div>
              <Link 
                href="/forgot-password" 
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-light"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-lg text-white text-sm font-light tracking-wider bg-violet-600 hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0f0f0f] text-white/30 font-light">Or continue with</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all font-light tracking-wide"
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
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all font-light tracking-wide"
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
        @keyframes border-beam {
          0% {
            top: -100px;
            left: -100px;
          }
          25% {
            top: -100px;
            left: calc(100% - 100px);
          }
          50% {
            top: calc(100% - 100px);
            left: calc(100% - 100px);
          }
          75% {
            top: calc(100% - 100px);
            left: -100px;
          }
          100% {
            top: -100px;
            left: -100px;
          }
        }
        .animate-border-beam {
          animation: border-beam 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
