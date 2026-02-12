"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, GraduationCap, School, Users, Shield } from "lucide-react";

const portals = [
  {
    title: "Students",
    href: "/student",
    icon: GraduationCap,
    description: "Assessments, careers, and planning.",
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-900/30",
  },
  {
    title: "Teachers",
    href: "/teacher",
    icon: School,
    description: "Classes, homework, and grading.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/30",
  },
  {
    title: "Parents",
    href: "/parent",
    icon: Users,
    description: "Track your child's progress.",
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-900/30",
  },
  {
    title: "Counselors",
    href: "/counselor",
    icon: Shield,
    description: "Student guidance & interventions.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-900/30",
  },
];

function PortalCard({ portal, index }: { portal: typeof portals[0]; index: number }) {
  const Icon = portal.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        href={portal.href}
        className={`group relative h-full p-6 rounded-2xl ${portal.bg} ${portal.border} border-2 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${portal.color} shadow-sm`}>
            <Icon className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <ArrowRight className={`w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors`} />
        </div>
        <h3 className="text-xl font-semibold text-gray-950 dark:text-white mb-2">
          {portal.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {portal.description}
        </p>
      </Link>
    </motion.div>
  );
}

export function PortalGridSection() {
  return (
    <section className="relative py-24 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            One platform.
            <span className="block text-gray-400 dark:text-gray-600">Everyone connected.</span>
          </h2>
        </motion.div>

        {/* Portal Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portals.map((portal, index) => (
            <PortalCard key={portal.title} portal={portal} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            Explore all the features available in your portal
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-all duration-200"
          >
            Explore Features
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
