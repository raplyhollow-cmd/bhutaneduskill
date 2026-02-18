"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompactNav } from "@/components/layout/compact-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { RUBCollegesSection } from "@/components/landing/rub-colleges-3d";
import { TestimonialsOrbit } from "@/components/landing/testimonials-orbit";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and route them
    fetch("/api/auth/set-role")
      .then((res) => res.json())
      .then((data) => {
        const { userType, needsSetup } = data;

        // If user is authenticated and set up, redirect to portal
        if (!needsSetup && userType) {
          const redirectMap: Record<string, string> = {
            student: "/student",
            teacher: "/teacher",
            parent: "/parent",
            counselor: "/counselor",
            "school-admin": "/school-admin",
            admin: "/admin",
            ministry: "/ministry",
          };
          const redirectPath = redirectMap[userType];
          if (redirectPath) {
            router.push(redirectPath);
            return;
          }
        }

        // If user needs setup, redirect to setup wizard
        if (needsSetup && !userType) {
          setIsRedirecting(false);
          router.push("/setup/unified");
          return;
        }

        // User not authenticated or needs setup - show landing page
        setIsRedirecting(false);
        setShowLanding(true);
      })
      .catch(() => {
        // On error, show landing page
        setIsRedirecting(false);
        setShowLanding(true);
      });
  }, [router]);

  // Show loading while checking auth
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
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
