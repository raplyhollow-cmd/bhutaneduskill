"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function HeroSection() {
  const features = [
    "Career Discovery",
    "School Management",
    "Progress Tracking",
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950">
      {/* Very subtle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-950/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-tl from-blue-50/30 to-transparent dark:from-blue-950/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Clean badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI-Powered Career Guidance
            </span>
          </div>

          {/* Clean heading - proper 11px-13px scale equivalent */}
          <h1 className="text-[56px] sm:text-[64px] lg:text-[72px] xl:text-[80px] font-semibold tracking-tight mb-6 text-gray-950 dark:text-white leading-[1.1]">
            Education that
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
              works for you
            </span>
          </h1>

          {/* Subheading - proper text base */}
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            One platform for your entire education journey — from career discovery
            <br className="hidden sm:block" />
            to classroom management.
          </p>

          {/* CTA - compact p-3/p-4 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-12 px-5 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-lg font-medium text-base hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors shadow-lg"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-5 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-lg font-medium text-base hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                View Demo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Feature pills - compact */}
          <div className="flex flex-wrap justify-center gap-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                className="px-4 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Minimal floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.4, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="right-[10%] top-[25%] hidden lg:block"
        >
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200/50 dark:border-orange-900/30" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.4, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="left-[10%] bottom-[30%] hidden lg:block"
        >
          <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-900/30" />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 border border-gray-300 dark:border-gray-700 rounded-full flex items-start justify-center p-1"
        >
          <div className="w-1 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
