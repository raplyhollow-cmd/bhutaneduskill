"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, BookOpen, TrendingUp, Users, Zap, Target, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Career Discovery",
    description: "Get personalized career recommendations based on your strengths.",
  },
  {
    icon: BookOpen,
    title: "School Management",
    description: "Attendance, homework, grades — everything in one place.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Real-time updates on student growth and performance.",
  },
  {
    icon: Users,
    title: "Parent Portal",
    description: "Monitor your child's journey, stay connected.",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Instant notifications for homework and announcements.",
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set academic and career goals, track progress.",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        href="/dashboard"
        className="group block h-full p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300"
      >
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>

        <h3 className="text-lg font-semibold text-gray-950 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {feature.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {feature.description}
        </p>

        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Learn more
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section className="relative py-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            Everything you need.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful tools to manage every aspect of education.
          </p>
        </motion.div>

        {/* Feature Grid - Clerk style bento */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
