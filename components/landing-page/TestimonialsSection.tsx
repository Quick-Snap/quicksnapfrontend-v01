'use client';

import { AnimatedTestimonials, Testimonial } from './AnimatedTestimonials';

export interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  testimonials: Testimonial[];
  autoRotateInterval?: number;
  trustedCompanies?: string[];
  trustedCompaniesTitle?: string;
}

export function TestimonialsSection({
  title = "Loved by Event Planners",
  subtitle = "See what photographers, planners, and event organizers say about QuickSnap.",
  badgeText = "Customer Stories",
  testimonials,
  autoRotateInterval = 5000,
  trustedCompanies = ["Weddings", "Corporate Events", "Festivals", "Concerts", "Conferences"],
  trustedCompaniesTitle = "Trusted across all event types"
}: TestimonialsSectionProps) {
  return (
    <AnimatedTestimonials
      title={title}
      subtitle={subtitle}
      badgeText={badgeText}
      testimonials={testimonials}
      autoRotateInterval={autoRotateInterval}
      trustedCompanies={trustedCompanies}
      trustedCompaniesTitle={trustedCompaniesTitle}
    />
  );
}

export default TestimonialsSection;

