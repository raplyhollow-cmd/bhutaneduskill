"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Building, GraduationCap, MapPin, Users, BookOpen } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";

const categories = [
  {
    icon: Building,
    title: "Engineering & Technology",
    programs: "8 programs",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BookOpen,
    title: "Business & Commerce",
    programs: "12 programs",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: GraduationCap,
    title: "Education",
    programs: "6 programs",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Users,
    title: "Arts & Humanities",
    programs: "15 programs",
    color: "from-orange-500 to-red-500",
  },
];

const locations = [
  "Thimphu", "Paro", "Phuentsholing", "Trashigang",
  "Gaeddu", "Lobesa", "Kanglung", "Samtse"
];

function ProgramCategory({ category, index }: { category: typeof categories[0]; index: number }) {
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group"
    >
      <Link href="/student/rub" className="block">
        <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${category.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-gray-950 dark:text-white mb-1">
            {category.title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {category.programs}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function RUBCollegesSection() {
  return (
    <ErrorBoundary
      fallback={
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-gray-950 dark:text-white mb-4">
                Royal University of Bhutan
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Explore programs across 11 colleges and find the perfect fit for your future.
              </p>
            </div>
          </div>
        </section>
      }
    >
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4">
            <Building className="w-4 h-4" />
            Royal University of Bhutan
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            Your Path to{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Higher Education
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore programs across 11 colleges and find the perfect fit for your future.
          </p>
        </motion.div>

        {/* Main Visual - Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { value: "11", label: "Colleges", icon: Building },
            { value: "50+", label: "Programs", icon: BookOpen },
            { value: "8", label: "Districts", icon: MapPin },
            { value: "5000+", label: "Students", icon: Users },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
              <div className="relative p-6 text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-3 text-orange-500" strokeWidth={1.5} />
                <div className="text-3xl md:text-4xl font-bold text-gray-950 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Program Categories - Compact Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h3 className="text-xl font-semibold text-gray-950 dark:text-white mb-6 text-center">
            Explore by Field of Study
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <ProgramCategory key={category.title} category={category} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Locations Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-8 mb-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-950 dark:text-white mb-2">
                Colleges Across Bhutan
              </h4>
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <MapPin className="w-3 h-3 text-orange-500" />
                    {location}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/student/rub"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
            >
              Explore All Colleges
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
          </div>
        </motion.div>

        {/* Simple Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Take career assessments to discover which programs match your strengths
          </p>
          <Link
            href="/dashboard/assessment"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg transition-all duration-300"
          >
            Take Free Assessment
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </Link>
        </motion.div>
      </div>
    </section>
    </ErrorBoundary>
  );
}
