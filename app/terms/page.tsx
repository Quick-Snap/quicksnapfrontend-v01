import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Roopixo',
  description:
    'Read the Roopixo Terms & Conditions covering use of the platform, accounts, content, payments, and more.',
};

const lastUpdated = 'September 18, 2026';

const sections: { heading: string; body: string[] }[] = [
  {
    heading: '1. Acceptance of Terms',
    body: [
      'By accessing or using Roopixo (the "Service"), located at https://roopixo.com, you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.',
      'These Terms apply to all visitors, attendees, photographers, event organizers, and others who access or use the Service.',
    ],
  },
  {
    heading: '2. Eligibility',
    body: [
      'You must be at least 13 years of age to use Roopixo. By using the Service, you represent and warrant that you meet this requirement and have the legal capacity to enter into these Terms.',
    ],
  },
  {
    heading: '3. Accounts & Authentication',
    body: [
      'When you create an account using email/password or Google OAuth, you must provide accurate and complete information. You are responsible for safeguarding your credentials and for all activities that occur under your account.',
      'You agree to notify us immediately of any unauthorized use of your account at contact@roopixo.com.',
    ],
  },
  {
    heading: '4. Description of Service & AI Face Matching',
    body: [
      'Roopixo provides automated photo sorting and delivery services for live events, using advanced face recognition technology powered by secure cloud services (AWS Rekognition) to help event guests quickly locate their photos.',
      'You agree to use the Service only for lawful purposes and in accordance with these Terms. You will not misuse the Service, attempt to gain unauthorized access, interfere with platform infrastructure, or upload harmful or unlawful content.',
    ],
  },
  {
    heading: '5. User Content & Photos',
    body: [
      'Photographers and organizers retain full ownership and copyrights of the photos they upload to Roopixo. By uploading content, you grant Roopixo a non-exclusive, worldwide license to host, process, index, and deliver that content solely as necessary to operate the Service.',
      'Users who upload a reference selfie for facial recognition grant Roopixo permission to process their facial embedding solely to match and deliver event photos. Users can delete their facial data at any time from their account profile.',
    ],
  },
  {
    heading: '6. Privacy & Data Protection',
    body: [
      'Your privacy is very important to us. Please review our Privacy Policy at https://roopixo.com/privacy to understand how we collect, process, and protect your personal data, Google OAuth information, and facial recognition data.',
    ],
  },
  {
    heading: '7. Subscriptions & Payments',
    body: [
      'Certain organizer and enterprise features of Roopixo may require paid subscription plans or event-based fees. All fees are clearly displayed prior to purchase and are non-refundable except as required by applicable law.',
    ],
  },
  {
    heading: '8. Intellectual Property',
    body: [
      'The Service, including its design, branding, logo, code, and interfaces, is the proprietary property of Roopixo and is protected by copyright, trademark, and intellectual property laws.',
    ],
  },
  {
    heading: '9. Termination',
    body: [
      'We reserve the right to suspend or terminate your account and access to the Service at our discretion, without prior notice, if you breach these Terms or engage in fraudulent or harmful conduct.',
    ],
  },
  {
    heading: '10. Disclaimers & Limitation of Liability',
    body: [
      'The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. Roopixo is not liable for indirect, incidental, or consequential damages resulting from your use of or inability to use the Service.',
    ],
  },
  {
    heading: '11. Changes to Terms',
    body: [
      'We may modify these Terms periodically. We will notify you of material changes by updating the "Last updated" date on this page. Your continued use of Roopixo following any update constitutes your acceptance of the revised Terms.',
    ],
  },
  {
    heading: '12. Contact Information',
    body: [
      'If you have any questions concerning these Terms, please reach out to us at:',
      '• Email: contact@roopixo.com',
      '• Website: https://roopixo.com',
    ],
  },
];

export default function TermsPage() {
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
            Terms &amp; Conditions
          </h1>
          <p className="text-sm font-light tracking-wider text-zinc-500 dark:text-white/40 mb-12">
            Last updated: {lastUpdated}
          </p>

          <p className="text-zinc-600 dark:text-white/60 font-light leading-relaxed mb-12">
            Welcome to Roopixo. These Terms &amp; Conditions govern your use of our
            website, mobile experiences, and AI-powered photo delivery service.
            Please read them carefully.
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
