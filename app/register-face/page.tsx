'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRegisterFaceLivenessCapture } from '@/hooks/useRegisterFaceLivenessCapture';
import type { FaceLandmarkerResultLike } from '@/hooks/useSmartSelfieCapture';
import { webpRawBase64ToJpegDataUrl } from '@/lib/webpToJpegDataUrl';

const MEDIAPIPE_TASKS_VERSION = '0.10.17';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VERSION}/wasm`;

type LandmarkerReadyState = 'idle' | 'loading' | 'ready' | 'error';

function CaptureProgressRing({ percentage }: { percentage: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percentage) / 100) * c;
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2"
      viewBox="0 0 128 128"
      aria-hidden
    >
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="url(#registerFaceCapGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
      />
      <defs>
        <linearGradient id="registerFaceCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function RegisterFacePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopDetectionRef = useRef(false);
  const faceLandmarkerRef = useRef<{ detectForVideo: (v: HTMLVideoElement, t: number) => unknown; close: () => void } | null>(
    null
  );

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [landmarkerState, setLandmarkerState] = useState<LandmarkerReadyState>('idle');

  const stopMediaStream = useCallback(() => {
    stopDetectionRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraActive(false);
    if (videoRef.current) videoRef.current.srcObject = null;
    faceLandmarkerRef.current?.close();
    faceLandmarkerRef.current = null;
    setLandmarkerState('idle');
  }, []);

  const onLiveCapture = useCallback(async (frameBase64: string) => {
    try {
      const jpegDataUrl = await webpRawBase64ToJpegDataUrl(frameBase64);
      setCapturedImage(jpegDataUrl);
      toast.success('Live selfie captured');
    } catch {
      try {
        setCapturedImage(`data:image/jpeg;base64,${frameBase64}`);
        toast.success('Live selfie captured');
      } catch {
        toast.error('Could not process camera frame');
      }
    }
  }, []);

  const {
    phase,
    statusMessage,
    progressPercentage,
    isFaceValid,
    onFaceLandmarkerResults,
    reset: resetSelfie,
    challengeStep,
    challengeTotal,
  } = useRegisterFaceLivenessCapture({
    videoRef,
    onCapture: onLiveCapture,
    stopMediaStream,
    challengeCount: 3,
  });

  /**
   * The `<video>` only mounts after `isCameraActive` is true. Assigning `srcObject` in `startCamera`
   * ran while the ref was still null, so the stream was never attached (black preview).
   */
  useLayoutEffect(() => {
    if (!isCameraActive) return;
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.srcObject = stream;

    const tryPlay = () => {
      void video.play().catch((err) => {
        console.error('Camera preview play failed:', err);
        toast.error('Could not start camera preview. Stop and try again.');
      });
    };

    tryPlay();
    if (video.readyState < 2) {
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
      video.srcObject = null;
    };
  }, [isCameraActive]);

  const startCamera = useCallback(async () => {
    try {
      setLandmarkerState('loading');
      stopDetectionRef.current = false;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = mediaStream;
      setIsCameraActive(true);

      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      } catch {
        toast.error('Could not load face detection. Check your connection.');
        setLandmarkerState('error');
        stopMediaStream();
        return;
      }

      const tryCreate = (delegate: 'GPU' | 'CPU') =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL,
            delegate,
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
        });

      let faceLandmarker;
      try {
        faceLandmarker = await tryCreate('GPU');
      } catch {
        try {
          faceLandmarker = await tryCreate('CPU');
        } catch {
          toast.error('Face detection unavailable on this device.');
          setLandmarkerState('error');
          stopMediaStream();
          return;
        }
      }

      faceLandmarkerRef.current = faceLandmarker;
      setLandmarkerState('ready');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
      setLandmarkerState('idle');
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  }, [stopMediaStream]);

  const stopCamera = useCallback(() => {
    stopMediaStream();
    resetSelfie();
  }, [resetSelfie, stopMediaStream]);

  useEffect(() => {
    if (!isCameraActive || landmarkerState !== 'ready' || capturedImage) return;
    const video = videoRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
    if (!video || !faceLandmarker) return;

    stopDetectionRef.current = false;
    let rafId = 0;
    let lastVideoTime = -1;

    const loop = () => {
      if (stopDetectionRef.current) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const ts = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const result = faceLandmarker.detectForVideo(video, ts) as FaceLandmarkerResultLike;
          onFaceLandmarkerResults(result, ts);
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isCameraActive, landmarkerState, capturedImage, onFaceLandmarkerResults]);

  useEffect(() => {
    return () => {
      stopDetectionRef.current = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      faceLandmarkerRef.current?.close();
    };
  }, []);

  const handleUpload = async () => {
    if (!capturedImage) {
      toast.error('Please capture a live photo first');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(20);
      const presignedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/face/upload-url`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignedResponse.json();
      setUploadProgress(40);

      const base64Data = capturedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

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

      const registerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/face`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ s3Key: key }),
        }
      );

      const registerData = await registerResponse.json();

      if (registerData.success) {
        setUploadProgress(100);
        toast.success('Face registered successfully!');
        if (user) {
          updateUser({
            ...user,
            faceRegistered: true,
            avatar: registerData.data?.avatarUrl || user.avatar,
          });
        }
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        throw new Error(registerData.message || 'Failed to register face');
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const message =
        error && typeof error === 'object' && 'response' in error
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
          : error instanceof Error
            ? error.message
            : 'Failed to register face';
      toast.error(message || 'Failed to register face');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    resetSelfie();
  };

  const showLiveChrome = isCameraActive && landmarkerState === 'ready' && !capturedImage;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>
      </div>

      <div className="absolute left-10 top-20 h-96 w-96 animate-float rounded-full bg-emerald-500/10 blur-[100px]"></div>
      <div className="absolute bottom-20 right-10 h-80 w-80 animate-float rounded-full bg-violet-500/10 blur-[100px] delay-200"></div>
      <div className="absolute left-1/2 top-1/2 h-72 w-72 animate-float rounded-full bg-blue-500/5 blur-[100px] delay-400"></div>

      <div className="animate-slide-up relative z-10 w-full max-w-2xl">
        <div className="card-glass rounded-xl p-4 shadow-2xl sm:rounded-2xl sm:p-8">
          <div className="mb-5 text-center sm:mb-8">
            <div className="mb-3 flex justify-center sm:mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 transition-all duration-300 sm:h-16 sm:w-16 sm:rounded-2xl sm:hover:scale-105 sm:hover:shadow-emerald-500/50">
                <Camera className="h-7 w-7 text-white sm:h-8 sm:w-8" />
              </div>
            </div>
            <h1 className="text-gradient mb-1.5 px-1 text-2xl font-bold sm:mb-2 sm:text-3xl">
              {user?.faceRegistered ? 'Update Face Data' : 'Register Your Face'}
            </h1>
            <p className="flex items-center justify-center gap-2 px-2 text-sm text-gray-400 sm:text-base">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="leading-snug">
                {user?.faceRegistered ? 'Update your recognition data' : 'Enable automatic photo recognition at events'}
              </span>
            </p>
          </div>

          {user?.faceRegistered && (
            <div className="animate-slide-up mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 sm:mb-6 sm:p-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-300">Warning: Replacing Existing Data</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    You already have a face registered. Proceeding will{' '}
                    <span className="font-bold text-amber-300">permanently delete</span> your old face data and photos
                    associated with it might need re-indexing.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="animate-slide-up delay-100 mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 sm:mb-6 sm:p-4">
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
              <Shield className="h-4 w-4 shrink-0 text-emerald-400 sm:h-5 sm:w-5" />
              Live enrollment only
            </h3>
            <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
              Registration uses your camera with real-time face checks. File uploads are disabled here so you cannot
              register using a saved or third-party photo.
            </p>
          </div>

          <div className="card animate-slide-up delay-100 mb-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 sm:mb-6 sm:p-4">
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
              <AlertCircle className="h-4 w-4 shrink-0 text-violet-400 sm:h-5 sm:w-5" />
              Photo guidelines
            </h3>
            <ul className="list-inside list-disc space-y-0.5 text-xs leading-relaxed text-gray-400 sm:space-y-1 sm:text-sm">
              <li>Face the camera directly with good lighting</li>
              <li>Follow the random prompts (blink, turn head, smile)</li>
              <li>Stay still for ~2 seconds when the progress ring fills</li>
              <li>Remove glasses or hat if possible</li>
            </ul>
          </div>

          <div className="animate-slide-up delay-200 mb-4 sm:mb-6">
            {!capturedImage ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-xl sm:rounded-2xl">
                  {isCameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                      {showLiveChrome && (
                        <>
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div
                              className={`h-[min(78%,22rem)] w-[min(62%,17rem)] rounded-full border-4 ${
                                phase === 'liveness'
                                  ? 'border-amber-400/65'
                                  : isFaceValid
                                    ? 'border-emerald-400/70'
                                    : 'border-violet-500/45'
                              }`}
                            />
                          </div>
                          {phase === 'stabilizing' && <CaptureProgressRing percentage={progressPercentage} />}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-10 text-center sm:px-4">
                            <p className="text-sm font-medium text-white drop-shadow md:text-base">{statusMessage}</p>
                            {phase === 'liveness' && challengeTotal > 0 && (
                              <p className="mt-1 text-xs font-medium text-amber-200/95">
                                Step {challengeStep} of {challengeTotal}
                              </p>
                            )}
                            {phase === 'framing' && (
                              <p className="mt-1 text-[11px] text-gray-400">Get in frame, then you’ll get random prompts</p>
                            )}
                          </div>
                        </>
                      )}
                      {landmarkerState === 'loading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]">
                          <Loader2 className="mb-2 h-10 w-10 animate-spin text-violet-400" />
                          <p className="text-sm text-gray-200">Starting face detection…</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full min-h-[9rem] flex-col items-center justify-center px-3 text-center text-gray-500 sm:px-4">
                      <Camera className="mb-2 h-10 w-10 opacity-40 sm:mb-4 sm:h-16 sm:w-16" />
                      <p className="text-xs leading-snug text-gray-400 sm:text-sm">Camera not active</p>
                      <p className="mt-1.5 max-w-[17rem] text-[11px] leading-snug text-gray-500 sm:text-xs">
                        Use <span className="font-medium text-gray-400">Start Camera</span> for a guided live selfie.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={landmarkerState === 'loading'}
                      className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {landmarkerState === 'loading' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Starting…
                        </>
                      ) : (
                        <>
                          <Camera className="h-5 w-5" />
                          Start Camera
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={stopCamera}
                        disabled={!!capturedImage}
                        className="btn-secondary flex items-center gap-2 rounded-xl px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-5 w-5" />
                        Stop Camera
                      </button>
                    </>
                  )}
                </div>

                {landmarkerState === 'error' && (
                  <p className="text-center text-sm text-amber-300">Face detection failed to load. Try again or use another browser.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-xl sm:rounded-2xl">
                  <img src={capturedImage} alt="Captured live selfie" className="h-full w-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                      <div className="text-center text-white">
                        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-400" />
                        <p className="mb-2 text-lg font-semibold">Processing...</p>
                        <div className="mx-auto h-2 w-64 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-400">{uploadProgress}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse justify-stretch gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={uploading}
                    className="btn-secondary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

          <div className="animate-fade-in delay-300 border-t border-white/10 pt-3 text-center sm:pt-4">
            <Link href="/dashboard" className="text-xs text-gray-500 transition-colors hover:text-violet-400 sm:text-sm">
              Skip for now →
            </Link>
          </div>
        </div>

        <p className="animate-fade-in delay-400 mt-4 px-2 text-center text-xs leading-relaxed text-gray-500 sm:mt-6 sm:text-sm">
          Your face data is securely stored and used only for photo recognition at events
        </p>
      </div>
    </div>
  );
}
