"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Users, GraduationCap, Building2, Award, TrendingUp, Heart } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  description: string;
  color: string;
  delay: number;
  prefix?: string;
}

function StatCard({
  icon,
  value,
  suffix = "",
  label,
  description,
  color,
  delay,
  prefix = "",
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [count, setCount] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  // Animate count when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      className="relative group"
    >
      {/* Particle effects on hover */}
      <div className="absolute inset-0 pointer-events-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-100"
            style={{
              background: color,
              left: `${20 * i}%`,
              top: "50%",
            }}
            animate={{
              y: [0, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.1,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ delay, duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 overflow-hidden"
        whileHover={{
          borderColor: color,
          boxShadow: `0 20px 40px -10px ${color}40`,
        }}
      >
        {/* Background gradient */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${color}08, transparent)`,
          }}
        />

        {/* Icon */}
        <motion.div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `${color}20` }}
          whileHover={{
            scale: 1.1,
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ color }}>{icon}</div>
        </motion.div>

        {/* Value */}
        <div className="mb-2">
          <motion.div
            className="text-5xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${color}, ${color}cc)`,
            }}
          >
            {prefix}
            {count.toLocaleString()}
            {suffix}
          </motion.div>
        </div>

        {/* Label */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {label}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>

        {/* Glow effect */}
        <motion.div
          className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          style={{ background: color }}
        />
      </motion.div>
    </motion.div>
  );
}

export function StatsParticlesSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const stats: StatCardProps[] = [
    {
      icon: <Users className="w-8 h-8" />,
      value: 10000,
      suffix: "+",
      label: "Students",
      description: "Active users across Bhutan",
      color: "#f97316",
      delay: 0,
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      value: 50,
      suffix: "+",
      label: "Schools",
      description: "Partner institutions nationwide",
      color: "#3b82f6",
      delay: 0.1,
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      value: 11,
      suffix: "",
      label: "RUB Colleges",
      description: "Full program integration",
      color: "#10b981",
      delay: 0.2,
    },
    {
      icon: <Award className="w-8 h-8" />,
      value: 95,
      suffix: "%",
      label: "Satisfaction",
      description: "Student happiness rate",
      color: "#8b5cf6",
      delay: 0.3,
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      value: 5000,
      suffix: "+",
      label: "Career Matches",
      description: "Students found their path",
      color: "#ec4899",
      delay: 0.4,
    },
    {
      icon: <Heart className="w-8 h-8" />,
      value: 4.9,
      suffix: "/5",
      label: "Average Rating",
      description: "From student reviews",
      color: "#ef4444",
      delay: 0.5,
      prefix: "★ ",
    },
  ];

  return (
    <section
      ref={containerRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-orange-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950/20 overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Moving gradient blobs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.1), transparent 70%)",
          }}
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 100, 0],
            y: [0, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 0],
            y: [0, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50 mb-6"
          >
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              ✨
            </motion.span>
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Our Impact
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Making a Real
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {" "}Difference
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of students, teachers, and parents who trust Career Compass to guide
            their educational journey.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Additional stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Districts Covered", value: "20+" },
            { label: "Assessments", value: "5 Types" },
            { label: "Scholarships", value: "100+" },
            { label: "Countries", value: "5+" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="text-center p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {item.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-400"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-sm">Data Secure</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
