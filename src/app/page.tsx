"use client";

import { CompactNav } from "@/components/layout/compact-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { RUBCollegesSection } from "@/components/landing/rub-colleges-3d";
import { TestimonialsOrbit } from "@/components/landing/testimonials-orbit";
import { CTASection } from "@/components/landing/cta-section";
import { motion } from "framer-motion";
import { Facebook, Instagram, Linkedin, Twitter, Heart } from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/bhutaneduskill", name: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/bhutaneduskill", name: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/bhutaneduskill", name: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/bhutaneduskill", name: "Twitter" },
];

const productLinks = [
  { name: "Career Explorer", href: "/dashboard/careers" },
  { name: "Assessments", href: "/dashboard/assessment" },
  { name: "Scholarships", href: "/dashboard/scholarships" },
  { name: "Study Abroad", href: "/dashboard/study-abroad" },
];

const portalLinks = [
  { name: "Student Portal", href: "/student" },
  { name: "Teacher Portal", href: "/teacher" },
  { name: "Parent Portal", href: "/parent" },
  { name: "Counselor Portal", href: "/counselor" },
  { name: "School Admin", href: "/school-admin" },
  { name: "Platform Admin", href: "/admin" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "FAQ", href: "/faq" },
];

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

      {/* Clean Footer - Micro-Premium style */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">BE</span>
                </div>
                <span className="font-semibold text-gray-950 dark:text-white">
                  Bhutan EduSkill
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs">
                Complete education management with career guidance.
              </p>

              {/* Social Icons */}
              <div className="flex gap-2">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                  >
                    <social.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Product Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
            >
              <h4 className="font-semibold mb-4 text-gray-950 dark:text-white">Product</h4>
              <ul className="space-y-3">
                {productLinks.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-orange-500 transition-colors" />
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Portals Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="font-semibold mb-4 text-gray-950 dark:text-white">Portals</h4>
              <ul className="space-y-3">
                {portalLinks.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-orange-500 transition-colors" />
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Company Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <h4 className="font-semibold mb-4 text-gray-950 dark:text-white">Company</h4>
              <ul className="space-y-3">
                {companyLinks.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-orange-500 transition-colors" />
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Bhutan EduSkill. All rights reserved.
            </p>

            {/* Made with love */}
            <motion.div
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Made with
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-red-500 inline-block"
              >
                <Heart className="w-4 h-4 fill-current" />
              </motion.span>
              using{" "}
              <a
                href="https://claude.com/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-950 dark:text-white hover:underline font-medium"
              >
                Claude Code
              </a>
            </motion.div>
          </motion.div>

          {/* Accent Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 origin-left"
          />
        </div>
      </footer>
    </main>
  );
}
