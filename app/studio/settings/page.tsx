'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Camera,
  ShieldCheck,
  Save,
  Building,
  Phone,
  Sliders,
  Clock,
  Upload,
  Trash2,
  Type,
  Image as ImageIcon,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function StudioSettingsPage() {
  const { user } = useAuth();
  const updateUser = useAuthStore((state) => state.updateUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [watermarkType, setWatermarkType] = useState<'text' | 'logo'>('text');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkSize, setWatermarkSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoKey, setLogoKey] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left' | 'center'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);
  const [brandColor, setBrandColor] = useState('#7c3aed');
  const [defaultProofingDays, setDefaultProofingDays] = useState(14);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Initialize from user.studioSettings or defaults
  useEffect(() => {
    if (user) {
      const s = user.studioSettings || {};
      setBusinessName(s.businessName || user.name || '');
      setPhone(s.phone || user.phone || '');
      setWatermarkType(s.watermarkType || 'text');
      setWatermarkText(s.watermarkText || (user.name ? `© ${user.name} Preview` : '© Roopixo Preview'));
      setWatermarkSize(s.watermarkSize || 'medium');
      setLogoUrl(s.logoUrl || '');
      setLogoKey(s.logoKey || '');
      setWatermarkPosition(s.watermarkPosition || 'bottom-right');
      setWatermarkOpacity(s.watermarkOpacity !== undefined ? s.watermarkOpacity : 50);
      setBrandColor(s.brandColor || '#7c3aed');
      setDefaultProofingDays(s.defaultProofingDays || 14);
    }
  }, [user]);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Logo file size must be less than 10MB');
      return;
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only PNG, JPG, SVG, and WEBP formats are supported');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const res = await userApi.uploadStudioLogo(file);
      if (res.success && res.data) {
        setLogoUrl(res.data.logoUrl);
        setLogoKey(res.data.logoKey);
        setWatermarkType('logo');
        if (res.data.user) {
          updateUser(res.data.user);
        }
        toast.success('Studio logo uploaded successfully!');
      }
    } catch (err: any) {
      console.error('Failed to upload logo:', err);
      toast.error(err.response?.data?.message || 'Failed to upload studio logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove your studio logo?')) return;
    setIsUploadingLogo(true);
    try {
      const res = await userApi.deleteStudioLogo();
      if (res.success && res.data) {
        setLogoUrl('');
        setLogoKey('');
        setWatermarkType('text');
        if (res.data.user) {
          updateUser(res.data.user);
        }
        toast.success('Studio logo removed');
      }
    } catch (err: any) {
      console.error('Failed to remove logo:', err);
      toast.error('Failed to remove studio logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        businessName: businessName.trim(),
        phone: phone.trim(),
        watermarkType,
        watermarkText: watermarkText.trim(),
        watermarkSize,
        logoUrl,
        logoKey,
        watermarkPosition,
        watermarkOpacity,
        brandColor,
        defaultProofingDays
      };

      const res = await userApi.updateStudioSettings(payload);
      if (res.success && res.data) {
        updateUser(res.data);
        toast.success('Studio settings saved successfully!');
      } else {
        toast.success('Studio preferences updated!');
      }
    } catch (err: any) {
      console.error('Failed to save studio settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16 font-sans">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          Studio Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your photography studio profile, watermark preferences, and proofing defaults.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#10131d]/90 sm:p-8 transition-colors duration-200">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                {logoUrl ? (
                  <img src={logoUrl} alt="Studio Logo" className="h-full w-full object-contain p-1.5" />
                ) : (
                  <Camera size={28} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {businessName || user?.name || 'Studio Owner'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                    {user?.role || 'Photographer'}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">• Pro Studio</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 disabled:opacity-50 transition-all sm:self-start"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>

          {/* Studio Profile Inputs */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Studio / Business Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:bg-[#141724]"
                  placeholder="e.g. Royal Heritage Photography"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Contact Phone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:bg-[#141724]"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-transparent p-0.5 dark:border-white/10"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 px-4 py-2.5 text-sm font-mono text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder="#7c3aed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Default Proofing Window
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <select
                  value={defaultProofingDays}
                  onChange={(e) => setDefaultProofingDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:bg-[#141724]"
                >
                  <option value={7}>7 Days (Fast turnaround)</option>
                  <option value={14}>14 Days (Standard)</option>
                  <option value={30}>30 Days (Extended review)</option>
                  <option value={60}>60 Days (Full season)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Watermarking Preferences */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#10131d]/90 sm:p-8 transition-colors duration-200 space-y-6">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-base sm:text-lg">
            <Sliders size={20} className="text-violet-600 dark:text-violet-400" />
            <span>Client Proofing Watermark</span>
          </div>

          {/* Watermark Type Selector: Text vs Logo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Watermark Style
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setWatermarkType('text')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                  watermarkType === 'text'
                    ? 'border-violet-600 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/20 dark:text-violet-300 shadow-sm ring-1 ring-violet-500'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07]'
                }`}
              >
                <Type size={16} />
                <span>Text Watermark</span>
              </button>
              <button
                type="button"
                onClick={() => setWatermarkType('logo')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                  watermarkType === 'logo'
                    ? 'border-violet-600 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/20 dark:text-violet-300 shadow-sm ring-1 ring-violet-500'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07]'
                }`}
              >
                <ImageIcon size={16} />
                <span>Studio Logo</span>
                {logoUrl && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="Logo active" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              {/* Conditional: Text input vs Logo Upload */}
              {watermarkType === 'text' ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 px-4 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    placeholder="e.g. © Studio Name - Client Preview"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Studio Brand Logo
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />

                  {logoUrl ? (
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-900/10 dark:bg-white/10 p-1">
                          <img
                            src={logoUrl}
                            alt="Uploaded Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                              Logo uploaded
                            </p>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Ready for watermarking
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/20 transition-all"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          disabled={isUploadingLogo}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-all"
                          title="Remove logo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
                      className="group cursor-pointer rounded-2xl border-2 border-dashed border-zinc-200 p-6 text-center hover:border-violet-500 dark:border-white/10 dark:hover:border-violet-500/50 transition-all"
                    >
                      {isUploadingLogo ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Loader2 size={24} className="animate-spin text-violet-600" />
                          <span className="text-xs text-zinc-500">Uploading studio logo…</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 group-hover:scale-105 transition-transform">
                            <Upload size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              Click to upload studio logo
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                              PNG, JPG, SVG, or WEBP (transparent background recommended, max 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Watermark Size Selector (Decreased / Small, Medium, Large) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    {watermarkType === 'text' ? 'Text Size' : 'Logo Size'}
                  </label>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 capitalize">
                    {watermarkSize} size
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Small', desc: 'Decreased / Subtle' },
                    { id: 'medium', label: 'Medium', desc: 'Standard' },
                    { id: 'large', label: 'Large', desc: 'Prominent' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setWatermarkSize(sz.id as any)}
                      className={`flex flex-col items-center rounded-xl border px-3 py-2 text-xs transition-all ${
                        watermarkSize === sz.id
                          ? 'border-violet-600 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/20 dark:text-violet-300 shadow-sm font-semibold'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      <span className="font-semibold">{sz.label}</span>
                      <span className="text-[10px] opacity-75 font-normal mt-0.5">{sz.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Position */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Watermark Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bottom-right', label: 'Bottom Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'center', label: 'Center' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setWatermarkPosition(pos.id as any)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                        watermarkPosition === pos.id
                          ? 'border-violet-600 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/20 dark:text-violet-300 shadow-sm'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Watermark Opacity ({watermarkOpacity}%)
                  </label>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>Subtle (10%)</span>
                  <span>Balanced (50%)</span>
                  <span>Prominent (100%)</span>
                </div>
              </div>
            </div>

            {/* Live Watermark Preview Mockup */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Live Client Preview Mockup
              </label>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black shadow-inner dark:border-white/10 flex items-center justify-center text-white">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80')` }}
                />

                <div className="relative z-10 text-center px-4">
                  <Camera className="mx-auto h-8 w-8 text-white/50 mb-1" />
                  <p className="text-xs text-white/70 font-medium">Sample Shoot Photo Preview</p>
                </div>

                {/* Simulated Watermark Badge / Logo */}
                <div
                  className={`absolute z-20 pointer-events-none transition-all duration-200 select-none ${
                    watermarkPosition === 'bottom-right'
                      ? 'bottom-3 right-3'
                      : watermarkPosition === 'bottom-left'
                      ? 'bottom-3 left-3'
                      : 'inset-0 flex items-center justify-center'
                  }`}
                  style={{ opacity: watermarkOpacity / 100 }}
                >
                  {watermarkType === 'logo' ? (
                    logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Studio Logo Watermark"
                        className={`transition-all ${
                          watermarkSize === 'small'
                            ? 'max-h-7 max-w-[100px]'
                            : watermarkSize === 'large'
                            ? 'max-h-16 max-w-[210px]'
                            : 'max-h-11 max-w-[150px]'
                        } object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]`}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/40 bg-black/65 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm shadow-md">
                        <ImageIcon size={14} />
                        <span>Studio Logo (Upload Above)</span>
                      </div>
                    )
                  ) : (
                    <div
                      className={`rounded-lg bg-black/65 backdrop-blur-sm text-white tracking-wide shadow-md border border-white/20 transition-all font-semibold ${
                        watermarkSize === 'small'
                          ? 'text-[10px] px-2 py-0.5'
                          : watermarkSize === 'large'
                          ? 'text-sm sm:text-base px-3.5 py-1.5'
                          : 'text-xs px-2.5 py-1'
                      }`}
                    >
                      {watermarkText || '© Preview Watermark'}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Web preview files will carry this stamp. Unwatermarked originals are protected on your local drive.
              </p>
            </div>
          </div>
        </div>

        {/* Informational Protection Card */}
        <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/60 p-5 text-xs text-zinc-700 dark:border-violet-500/20 dark:bg-gradient-to-r dark:from-violet-950/20 dark:via-[#131127] dark:to-[#0c0e16] dark:text-zinc-300">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <ShieldCheck size={18} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                Fast Web Proofing &amp; Local Master File Security
              </p>
              <p className="leading-relaxed text-zinc-600 dark:text-zinc-400 text-xs">
                When you ingest photos in Studio, lightweight compressed proxies are uploaded to Roopixo cloud. Clients select their favorites (❤️ Album and 🔖 Keepers). Your high-resolution master RAW files remain securely stored on your computer until you export the final selection.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 hover:bg-violet-500 disabled:opacity-50 transition-all"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving Settings…' : 'Save Studio Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
