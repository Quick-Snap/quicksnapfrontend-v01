import { photoApi } from '@/lib/api';

/**
 * Picks a browser-loadable image URL from heterogeneous API photo payloads.
 */
export function getPhotoDisplayUrl(photo: unknown): string | undefined {
    if (!photo || typeof photo !== 'object') return undefined;
    const p = photo as Record<string, unknown>;

    const pick = (v: unknown): string | undefined => {
        if (typeof v !== 'string') return undefined;
        const s = v.trim();
        return s.length > 0 ? s : undefined;
    };

    const candidates: unknown[] = [
        p.thumbnailUrl,
        p.thumbnail_url,
        p.url,
        p.s3Url,
        p.s3_url,
        p.imageUrl,
        p.image_url,
        p.publicUrl,
        p.public_url,
        p.fileUrl,
        p.file_url,
        p.src,
        p.cdnUrl,
        p.cdn_url,
        p.downloadUrl,
        p.download_url,
        p.previewUrl,
        p.preview_url,
    ];

    const urls = p.urls;
    if (urls && typeof urls === 'object') {
        const u = urls as Record<string, unknown>;
        candidates.push(u.thumbnail, u.thumb, u.small, u.medium, u.full, u.original, u.url);
    }
    const media = p.media;
    if (media && typeof media === 'object') {
        const m = media as Record<string, unknown>;
        candidates.push(m.url, m.thumbnailUrl, m.thumbnail_url, m.src);
    }

    for (const c of candidates) {
        const s = pick(c);
        if (s) return s;
    }

    const base =
        typeof process !== 'undefined'
            ? process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '')
            : undefined;
    if (base) {
        const keys = [
            p.publicKey,
            p.public_key,
            p.processedKey,
            p.processed_key,
            p.originalKey,
            p.original_key,
        ];
        for (const k of keys) {
            const key = pick(k);
            if (key) return `${base}/${key.replace(/^\//, '')}`;
        }
    }

    return undefined;
}

/**
 * When list endpoints omit URLs (e.g. `all=true` lean projection), merge in `/photos/:id` details.
 */
export async function enrichPhotosWithDisplayUrls(
    photos: any[],
    getPhotoId: (p: any) => string
): Promise<any[]> {
    const missing = photos.filter((p) => !getPhotoDisplayUrl(p) && getPhotoId(p));
    if (missing.length === 0) return photos;

    const max = 120;
    const toFetch = missing.slice(0, max);

    const results = await Promise.all(
        toFetch.map(async (p) => {
            const id = getPhotoId(p);
            let merged: any = null;

            try {
                const res = (await photoApi.getPhotoDetails(id)) as { data?: unknown };
                let detail: unknown = res?.data;
                if (
                    detail &&
                    typeof detail === 'object' &&
                    detail !== null &&
                    'photo' in detail &&
                    typeof (detail as { photo?: unknown }).photo === 'object' &&
                    (detail as { photo?: unknown }).photo !== null
                ) {
                    detail = (detail as { photo: unknown }).photo;
                }
                if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
                    merged = { ...p, ...(detail as Record<string, unknown>) };
                }
            } catch {
                /* details may 403/404 for some roles */
            }

            if (merged && getPhotoDisplayUrl(merged)) {
                return { id, merged };
            }

            try {
                const dl = (await photoApi.downloadPhoto(id)) as { data?: { url?: string } };
                const url = dl?.data?.url?.trim();
                if (url) {
                    return { id, merged: { ...p, ...(merged || {}), url } };
                }
            } catch {
                /* download URL may be unavailable */
            }

            return { id, merged };
        })
    );

    const mergedById = new Map<string, any>();
    for (const r of results) {
        if (r.merged) mergedById.set(r.id, r.merged);
    }

    return photos.map((p) => {
        const id = getPhotoId(p);
        return mergedById.get(id) ?? p;
    });
}
