import { ApiResponse } from '@/types';
import { eventApi, photoApi } from '@/lib/api';

const PAGE_SIZE = 250;

/** Align with event page — supports several API envelope shapes. */
export function normalizePhotosFromGet(res: unknown): any[] {
  if (!res) return [];
  const r = res as Record<string, unknown>;
  const d = r.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object' && Array.isArray((d as { photos?: unknown }).photos)) {
    return (d as { photos: any[] }).photos;
  }
  if (
    d &&
    typeof d === 'object' &&
    (d as { data?: { photos?: unknown } }).data &&
    Array.isArray((d as { data: { photos?: unknown } }).data.photos)
  ) {
    return (d as { data: { photos: any[] } }).data.photos;
  }
  if (Array.isArray(r.photos)) return r.photos as any[];
  return [];
}

function flattenGroupedPhotos(photos: any[]): any[] {
  if (!photos.length) return photos;
  const first = photos[0];
  if (first && typeof first === 'object' && Array.isArray(first.photos)) {
    return photos.flatMap((g: { photos?: any[] }) => g.photos || []);
  }
  return photos;
}

export function normalizeEventPhotosPayload(res: unknown): any[] {
  return flattenGroupedPhotos(normalizePhotosFromGet(res));
}

export function extractMyPhotosTotal(res: ApiResponse<any> | undefined): number | undefined {
  const total = res?.data?.pagination?.total;
  return typeof total === 'number' && !Number.isNaN(total) ? total : undefined;
}

function getPhotoUniqueId(photo: { _id?: string; imageId?: string }): string | undefined {
  const id = photo._id ?? photo.imageId;
  return id != null ? String(id) : undefined;
}

export function mergePhotosDeduped(existing: any[], batch: any[]): any[] {
  const seen = new Set(existing.map((p) => getPhotoUniqueId(p)).filter(Boolean) as string[]);
  const merged = [...existing];
  for (const photo of batch) {
    const id = getPhotoUniqueId(photo);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(photo);
  }
  return merged;
}

function serializeLastKey(lastKey: unknown): string | undefined {
  if (lastKey == null) return undefined;
  if (typeof lastKey === 'string') return lastKey.trim() || undefined;
  try {
    return JSON.stringify(lastKey);
  } catch {
    return undefined;
  }
}

export function extractNextLastKey(pagination: { lastKey?: unknown } | undefined): string | undefined {
  if (!pagination || !('lastKey' in pagination)) return undefined;
  return serializeLastKey(pagination.lastKey);
}

export function extractEventPhotosTotal(res: unknown): number | undefined {
  if (!res || typeof res !== 'object') return undefined;
  const r = res as Record<string, unknown>;
  const tryNum = (v: unknown) =>
    typeof v === 'number' && !Number.isNaN(v) && v >= 0 ? v : undefined;

  const d = r.data;
  const candidates: unknown[] = [
    r.total,
    r.totalCount,
    r.count,
    d && typeof d === 'object' ? (d as Record<string, unknown>).total : undefined,
    d && typeof d === 'object' ? (d as Record<string, unknown>).totalCount : undefined,
    d && typeof d === 'object' ? (d as Record<string, unknown>).count : undefined,
    d &&
    typeof d === 'object' &&
    'pagination' in d &&
    typeof (d as { pagination?: { total?: number } }).pagination?.total === 'number'
      ? (d as { pagination: { total: number } }).pagination.total
      : undefined,
    (r.pagination as { total?: number } | undefined)?.total,
  ];
  for (const c of candidates) {
    const n = tryNum(c);
    if (n !== undefined) return n;
  }
  return undefined;
}

export interface ProgressiveBatchEvent<T = any> {
  photos: T[];
  total: number;
  hasMore: boolean;
  isInitial: boolean;
}

export interface ProgressiveFetchOptions {
  all?: boolean;
  isLiveWall?: boolean;
  initialLimit?: number;
  batchLimit?: number;
  onBatch?: (data: ProgressiveBatchEvent) => void;
}

/**
 * Hybrid Progressive Event Photo Fetching:
 * 1. Fetches an initial batch (e.g. 24 or 36 photos) immediately for sub-100ms first paint.
 * 2. If onBatch callback is provided and more photos exist, continues fetching subsequent batches
 *    in the background and streaming them without blocking the UI.
 */
