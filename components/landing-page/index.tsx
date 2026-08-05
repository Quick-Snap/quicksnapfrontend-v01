'use client';

import { Header } from './Header';
import { DriftWallHero } from './DriftWallHero';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorks } from './HowItWorks';
import { TestimonialsSection } from './TestimonialsSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';

const testimonials = [
  {
    id: 1,
    name: "Lucky Chauhan",
    role: "Wedding Planner",
    company: "Elegant Events",
    content:
      "Roopixo transformed how we handle wedding photography. Guests love finding their photos instantly with just a selfie. It's become a must-have for every event we organize!",
    rating: 5,
    avatar: "https://avatars.githubusercontent.com/u/132067512?v=4",
  },
  {
    id: 2,
    name: "Prakhar Singh",
    role: "Event Photographer",
    company: "Chen Photography",
    content:
      "As a photographer, Roopixo has revolutionized my workflow. Photos are delivered instantly, clients are happier, and I can focus on what I do best - capturing moments.",
    rating: 5,
    avatar: "https://avatars.githubusercontent.com/u/148339919?v=4",
  },
  {
    id: 3,
    name: "Sanskrti Jaiswal",
    role: "Corporate Events Manager",
    company: "TechCorp Inc.",
    content:
      "We used Roopixo for our annual conference with 2,000+ attendees. The AI face recognition is incredibly accurate, and our team loved getting their photos in real-time.",
    rating: 5,
    avatar: "https://avatars.githubusercontent.com/u/197813452?v=4",
  },
  {
    id: 4,
    name: "Rishi Raj Singh",
    role: "Tech Events Manager - Indore",
    company: "TechCorp Inc.",
    content:
      "We used Roopixo for handling photo delivery for our Tech Conference with 2,000+ attendees. It's incredibly accurate and our team loved getting their photos in such a fast pace and with accuracy",
    rating: 5,
    avatar: "https://avatars.githubusercontent.com/u/144822182?v=4",
  },
];

export interface LandingPageProps {
  loginHref?: string;
  signupHref?: string;
  brandName?: string;
}

export function LandingPage({
  loginHref = '/login',
  signupHref = '/register',
  brandName = 'Roopixo'
}: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] font-sans">
      <Header
        brandName={brandName}
        loginHref={loginHref}
        signupHref={signupHref}
      />

      <section className="h-screen w-full">
        <DriftWallHero
          signupHref={signupHref}
          loginHref={loginHref}
          brandName={brandName}
        />
      </section>

      <FeaturesSection />

      <HowItWorks />

      <TestimonialsSection
        testimonials={testimonials}
        title="Loved by Event Planners"
        subtitle="See what photographers, planners, and event organizers say about Roopixo."
        badgeText="Customer Stories"
        trustedCompanies={["Weddings", "Corporate Events", "Festivals", "Concerts", "Conferences"]}
        trustedCompaniesTitle="Trusted across all event types"
      />

      <CTASection
        signupHref={signupHref}
        loginHref={loginHref}
      />

      <Footer brandName={brandName} />
    </div>
  );
}

export default LandingPage;

export { Header } from './Header';
export { DriftWallHero } from './DriftWallHero';
export { ScrollMorphHero } from './ScrollMorphHero';
export { FeaturesSection } from './FeaturesSection';
export { HowItWorks } from './HowItWorks';
export { TestimonialsSection } from './TestimonialsSection';
export { CTASection } from './CTASection';
export { Footer } from './Footer';
export { FeaturesGrid } from './FeaturesGrid';
export { GlowingEffect } from './GlowingEffect';
export { AnimatedTestimonials } from './AnimatedTestimonials';
