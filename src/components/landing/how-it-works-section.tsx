"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  ClipboardCheck,
  GraduationCap,
  School,
  Users,
  Target,
  BookOpen,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Discover Your Path",
    description: "Take free career assessments to discover your strengths and interests. Get matched with careers that fit your personality.",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Explore & Learn",
    description: "Browse detailed career profiles, RUB colleges, scholarships, and study abroad options. Research what each path requires.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    number: "03",
    icon: Target,
    title: "Create Your Plan",
    description: "Build a personalized roadmap with subject choices, academic goals, and career milestones. Track your progress visually.",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    number: "04",
    icon: GraduationCap,
    title: "Connect Your School",
    description: "Join your school ecosystem. Teachers assign homework, track attendance, and update grades — all linked to your career plan.",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    number: "05",
    icon: Users,
    title: "Family Support",
    description: "Parents monitor progress, receive updates, and support learning. Teachers provide guidance based on real performance data.",
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
  },
  {
    number: "06",
    icon: Sparkles,
    title: "Achieve Your Goals",
    description: "Complete Class 12 with clarity. Apply to RUB or other universities with confidence. Your dream career awaits!",
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
];

const benefits = [
  {
    icon: School,
    title: "For Schools",
    description: "Complete management system — attendance, homework, fees, reports, and analytics in one platform.",
  },
  {
    icon: Users,
    title: "For Teachers",
    description: "Create assignments, grade submissions, track student progress, and identify those needing extra support.",
  },
  {
    icon: ClipboardCheck,
    title: "For Parents",
    description: "Real-time visibility into your child's education. Attendance, homework, grades, and teacher communication.",
  },
  {
    icon: GraduationCap,
    title: "For Students",
    description: "Career guidance, academic planning, and progress tracking — all designed to help you succeed.",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="relative"
    >
      <div className={`relative p-6 rounded-2xl ${step.bgColor} border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full`}>
        {/* Step Number */}
        <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
          {step.number}
        </div>

        {/* Icon */}
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${step.color} mb-4`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-950 dark:text-white mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Connector Line (not on last items) */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800" />
      )}
    </motion.div>
  );
}

function BenefitCard({ benefit, index }: { benefit: typeof benefits[0]; index: number }) {
  const Icon = benefit.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <h4 className="font-semibold text-gray-950 dark:text-white mb-1">
            {benefit.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {benefit.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            Your Journey to Success
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            A simple 6-step journey from career discovery to achieving your dreams.
            Designed specifically for Bhutanese students from Class 6 to Class 12.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-gray-800">
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-950 dark:text-white text-center mb-8">
              Built for Everyone in Education
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <BenefitCard key={benefit.title} benefit={benefit} index={index} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Ready to start your journey?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-semibold hover:from-orange-700 hover:to-red-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link
              href="/dashboard/assessment"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-2xl font-semibold border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Take Free Assessment
              <ClipboardCheck className="w-5 h-5" strokeWidth={2} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
