"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, BookOpen, TrendingUp, Users, Zap, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Career Discovery",
    description: "Personalized recommendations based on your strengths.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: BookOpen,
    title: "School Management",
    description: "Attendance, homework, grades in one place.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Users,
    title: "Parent Portal",
    description: "Monitor your child's journey in real-time.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: Zap,
    title: "Instant Updates",
    description: "Real-time notifications for announcements.",
    color: "from-orange-500 to-red-600",
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set goals and track your progress.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description: "Visual dashboards showing growth trends.",
    color: "from-indigo-500 to-purple-600",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link href="/dashboard" className="group block">
        <div className="relative p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
          {/* Icon with gradient ring */}
          <div className="relative mb-6">
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-gray-950 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {feature.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {feature.description}
          </p>

          {/* Decorative corner accent */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${feature.color} opacity-0 group-hover:opacity-5 rounded-br-3xl rounded-tl-3xl transition-opacity duration-500`} />
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section className="relative py-32 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            Built for modern education
          </h2>
          <p className="text-lg text-gray-400">
            Everything schools and students need, in one place.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
