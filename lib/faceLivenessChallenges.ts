import { estimateFacePose, type NormalizedLandmark } from '@/hooks/useSmartSelfieCapture';

/** Wider than strict enrollment — match “keep face in the oval”, not pixel-perfect center */
const CENTER_TOLERANCE = 0.22;
/** Yaw/roll — keep roughly facing the camera */
const MAX_YAW_ROLL_DEG_FRAMING = 32;
/**
 * Pitch estimate often reads high for neutral gaze; a dedicated looser cap avoids forcing chin-up.
 */
const MAX_PITCH_DEG_FRAMING = 44;
/** Only reject tiny partial faces — distance (too close/far) is intentionally not enforced */
export const FRAMING_MIN_AREA = 0.04;
export const FRAMING_MAX_AREA = 0.95;

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
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    area: w * h,
  };
}

/** Enough face visible & centered to start liveness (not as strict as final snapshot) */
export function evaluateRelaxedFraming(landmarks: NormalizedLandmark[]): boolean {
  const bbox = computeFaceBoundingBox(landmarks);
  const pose = estimateFacePose(landmarks);
  const centered =
    Math.abs(bbox.centerX - 0.5) <= CENTER_TOLERANCE && Math.abs(bbox.centerY - 0.5) <= CENTER_TOLERANCE;
  const sizeOk = bbox.area >= FRAMING_MIN_AREA && bbox.area <= FRAMING_MAX_AREA;
  const anglesOk =
    pose !== null &&
    pose.yawDeg < MAX_YAW_ROLL_DEG_FRAMING &&
    pose.pitchDeg < MAX_PITCH_DEG_FRAMING &&
    pose.rollDeg < MAX_YAW_ROLL_DEG_FRAMING;
  return centered && sizeOk && anglesOk;
}

/** While turning head, yaw checks fail — only ensure the face is still detectable */
export function evaluateMinimalPresence(landmarks: NormalizedLandmark[]): boolean {
  const bbox = computeFaceBoundingBox(landmarks);
  return bbox.area >= 0.07 && bbox.area <= 0.62;
}

export function getRelaxedFramingHint(landmarks: NormalizedLandmark[]): string {
  const bbox = computeFaceBoundingBox(landmarks);
  const pose = estimateFacePose(landmarks);
  if (bbox.area < FRAMING_MIN_AREA) return 'Move a bit closer';
  if (bbox.area > FRAMING_MAX_AREA) return 'Step back slightly';
  if (Math.abs(bbox.centerX - 0.5) > CENTER_TOLERANCE || Math.abs(bbox.centerY - 0.5) > CENTER_TOLERANCE) {
    return 'Align your face with the circle';
  }
  if (
    pose !== null &&
    (pose.yawDeg >= MAX_YAW_ROLL_DEG_FRAMING ||
      pose.pitchDeg >= MAX_PITCH_DEG_FRAMING ||
      pose.rollDeg >= MAX_YAW_ROLL_DEG_FRAMING)
  ) {
    return 'Face the camera straight on';
  }
  return 'Hold steady';
}

/** MediaPipe Face Landmarker ARKit-style blendshape names vary slightly by build */
export type BlendshapeMap = Record<string, number>;

export type LivenessChallengeType = 'blink' | 'head_left' | 'head_right' | 'smile';

