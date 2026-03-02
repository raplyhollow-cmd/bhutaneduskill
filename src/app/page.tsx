import { CompactNav } from "@/components/layout/compact-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
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
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RUBCollegesSection />
      <TestimonialsOrbit />
      <CTASection />
      <Footer />
    </main>
  );
}
