import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(
  /\/$/,
  ''
);

/**
 * Proxies bulk ZIP download server-side to avoid browser CORS on api.quicksnap.online.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = `${API_BASE}/photos/my-photos/download`;

  let backendRes: Response;
  try {
    backendRes = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[my-photos/download proxy] upstream fetch failed:', err);
    return NextResponse.json(
      { success: false, message: 'Could not reach download service' },
      { status: 502 }
    );
  }

  if (!backendRes.ok) {
    const contentType = backendRes.headers.get('content-type') || '';
    let message = `Download failed (${backendRes.status})`;
    try {
      if (contentType.includes('application/json')) {
        const json = await backendRes.json();
        message = json.message || json.error || message;
      } else {
        const text = await backendRes.text();
        if (text) message = text.slice(0, 500);
      }
    } catch {
      /* ignore parse errors */
    }
    return NextResponse.json({ success: false, message }, { status: backendRes.status });
  }

  const buffer = await backendRes.arrayBuffer();
  const contentType =
    backendRes.headers.get('content-type') || 'application/zip';
  const disposition = backendRes.headers.get('content-disposition');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      ...(disposition ? { 'Content-Disposition': disposition } : {}),
      'Cache-Control': 'no-store',
    },
  });
}
