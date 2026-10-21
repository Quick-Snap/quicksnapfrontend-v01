'use client';

import { useParams } from 'next/navigation';
import StudioUploader from '@/app/components/studio/StudioUploader';

export default function ShootUploadPage() {
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  return <StudioUploader presetEventId={eventId} />;
}
