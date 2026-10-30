'use client';

import { LandingPage } from '@/components/landing-page';

export default function Home() {
  return (
    <LandingPage
      loginHref="/login"
      signupHref="/register"
      brandName="Roopixo"
    />
  );
}

