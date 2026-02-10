"use client";

import { ProfessionalNav } from "@/components/layout/professional-nav";
import { Hero3D } from "@/components/landing/hero-3d";
import { PortalGridSection } from "@/components/landing/portal-cards-3d";
import { JourneyTimeline } from "@/components/landing/journey-timeline";
import { RUBCollegesSection } from "@/components/landing/rub-colleges-3d";
import { TestimonialsOrbit } from "@/components/landing/testimonials-orbit";
import { StatsParticlesSection } from "@/components/landing/stats-particles";
import { CTAPremium } from "@/components/landing/cta-premium";
import { TrustedBy } from "@/components/marketing/trusted-by";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <ProfessionalNav />

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* Hero Section */}
      <Hero3D />

      {/* Trusted By Section */}
      <TrustedBy className="bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800" />

      {/* Portal Cards Grid */}
      <PortalGridSection />

      {/* Journey Timeline */}
      <JourneyTimeline />

      {/* RUB Colleges */}
      <RUBCollegesSection />

      {/* Stats Section */}
      <StatsParticlesSection />

      {/* Testimonials */}
      <TestimonialsOrbit />

      {/* Premium CTA */}
      <CTAPremium />

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CC</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  Career Compass
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                AI-powered career guidance for Bhutanese students.
              </p>
              <div className="flex gap-2">
                {[
                  { icon: Facebook, href: "https://facebook.com/careercompassbt" },
                  { icon: Instagram, href: "https://instagram.com/careercompassbt" },
                  { icon: Linkedin, href: "https://linkedin.com/company/careercompassbt" },
                  { icon: Twitter, href: "https://twitter.com/careercompassbt" },
                ].map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400"
                    aria-label="Social"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "Career Explorer", href: "/dashboard/careers" },
                  { name: "Assessments", href: "/dashboard/assessment" },
                  { name: "Scholarships", href: "/dashboard/scholarships" },
                  { name: "Study Abroad", href: "/dashboard/study-abroad" },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Portals</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "Student Portal", href: "/student", color: "text-orange-500" },
                  { name: "Teacher Portal", href: "/teacher", color: "text-blue-500" },
                  { name: "Parent Portal", href: "/parent", color: "text-gray-500" },
                  { name: "Counselor Portal", href: "/counselor", color: "text-purple-500" },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className={`text-gray-600 dark:text-gray-400 hover:${link.color} transition-colors flex items-center gap-2`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "About Us", href: "/about" },
                  { name: "Contact", href: "/contact" },
                  { name: "FAQ", href: "/faq" },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Career Compass. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for Bhutan
            </div>
          </div>
        </div>

        {/* Accent */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
      </footer>
    </main>
  );
}
