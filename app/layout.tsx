import type { Metadata, Viewport } from 'next';
import { Syne, Outfit } from 'next/font/google';
import Script from 'next/script';
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
  metadataBase: new URL('https://www.roopixo.com'),
  title: {
    default: 'Roopixo — AI Event Photo Sharing & Instant Face Match Gallery',
    template: '%s | Roopixo',
  },
  description:
    'Roopixo is the modern AI event photo sharing platform. Guests find their photos instantly using selfie face matching. Real-time photo delivery for weddings, corporate events, and parties.',
  keywords: [
    'Roopixo',
    'roopixo.com',
    'event photo sharing',
    'AI face recognition photos',
    'wedding photo gallery',
    'instant event photo delivery',
    'face match photo finder',
    'QR code event photos',
    'photographer gallery platform',
  ],
  authors: [{ name: 'Roopixo', url: 'https://www.roopixo.com' }],
  creator: 'Roopixo',
  publisher: 'Roopixo',
  applicationName: 'Roopixo',
  alternates: {
    canonical: 'https://www.roopixo.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.roopixo.com',
    siteName: 'Roopixo',
    title: 'Roopixo — AI Event Photo Sharing & Instant Face Match Gallery',
    description:
      'Roopixo is the modern AI event photo sharing platform. Find all your event photos instantly with AI selfie matching. No app download needed.',
    images: [
      {
        url: '/favicon.png',
        width: 512,
        height: 512,
        alt: 'Roopixo AI Event Photo Sharing',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Roopixo — AI Event Photo Sharing',
    description:
      'Find all your event photos in seconds using AI face matching. Instant photo sharing for weddings and events.',
    images: ['/favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.roopixo.com/#website',
      url: 'https://www.roopixo.com',
      name: 'Roopixo',
      alternateName: ['Roopixo AI', 'Roopixo Photo Sharing'],
      description: 'AI-powered event photo sharing and instant face match gallery',
      publisher: {
        '@id': 'https://www.roopixo.com/#organization',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.roopixo.com/#organization',
      name: 'Roopixo',
      url: 'https://www.roopixo.com',
      logo: 'https://www.roopixo.com/favicon.png',
      sameAs: [
        'https://www.linkedin.com/company/roopixo',
        'https://www.instagram.com/roopixo',
        'https://x.com/Roopixo',
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${syne.variable} ${outfit.variable} font-sans bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
