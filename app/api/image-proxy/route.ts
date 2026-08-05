import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOST_SUFFIXES = ['.cloudfront.net', '.amazonaws.com'];

function isAllowedImageUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;

  const host = parsed.hostname.toLowerCase();
  if (ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix))) {
    return parsed;
  }

  for (const envKey of ['NEXT_PUBLIC_MEDIA_BASE_URL', 'NEXT_PUBLIC_API_URL'] as const) {
    const base = process.env[envKey];
    if (!base) continue;
    try {
      if (host === new URL(base).hostname.toLowerCase()) return parsed;
    } catch {
      /* ignore bad env */
    }
  }

  return null;
}

/**
 * Same-origin proxy for CDN photos so WebGL (MorphSlider) can sample textures.
 * CloudFront often omits ACAO, which taints cross-origin Image bitmaps.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) {
    return NextResponse.json({ message: 'Missing url' }, { status: 400 });
  }

  const target = isAllowedImageUrl(raw);
  if (!target) {
    return NextResponse.json({ message: 'Host not allowed' }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.href, {
      headers: {
        Accept: 'image/*,*/*',
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
      },
      // Photos may be signed; avoid long sticky caches.
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { message: `Upstream ${upstream.status}` },
        { status: upstream.status === 404 ? 404 : 502 }
      );
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
      return NextResponse.json({ message: 'Not an image' }, { status: 415 });
    }

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType.startsWith('image/') ? contentType : 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        // Allow canvas/WebGL to read this same-origin response
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[image-proxy]', err);
    return NextResponse.json({ message: 'Proxy failed' }, { status: 502 });
  }
}
