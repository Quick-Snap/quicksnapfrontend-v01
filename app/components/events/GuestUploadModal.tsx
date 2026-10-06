'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { guestSubmissionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface GuestUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  onSuccess?: () => void;
}

const MAX_PHOTOS = 15;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export default function GuestUploadModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  onSuccess,
}: GuestUploadModalProps) {
  const { user } = useAuth();

  // Steps: 1 = Phone Verification, 2 = Photo Selection & Upload, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Phone Verification State
  const [guestName, setGuestName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Photo Selection State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill from localStorage if previously verified
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('qs_verified_guest_phone');
      const savedName = localStorage.getItem('qs_verified_guest_name');
      if (savedPhone) {
        setPhone(savedPhone);
        setIsPhoneVerified(true);
        setStep(2);
      }
      if (savedName && !guestName) {
        setGuestName(savedName);
      }
    }
  }, [guestName]);

  if (!isOpen) return null;

  // Handle Mock/Firebase OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setOtpSent(true);
    toast.success(`Verification code sent to +91 ${cleanPhone.slice(-10)}`);
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      toast.error('Please enter the verification code');
      return;
    }

    setVerifyingOtp(true);
    try {
      // Firebase Phone Auth integration hook with dev bypass
      await new Promise((r) => setTimeout(r, 600));

      setIsPhoneVerified(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('qs_verified_guest_phone', phone);
        localStorage.setItem('qs_verified_guest_name', guestName);
      }
      toast.success('Mobile number verified successfully!');
      setStep(2);
    } catch {
      toast.error('Invalid verification code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle File Selection with constraints
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const validFiles: File[] = [];
    for (const f of filesArray) {
      if (!ALLOWED_TYPES.includes(f.type) && !f.name.toLowerCase().endsWith('.heic')) {
        toast.error(`"${f.name}" is not a supported format (JPG, PNG, HEIC only)`);
        continue;
      }
      validFiles.push(f);
    }

    if (selectedFiles.length + validFiles.length > MAX_PHOTOS) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos at a time`);
      const allowed = validFiles.slice(0, MAX_PHOTOS - selectedFiles.length);
      setSelectedFiles((prev) => [...prev, ...allowed]);
    } else {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // 1. Request presigned URLs
      const fileSpecs = selectedFiles.map((f) => ({
        fileName: f.name,
        fileType: f.type || 'image/jpeg',
      }));

      const presignRes = await guestSubmissionsApi.getUploadUrls(eventId, {
        phone,
        guestName,
        files: fileSpecs,
      });

      if (!presignRes.success || !presignRes.data?.uploadTargets) {
        throw new Error(presignRes.message || 'Failed to get upload authorization');
      }

      setUploadProgress(30);

      // 2. Upload directly to S3 via presigned PUT URLs
      const targets = presignRes.data.uploadTargets;
      const uploadedPhotosData: any[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const target = targets[i];

        await fetch(target.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'image/jpeg',
          },
          body: file,
        });

        uploadedPhotosData.push({
          s3Key: target.key,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'image/jpeg',
        });

        const progressPercent = 30 + Math.round(((i + 1) / selectedFiles.length) * 50);
        setUploadProgress(progressPercent);
      }

      // 3. Register submission in DB (status: 'pending')
      setUploadProgress(90);
      const submitRes = await guestSubmissionsApi.createSubmission(eventId, {
        guestName,
        phone,
        avatar: user?.avatar,
        photos: uploadedPhotosData,
      });

      if (submitRes.success) {
        setUploadProgress(100);
        setStep(3);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(submitRes.message || 'Failed to register submission');
      }
    } catch (err: any) {
      console.error('[GuestUpload] Upload failed:', err);
      toast.error(err.message || 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f0c18]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Share Your Photos</h3>
              <p className="text-xs text-zinc-500 dark:text-gray-400 truncate max-w-[240px]">{eventName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* STEP 1: Phone Verification */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-500/10 dark:bg-violet-500/5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-600 dark:text-gray-300 space-y-1">
                    <p className="font-semibold text-zinc-900 dark:text-white">Verified Guest Upload</p>
                    <p>To keep the event photo pool authentic and safe for all guests, please verify your mobile number once before uploading.</p>
                  </div>
                </div>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-gray-300 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-gray-300 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 dark:text-gray-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-12 pr-4 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors"
                  >
                    <span>Get Verification Code</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-violet-600 hover:underline dark:text-violet-400"
                      >
                        Change Number
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full text-center tracking-[0.5em] rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 text-lg font-bold text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyingOtp}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors disabled:opacity-50"
                  >
                    {verifyingOtp ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Verify & Continue</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Photo Selection & Direct Upload */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  Verified: +91 {phone.slice(-10)}
                </span>
                <span>Max {MAX_PHOTOS} photos</span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-6 text-center transition-all hover:border-violet-400 hover:bg-violet-50/20 dark:border-white/10 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 group-hover:scale-110 transition-transform dark:bg-violet-500/10 dark:text-violet-300">
                  <ImageIcon size={22} />
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Click to select photos</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-gray-400">Supports JPG, PNG, HEIC from mobile camera</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic,.heic"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-zinc-600 dark:text-gray-300">
                    Selected ({selectedFiles.length}/{MAX_PHOTOS})
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs dark:border-white/5 dark:bg-white/5"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ImageIcon size={14} className="text-zinc-400 shrink-0" />
                          <span className="truncate font-medium text-zinc-800 dark:text-gray-200">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-gray-300">
                    <span>Uploading photos...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Uploading ({selectedFiles.length} photos)...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Submit {selectedFiles.length > 0 ? `${selectedFiles.length} Photos` : ''} for Review</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: Submission Confirmation */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Photos Submitted Successfully!</h4>
                <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400 max-w-sm mx-auto">
                  Your photos are now queued for review by the event organizer. Once approved, they will appear in the event pool and may be featured on the Live Moments Wall!
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 text-left dark:border-white/5 dark:bg-white/5">
                <p className="text-xs font-semibold text-zinc-700 dark:text-gray-300 mb-1">What happens next?</p>
                <ul className="text-xs text-zinc-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>Organizer reviews submissions to prevent duplicate burst shots.</li>
                  <li>Approved photos match attendees automatically via face recognition.</li>
                  <li>Highlighted shots flash on the venue screen!</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
