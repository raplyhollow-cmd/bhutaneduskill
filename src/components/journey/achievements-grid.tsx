"use client";

import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Users, Building, Shield, Sparkles, Server, Database, FileCode } from "lucide-react";
import { useState } from "react";
import { portal } from "@/styles/design-tokens";

interface Achievement {
  icon: React.ReactNode;
  title: string;
  count: string;
  items: string[];
  color: string;
  gradient: string;
}

const achievements: Achievement[] = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Portals",
    count: "8",
    items: ["Student", "Teacher", "Parent", "Counselor", "School Admin", "Platform Admin", "Ministry", "Alumni"],
    color: portal.student.primary,
    gradient: "from-orange-500 to-red-600"
  },
  {
    icon: <Server className="w-6 h-6" />,
    title: "API Routes",
    count: "200+",
    items: ["Protected with RBAC", "RESTful design", "Error handling", "Type-safe", "Documented"],
    color: portal.teacher.primary,
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    icon: <FileCode className="w-6 h-6" />,
    title: "Pages",
    count: "150+",
    items: ["Full-stack pages", "Responsive design", "Accessible", "Optimized", "Animated"],
    color: portal.schoolAdmin.primary,
    gradient: "from-purple-500 to-violet-600"
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "Database Tables",
    count: "115+",
    items: ["Users & auth", "Academics", "Assessments", "Operations", "Analytics"],
    color: portal.admin.primary,
    gradient: "from-pink-500 to-rose-600"
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Feb 18 Batches",
    count: "9",
    items: ["Gate Pass", "Library", "Alumni Portal", "Payroll", "Medical", "Transport", "Leave", "Inventory", "Events"],
    color: "rgb(34 197 94)",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Error Fixes",
    count: "50+",
    items: ["TypeScript errors", "API issues", "Navigation bugs", "Database schema", "Build errors"],
    color: portal.counselor.primary,
    gradient: "from-violet-500 to-purple-600"
  }
];

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Glow effect */}
      <motion.div
        animate={{
          scale: isHovered ? 1.1 : 1,
          opacity: isHovered ? 0.3 : 0.1,
        }}
        transition={{ duration: 0.3 }}
        className="absolute -inset-1 bg-gradient-to-r rounded-2xl blur-xl"
        style={{ background: `linear-gradient(135deg, ${achievement.color}, transparent)` }}
      />

      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full hover:border-white/20 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${achievement.gradient} text-white`}>
            {achievement.icon}
          </div>
          <div className={`text-4xl font-bold bg-gradient-to-r ${achievement.gradient} bg-clip-text text-transparent`}>
            {achievement.count}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3">{achievement.title}</h3>

        {/* Items list */}
        <div className="space-y-1.5">
          {achievement.items.slice(0, isHovered ? undefined : 3).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: achievement.color }} />
              <span>{item}</span>
            </motion.div>
          ))}
        </div>

        {/* Expand indicator */}
        {achievement.items.length > 3 && !isHovered && (
          <div className="mt-3 text-xs text-gray-600">
            +{achievement.items.length - 3} more
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AchievementsGrid() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950" />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-gray-300">What We Built</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Achievement <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">Unlocked</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Hover over cards to see details. Every number represents real work—no estimates, no
            approximations.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <AchievementCard key={achievement.title} achievement={achievement} index={index} />
          ))}
        </div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-pink-500/10 border border-white/10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-1">98%</div>
              <div className="text-sm text-gray-400">Vision Complete</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-1">~375</div>
              <div className="text-sm text-gray-400">Total Routes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-1">2</div>
              <div className="text-sm text-gray-400">Months Development</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-1">0</div>
              <div className="text-sm text-gray-400">Known Issues</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
