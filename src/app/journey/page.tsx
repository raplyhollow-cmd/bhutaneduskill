"use client";

import { CompactNav } from "@/components/layout/compact-nav";
import { JourneyHero } from "@/components/journey/journey-hero";
import { StatsParallax } from "@/components/journey/stats-parallax";
import { TimelineSection } from "@/components/journey/timeline-section";
import { FailuresGallery } from "@/components/journey/failures-gallery";
import { BuildProcessSection } from "@/components/journey/build-process-section";
import { AchievementsGrid } from "@/components/journey/achievements-grid";
import { FutureVision } from "@/components/journey/future-vision";
import { Footer } from "@/components/layout/footer";

export default function JourneyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
      <CompactNav />
      <JourneyHero />
      <StatsParallax />
      <TimelineSection />
      <FailuresGallery />
      <BuildProcessSection />
      <AchievementsGrid />
      <FutureVision />
      <Footer />
    </main>
  );
}
