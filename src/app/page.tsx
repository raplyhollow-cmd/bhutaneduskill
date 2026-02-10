"use client";

import { FuturisticNavTransparent } from "@/components/layout/futuristic-nav";
import { Hero3D } from "@/components/landing/hero-3d";
import { PortalGridSection } from "@/components/landing/portal-cards-3d";
import { JourneyTimeline } from "@/components/landing/journey-timeline";
import { RUBCollegesSection } from "@/components/landing/rub-colleges-3d";
import { TestimonialsOrbit } from "@/components/landing/testimonials-orbit";
import { StatsParticlesSection } from "@/components/landing/stats-particles";
import { CTAPremium } from "@/components/landing/cta-premium";
import { PageLoader } from "@/components/landing/page-loader";
import { TrustedBy } from "@/components/marketing/trusted-by";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Heart } from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader for 2 seconds for dramatic effect
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {/* Navigation */}
      <FuturisticNavTransparent />

      {/* Hero Section - 3D Himalayan Mountains */}
      <Hero3D />

      {/* Trusted By Section */}
      <TrustedBy className="bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800" />

      {/* Portal Cards Grid - 3D Tilt Effect */}
      <PortalGridSection />

      {/* Journey Timeline - Scroll Triggered */}
      <JourneyTimeline />

      {/* RUB Colleges - 3D Cards */}
      <RUBCollegesSection />

      {/* Stats Section - With Particle Effects */}
      <StatsParticlesSection />

      {/* Testimonials - Orbiting Avatars */}
      <TestimonialsOrbit />

      {/* Premium CTA - Animated Gradient Border */}
      <CTAPremium />

      {/* Footer - Modern Design */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          {/* Main footer grid */}
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {/* Brand column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-white font-bold">CC</span>
                </motion.div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  Career Compass
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                AI-powered career guidance and school management for Bhutanese students.
                Discover your path to success.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, href: "https://facebook.com/careercompassbt", label: "Facebook" },
                  { icon: Instagram, href: "https://instagram.com/careercompassbt", label: "Instagram" },
                  { icon: Linkedin, href: "https://linkedin.com/company/careercompassbt", label: "LinkedIn" },
                  { icon: Twitter, href: "https://twitter.com/careercompassbt", label: "Twitter" },
                ].map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400"
                    aria-label={social.label}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Product links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { name: "Career Explorer", href: "/dashboard/careers" },
                  { name: "Assessments", href: "/dashboard/assessment" },
                  { name: "Scholarships", href: "/dashboard/scholarships" },
                  { name: "Study Abroad", href: "/dashboard/study-abroad" },
                  { name: "RUB Programs", href: "/dashboard/rub" },
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
            </motion.div>

            {/* Portals links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Portals</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { name: "Student Portal", href: "/student", color: "text-orange-500" },
                  { name: "Teacher Portal", href: "/teacher", color: "text-blue-500" },
                  { name: "Parent Portal", href: "/parent", color: "text-gray-500" },
                  { name: "Counselor Portal", href: "/counselor", color: "text-purple-500" },
                  { name: "School Admin", href: "/school-admin", color: "text-violet-500" },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className={`text-gray-600 dark:text-gray-400 hover:${link.color} transition-colors flex items-center gap-2`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Newsletter & Company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Stay Updated</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get career tips, scholarship alerts, and education news.
              </p>
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Add newsletter signup logic
                }}
              >
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                  <motion.button
                    type="submit"
                    className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center hover:from-orange-600 hover:to-red-700 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="w-4 h-4" />
                  </motion.button>
                </div>
              </form>

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Company</h5>
                <ul className="space-y-2 text-sm">
                  {[
                    { name: "About Us", href: "/about" },
                    { name: "Contact", href: "/contact" },
                    { name: "FAQ", href: "/faq" },
                    { name: "Privacy", href: "/about" },
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
            </motion.div>
          </div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Career Compass. All rights reserved.
            </p>
            <motion.div
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for Bhutanese students
            </motion.div>
            <div className="flex gap-6 text-sm">
              <a
                href="/about"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="/about"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Privacy
              </a>
            </div>
          </motion.div>
        </div>

        {/* Bhutanese pattern footer accent */}
        <div className="h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
      </footer>
    </main>
  );
}
