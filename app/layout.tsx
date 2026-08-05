import type { Metadata, Viewport } from 'next';
import { Syne, Outfit } from 'next/font/google';
import './globals.css';
import { RootLayoutClient } from './RootLayoutClient';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: { default: 'Roopixo', template: '%s | Roopixo' },
  /** PNG in `public/favicon.png`. `/favicon.ico` rewrites to the same file (see `next.config.js`). */
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

/** Safe-area + notch friendly for camera / face flows on mobile */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${outfit.variable} font-sans bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
