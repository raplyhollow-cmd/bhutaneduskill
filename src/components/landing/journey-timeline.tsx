"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { CheckCircle2, Circle, ArrowRight, Sparkles, Target, BookOpen, GraduationCap, Plane } from "lucide-react";

interface JourneyStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  stats?: string;
}

const journeySteps: JourneyStep[] = [
  {
    id: 1,
    title: "Discover Your Self",
    description: "Take AI-powered assessments to uncover your personality type, natural talents, and career interests.",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-orange-500 to-amber-500",
    stats: "5 min • 100% Free",
  },
  {
    id: 2,
    title: "Explore Careers",
    description: "Browse matched careers, learn about RUB colleges, and discover scholarship opportunities.",
    icon: <Target className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    stats: "50+ Careers • 11 RUB Colleges",
  },
  {
    id: 3,
    title: "Create Your Plan",
    description: "Build a personalized career roadmap with subject choices, goals, and milestones.",
    icon: <BookOpen className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    stats: "Class 11-12 Ready",
  },
  {
    id: 4,
    title: "Achieve Goals",
    description: "Track progress with integrated homework, attendance, and performance data.",
    icon: <GraduationCap className="w-6 h-6" />,
    color: "from-green-500 to-emerald-500",
    stats: "Real-time Tracking",
  },
  {
    id: 5,
    title: "Study Abroad",
    description: "Get country-specific guidance for Australia, NZ, USA, Singapore, and more.",
    icon: <Plane className="w-6 h-6" />,
    color: "from-red-500 to-orange-500",
    stats: "5+ Countries",
  },
];

function JourneyCard({ step, isActive, isCompleted }: { step: JourneyStep; isActive: boolean; isCompleted: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Connection line */}
      {step.id < journeySteps.length && (
        <motion.div
          className="absolute top-24 left-8 w-0.5 h-24 -z-10"
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: isCompleted ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-full h-full bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700" />
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        className={`relative p-6 rounded-2xl border-2 transition-all duration-500 ${
          isActive
            ? "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-300 dark:border-orange-700 shadow-xl shadow-orange-500/20"
            : isCompleted
            ? "bg-white dark:bg-gray-900 border-green-300 dark:border-green-700"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }`}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Glow effect for active */}
        {isActive && (
          <motion.div
            className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-xl -z-10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Status Icon */}
        <div className="absolute -top-4 -left-4">
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg"
            >
              <CheckCircle2 className="w-6 h-6 text-white" />
            </motion.div>
          ) : isActive ? (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg"
            >
              <Circle className="w-6 h-6 text-white fill-white" />
            </motion.div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pl-4">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-3">
            <motion.div
              className={`p-3 rounded-xl bg-gradient-to-br ${step.color} text-white`}
              animate={isActive ? {
                rotateY: [0, 360],
              } : {}}
              transition={{
                duration: 1,
                repeat: isActive ? Infinity : 0,
                repeatDelay: 2,
              }}
            >
              {step.icon}
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              {step.stats && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {step.stats}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {step.description}
          </p>

          {/* Active indicator */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Current Focus
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function JourneyTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(1);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Map scroll progress to active step
  useTransform(scrollYProgress, [0, 1], [1, journeySteps.length]);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-950 dark:via-blue-950/20 dark:to-gray-950 overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-900/50 mb-6"
          >
            <span className="text-2xl">🗺️</span>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Your Journey to Success
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            From Confusion to
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {" "}Clarity
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Five simple steps to discover your path, plan your future, and achieve your dreams.
            We guide you every step of the way.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-12"
        >
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"
              initial={{ width: "20%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Start</span>
            <span>Your Future Awaits</span>
          </div>
        </motion.div>

        {/* Journey Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journeySteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                type: "spring",
                stiffness: 100,
              }}
              onViewportEnter={() => setActiveStep(step.id)}
            >
              <JourneyCard
                step={step}
                isActive={activeStep === step.id}
                isCompleted={activeStep > step.id}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50">
            <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-gray-900 dark:text-white font-medium">
              Ready to start your journey?
            </span>
            <a
              href="/dashboard/assessment"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-semibold text-sm hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-500/30"
            >
              Take Free Assessment
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
