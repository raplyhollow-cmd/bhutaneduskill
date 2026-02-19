"use client";

import { motion, useSpring, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Terminal, GitCommit, Code2, Zap } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  color: string;
}

const stats: StatItem[] = [
  { label: "Vision Complete", value: 98, suffix: "%", color: "text-purple-400" },
  { label: "Routes Compiled", value: 375, color: "text-orange-400" },
  { label: "Database Tables", value: 115, suffix: "+", color: "text-pink-400" },
  { label: "Portals Deployed", value: 8, color: "text-cyan-400" },
  { label: "Errors Fixed", value: 173, color: "text-green-400" },
];

function Counter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const spring = useSpring(0, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (latest) => Math.floor(latest).toLocaleString());
  const [currentValue, setCurrentValue] = useState("0");

  useEffect(() => {
    const controls = animate(spring, value);
    const unsubscribe = display.on("change", (latest) => setCurrentValue(latest));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [spring, value, display]);

  return (
    <span className="font-mono">
      {prefix}
      {currentValue}
      {suffix}
    </span>
  );
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Gradient glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-3xl"
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

function CodeSnippet() {
  const [visibleLines, setVisibleLines] = useState(0);

  const codeLines = [
    '$ git log --oneline -10',
    'a2f2281 fix: API errors, school search seeding',
    'a2020a9 feat: add AI journal features',
    '22c0af0 docs: update changelog',
    'de89bed fix: resolve portal access issues',
    '74b7d91 fix: restore login routing',
    '...',
    '$ npm run build',
    '✓ Building...',
    '✓ 375 routes compiled',
    '✓ Build successful',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev < codeLines.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-80">
      <div className="relative bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-4 font-mono text-xs">
        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-gray-500">terminal</span>
        </div>

        {/* Terminal content */}
        <div className="space-y-1">
          {codeLines.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={
                line.includes('fix:') || line.includes('feat:') || line.includes('docs:')
                  ? 'text-gray-400'
                  : line.includes('✓')
                  ? 'text-green-400'
                  : line.includes('$')
                  ? 'text-purple-400'
                  : 'text-gray-500'
              }
            >
              {line}
            </motion.div>
          ))}

          {/* Cursor */}
          {visibleLines >= codeLines.length && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
              className="text-purple-400"
            >
              ▊
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}

export function JourneyHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8"
            >
              <Terminal className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">The Development Documentary</span>
            </motion.div>

            {/* Main heading */}
            <h1 className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-purple-400"
              >
                &lt;
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-gradient-to-r from-purple-400 via-orange-400 to-pink-400 bg-clip-text text-transparent"
              >
                Journey
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-purple-400"
              >
                /&gt;
              </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-400 mb-12 max-w-lg mx-auto lg:mx-0"
            >
              From the first commit to 98% vision complete. A technical documentary of building
              Bhutan EduSkill.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <a
                href="#timeline"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
              >
                <GitCommit className="w-4 h-4" />
                Explore Timeline
              </a>
              <a
                href="#stats"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all hover:scale-105"
              >
                <Code2 className="w-4 h-4" />
                View Metrics
              </a>
            </motion.div>
          </motion.div>

          {/* Right side - Stats grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <CodeSnippet />

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:ml-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
                    <div className={`text-3xl sm:text-4xl font-bold mb-2 ${stat.color}`}>
                      <Counter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
            className="w-6 h-10 border border-white/20 rounded-full flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ scaleY: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
              className="w-1 h-2 bg-white/60 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
