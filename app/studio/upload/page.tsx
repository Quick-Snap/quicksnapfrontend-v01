'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudioUploader from '@/app/components/studio/StudioUploader';

export default function StudioUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
        </div>
      }
    >
      <StudioUploadContent />
    </Suspense>
  );
}

function StudioUploadContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || undefined;

  return <StudioUploader presetEventId={eventId} />;
}
