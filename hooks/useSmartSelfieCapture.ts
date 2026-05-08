'use client';

import { useCallback, useRef, useState, type RefObject } from 'react';

/** Normalized viewport coordinates (0–1), compatible with MediaPipe Face Landmarker output */
export type NormalizedLandmark = { x: number; y: number; z?: number };

/** Subset of `FaceLandmarkerResult` — avoids requiring `@mediapipe/tasks-vision` at compile time */
export type FaceLandmarkerResultLike = {
  faceLandmarks?: NormalizedLandmark[][];
  /** Present when FaceLandmarker is created with `outputFaceBlendshapes: true` */
  faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[];
};

/** MediaPipe Face Mesh–compatible indices (also used by Face Landmarker task) */
const LM = {
  NOSE_TIP: 1,
  FOREHEAD: 10,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  CHIN: 152,
  NOSE_BRIDGE: 168,
  LEFT_FACE_OVAL: 234,
  RIGHT_FACE_OVAL: 454,
} as const;

export const STABLE_CAPTURE_MS = 2000;
const CENTER_TOLERANCE = 0.1;
const MAX_ANGLE_DEG = 15;
const MIN_FACE_AREA = 0.2;
const MAX_FACE_AREA = 0.5;

function dist2(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function computeFaceBoundingBox(landmarks: NormalizedLandmark[]) {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of landmarks) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: w,
    height: h,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    area: w * h,
  };
}

