"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { CompactNav } from "@/components/layout/compact-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { RUBCollegesSection } from "@/components/landing/rub-colleges-3d";
import { TestimonialsOrbit } from "@/components/landing/testimonials-orbit";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";

/**
 * Role-based redirect handler
 * - Unauthenticated visitors see the landing page
 * - Authenticated users are redirected to their portal based on user type
 * - Users needing setup go to /setup/unified
 */
export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Don't run if already checked
    if (hasChecked.current) return;
    hasChecked.current = true;

    // If Clerk isn't loaded yet, wait
    if (!isLoaded) return;

    // If user is not signed in, show landing page
    if (!isSignedIn) {
      setIsChecking(false);
      return;
    }

    // User is signed in - check their role and redirect
    fetch("/api/auth/set-role")
      .then((res) => res.json())
      .then((data) => {
        const { userType, needsSetup } = data;

        // Redirect based on user type
        if (needsSetup || !userType) {
          router.push("/setup/unified");
        } else {
          // Map user types to their portal routes
          const redirectMap: Record<string, string> = {
            student: "/student",
            teacher: "/teacher",
            parent: "/parent",
            counselor: "/counselor",
            "school-admin": "/school-admin",
            admin: "/admin",
            ministry: "/ministry",
          };

          const redirectPath = redirectMap[userType] || "/setup/unified";
          router.push(redirectPath);
        }
      })
      .catch((error) => {
        console.error("Error checking user role:", error);
        // On error, redirect to unified setup as fallback
        router.push("/setup/unified");
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [isLoaded, isSignedIn, router]);

  // Show loading spinner while checking authentication
  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated visitors
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
