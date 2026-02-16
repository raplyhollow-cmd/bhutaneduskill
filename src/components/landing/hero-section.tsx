"use client";

import Link from "next/link";
import { ArrowRight, User, ClipboardCheck, Sparkles, GraduationCap, Trophy } from "lucide-react";
import { motion } from "framer-motion";

// Flow step data
const flowSteps = [
  { icon: User, label: "Student", color: "from-blue-500 to-blue-600" },
  { icon: ClipboardCheck, label: "Assessment", color: "from-purple-500 to-purple-600" },
  { icon: Sparkles, label: "Match", color: "from-orange-500 to-orange-600" },
  { icon: GraduationCap, label: "RUB", color: "from-green-500 to-green-600" },
  { icon: Trophy, label: "Success", color: "from-amber-500 to-amber-600" },
];

function FlowStep({
  step,
  index,
  totalSteps,
}: {
  step: typeof flowSteps[0];
  index: number;
  totalSteps: number;
}) {
  const Icon = step.icon;
  const isNotLast = index < totalSteps - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
      className="relative flex flex-col items-center"
    >
      {/* Icon circle */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2 + index * 0.3,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: index * 0.2,
        }}
        className="relative"
      >
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>

        {/* Pulsing ring */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.3,
          }}
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color}`}
        />
      </motion.div>

      {/* Label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 + index * 0.15, duration: 0.4 }}
        className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400"
      >
        {step.label}
      </motion.span>

      {/* Connection line with flowing particle */}
      {isNotLast && (
        <div className="absolute top-7 left-full w-16 h-0.5 -ml-1 hidden sm:block">
          {/* Static line */}
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />

          {/* Animated flowing dot */}
          <motion.div
            animate={{
              left: ["0%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2,
            }}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left Side - Content (3/5) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-3"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                One platform for education
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-950 dark:text-white leading-[1.1] mb-6"
            >
              Everything you need
              <br />
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                for education
              </span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-lg leading-relaxed"
            >
              From career discovery to school management. One platform for students,
              teachers, parents, and schools.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Link href="/sign-up">
                <button className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-lg font-medium text-base hover:bg-gray-900 dark:hover:bg-gray-100 transition-all duration-200">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Side - Flow Diagram (2/5) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="lg:col-span-2"
          >
            <div className="relative">
              {/* Background glow */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-3xl blur-3xl"
              />

              {/* Flow diagram container */}
              <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
                {/* Title */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-8"
                >
                  Your journey at a glance
                </motion.p>

                {/* Flow steps - horizontal on desktop, vertical on mobile */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-4">
                  {flowSteps.map((step, index) => (
                    <FlowStep
                      key={step.label}
                      step={step}
                      index={index}
                      totalSteps={flowSteps.length}
                    />
                  ))}
                </div>

                {/* Bottom label */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    From assessment to success — all in one place
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
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