/** Roll: tilt of the line joining the outer eye corners (degrees, 0 = level). */
function estimateRollDeg(leftEye: NormalizedLandmark, rightEye: NormalizedLandmark): number {
  return (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;
}

/**
 * Yaw: asymmetry of nose-bridge distance to left vs. right face boundary landmarks,
 * combined with nose vs. eye-midpoint horizontal offset for stability.
 */
function estimateYawDeg(
  landmarks: NormalizedLandmark[],
  noseBridge: NormalizedLandmark,
  leftBoundary: NormalizedLandmark,
  rightBoundary: NormalizedLandmark,
  noseTip: NormalizedLandmark,
  leftEye: NormalizedLandmark,
  rightEye: NormalizedLandmark
): number {
  const dLeft = dist2(noseBridge, leftBoundary);
  const dRight = dist2(noseBridge, rightBoundary);
  const sum = dLeft + dRight + 1e-6;
  const earAsymDeg = (Math.abs(dRight - dLeft) / sum) * 90;

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const interocular = Math.max(dist2(leftEye, rightEye), 1e-6);
  const noseOffsetDeg =
    (Math.atan2(Math.abs(noseTip.x - eyeMidX), interocular * 0.5) * 180) / Math.PI;

  return Math.max(earAsymDeg, noseOffsetDeg);
}

/**
 * Pitch: imbalance between nose–forehead vs. nose–chin distances (vertical gaze proxy).
 */
function estimatePitchDeg(
  nose: NormalizedLandmark,
  forehead: NormalizedLandmark,
  chin: NormalizedLandmark,
  leftEye: NormalizedLandmark,
  rightEye: NormalizedLandmark
): number {
  const dFore = dist2(nose, forehead);
  const dChin = dist2(nose, chin);
  const denom = dFore + dChin + 1e-6;
  const verticalImbalanceDeg = (Math.abs(dChin - dFore) / denom) * 90;

  const eyeMidY = (leftEye.y + rightEye.y) / 2;
  const faceSpanY = Math.max(Math.abs(chin.y - forehead.y), 1e-6);
  const noseVsEyesDeg =
    (Math.atan2(Math.abs(nose.y - eyeMidY), faceSpanY * 0.5) * 180) / Math.PI;

  return Math.max(verticalImbalanceDeg, noseVsEyesDeg);
}

export type FacePoseEstimate = {
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
};

export function estimateFacePose(landmarks: NormalizedLandmark[]): FacePoseEstimate | null {
  const need = Math.max(
    LM.RIGHT_FACE_OVAL,
    LM.LEFT_FACE_OVAL,
    LM.NOSE_BRIDGE,
    LM.NOSE_TIP,
    LM.FOREHEAD,
    LM.CHIN,
    LM.LEFT_EYE_OUTER,
    LM.RIGHT_EYE_OUTER
  );
  if (landmarks.length <= need) return null;

  const leftEye = landmarks[LM.LEFT_EYE_OUTER];
  const rightEye = landmarks[LM.RIGHT_EYE_OUTER];
  const noseTip = landmarks[LM.NOSE_TIP];
  const noseBridge = landmarks[LM.NOSE_BRIDGE];
  const forehead = landmarks[LM.FOREHEAD];
  const chin = landmarks[LM.CHIN];
  const leftEar = landmarks[LM.LEFT_FACE_OVAL];
  const rightEar = landmarks[LM.RIGHT_FACE_OVAL];

  const yawDeg = estimateYawDeg(landmarks, noseBridge, leftEar, rightEar, noseTip, leftEye, rightEye);
  const pitchDeg = estimatePitchDeg(noseTip, forehead, chin, leftEye, rightEye);
  const rollDeg = Math.abs(estimateRollDeg(leftEye, rightEye));

  return { yawDeg, pitchDeg, rollDeg };
}

export type ValidationBreakdown = {
  hasFace: boolean;
  centered: boolean;
  anglesOk: boolean;
  sizeOk: boolean;
  tooSmall: boolean;
  tooLarge: boolean;
  area: number;
};

export function evaluateFaceValidity(
  landmarks: NormalizedLandmark[]
): { valid: boolean; pose: FacePoseEstimate | null; bbox: ReturnType<typeof computeFaceBoundingBox>; breakdown: ValidationBreakdown } {
  const bbox = computeFaceBoundingBox(landmarks);
  const pose = estimateFacePose(landmarks);

  const centered =
    Math.abs(bbox.centerX - 0.5) <= CENTER_TOLERANCE &&
    Math.abs(bbox.centerY - 0.5) <= CENTER_TOLERANCE;

  const tooSmall = bbox.area < MIN_FACE_AREA;
  const tooLarge = bbox.area > MAX_FACE_AREA;
  const sizeOk = !tooSmall && !tooLarge;

  const anglesOk =
    pose !== null && pose.yawDeg < MAX_ANGLE_DEG && pose.pitchDeg < MAX_ANGLE_DEG && pose.rollDeg < MAX_ANGLE_DEG;

  const hasFace = true;
  const valid = centered && anglesOk && sizeOk;

  return {
    valid,
    pose,
    bbox,
    breakdown: {
      hasFace,
      centered,
      anglesOk: pose !== null && anglesOk,
      sizeOk,
      tooSmall,
      tooLarge,
      area: bbox.area,
    },
  };
}

function resolveStatusMessage(breakdown: ValidationBreakdown): string {
  if (!breakdown.hasFace) return 'Center your face';
  if (breakdown.tooSmall) return 'Move Closer';
  if (breakdown.tooLarge) return 'Move Back';
  if (!breakdown.centered) return 'Center your face';
  if (!breakdown.anglesOk) return 'Look straight at the camera';
  return 'Stay still...';
}

/** Status line for strict framing (final capture) */
export function getStrictFramingMessage(landmarks: NormalizedLandmark[]): string {
  const { breakdown } = evaluateFaceValidity(landmarks);
  return resolveStatusMessage(breakdown);
}

/**
 * Grab current frame from `<video>`, draw off-screen, return high-quality WebP as raw base64 (no data URL prefix).
 */
export function captureFrameToWebpBase64(video: HTMLVideoElement, quality = 0.92): string | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/webp', quality);
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return null;
  return dataUrl.slice(comma + 1);
}

/** Alias — draws `<video>` to an off-screen canvas and returns WebP raw base64 */
export const captureFrame = captureFrameToWebpBase64;

export type UseSmartSelfieCaptureOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Called once with WebP payload (raw base64) after stable capture */
  onCapture: (webpBase64: string) => void;
  /** Stop `requestAnimationFrame` / landmarker loop */
  onStopDetection?: () => void;
  /** Stop camera tracks (e.g. from parent `MediaStream`) */
  stopMediaStream?: () => void;
  webpQuality?: number;
  stableDurationMs?: number;
};

export type UseSmartSelfieCaptureReturn = {
  statusMessage: string;
  progressPercentage: number;
  isFaceValid: boolean;
  isCaptureComplete: boolean;
  stableElapsedMs: number;
  /** Wire this to Face Landmarker `onResults` / `detectForVideo` completion */
  onFaceLandmarkerResults: (result: FaceLandmarkerResultLike, timestampMs?: number) => void;
  reset: () => void;
};

export function useSmartSelfieCapture({
  videoRef,
  onCapture,
  onStopDetection,
  stopMediaStream,
  webpQuality = 0.92,
  stableDurationMs = STABLE_CAPTURE_MS,
}: UseSmartSelfieCaptureOptions): UseSmartSelfieCaptureReturn {
  const [statusMessage, setStatusMessage] = useState('Center your face');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isCaptureComplete, setIsCaptureComplete] = useState(false);
  const [isFaceValid, setIsFaceValid] = useState(false);
  const [stableElapsedMs, setStableElapsedMs] = useState(0);

  const stableMsRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const capturedRef = useRef(false);

  const reset = useCallback(() => {
    capturedRef.current = false;
    stableMsRef.current = 0;
    lastTsRef.current = null;
    setIsCaptureComplete(false);
    setProgressPercentage(0);
    setStableElapsedMs(0);
    setStatusMessage('Center your face');
    setIsFaceValid(false);
  }, []);

  const onFaceLandmarkerResults = useCallback(
    (result: FaceLandmarkerResultLike, timestampMs?: number) => {
      if (capturedRef.current) return;

      const now = timestampMs ?? performance.now();
      let deltaMs = 0;
      if (lastTsRef.current !== null) {
        deltaMs = Math.min(Math.max(now - lastTsRef.current, 0), 250);
      }
      lastTsRef.current = now;

      const faces = result.faceLandmarks;
      if (!faces || faces.length === 0) {
        stableMsRef.current = 0;
        setStableElapsedMs(0);
        setProgressPercentage(0);
        setIsFaceValid(false);
        setStatusMessage('Center your face');
        return;
      }

      const landmarks = faces[0];
      const { valid, breakdown } = evaluateFaceValidity(landmarks);

      if (!valid) {
        stableMsRef.current = 0;
        setStableElapsedMs(0);
        setProgressPercentage(0);
        setIsFaceValid(false);
        setStatusMessage(resolveStatusMessage(breakdown));
        return;
      }

      setIsFaceValid(true);
      stableMsRef.current += deltaMs;
      const elapsed = stableMsRef.current;
      setStableElapsedMs(elapsed);
      const pct = Math.min(100, (elapsed / stableDurationMs) * 100);
      setProgressPercentage(pct);
      setStatusMessage('Stay still...');

      if (elapsed >= stableDurationMs) {
        const video = videoRef.current;
        const base64 = video ? captureFrameToWebpBase64(video, webpQuality) : null;
        if (!base64) {
          stableMsRef.current = Math.max(0, stableDurationMs - 100);
          return;
        }

        capturedRef.current = true;
        setStatusMessage('Perfect!');
        setProgressPercentage(100);
        setIsCaptureComplete(true);

        stopMediaStream?.();
        onStopDetection?.();
        onCapture(base64);
      }
    },
    [onCapture, onStopDetection, stableDurationMs, stopMediaStream, videoRef, webpQuality]
  );

  return {
    statusMessage,
    progressPercentage,
    isFaceValid,
    isCaptureComplete,
    stableElapsedMs,
    onFaceLandmarkerResults,
    reset,
  };
}
