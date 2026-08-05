import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Read the Roopixo Terms & Conditions covering use of the platform, accounts, content, payments, and more.',
};

const lastUpdated = 'May 13, 2026';

const sections: { heading: string; body: string[] }[] = [
  {
    heading: '1. Acceptance of Terms',
    body: [
      'By accessing or using Roopixo (the "Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.',
      'These Terms apply to all visitors, users, photographers, organizers, and others who access or use the Service.',
    ],
  },
  {
    heading: '2. Eligibility',
    body: [
      'You must be at least 13 years of age to use Roopixo. By using the Service, you represent and warrant that you meet this requirement and have the legal capacity to enter into these Terms.',
    ],
  },
  {
    heading: '3. Accounts',
    body: [
      'When you create an account, you must provide accurate and complete information. You are responsible for safeguarding your password and for all activities that occur under your account.',
      'You agree to notify us immediately of any unauthorized use of your account at contact@roopixo.online.',
    ],
  },
  {
    heading: '4. Use of the Service',
    body: [
      'Roopixo provides AI-powered photo delivery for events, including face recognition to help users find their photos. You agree to use the Service only for lawful purposes and in accordance with these Terms.',
      'You will not misuse the Service, attempt to gain unauthorized access, interfere with its operation, or upload content that infringes upon the rights of others.',
    ],
  },
  {
    heading: '5. User Content & Photos',
    body: [
      'Photographers and organizers retain ownership of the photos they upload. By uploading content, you grant Roopixo a non-exclusive, worldwide license to host, process, and deliver that content as necessary to operate the Service.',
      'Users who register their face for matching grant Roopixo permission to process their facial data solely to match and deliver photos. You may request deletion of your data at any time by contacting us.',
    ],
  },
  {
    heading: '6. Privacy',
    body: [
      'Your use of Roopixo is also governed by our privacy practices. We take the security of your data seriously and only use it to provide and improve the Service.',
    ],
  },
  {
    heading: '7. Payments & Subscriptions',
    body: [
      'Certain features of Roopixo may require payment. Fees are billed in advance on a recurring basis and are non-refundable except as required by law or as expressly stated by us.',
      'You authorize us to charge your chosen payment method for all applicable fees.',
    ],
  },
  {
    heading: '8. Intellectual Property',
    body: [
      'The Service, including its design, branding, logos, and software, is owned by Roopixo and is protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our prior written consent.',
    ],
  },
  {
    heading: '9. Termination',
    body: [
      'We may suspend or terminate your access to the Service at any time, with or without cause or notice, including if you violate these Terms. Upon termination, your right to use the Service will immediately cease.',
    ],
  },
  {
    heading: '10. Disclaimers',
    body: [
      'The Service is provided "as is" and "as available" without warranties of any kind. Roopixo does not warrant that the Service will be uninterrupted, error-free, or completely secure.',
    ],
  },
  {
    heading: '11. Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, Roopixo shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.',
    ],
  },
  {
    heading: '12. Changes to These Terms',
    body: [
      'We may update these Terms from time to time. If we make material changes, we will notify you by updating the "Last updated" date or by other reasonable means. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.',
    ],
  },
  {
    heading: '13. Contact Us',
    body: [
      'If you have any questions about these Terms, please contact us at contact@roopixo.online.',
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
                href="mailto:contact@roopixo.online"
                className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
              >
                contact@roopixo.online
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
