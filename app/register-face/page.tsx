  'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Upload, X, CheckCircle, AlertCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

/** Set to true when live camera capture is supported end-to-end */
const CAMERA_CAPTURE_ENABLED = false;

export default function RegisterFacePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  // Upload to S3 and register face
  const handleUpload = async () => {
    if (!capturedImage) {
      toast.error('Please add a photo first');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Step 1: Get presigned URL from backend
      setUploadProgress(20);
      const presignedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/face/upload-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignedResponse.json();
      setUploadProgress(40);

      // Step 2: Convert base64 to blob
      const base64Data = capturedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Step 3: Upload directly to S3 using presigned URL
      setUploadProgress(60);
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=432000, immutable',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      setUploadProgress(80);

      // Step 4: Notify backend to process the uploaded image from S3
      const registerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/face`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ s3Key: key }),
        }
      );

      const registerData = await registerResponse.json();

      if (registerData.success) {
        setUploadProgress(100);
        toast.success('Face registered successfully!');
        // Update user in context with new face registration status and cache-busted avatar
        if (user) {
          updateUser({
            ...user,
            faceRegistered: true,
            avatar: registerData.data?.avatarUrl || user.avatar
          });
        }
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        throw new Error(registerData.message || 'Failed to register face');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to register face');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Handle file upload alternative
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>
      </div>

      {/* Animated Blobs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-float delay-200"></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-float delay-400"></div>

      <div className="max-w-2xl w-full relative z-10 animate-slide-up">
        {/* Glass Card */}
        <div className="card-glass rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 sm:hover:shadow-emerald-500/50 sm:transform sm:hover:scale-105 transition-all duration-300">
                <Camera className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-1.5 sm:mb-2 px-1">
              {user?.faceRegistered ? 'Update Face Data' : 'Register Your Face'}
            </h1>
            <p className="text-gray-400 flex items-center justify-center gap-2 text-sm sm:text-base px-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-snug">{user?.faceRegistered ? 'Update your recognition data' : 'Enable automatic photo recognition at events'}</span>
            </p>
          </div>

          {/* Warning for Re-registration */}
          {user?.faceRegistered && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 animate-slide-up">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-300">Warning: Replacing Existing Data</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    You already have a face registered. Proceeding will <span className="font-bold text-amber-300">permanently delete</span> your old face data and photos associated with it might need re-indexing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="card bg-violet-500/10 border-violet-500/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 animate-slide-up delay-100">
            <h3 className="font-semibold text-white text-sm sm:text-base mb-1.5 sm:mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400 shrink-0" />
              Photo Guidelines
            </h3>
            <ul className="text-xs sm:text-sm text-gray-400 space-y-0.5 sm:space-y-1 list-disc list-inside leading-relaxed">
              <li>Face the camera directly with good lighting</li>
              <li>Remove glasses or hat if possible</li>
              <li>Keep a neutral expression</li>
              <li>Ensure your full face is visible</li>
            </ul>
          </div>

          {/* Camera/Preview Section */}
          <div className="mb-4 sm:mb-6 animate-slide-up delay-200">
            {!capturedImage ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Video Preview */}
                <div
                  className={`relative bg-[#0a0a0a] rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-xl ${
                    isCameraActive ? 'aspect-video' : !CAMERA_CAPTURE_ENABLED ? 'h-36 sm:h-auto sm:aspect-video' : 'aspect-video'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {/* Face Guide Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-80 border-4 border-violet-500/50 rounded-full"></div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[9rem] text-gray-500 px-3 sm:px-4 text-center">
                      <Camera className="h-10 w-10 sm:h-16 sm:w-16 mb-2 sm:mb-4 opacity-40" />
                      <p className="text-xs sm:text-sm text-gray-400 leading-snug">
                        {CAMERA_CAPTURE_ENABLED ? (
                          'Camera not active'
                        ) : (
                          <>
                            Live camera — <span className="text-gray-300">coming soon</span>
                          </>
                        )}
                      </p>
                      {!CAMERA_CAPTURE_ENABLED && (
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5 max-w-[17rem] leading-snug">
                          Use <span className="text-gray-400 font-medium">Upload File</span> below for now.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                {!isCameraActive && !CAMERA_CAPTURE_ENABLED ? (
                  <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                    <label className="btn-gradient px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold cursor-pointer w-full sm:w-auto order-1 shadow-lg shadow-violet-500/15">
                      <Upload className="h-5 w-5 shrink-0" />
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-gray-500 bg-white/[0.04] border border-white/10 cursor-not-allowed order-2"
                    >
                      <Camera className="h-5 w-5 shrink-0 opacity-60" />
                      Start Camera
                      <span className="sr-only">(unavailable)</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center">
                    {!isCameraActive ? (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="btn-gradient px-6 py-3 rounded-xl flex items-center gap-2 font-semibold"
                      >
                        <Camera className="h-5 w-5" />
                        Start Camera
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={capturePhoto}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                        >
                          <Camera className="h-5 w-5" />
                          Capture Photo
                        </button>
                        <button
                          onClick={stopCamera}
                          className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2 font-semibold"
                        >
                          <X className="h-5 w-5" />
                          Stop Camera
                        </button>
                      </>
                    )}

                    {CAMERA_CAPTURE_ENABLED && (
                      <label className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2 font-semibold cursor-pointer">
                        <Upload className="h-5 w-5" />
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Captured Image Preview */}
                <div className="relative bg-[#0a0a0a] rounded-xl sm:rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-xl">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-violet-400" />
                        <p className="text-lg font-semibold mb-2">Processing...</p>
                        <div className="w-64 bg-white/10 rounded-full h-2 mx-auto">
                          <div
                            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm mt-2 text-gray-400">{uploadProgress}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 justify-stretch sm:justify-center">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setUploadProgress(0);
                      if (CAMERA_CAPTURE_ENABLED) startCamera();
                    }}
                    disabled={uploading}
                    className="btn-secondary px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Retake
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn-gradient px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Register Face
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Skip Option */}
          <div className="text-center pt-3 sm:pt-4 border-t border-white/10 animate-fade-in delay-300">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-violet-400 text-xs sm:text-sm transition-colors"
            >
              Skip for now →
            </Link>
          </div>
        </div>

        {/* Info Footer */}
        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 px-2 animate-fade-in delay-400 leading-relaxed">
          Your face data is securely stored and used only for photo recognition at events
        </p>
      </div>
    </div>
  );
}
