"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, GraduationCap, ArrowRight, Building } from "lucide-react";
import { useRef, useState, useCallback } from "react";

const colleges = [
  {
    short: "CST",
    name: "College of Science and Technology",
    location: "Phuentsholing",
    programs: "Engineering, Architecture, IT",
    color: "from-blue-500 to-cyan-500",
    icon: "🔧",
  },
  {
    short: "CoE",
    name: "College of Education",
    location: "Paro",
    programs: "B.Ed Primary, B.Ed Secondary",
    color: "from-green-500 to-emerald-500",
    icon: "📚",
  },
  {
    short: "CNR",
    name: "College of Natural Resources",
    location: "Lobesa",
    programs: "Agriculture, Forestry, Environment",
    color: "from-lime-500 to-green-500",
    icon: "🌿",
  },
  {
    short: "GCBS",
    name: "Gaeddu College of Business Studies",
    location: "Gaeddu",
    programs: "BBA, B.Com",
    color: "from-purple-500 to-pink-500",
    icon: "💼",
  },
  {
    short: "Sherubtse",
    name: "Sherubtse College",
    location: "Trashigang",
    programs: "Arts, Science, Commerce",
    color: "from-orange-500 to-red-500",
    icon: "🎓",
  },
];

// Expanding card component
function ExpandingCollegeCard({
  college,
  index,
}: {
  college: typeof colleges[0];
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: 50, y: 50 });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group"
    >
      <Link href="/dashboard/rub" className="block">
        <div
          className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border-2 transition-all duration-500 ${
            isExpanded
              ? "border-orange-400 dark:border-orange-600 shadow-2xl shadow-orange-500/20"
              : "border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl"
          }`}
          style={{
            background: isExpanded
              ? `linear-gradient(135deg, rgba(255,255,255,1), rgba(251,146,60,0.05))`
              : "rgba(255,255,255,0.95)",
          }}
        >
          {/* Spotlight effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle 300px at ${mousePosition.x}% ${mousePosition.y}%, rgba(249, 115, 22, 0.1), transparent 60%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-5 md:p-6">
            {/* Header with badge */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Short name badge */}
                <motion.div
                  animate={isExpanded ? { rotate: [0, -5, 5, -5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{
                    background: `linear-gradient(to bottom right, ${college.color})`,
                  }}
                >
                  {college.short}
                </motion.div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {college.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {college.location}
                  </div>
                </div>
              </div>

              {/* Animated icon */}
              <motion.span
                animate={isExpanded ? { rotate: 360 } : {}}
                transition={{ duration: 0.6, type: "spring" }}
                className="text-2xl"
              >
                {college.icon}
              </motion.span>
            </div>

            {/* Programs - expandable */}
            <div
              className={`overflow-hidden transition-all duration-500 ${
                isExpanded ? "max-h-20 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programs offered:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {college.programs}
                </p>
              </div>
            </div>

            {/* Hover reveal indicator */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  View all programs
                </span>
              </div>
              <motion.div
                animate={{ x: isExpanded ? 5 : 0 }}
                className="p-2 rounded-full text-white flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${college.color})`,
                }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function RUBCollegesSection() {
  const ref = useRef(null);

  return (
    <section className="relative py-24 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/30 dark:to-gray-950 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-[10%] w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-[10%] w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header with parallax effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4"
          >
            <Building className="w-4 h-4" />
            Royal University of Bhutan
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Your Path to
            <span className="block gradient-text-animated mt-2">Higher Education</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore all 11 RUB colleges, their programs, and find the perfect fit for your future.
          </p>
        </motion.div>

        {/* Colleges Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {colleges.map((college, index) => (
            <ExpandingCollegeCard key={college.short} college={college} index={index} />
          ))}
        </div>

        {/* Additional colleges notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">
              Plus 6 more colleges across Bhutan
            </span>
            <Link
              href="/dashboard/rub"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105 transition-all"
            >
              View all colleges
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { value: "11", label: "Colleges" },
            { value: "50+", label: "Programs" },
            { value: "8", label: "Locations" },
            { value: "100%", label: "Placement" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="text-center p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg hover:shadow-orange-500/10 transition-all group"
            >
              <div className="text-2xl md:text-3xl font-bold gradient-text-animated mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
