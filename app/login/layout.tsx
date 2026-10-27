import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your Roopixo account to access your events, photos, and AI face-matched galleries.',
  alternates: {
    canonical: 'https://www.roopixo.com/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
