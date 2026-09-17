import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'Privacy Policy | Roopixo',
  description:
    'Read the Roopixo Privacy Policy covering user data collection, Google OAuth data usage, facial recognition processing, security, and user rights.',
};

const lastUpdated = 'September 18, 2026';

const sections = [
  {
    heading: '1. Introduction',
    body: [
      'Roopixo ("we", "our", or "us") is dedicated to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website https://roopixo.com and use our AI-powered event photo delivery services.',
      'Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access or use the application.',
    ],
  },
  {
    heading: '2. Information We Collect',
    body: [
      'A. Personal Data You Provide Directly: When you register for an account, join an event, or contact us, we collect personal information including your name, email address, password, and profile preferences.',
      'B. Google OAuth Data: If you choose to sign in using Google ("Continue with Google"), we request access to your basic Google profile information (such as your full name, email address, and profile picture avatar) via standard OAuth scopes (openid, email, profile). We do NOT request access to your Google Drive, Gmail, contacts, or sensitive private Google data without explicit separate consent.',
      'C. Facial Recognition Data: To provide our core feature of automatic photo matching and delivery, users may optionally upload a selfie. We process this photo to generate a secure facial mathematical representation (vector embedding) using AWS Rekognition. This is used solely to locate and deliver photos in which you appear across event galleries you join.',
      'D. Event Media & Photos: Event organizers and photographers upload event photographs to Roopixo for hosting, processing, and distribution to attendees.',
    ],
  },
  {
    heading: '3. How We Use Your Information',
    body: [
      'We use the information we collect or receive for specific, limited purposes:',
      '• To authenticate your identity and manage your user account via email/password or Google OAuth.',
      '• To perform facial recognition matching so you can find and download high-resolution photos of yourself from events.',
      '• To notify you when new photos of you are discovered in event galleries.',
      '• To deliver customer support and respond to your inquiries.',
      '• To maintain platform security, prevent fraud, and enforce our terms of service.',
    ],
  },
  {
    heading: '4. Google API User Data & Scopes Policy',
    body: [
      'Roopixo adheres to the Google API Services User Data Policy, including the Limited Use requirements.',
      '• We only use Google user data (name, email, profile image) to facilitate user registration, login, and profile display.',
      '• We do NOT transfer, sell, or disclose Google user data to third parties, data brokers, or advertising networks.',
      '• We do NOT use Google user data for serving advertisements, retargeting, or developing marketing models.',
    ],
  },
  {
    heading: '5. Facial Recognition & Biometric Data Handling',
    body: [
      '• Purpose Limitation: Facial vector embeddings are generated and used exclusively for the purpose of matching registered event attendees with event photographs.',
      '• Secure Storage: Face embeddings are encrypted at rest and in transit within secure cloud infrastructure (AWS). Raw reference selfies are stored privately in encrypted Amazon S3 buckets.',
      '• User Control & Deletion: You retain complete control over your facial data. You can delete your facial registration data at any time from your account settings, which immediately removes your facial vector from our active search collections.',
    ],
  },
  {
    heading: '6. Data Sharing and Third-Party Services',
    body: [
      'We do not sell, trade, or rent your personal information to third parties. We may share data only with trusted infrastructure and service providers bound by strict data protection agreements:',
      '• Cloud Hosting & Storage: Amazon Web Services (AWS) for secure storage and AI facial matching.',
      '• Authentication & Infrastructure: Vercel (frontend hosting) and MongoDB Atlas (encrypted database).',
      '• Email Delivery: Resend for transactional emails (e.g., account confirmation, password resets).',
      '• Legal Requirements: We may disclose your information if required to do so by law or in response to valid requests by public authorities.',
    ],
  },
  {
    heading: '7. Data Retention and Security',
    body: [
      'We implement appropriate technical and organizational security measures designed to protect your personal data against unauthorized access, alteration, disclosure, or destruction.',
      'We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. When an account or event is deleted, associated images and vectors are permanently purged in accordance with our retention schedule.',
    ],
  },
  {
    heading: '8. Your Privacy Rights & Data Deletion',
    body: [
      'Depending on your location, you have rights regarding your personal information, including the right to access, correct, export, or permanently delete your data.',
      'To request the deletion of your account, facial embeddings, or uploaded photos, you can use the in-app settings or email us directly at contact@roopixo.com.',
    ],
  },
  {
    heading: '9. Changes to This Privacy Policy',
    body: [
      'We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last updated" date at the top of this page. We encourage you to review this Privacy Policy periodically to stay informed of how we are protecting your information.',
    ],
  },
  {
    heading: '10. Contact Us',
    body: [
      'If you have questions, comments, or concerns about this Privacy Policy or our privacy practices, please contact us at:',
      '• Email: contact@roopixo.com',
      '• Website: https://roopixo.com',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[#0a0a0a] dark:text-white font-sans">
      <header className="px-6 pt-8">
        <div className="max-w-3xl mx-auto">
          <BrandLogo href="/" size="sm" tone="auto" />
        </div>
      </header>
      <main className="pt-12 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 h-px w-16 bg-violet-500/60 dark:bg-violet-400/50" />
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-[-0.03em] mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm font-light tracking-wider text-zinc-500 dark:text-white/40 mb-12">
            Last updated: {lastUpdated}
          </p>

          <p className="text-zinc-600 dark:text-white/60 font-light leading-relaxed mb-12">
            At Roopixo, we value your trust and are committed to protecting your privacy.
            This document details our policies regarding the collection, use, and disclosure
            of your information across our platform and services.
          </p>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl md:text-2xl font-light tracking-tight text-zinc-900 dark:text-white mb-4">
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.body.map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="text-zinc-600 dark:text-white/50 font-light leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm font-light text-zinc-500 dark:text-white/40">
              Questions? Reach out at{' '}
              <a
                href="mailto:contact@roopixo.com"
                className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
              >
                contact@roopixo.com
              </a>
              .
            </p>
            <Link
              href="/"
              className="text-sm font-light tracking-wider text-zinc-500 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
