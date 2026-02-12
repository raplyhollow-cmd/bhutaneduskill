"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Target, Users, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";

// Real problems with real solutions - Bhutan-specific context
const problems = [
  {
    problem: "Most students choose BCSE subjects without knowing their strengths",
    stat: "85%",
    statLabel: "of students regret subject choices",
    context: "Pick subjects based on what friends choose or what seems 'easy' - not what matches their abilities",
    outcome: "Get matched to RUB programs that fit YOUR personality and strengths",
    solution: "RIASEC assessment → AI career matching → Confident subject selection",
    icon: Target,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    problem: "Parents only find out about struggles at report card time",
    stat: "Months",
    statLabel: "too late to help effectively",
    context: "By the time report cards come home, the gap is too wide and grades have suffered",
    outcome: "See homework, attendance, and progress every single day",
    solution: "Real-time dashboard + instant notifications + direct teacher messaging",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    problem: "Teachers spend hours grading and doing paperwork instead of teaching",
    stat: "40%",
    statLabel: "of time spent on non-teaching work",
    context: "Manual grading, attendance records, and report generation takes away from actual classroom time",
    outcome: "Auto-grade homework in seconds, generate reports with one click",
    solution: "8 question types + instant analytics + automated reports",
    icon: Zap,
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
];

function StatCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseInt(value) || 0;

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}

function ProblemSolutionCard({ problem, index }: { problem: typeof problems[0]; index: number }) {
  const Icon = problem.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-500">
        {/* Problem Section - Top */}
        <div className="relative p-6 pb-8 border-b border-gray-100 dark:border-gray-800">
          {/* Alert badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">The Problem</span>
            </div>
          </div>

          {/* Problem statement */}
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            {problem.problem}
          </p>

          {/* Context */}
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            "{problem.context}"
          </p>
        </div>

        {/* Solution Section - Bottom */}
        <div className={`${problem.bgColor} p-6 relative`}>
          {/* Check badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Our Solution</span>
            </div>
          </div>

          {/* Stat highlight */}
          <div className="flex items-baseline gap-2 mb-4">
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {problem.stat.includes('%') ? (
                <StatCounter value={problem.stat.replace('%', '')} suffix="%" />
              ) : (
                problem.stat
              )}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {problem.statLabel}
            </span>
          </div>

          {/* Outcome */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${problem.color} flex-shrink-0`}>
              <Icon className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
              {problem.outcome}
            </p>
          </div>

          {/* Solution steps */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {problem.solution}
            </p>
            <Link
              href="/sign-up"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r ${problem.color} text-white text-sm font-semibold hover:shadow-lg transition-all`}
            >
              Start Now
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* Decorative gradient line */}
        <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r ${problem.color} opacity-20`} />
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section className="relative py-32 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Why Schools Choose Us
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            Real Problems,{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Real Solutions
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            We don't just add features. We solve actual problems faced by Bhutanese students, parents, and teachers every day.
          </p>
        </motion.div>

        {/* Problem-Solution Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <ProblemSolutionCard key={index} problem={problem} index={index} />
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Already know what you need?
            </span>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-semibold text-sm hover:from-orange-700 hover:to-red-700 hover:shadow-lg transition-all"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
