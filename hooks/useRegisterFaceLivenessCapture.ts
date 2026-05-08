'use client';

import { useCallback, useRef, useState, type RefObject } from 'react';
import { captureFrameToWebpBase64, type FaceLandmarkerResultLike } from '@/hooks/useSmartSelfieCapture';
import {
  advanceBlinkFsm,
  advanceHeadTurnFsm,
  advanceSmileFsm,
  blendshapesToMap,
  challengePrompt,
  estimateHorizontalNoseOffset,
  evaluateMinimalPresence,
  evaluateRelaxedFraming,
  eyeBlinkScore,
  getRelaxedFramingHint,
  initBlinkFsm,
  initHeadTurnFsm,
  initSmileFsm,
  pickRandomChallenges,
  smileScore,
  type LivenessChallengeType,
} from '@/lib/faceLivenessChallenges';

export type RegistrationPhase = 'framing' | 'liveness' | 'stabilizing';

/** Shorter hold feels less tedious once framing is relaxed */
const STABLE_CAPTURE_MS = 1600;

/** Prefer WebP; some browsers return an empty payload — fall back to JPEG base64 for the parent handler */
function captureFrameWebpOrJpeg(video: HTMLVideoElement, webpQuality: number): string | null {
  const webp = captureFrameToWebpBase64(video, webpQuality);
  if (webp && webp.length > 64) return webp;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? null : dataUrl.slice(comma + 1);
}

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: (webpBase64: string) => void;
  stopMediaStream?: () => void;
  webpQuality?: number;
  stableDurationMs?: number;
  /** How many random prompts (blink / turn / smile) before the auto hold-to-capture */
  challengeCount?: number;
};

