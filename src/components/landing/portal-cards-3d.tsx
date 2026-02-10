"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";

interface PortalCard3DProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  link: string;
  features: string[];
  index: number;
  badge?: string;
}

export function PortalCard3D({
  title,
  description,
  icon,
  gradient,
  link,
  features,
  index,
  badge,
}: PortalCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Mouse position values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring values for smooth rotation
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      className="relative h-full"
    >
      <Link href={link} className="block h-full">
        <motion.div
          className="relative h-full p-[1px] rounded-3xl overflow-hidden"
          style={{
            background: hovered
              ? `linear-gradient(135deg, ${gradient}, transparent, ${gradient})`
              : "linear-gradient(135deg, rgba(200,200,200,0.3), transparent, rgba(200,200,200,0.3))",
            backgroundSize: "200% 200%",
          }}
          animate={hovered ? { backgroundPosition: "200% 200%" } : {}}
          transition={{ duration: 1 }}
        >
          {/* Card content */}
          <div className="relative h-full bg-white dark:bg-gray-900 rounded-3xl p-6 overflow-hidden">
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-4 opacity-0"
              animate={hovered ? { opacity: 0.3 } : { opacity: 0 }}
              style={{
                background: `radial-gradient(circle at ${x.get() * 100 + 50}% ${
                  y.get() * 100 + 50
                }%, ${gradient}, transparent 70%)`,
              }}
            />

            {/* Floating particles */}
            {hovered && (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      background: gradient,
                      left: `${20 + i * 30}%`,
                      top: `${20 + i * 20}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </>
            )}

            {/* Content */}
            <div className="relative z-10">
              {/* Badge */}
              {badge && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={hovered ? { scale: 1 } : { scale: 0.8 }}
                  className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full"
                >
                  {badge}
                </motion.div>
              )}

              {/* Icon */}
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${gradient}, ${gradient}80)`,
                }}
                animate={hovered ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{ duration: 0.5 }}
              >
                {icon}
              </motion.div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0.5, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <motion.span
                      animate={hovered ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.3 }}
                      className="w-1.5 h-1.5 rounded-full bg-green-500"
                    />
                    {feature}
                  </motion.li>
                ))}
              </ul>

              {/* Arrow indicator */}
              <motion.div
                className="flex items-center gap-2 text-sm font-semibold"
                style={{
                  color: gradient.split(",")[0]?.replace("rgb(", "").replace(")", "") || "#f97316",
                }}
              >
                Explore
                <motion.span
                  animate={hovered ? { x: [0, 5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  →
                </motion.span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Portal Grid Section
export function PortalGridSection() {
  const portals = [
    {
      title: "Student Portal",
      description: "Discover careers, plan your path, and track your journey",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, rgb(249, 115, 22), rgb(194, 65, 12))",
      link: "/student",
      features: [
        "Career assessments",
        "Personalized plans",
        "RUB college search",
        "Scholarship finder",
      ],
      badge: "Popular",
    },
    {
      title: "Teacher Portal",
      description: "Manage classes, create homework, and track student progress",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))",
      link: "/teacher",
      features: [
        "Class management",
        "Homework creator",
        "Grade book",
        "Live sessions",
      ],
    },
    {
      title: "Parent Portal",
      description: "Monitor your child's progress and support their journey",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, rgb(107, 114, 128), rgb(75, 85, 99))",
      link: "/parent",
      features: [
        "Child progress dashboard",
        "Attendance tracking",
        "Fee payments",
        "Teacher messages",
      ],
    },
    {
      title: "Counselor Portal",
      description: "Guide students with data-driven insights and interventions",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, rgb(168, 85, 247), rgb(147, 51, 234))",
      link: "/counselor",
      features: [
        "Student profiles",
        "Intervention tracking",
        "Session notes",
        "Assessment tools",
      ],
    },
    {
      title: "School Admin",
      description: "Manage your entire school from one powerful dashboard",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, rgb(139, 92, 246), rgb(124, 58, 237))",
      link: "/school-admin",
      features: [
        "Student enrollment",
        "Staff management",
        "Timetable generation",
        "Analytics reports",
      ],
      badge: "Admin",
    },
    {
      title: "Platform Admin",
      description: "Manage multiple schools and platform-wide settings",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119))",
      link: "/admin",
      features: [
        "Multi-school management",
        "Platform analytics",
        "Content management",
        "Billing & subscriptions",
      ],
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-orange-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

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
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50 mb-6"
          >
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Six Powerful Portals
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            One Ecosystem,
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {" "}Infinite Possibilities
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Every stakeholder in a student's journey has a dedicated portal. Connected by data,
            united by purpose.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal, index) => (
            <div key={portal.title} className="h-[340px]">
              <PortalCard3D {...portal} index={index} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Not sure which portal is right for you?
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold hover:underline"
          >
            Take our quiz to find out
            <span>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
