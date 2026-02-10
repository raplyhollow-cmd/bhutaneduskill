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
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(45deg, #f97316 0%, #dc2626 25%, #f97316 50%, #dc2626 75%, #f97316 100%)`,
            backgroundSize: "400% 400%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Overlapping gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/90 via-white to-red-50/90 dark:from-gray-950/90 dark:via-gray-900 dark:to-gray-950/90" />
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${i % 2 === 0 ? "#f97316" : "#dc2626"}, transparent)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Main CTA Card with animated gradient border */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="relative"
        >
          {/* Animated gradient border */}
          <div className="absolute -inset-1 rounded-3xl opacity-75 blur-sm">
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: `linear-gradient(45deg, #f97316, #dc2626, #f97316, #dc2626)`,
                backgroundSize: "300% 300%",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Inner card */}
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Glow effect */}
            <motion.div
              className="absolute top-0 right-0 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(249,115,22,0.15), transparent 70%)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50 mb-6"
              >
                <motion.span
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xl"
                >
                  🚀
                </motion.span>
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  Start Your Journey Today
                </span>
              </motion.div>

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
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full"
                  >
                    <motion.span
                      className="text-orange-600 dark:text-orange-400"
                      animate={
                        i === 0
                          ? { rotate: [0, 10, -10, 0] }
                          : { scale: [1, 1.1, 1] }
                      }
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    >
                      {feature.icon}
                    </motion.span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/assessment">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                    <button className="relative px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 flex items-center gap-3 transition-all">
                      <Sparkles className="w-5 h-5" />
                      Start Free Assessment
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                </Link>

                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold text-lg border-2 border-gray-200 dark:border-gray-700 transition-all flex items-center gap-3"
                  >
                    Create Account
                    <span className="text-sm font-normal text-gray-500">(Free)</span>
                  </motion.button>
                </Link>
              </div>

              {/* Trust indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold"
                    >
                      {i}
                    </motion.div>
                  ))}
                </div>
                <span>Join 10,000+ students already on board</span>
              </motion.div>
            </div>

            {/* Decorative corner accents */}
            <motion.div
              className="absolute top-0 left-0 w-24 h-24"
              animate={{
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
                <path
                  d="M0 100 L0 50 Q50 50 50 0"
                  stroke="url(#cornerGradient)"
                  strokeWidth="4"
                  fill="none"
                />
                <defs>
                  <linearGradient id="cornerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            <motion.div
              className="absolute bottom-0 right-0 w-24 h-24"
              animate={{
                rotate: [360, 270, 180, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
                <path
                  d="M100 0 L100 50 Q50 50 50 100"
                  stroke="url(#cornerGradient2)"
                  strokeWidth="4"
                  fill="none"
                />
                <defs>
                  <linearGradient id="cornerGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
        >
          No credit card required • Free forever for students • Ready in 2 minutes
        </motion.p>
      </div>
    </section>
  );
}
