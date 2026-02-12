"use client";

import { CompactNav } from "@/components/layout/compact-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { RUBCollegesSection } from "@/components/landing/rub-colleges-3d";
import { TestimonialsOrbit } from "@/components/landing/testimonials-orbit";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Compact Navigation - Desktop floating pill + Mobile bottom tab bar */}
      <CompactNav />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* RUB Colleges Section */}
      <RUBCollegesSection />

      {/* Testimonials Section */}
      <TestimonialsOrbit />

      {/* CTA Section */}
      <CTASection />

      {/* Modern Footer Component */}
      <Footer />
    </main>
  );
}
