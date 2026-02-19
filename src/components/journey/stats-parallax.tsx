"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { GitCommit, HardDrive, FileCode, Calendar } from "lucide-react";
import { useRef } from "react";

interface ParallaxCard {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  delay: number;
}

const cards: ParallaxCard[] = [
  {
    icon: <GitCommit className="w-6 h-6" />,
    title: "Version History",
    value: "1.0 → 1.3",
    subtitle: "4 major releases in 2 months",
    gradient: "from-purple-500 to-violet-600",
    delay: 0
  },
  {
    icon: <HardDrive className="w-6 h-6" />,
    title: "Build Count",
    value: "375",
    subtitle: "routes compiled successfully",
    gradient: "from-orange-500 to-red-600",
    delay: 0.1
  },
  {
    icon: <FileCode className="w-6 h-6" />,
    title: "Single Session",
    value: "94",
    subtitle: "files created on Feb 18",
    gradient: "from-cyan-500 to-blue-600",
    delay: 0.2
  }
];

function StatCard({ card, index }: { card: ParallaxCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, index * 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity, scale }}
      className="relative"
    >
      {/* Glow effect */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`absolute -inset-1 opacity-20 blur-xl transition-all duration-300 bg-gradient-to-r ${card.gradient}`}
      />

      {/* Card */}
      <motion.div
        whileHover={{ y: -5 }}
        className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300"
      >
        {/* Icon */}
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white mb-6`}>
          {card.icon}
        </div>

        {/* Value */}
        <h3 className={`text-5xl sm:text-6xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mb-2`}>
          {card.value}
        </h3>

        {/* Title */}
        <p className="text-xl font-semibold text-white mb-2">{card.title}</p>

        {/* Subtitle */}
        <p className="text-gray-400 text-sm">{card.subtitle}</p>
      </motion.div>
    </motion.div>
  );
}

export function StatsParallax() {
  return (
    <section id="stats" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
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
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-gray-300">Build Metrics</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            By the <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Numbers</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Scroll to see key development metrics emerge. These aren't estimates—they're the exact
            counts from our build logs and git history.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <StatCard key={index} card={card} index={index} />
          ))}
        </div>

        {/* Additional metrics row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { label: "Portals", value: "8" },
            { label: "API Routes", value: "200+" },
            { label: "Pages", value: "150+" },
            { label: "DB Tables", value: "115+" }
          ].map((metric, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{metric.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