export async function fetchEventPhotosProgressive(
  eventId: string,
  options?: ProgressiveFetchOptions
): Promise<any> {
  const initialLimit = options?.initialLimit ?? 24;
  const batchLimit = options?.batchLimit ?? 48;

  // 1. Initial fast fetch
  const initialRes = await eventApi.getPhotos(eventId, {
    all: options?.all ?? false,
    isLiveWall: options?.isLiveWall ?? false,
    limit: initialLimit,
  });

  const initialBatch = normalizeEventPhotosPayload(initialRes);
  const explicitTotal = extractEventPhotosTotal(initialRes);

  const responseRecord = initialRes as unknown as Record<string, unknown> | undefined;
  const dataBlock = responseRecord?.data as Record<string, unknown> | undefined;
  const pagination =
    (dataBlock?.pagination as { pages?: number; lastKey?: unknown } | undefined) ??
    (responseRecord?.pagination as { pages?: number; lastKey?: unknown } | undefined);

  let cursor = extractNextLastKey(pagination);
  let hasMore = Boolean(cursor);

  if (options?.onBatch) {
    options.onBatch({
      photos: initialBatch,
      total: explicitTotal ?? initialBatch.length,
      hasMore,
      isInitial: true,
    });
  }

  // 2. Background streaming if hasMore and callback provided
  if (hasMore && options?.onBatch && cursor) {
    (async () => {
      let allPhotos = [...initialBatch];
      let prevCursor: string | undefined;

      while (cursor) {
        if (cursor === prevCursor) break;
        prevCursor = cursor;

        // Yield slightly so browser UI remains completely responsive
        await new Promise((r) => setTimeout(r, 60));

        try {
          const nextRes = await eventApi.getPhotos(eventId, {
            all: options?.all ?? false,
            isLiveWall: options?.isLiveWall ?? false,
            limit: batchLimit,
            lastKey: cursor,
          });

          const nextBatch = normalizeEventPhotosPayload(nextRes);
          if (!nextBatch.length) break;

          allPhotos = mergePhotosDeduped(allPhotos, nextBatch);

          const nextRec = nextRes as unknown as Record<string, unknown> | undefined;
          const nextData = nextRec?.data as Record<string, unknown> | undefined;
          const nextPag =
            (nextData?.pagination as { lastKey?: unknown } | undefined) ??
            (nextRec?.pagination as { lastKey?: unknown } | undefined);

          cursor = extractNextLastKey(nextPag);
          const more = Boolean(cursor);

          options.onBatch!({
            photos: allPhotos,
            total: explicitTotal ?? allPhotos.length,
            hasMore: more,
            isInitial: false,
          });

          if (!more) break;
        } catch (err) {
          console.warn('Progressive background photo fetch interrupted:', err);
          break;
        }
      }
    })().catch((err) => console.error('Background fetch runner error:', err));
  }

  return {
    ...(initialRes && typeof initialRes === 'object' ? initialRes : {}),
    success: (initialRes as ApiResponse<unknown> | undefined)?.success ?? true,
    data: {
      photos: initialBatch,
      total: explicitTotal,
      pagination: { total: explicitTotal, hasMore, limit: initialLimit, lastKey: cursor },
    },
  };
}

/**
 * Hybrid Progressive My-Photos Fetching:
 * Fetches initial 24 photos immediately, then streams remaining photos in the background.
 */
export async function fetchMyPhotosProgressive(
  params?: { eventId?: string },
  options?: {
    initialLimit?: number;
    batchLimit?: number;
    onBatch?: (data: ProgressiveBatchEvent) => void;
  }
): Promise<ApiResponse<{ photos: any[]; pagination: { total: number } }>> {
  const initialLimit = options?.initialLimit ?? 24;
  const batchLimit = options?.batchLimit ?? 48;

  const initialRes = await photoApi.getMyPhotos({
    ...params,
    limit: initialLimit,
    all: true,
  });

  const initialBatch: any[] = initialRes.data?.photos ?? [];
  const pagination = initialRes.data?.pagination;
  const explicitTotal = extractMyPhotosTotal(initialRes);

  let cursor = extractNextLastKey(pagination);
  let hasMore = Boolean(cursor);

  if (options?.onBatch) {
    options.onBatch({
      photos: initialBatch,
      total: explicitTotal ?? initialBatch.length,
      hasMore,
      isInitial: true,
    });
  }

  if (hasMore && options?.onBatch && cursor) {
    (async () => {
      let allPhotos = [...initialBatch];
      let prevCursor: string | undefined;

      while (cursor) {
        if (cursor === prevCursor) break;
        prevCursor = cursor;

        await new Promise((r) => setTimeout(r, 60));

        try {
          const nextRes = await photoApi.getMyPhotos({
            ...params,
            limit: batchLimit,
            all: true,
            lastKey: cursor,
          });

          const nextBatch: any[] = nextRes.data?.photos ?? [];
          if (!nextBatch.length) break;

          allPhotos = mergePhotosDeduped(allPhotos, nextBatch);
          const nextPagination = nextRes.data?.pagination;
          cursor = extractNextLastKey(nextPagination);
          const more = Boolean(cursor);

          options.onBatch!({
            photos: allPhotos,
            total: explicitTotal ?? allPhotos.length,
            hasMore: more,
            isInitial: false,
          });

          if (!more) break;
        } catch (err) {
          console.warn('Progressive background my-photos fetch interrupted:', err);
          break;
        }
      }
    })().catch((err) => console.error('Background my-photos runner error:', err));
  }

  return {
    success: initialRes?.success ?? true,
    data: {
      photos: initialBatch,
      pagination: { total: explicitTotal ?? initialBatch.length },
    },
  };
}

