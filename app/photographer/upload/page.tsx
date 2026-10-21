'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PhotographerUploadRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0c0e17]">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PhotographerUploadRedirectContent />
    </Suspense>
  );
}

function PhotographerUploadRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');

  useEffect(() => {
    const target = eventIdFromUrl ? `/studio/shoots/${eventIdFromUrl}/upload` : '/studio/upload';
    router.replace(target);
  }, [eventIdFromUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e17]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Redirecting to Roopixo Studio Uploader...</p>
      </div>
    </div>
  );
}