export function useRegisterFaceLivenessCapture({
  videoRef,
  onCapture,
  stopMediaStream,
  webpQuality = 0.92,
  stableDurationMs = STABLE_CAPTURE_MS,
  challengeCount = 3,
}: Options) {
  const [phase, setPhase] = useState<RegistrationPhase>('framing');
  const [statusMessage, setStatusMessage] = useState('Fit your face in the circle');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isFaceValid, setIsFaceValid] = useState(false);
  const [isCaptureComplete, setIsCaptureComplete] = useState(false);
  const [stableElapsedMs, setStableElapsedMs] = useState(0);
  const [challengeStep, setChallengeStep] = useState(0);
  const [challengeTotal, setChallengeTotal] = useState(0);

  const phaseRef = useRef<RegistrationPhase>('framing');
  const challengeIdxRef = useRef(0);

  const stableMsRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const capturedRef = useRef(false);
  const challengesRef = useRef<LivenessChallengeType[] | null>(null);

  const blinkFsmRef = useRef(initBlinkFsm());
  const headFsmRef = useRef(initHeadTurnFsm());
  const smileFsmRef = useRef(initSmileFsm());

  const setPhaseBoth = useCallback((next: RegistrationPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const resetFsmForChallenge = useCallback((_type: LivenessChallengeType) => {
    blinkFsmRef.current = initBlinkFsm();
    headFsmRef.current = initHeadTurnFsm();
    smileFsmRef.current = initSmileFsm();
  }, []);

  const reset = useCallback(() => {
    capturedRef.current = false;
    stableMsRef.current = 0;
    lastTsRef.current = null;
    phaseRef.current = 'framing';
    challengeIdxRef.current = 0;
    challengesRef.current = null;
    setPhase('framing');
    setIsCaptureComplete(false);
    setProgressPercentage(0);
    setStableElapsedMs(0);
    setStatusMessage('Fit your face in the circle');
    setIsFaceValid(false);
    setChallengeStep(0);
    setChallengeTotal(0);
    blinkFsmRef.current = initBlinkFsm();
    headFsmRef.current = initHeadTurnFsm();
    smileFsmRef.current = initSmileFsm();
  }, []);

  const advanceToNextChallengeOrStabilizing = useCallback(
    (seq: LivenessChallengeType[]) => {
      challengeIdxRef.current += 1;
      if (challengeIdxRef.current >= seq.length) {
        setPhaseBoth('stabilizing');
        setChallengeStep(seq.length);
        setStatusMessage('Almost there — hold still');
        stableMsRef.current = 0;
        setStableElapsedMs(0);
        setProgressPercentage(0);
        return;
      }
      const next = seq[challengeIdxRef.current];
      resetFsmForChallenge(next);
      setChallengeStep(challengeIdxRef.current + 1);
      setStatusMessage(challengePrompt(next));
    },
    [resetFsmForChallenge, setPhaseBoth]
  );

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
        setStatusMessage('Fit your face in the circle');
        phaseRef.current = 'framing';
        setPhase('framing');
        challengesRef.current = null;
        challengeIdxRef.current = 0;
        setChallengeStep(0);
        setChallengeTotal(0);
        return;
      }

      const landmarks = faces[0];
      const blendClassification = result.faceBlendshapes?.[0];
      const blendMap = blendshapesToMap(blendClassification);

      const p = phaseRef.current;

      if (p === 'framing') {
        stableMsRef.current = 0;
        setProgressPercentage(0);
        if (evaluateRelaxedFraming(landmarks)) {
          const seq = pickRandomChallenges(challengeCount);
          challengesRef.current = seq;
          challengeIdxRef.current = 0;
          setChallengeTotal(seq.length);
          setChallengeStep(1);
          resetFsmForChallenge(seq[0]);
          setPhaseBoth('liveness');
          setStatusMessage(challengePrompt(seq[0]));
          setIsFaceValid(true);
        } else {
          setIsFaceValid(false);
          setStatusMessage(getRelaxedFramingHint(landmarks));
        }
        return;
      }

      const seq = challengesRef.current;
      if (!seq?.length) {
        setPhaseBoth('framing');
        return;
      }

      if (p === 'liveness') {
        stableMsRef.current = 0;
        setProgressPercentage(0);
        const idx = challengeIdxRef.current;
        const current = seq[idx];
        if (!current) {
          setPhaseBoth('stabilizing');
          setStatusMessage('Almost there — hold still');
          return;
        }

        if (current === 'head_left' || current === 'head_right') {
          if (!evaluateMinimalPresence(landmarks)) {
            setIsFaceValid(false);
            setStatusMessage('Keep your face in view');
            return;
          }
          const rawOff = estimateHorizontalNoseOffset(landmarks);
          if (rawOff === null) return;
          /** Mirrored front camera: negate so “your left” matches what users see */
          const off = -rawOff;
          const dir = current === 'head_left' ? 'left' : 'right';
          const { fsm, completed } = advanceHeadTurnFsm(headFsmRef.current, off, dir);
          headFsmRef.current = fsm;
          setIsFaceValid(true);
          setStatusMessage(challengePrompt(current));
          if (completed) {
            headFsmRef.current = initHeadTurnFsm();
            advanceToNextChallengeOrStabilizing(seq);
          }
          return;
        }

        if (!evaluateRelaxedFraming(landmarks)) {
          setIsFaceValid(false);
          setStatusMessage(getRelaxedFramingHint(landmarks));
          return;
        }

        if (current === 'blink') {
          const b = eyeBlinkScore(blendMap);
          const { fsm, completed } = advanceBlinkFsm(blinkFsmRef.current, b);
          blinkFsmRef.current = fsm;
          setIsFaceValid(true);
          setStatusMessage(challengePrompt('blink'));
          if (completed) {
            blinkFsmRef.current = initBlinkFsm();
            advanceToNextChallengeOrStabilizing(seq);
          }
          return;
        }

        if (current === 'smile') {
          const s = smileScore(blendMap);
          const { fsm, completed } = advanceSmileFsm(smileFsmRef.current, s);
          smileFsmRef.current = fsm;
          setIsFaceValid(true);
          setStatusMessage(challengePrompt('smile'));
          if (completed) {
            smileFsmRef.current = initSmileFsm();
            advanceToNextChallengeOrStabilizing(seq);
          }
          return;
        }

        return;
      }

      if (p === 'stabilizing') {
        /**
         * Use the same relaxed framing as the first step — strict `evaluateFaceValidity`
         * (20–50% area, ±15°) blocked almost everyone after liveness, so the timer never
         * finished and `onCapture` never ran.
         */
        if (!evaluateRelaxedFraming(landmarks)) {
          stableMsRef.current = 0;
          setStableElapsedMs(0);
          setProgressPercentage(0);
          setIsFaceValid(false);
          setStatusMessage(getRelaxedFramingHint(landmarks));
          return;
        }

        setIsFaceValid(true);
        stableMsRef.current += deltaMs;
        const elapsed = stableMsRef.current;
        setStableElapsedMs(elapsed);
        setProgressPercentage(Math.min(100, (elapsed / stableDurationMs) * 100));
        setStatusMessage('Stay still…');

        if (elapsed >= stableDurationMs) {
          const video = videoRef.current;
          const base64 = video ? captureFrameWebpOrJpeg(video, webpQuality) : null;
          if (!base64) {
            stableMsRef.current = Math.max(0, stableDurationMs - 100);
            return;
          }
          capturedRef.current = true;
          setStatusMessage('Perfect!');
          setProgressPercentage(100);
          setIsCaptureComplete(true);
          stopMediaStream?.();
          onCapture(base64);
        }
      }
    },
    [
      advanceToNextChallengeOrStabilizing,
      challengeCount,
      onCapture,
      resetFsmForChallenge,
      setPhaseBoth,
      stableDurationMs,
      stopMediaStream,
      videoRef,
      webpQuality,
    ]
  );

  return {
    phase,
    statusMessage,
    progressPercentage,
    isFaceValid,
    isCaptureComplete,
    stableElapsedMs,
    challengeStep,
    challengeTotal,
    onFaceLandmarkerResults,
    reset,
  };
}