/** Fetch every my-photo (no cap) by paging until the API reports no more. */
export async function fetchAllMyPhotos(params?: {
  eventId?: string;
}): Promise<ApiResponse<{ photos: any[]; pagination: { total: number } }>> {
  let photos: any[] = [];
  let page = 1;
  let cursor: string | undefined;
  let prevCursor: string | undefined;
  let lastResponse: ApiResponse<any> | undefined;
  let apiTotal: number | undefined;

  for (;;) {
    const response = await photoApi.getMyPhotos({
      ...params,
      limit: PAGE_SIZE,
      all: true,
      ...(cursor ? { lastKey: cursor } : { page }),
    });
    lastResponse = response;
    const batch: any[] = response.data?.photos ?? [];
    const pagination = response.data?.pagination;
    const batchTotal = extractMyPhotosTotal(response);
    if (batchTotal != null) apiTotal = batchTotal;

    photos = mergePhotosDeduped(photos, batch);

    if (!batch.length) break;
    if (apiTotal != null && photos.length >= apiTotal) break;

    const nextCursor = extractNextLastKey(pagination);
    if (nextCursor) {
      if (nextCursor === prevCursor) break;
      prevCursor = nextCursor;
      cursor = nextCursor;
      continue;
    }

    if (pagination && pagination.pages === undefined) {
      break;
    }

    if (pagination?.pages != null && page >= pagination.pages) break;
    if (!pagination && batch.length < PAGE_SIZE) break;
    page++;
  }

  const total = photos.length;

  return {
    success: lastResponse?.success ?? true,
    data: {
      photos,
      pagination: { total },
    },
  };
}

/** Fetch every event photo (no cap) by paging until the API reports no more. */
export async function fetchAllEventPhotos(
  eventId: string,
  options?: { all?: boolean; isLiveWall?: boolean }
): Promise<unknown> {
  let page = 1;
  let cursor: string | undefined;
  let prevCursor: string | undefined;
  const photos: any[] = [];
  let lastResponse: unknown;

  for (;;) {
    const response = await eventApi.getPhotos(eventId, {
      all: options?.all ?? false,
      isLiveWall: options?.isLiveWall ?? false,
      limit: PAGE_SIZE,
      ...(cursor ? { lastKey: cursor } : { page }),
    });
    lastResponse = response;
    const batch = normalizeEventPhotosPayload(response);
    photos.push(...batch);

    const total = extractEventPhotosTotal(response);
    if (!batch.length) break;
    if (total != null && photos.length >= total) break;

    const responseRecord = response as unknown as Record<string, unknown> | undefined;
    const dataBlock = responseRecord?.data as Record<string, unknown> | undefined;
    const pagination =
      (dataBlock?.pagination as { pages?: number; lastKey?: unknown } | undefined) ??
      (responseRecord?.pagination as { pages?: number; lastKey?: unknown } | undefined);

    const nextCursor = extractNextLastKey(pagination);
    if (nextCursor) {
      if (nextCursor === prevCursor) break;
      prevCursor = nextCursor;
      cursor = nextCursor;
      continue;
    }

    if (pagination && (pagination as { pages?: number }).pages === undefined) {
      break;
    }

    const pages =
      pagination && typeof pagination === 'object' && 'pages' in pagination
        ? (pagination as { pages: number }).pages
        : undefined;

    if (pages != null && page >= pages) break;
    if (!pages && batch.length < PAGE_SIZE) break;
    page++;
  }

  const total = extractEventPhotosTotal(lastResponse) ?? photos.length;

  return {
    ...(lastResponse && typeof lastResponse === 'object' ? lastResponse : {}),
    success: (lastResponse as ApiResponse<unknown> | undefined)?.success ?? true,
    data: {
      photos,
      total,
      pagination: { total, pages: 1, page: 1, limit: photos.length },
    },
  };
}
