"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function CTAPremium() {
  const features = [
    { icon: <Sparkles className="w-5 h-5" />, text: "Free career assessments" },
    { icon: <Zap className="w-5 h-5" />, text: "Instant AI matching" },
    { icon: <ShieldCheck className="w-5 h-5" />, text: "RUB college integration" },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Static gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />

      <div className="relative max-w-4xl mx-auto">
        {/* Main CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Gradient border - static */}
          <div className="absolute -inset-1 rounded-3xl opacity-60 bg-gradient-to-r from-orange-500 to-red-500 blur-sm" />

          {/* Inner card */}
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Subtle glow - static */}
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
              style={{
                background: "radial-gradient(circle, rgba(249,115,22,0.3), transparent 70%)",
              }}
            />

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50 mb-6">
                <span className="text-xl">🚀</span>
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  Start Your Journey Today
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Discover Your
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {" "}Dream Career?
                </span>
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of Bhutanese students who have found their path. Take our free
                assessment and get personalized career matches in minutes.
              </p>

              {/* Features */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full"
                  >
                    <span className="text-orange-600 dark:text-orange-400">
                      {feature.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/assessment">
                  <button className="relative px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 flex items-center gap-3 transition-all hover:scale-105">
                    <Sparkles className="w-5 h-5" />
                    Start Free Assessment
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <Link href="/sign-up">
                  <button className="px-8 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold text-lg border-2 border-gray-200 dark:border-gray-700 transition-all flex items-center gap-3 hover:scale-105">
                    Create Account
                    <span className="text-sm font-normal text-gray-500">(Free)</span>
                  </button>
                </Link>
              </div>

              {/* Trust indicator */}
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <span>Join 10,000+ students already on board</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
        >
          No credit card required • Free forever for students • Ready in 2 minutes
        </motion.p>
      </div>
    </section>
  );
}
