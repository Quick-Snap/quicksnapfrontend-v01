'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Upload, X, CheckCircle, AlertCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
      toast.error('Please capture a photo first');
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
        // Update user in context
        if (user) {
          updateUser({ ...user, faceRegistered: true });
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
        <div className="card-glass rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-110 transition-all duration-300">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              {user?.faceRegistered ? 'Update Face Data' : 'Register Your Face'}
            </h1>
            <p className="text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {user?.faceRegistered ? 'Update your recognition data' : 'Enable automatic photo recognition at events'}
            </p>
          </div>

          {/* Warning for Re-registration */}
          {user?.faceRegistered && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 animate-slide-up">
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
          <div className="card bg-violet-500/10 border-violet-500/20 rounded-xl p-4 mb-6 animate-slide-up delay-100">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-violet-400" />
              Photo Guidelines
            </h3>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Face the camera directly with good lighting</li>
              <li>Remove glasses or hat if possible</li>
              <li>Keep a neutral expression</li>
              <li>Ensure your full face is visible</li>
            </ul>
          </div>

          {/* Camera/Preview Section */}
          <div className="mb-6 animate-slide-up delay-200">
            {!capturedImage ? (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative bg-[#0a0a0a] rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-xl">
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
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Camera className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-sm">Camera not active</p>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {!isCameraActive ? (
                    <button
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
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Captured Image Preview */}
                <div className="relative bg-[#0a0a0a] rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-xl">
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
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setUploadProgress(0);
                      startCamera();
                    }}
                    disabled={uploading}
                    className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Retake
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn-gradient px-8 py-3 rounded-xl flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="text-center pt-4 border-t border-white/10 animate-fade-in delay-300">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-violet-400 text-sm transition-colors"
            >
              Skip for now →
            </Link>
          </div>
        </div>

        {/* Info Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 animate-fade-in delay-400">
          Your face data is securely stored and used only for photo recognition at events
        </p>
      </div>
    </div>
  );
}
