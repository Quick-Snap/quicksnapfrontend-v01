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
  ChevronDown,
  FlipHorizontal2,
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
      className="pointer-events-none absolute left-1/2 top-1/2 h-[clamp(7.5rem,28vw,9rem)] w-[clamp(7.5rem,28vw,9rem)] -translate-x-1/2 -translate-y-1/2 text-white/15 sm:h-36 sm:w-36"
      viewBox="0 0 128 128"
      aria-hidden
    >
      <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="6" />
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
  // Default to non-mirrored preview so on-screen movement matches what the camera will save.
  // Users that prefer the classic mirror selfie can flip it back with the toggle.
  const [mirrorPreview, setMirrorPreview] = useState(false);

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
    challengeCount: 2,
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
    video.setAttribute('webkit-playsinline', 'true');
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
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
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
  /** Mobile: focus almost full screen on camera / review (~80% viewport) */
  const immersiveMobile = isCameraActive || !!capturedImage;

  const primaryButtonClass =
    'touch-manipulation min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold active:scale-[0.98] sm:min-h-0 sm:w-auto sm:py-3';

  return (
    <div
      className={`relative flex min-h-dvh min-h-screen flex-col overflow-x-hidden overflow-y-auto pb-safe-plus pt-safe sm:items-center sm:justify-center sm:px-6 sm:py-12 lg:px-8 ${
        immersiveMobile ? 'max-sm:pb-0 max-sm:pt-2' : ''
      }`}
    >
      <div className="absolute inset-0 bg-[var(--background)] dark:bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-[0.42] dark:opacity-50"></div>
      </div>

      <div className="pointer-events-none absolute left-10 top-20 hidden h-96 w-96 animate-float rounded-full bg-emerald-400/25 blur-[100px] dark:bg-emerald-500/10 sm:block"></div>
      <div className="pointer-events-none absolute bottom-20 right-10 hidden h-80 w-80 animate-float rounded-full bg-violet-400/20 blur-[100px] delay-200 dark:bg-violet-500/10 sm:block"></div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-float rounded-full bg-indigo-400/15 blur-[100px] delay-400 dark:bg-blue-500/5 sm:block"></div>

      <div
        className={`animate-slide-up relative z-10 w-full max-w-2xl flex-1 px-3 pb-4 sm:mx-auto sm:flex-none sm:px-0 sm:pb-0 ${
          immersiveMobile ? 'max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:px-2 max-sm:pb-safe-plus' : ''
        }`}
      >
        <div
          className={`rounded-none border-0 bg-transparent p-3 shadow-none backdrop-blur-none sm:rounded-2xl sm:border sm:border-zinc-200/90 sm:bg-white/85 sm:p-8 sm:shadow-xl sm:backdrop-blur-xl dark:sm:border-white/10 dark:sm:bg-white/[0.06] dark:sm:shadow-2xl ${
            immersiveMobile ? 'max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:bg-transparent max-sm:p-2' : ''
          }`}
        >
          <div className={`mb-4 text-center sm:mb-8 ${immersiveMobile ? 'max-sm:hidden' : ''}`}>
            <div className="mb-2 flex justify-center sm:mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 transition-all duration-300 sm:h-16 sm:w-16 sm:rounded-2xl sm:hover:scale-105 sm:hover:shadow-emerald-500/50">
                <Camera className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>
            </div>
            <h1 className="text-gradient mb-1 px-2 text-xl font-bold leading-tight sm:mb-2 sm:text-3xl">
              {user?.faceRegistered ? 'Update Face Data' : 'Register Your Face'}
            </h1>
            <p className="flex items-center justify-center gap-2 px-1 text-xs leading-snug text-zinc-600 dark:text-gray-400 sm:text-base">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 sm:h-4 sm:w-4" />
              <span className="max-w-md">
                {user?.faceRegistered ? 'Update your recognition data' : 'Enable automatic photo recognition at events'}
              </span>
            </p>
          </div>

          {user?.faceRegistered && (
            <div
              className={`animate-slide-up mb-4 rounded-xl border border-amber-200/90 bg-amber-50/95 p-3 sm:mb-6 sm:p-4 dark:border-amber-500/20 dark:bg-amber-500/10 ${immersiveMobile ? 'max-sm:hidden' : ''}`}
            >
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 dark:bg-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-300">Warning: Replacing Existing Data</h3>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-gray-400">
                    You already have a face registered. Proceeding will{' '}
                    <span className="font-bold text-amber-800 dark:text-amber-300">permanently delete</span> your old face data and photos
                    associated with it might need re-indexing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: compact expandable tips — hidden during live camera */}
          <details
            className={`group mb-4 rounded-xl border border-zinc-200/90 bg-white/90 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none sm:hidden ${immersiveMobile ? 'hidden' : ''}`}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold text-zinc-900 dark:text-white [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Tips before you start
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180 dark:text-gray-400" />
            </summary>
            <div className="space-y-3 border-t border-zinc-200/80 px-4 pb-4 pt-2 text-xs leading-relaxed text-zinc-600 dark:border-white/10 dark:text-gray-400">
              <p>
                Live enrollment only — camera required; uploads are disabled so you register with a real-time selfie.
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Good lighting, face the camera</li>
                <li>Follow prompts (blink, turn head, smile)</li>
                <li>Hold still ~1.5s when the ring fills</li>
                <li>Remove glasses or hat if you can</li>
              </ul>
            </div>
          </details>

          <div className="animate-slide-up delay-100 mb-4 hidden rounded-xl border border-emerald-200/90 bg-emerald-50/90 p-3 shadow-sm sm:mb-6 sm:block sm:p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:shadow-none">
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-900 sm:text-base dark:text-white">
              <Shield className="h-4 w-4 shrink-0 text-emerald-600 sm:h-5 sm:w-5 dark:text-emerald-400" />
              Live enrollment only
            </h3>
            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-gray-400">
              Registration uses your camera with real-time face checks. File uploads are disabled here so you cannot
              register using a saved or third-party photo.
            </p>
          </div>

          <div className="animate-slide-up delay-100 mb-4 hidden rounded-xl border border-violet-200/90 bg-violet-50/90 p-3 shadow-sm sm:mb-6 sm:block sm:p-4 dark:border-violet-500/20 dark:bg-violet-500/10 dark:shadow-none">
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-900 sm:text-base dark:text-white">
              <AlertCircle className="h-4 w-4 shrink-0 text-violet-600 sm:h-5 sm:w-5 dark:text-violet-400" />
              Photo guidelines
            </h3>
            <ul className="list-inside list-disc space-y-0.5 text-xs leading-relaxed text-zinc-600 sm:space-y-1 sm:text-sm dark:text-gray-400">
              <li>Face the camera directly with good lighting</li>
              <li>Follow the random prompts (blink, turn head, smile)</li>
              <li>Stay still for ~1.5 seconds when the progress ring fills</li>
              <li>Remove glasses or hat if possible</li>
            </ul>
          </div>

          {capturedImage && (
            <div className="mb-2 text-center sm:hidden">
              <p className="text-lg font-bold text-zinc-900 dark:text-white">Review your selfie</p>
              <p className="text-xs text-zinc-600 dark:text-gray-400">Happy with it? Register or retake below.</p>
            </div>
          )}

          <div
            className={`animate-slide-up delay-200 mb-4 sm:mb-6 ${immersiveMobile ? 'max-sm:mb-2 max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col' : ''}`}
          >
            {!capturedImage ? (
              <div className={`space-y-3 sm:space-y-4 ${immersiveMobile ? 'max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:space-y-2' : ''}`}>
                <div
                  className={`relative mx-auto w-full overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-100 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-[#0a0a0a] dark:shadow-xl sm:rounded-2xl ${
                    isCameraActive
                      ? 'max-sm:h-[80dvh] max-sm:max-h-[82dvh] max-sm:min-h-[78dvh] max-sm:flex-shrink-0 sm:aspect-video'
                      : 'aspect-video max-sm:min-h-[11rem]'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ transform: mirrorPreview ? 'scaleX(-1)' : 'scaleX(1)' }}
                        className="absolute inset-0 h-full w-full object-cover object-[center_top] sm:static sm:object-center"
                      />
                      {showLiveChrome && (
                        <>
                          <button
                            type="button"
                            onClick={() => setMirrorPreview((m) => !m)}
                            aria-pressed={mirrorPreview}
                            title={mirrorPreview ? 'Turn off mirror preview' : 'Mirror preview'}
                            className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                          >
                            <FlipHorizontal2 className="h-3.5 w-3.5" />
                            {mirrorPreview ? 'Mirror: On' : 'Mirror: Off'}
                          </button>
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2">
                            <div
                              className={`aspect-[3/4] w-[min(72vw,17rem)] max-w-[92%] rounded-full border-[3px] sm:h-[min(78%,22rem)] sm:w-[min(62%,17rem)] sm:border-4 ${
                                phase === 'liveness'
                                  ? 'border-amber-400/65'
                                  : isFaceValid
                                    ? 'border-emerald-400/70'
                                    : 'border-violet-500/45'
                              }`}
                            />
                          </div>
                          {phase === 'stabilizing' && <CaptureProgressRing percentage={progressPercentage} />}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-3 pb-safe-plus pt-12 text-center sm:px-4 sm:pb-3 sm:pt-10">
                            <p className="text-base font-semibold leading-snug text-white drop-shadow-md sm:text-sm sm:font-medium md:text-base">
                              {statusMessage}
                            </p>
                            {phase === 'liveness' && challengeTotal > 0 && (
                              <p className="mt-1.5 text-sm font-semibold text-amber-200 sm:text-xs sm:font-medium">
                                Step {challengeStep} of {challengeTotal}
                              </p>
                            )}
                            {phase === 'framing' && (
                              <p className="mt-1.5 max-sm:text-sm max-sm:text-gray-300 sm:mt-1 sm:text-[11px] sm:text-gray-400">
                                Get in frame, then you’ll get random prompts
                              </p>
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
                    <div className="flex h-full min-h-[9rem] flex-col items-center justify-center px-3 text-center text-zinc-500 sm:px-4 dark:text-gray-500">
                      <Camera className="mb-2 h-10 w-10 opacity-50 text-zinc-400 dark:opacity-40 sm:mb-4 sm:h-16 sm:w-16" />
                      <p className="text-xs leading-snug text-zinc-600 sm:text-sm dark:text-gray-400">Camera not active</p>
                      <p className="mt-1.5 max-w-[17rem] text-[11px] leading-snug text-zinc-500 sm:text-xs dark:text-gray-500">
                        Use <span className="font-medium text-zinc-700 dark:text-gray-400">Start Camera</span> for a guided live selfie.
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3 ${
                    isCameraActive
                      ? 'max-sm:sticky max-sm:bottom-0 max-sm:z-30 max-sm:rounded-t-2xl max-sm:border-t max-sm:border-zinc-200/90 max-sm:bg-white/95 max-sm:px-1 max-sm:pb-safe-plus max-sm:pt-3 max-sm:shadow-[0_-8px_30px_rgba(0,0,0,0.06)] max-sm:backdrop-blur-lg dark:max-sm:border-white/10 dark:max-sm:bg-[#0a0a0a]/92 dark:max-sm:shadow-none'
                      : ''
                  }`}
                >
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={landmarkerState === 'loading'}
                      className={`btn-gradient flex ${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
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
                        className={`btn-secondary flex ${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <X className="h-5 w-5" />
                        Stop Camera
                      </button>
                    </>
                  )}
                </div>

                {landmarkerState === 'error' && (
                  <p className="text-center text-sm text-amber-800 dark:text-amber-300">
                    Face detection failed to load. Try again or use another browser.
                  </p>
                )}
              </div>
            ) : (
              <div className={`space-y-4 ${immersiveMobile ? 'max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:space-y-3' : ''}`}>
                <div
                  className={`relative overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-100 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-[#0a0a0a] dark:shadow-xl sm:aspect-video sm:rounded-2xl ${
                    immersiveMobile
                      ? 'max-sm:h-[78dvh] max-sm:max-h-[80dvh] max-sm:min-h-[72dvh] max-sm:flex-shrink-0'
                      : 'aspect-video max-sm:min-h-[min(44vh,360px)]'
                  }`}
                >
                  <img src={capturedImage} alt="Captured live selfie" className="h-full min-h-full w-full object-cover object-center" />
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

                <div className="flex flex-col-reverse justify-stretch gap-3 max-sm:sticky max-sm:bottom-0 max-sm:z-30 max-sm:rounded-t-2xl max-sm:border-t max-sm:border-zinc-200/90 max-sm:bg-white/95 max-sm:px-1 max-sm:pb-safe-plus max-sm:pt-3 max-sm:shadow-[0_-8px_30px_rgba(0,0,0,0.06)] max-sm:backdrop-blur-lg dark:max-sm:border-white/10 dark:max-sm:bg-[#0a0a0a]/92 dark:max-sm:shadow-none sm:flex-row sm:justify-center sm:gap-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={uploading}
                    className={`btn-secondary flex ${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <RefreshCw className="h-5 w-5" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className={`btn-gradient flex ${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
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

          <div
            className={`animate-fade-in delay-300 border-t border-zinc-200/90 pb-safe pt-4 text-center dark:border-white/10 sm:pb-0 sm:pt-4 ${immersiveMobile ? 'max-sm:hidden' : ''}`}
          >
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center px-4 text-sm text-zinc-600 transition-colors hover:text-violet-600 active:text-violet-600 dark:text-gray-500 dark:hover:text-violet-400 dark:active:text-violet-400"
            >
              Skip for now →
            </Link>
          </div>
        </div>

        <p
          className={`animate-fade-in delay-400 mt-3 px-2 pb-safe text-center text-[11px] leading-relaxed text-zinc-500 sm:mt-6 sm:pb-0 sm:text-sm dark:text-gray-500 ${immersiveMobile ? 'max-sm:hidden' : ''}`}
        >
          Your face data is securely stored and used only for photo recognition at events
        </p>
      </div>
    </div>
  );
}