export function pickRandomChallenges(count = 3): LivenessChallengeType[] {
  const pool: LivenessChallengeType[] = ['blink', 'head_left', 'head_right', 'smile'];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

export function challengePrompt(type: LivenessChallengeType): string {
  switch (type) {
    case 'blink':
      return 'Blink your eyes once';
    case 'head_left':
      return 'Turn your head slightly to the left';
    case 'head_right':
      return 'Turn your head slightly to the right';
    case 'smile':
      return 'Smile for a moment';
    default:
      return 'Follow the prompt';
  }
}

export function blendshapesToMap(classifications: { categories?: { categoryName?: string; score: number }[] } | undefined): BlendshapeMap {
  const m: BlendshapeMap = {};
  if (!classifications?.categories) return m;
  for (const c of classifications.categories) {
    const name = c.categoryName;
    if (name) m[name] = c.score;
  }
  return m;
}

function maxKeyScores(m: BlendshapeMap, predicates: ((k: string) => boolean)[]): number {
  let mx = 0;
  const keys = Object.keys(m);
  for (const k of keys) {
    if (predicates.some((p) => p(k))) mx = Math.max(mx, m[k]);
  }
  return mx;
}

/** Eye blink closure score (0–1) */
export function eyeBlinkScore(m: BlendshapeMap): number {
  const direct = Math.max(
    m.eyeBlinkLeft ?? 0,
    m.eyeBlinkRight ?? 0,
    m.eyeBlink_L ?? 0,
    m.eyeBlink_R ?? 0,
    m['eyeBlink_L'] ?? 0,
    m['eyeBlink_R'] ?? 0
  );
  if (direct > 0) return direct;
  return maxKeyScores(m, [(k) => /blink/i.test(k) && /eye/i.test(k)]);
}

/** Smile intensity */
export function smileScore(m: BlendshapeMap): number {
  const direct = Math.max(
    m.mouthSmileLeft ?? 0,
    m.mouthSmileRight ?? 0,
    m.mouthSmile_L ?? 0,
    m.mouthSmile_R ?? 0
  );
  if (direct > 0) return direct;
  return maxKeyScores(m, [(k) => /smile/i.test(k) && /mouth/i.test(k)]);
}

/**
 * Normalized horizontal nose shift vs eye line. Negative ≈ nose moves left in image (mirrored selfie: often “turn head left”).
 */
export function estimateHorizontalNoseOffset(landmarks: NormalizedLandmark[]): number | null {
  const L = 33;
  const R = 263;
  const N = 1;
  if (landmarks.length <= Math.max(L, R, N)) return null;
  const le = landmarks[L];
  const re = landmarks[R];
  const nose = landmarks[N];
  const eyeMidX = (le.x + re.x) / 2;
  const halfWidth = Math.max(Math.abs(re.x - le.x) / 2, 1e-4);
  return (nose.x - eyeMidX) / halfWidth;
}

export type BlinkFsm = {
  stage: 'need_closed' | 'need_open';
};

export function initBlinkFsm(): BlinkFsm {
  return { stage: 'need_closed' };
}

/** One clear blink: eyelids close then open again */
export function advanceBlinkFsm(fsm: BlinkFsm, blink: number): { fsm: BlinkFsm; completed: boolean } {
  const closed = blink > 0.52;
  const open = blink < 0.38;

  if (fsm.stage === 'need_closed') {
    if (closed) return { fsm: { stage: 'need_open' }, completed: false };
    return { fsm, completed: false };
  }

  if (open) return { fsm: initBlinkFsm(), completed: true };
  return { fsm, completed: false };
}

export type HeadTurnFsm = {
  sawPastThreshold: boolean;
  stableFrames: number;
};

export function initHeadTurnFsm(): HeadTurnFsm {
  return { sawPastThreshold: false, stableFrames: 0 };
}

/** Detect turn in requested direction; complete after threshold hit + brief hold */
export function advanceHeadTurnFsm(
  fsm: HeadTurnFsm,
  offset: number,
  direction: 'left' | 'right',
  threshold = 0.22,
  holdFrames = 5
): { fsm: HeadTurnFsm; completed: boolean } {
  const passed =
    direction === 'left' ? offset <= -threshold : offset >= threshold;

  if (!fsm.sawPastThreshold) {
    if (passed) return { fsm: { sawPastThreshold: true, stableFrames: 1 }, completed: false };
    return { fsm, completed: false };
  }

  if (passed) {
    const nf = fsm.stableFrames + 1;
    if (nf >= holdFrames) return { fsm: initHeadTurnFsm(), completed: true };
    return { fsm: { sawPastThreshold: true, stableFrames: nf }, completed: false };
  }

  return { fsm: { sawPastThreshold: true, stableFrames: 0 }, completed: false };
}

export type SmileFsm = { peakFrames: number }

export function initSmileFsm(): SmileFsm {
  return { peakFrames: 0 };
}

export function advanceSmileFsm(fsm: SmileFsm, smile: number, threshold = 0.32, needFrames = 5): { fsm: SmileFsm; completed: boolean } {
  if (smile >= threshold) {
    const nf = fsm.peakFrames + 1;
    if (nf >= needFrames) return { fsm: initSmileFsm(), completed: true };
    return { fsm: { peakFrames: nf }, completed: false };
  }
  return { fsm: initSmileFsm(), completed: false };
}
