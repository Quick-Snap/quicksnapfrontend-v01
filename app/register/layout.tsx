import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Join Roopixo to create events, deliver photos in real-time, and let guests find their photos with AI face matching.',
  alternates: {
    canonical: 'https://www.roopixo.com/register',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
