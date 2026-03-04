import { CompactNav } from "@/components/layout/compact-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { QuickStartSection } from "@/components/landing/quick-start-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { RUBCollegesSection } from "@/components/landing/rub-colleges-3d";
import { TestimonialsOrbit } from "@/components/landing/testimonials-orbit";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  // Note: Authentication and routing is now handled by middleware
  // - Authenticated users with userType → redirected to their portal by middleware
  // - Authenticated users without userType → redirected to /setup/unified by middleware
  // - Unauthenticated users → see this landing page
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <CompactNav />
      {/* 1. Hero (with user selector) - Above fold */}
      <HeroSection />
      {/* 2. Quick Start Guide (how to use) - Clear path forward */}
      <QuickStartSection />
      {/* 3. Social Proof Bar (stats) - Establish credibility */}
      <SocialProofSection />
      {/* 4. Features (problem/solution) - Value props */}
      <FeaturesSection />
      {/* 5. How It Works (ecosystem) - Deep dive */}
      <HowItWorksSection />
      {/* 6. RUB Colleges (visual proof) - Interactive showcase */}
      <RUBCollegesSection />
      {/* 7. Testimonials Orbit - Reinforce trust */}
      <TestimonialsOrbit />
      {/* 8. CTA Section - Final push */}
      <CTASection />
      <Footer />
    </main>
  );
}
