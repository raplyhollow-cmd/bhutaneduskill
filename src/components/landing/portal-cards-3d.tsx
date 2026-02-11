"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  UserCircle,
  Building2,
  Settings,
  ArrowRight,
  Sparkles,
  Infinity,
  Zap,
  Shield,
  Eye,
  ChevronRight,
} from "lucide-react";

interface PortalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link: string;
  features: string[];
  index: number;
  badge?: string;
}

// Elegant rounded card with modern design
function PortalCard({
  title,
  description,
  icon,
  color,
  link,
  features,
  index,
  badge,
}: PortalCardProps) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        stiffness: 180,
        damping: 20,
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link href={link} className="block h-full">
        {/* Glass morphism card */}
        <motion.div
          className="relative h-full p-6 lg:p-8 rounded-[2rem] border backdrop-blur-sm overflow-hidden transition-all duration-300"
          style={{
            background: hovered
              ? "rgb(255, 255, 255)"
              : "linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(249, 250, 251) 100%)",
            borderColor: hovered ? color : "rgb(229, 231, 235)",
            borderWidth: hovered ? "2px" : "1px",
            boxShadow: hovered
              ? `0 20px 40px -10px ${color.replace("linear-gradient(135deg, ", "").replace(")", "").replace(/, /g, ",")}, 0 10px 30px 0px rgb(0 0 0 / 0.1)`
              : "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
          }}
        >
          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0 rounded-[2rem] opacity-0 pointer-events-none"
            animate={{ opacity: hovered ? 0.08 : 0 }}
            style={{ background: color }}
          />

          {/* Shine effect on hover */}
          {hovered && (
            <motion.div
              className="absolute inset-0 rounded-[2rem] opacity-0 pointer-events-none"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              }}
            />
          )}

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Badge */}
            {badge && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.08 + 0.2, type: "spring", stiffness: 200 }}
                className="absolute -top-2 -right-2 z-20"
              >
                <div className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {badge}
                </div>
              </motion.div>
            )}

            {/* Icon with floating animation */}
            <motion.div
              className="mb-5"
              animate={hovered ? { y: 0 } : { y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="w-16 h-16 lg:w-20 h-16 lg:h-20 rounded-2xl flex items-center justify-center text-white shadow-lg relative overflow-hidden"
                style={{ background: color }}
              >
                {icon}
                {/* Inner shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"
                  animate={{
                    backgroundPosition: ["0% 0%", "200% 0%"],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
              {title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
              {description}
            </p>

            {/* Features */}
            <ul className="space-y-2 mb-5">
              {features.slice(0, 3).map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.08 + i * 0.05,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 150,
                  }}
                  className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
                >
                  <motion.div
                    animate={hovered ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  {feature}
                </motion.li>
              ))}
            </ul>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* CTA */}
            <motion.div
              className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800"
              animate={hovered ? { x: [0, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: color.split(",")[0]?.replace("linear-gradient(135deg, ", "") }}
              >
                {hovered ? "Explore" : "Open"}
              </span>
              <ChevronRight
                className="w-4 h-4"
                style={{ color: color.split(",")[0]?.replace("linear-gradient(135deg, ", "") }}
              />
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Portal colors - consistent gradients
const colors = {
  student: "linear-gradient(135deg, rgb(249, 115, 22), rgb(194, 65, 12))",
  teacher: "linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))",
  parent: "linear-gradient(135deg, rgb(107, 114, 128), rgb(75, 85, 99))",
  counselor: "linear-gradient(135deg, rgb(168, 85, 247), rgb(147, 51, 234))",
  schoolAdmin: "linear-gradient(135deg, rgb(139, 92, 246), rgb(124, 58, 237))",
  platformAdmin: "linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119))",
};

const solidColors = {
  student: "rgb(249, 115, 22)",
  teacher: "rgb(59, 130, 246)",
  parent: "rgb(107, 114, 128)",
  counselor: "rgb(168, 85, 247)",
  schoolAdmin: "rgb(139, 92, 246)",
  platformAdmin: "rgb(236, 72, 153)",
};

export function PortalGridSection() {
  const portals = [
    {
      title: "Student Portal",
      description: "AI assessments, career matching, personalized roadmaps, and more.",
      icon: <GraduationCap className="w-8 h-8 lg:w-9 h-9" />,
      color: colors.student,
      link: "/student",
      features: ["AI Career Assessments", "Personalized Roadmap", "RUB Colleges", "Scholarships"],
      badge: "Popular",
    },
    {
      title: "Teacher Portal",
      description: "Class management, homework tools, attendance, and gradebook.",
      icon: <BookOpen className="w-8 h-8 lg:w-9 h-9" />,
      color: colors.teacher,
      link: "/teacher",
      features: ["Class Management", "Homework Creator", "Attendance Tracker", "Grade Book"],
    },
    {
      title: "Parent Portal",
      description: "Track your child's progress, attendance, and stay connected.",
      icon: <Users className="w-8 h-8 lg:w-9 h-9" />,
      color: colors.parent,
      link: "/parent",
      features: ["Progress Dashboard", "Attendance", "Fee Payments", "Messages"],
    },
    {
      title: "Counselor Portal",
      description: "Guide students with data-driven insights and interventions.",
      icon: <UserCircle className="w-8 h-8 lg:w-9 h-9" />,
      color: colors.counselor,
      link: "/counselor",
      features: ["Student Profiles", "Interventions", "Assessment Tools", "Reports"],
    },
    {
      title: "School Admin",
      description: "Complete school management from enrollment to announcements.",
      icon: <Building2 className="w-8 h-8 lg:w-9 h-9" />,
      color: colors.schoolAdmin,
      link: "/school-admin",
      features: ["Student Management", "Staff Directory", "Announcements", "Analytics"],
    },
    {
      title: "Platform Admin",
      description: "Multi-school management and platform-wide settings.",
      icon: <Settings className="w-8 h-8 lg:w-9 h-9" />,
      color: colors.platformAdmin,
      link: "/admin",
      features: ["Multi-School", "Platform Analytics", "Content Management", "Billing"],
      badge: "Admin",
    },
  ];

  return (
    <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-orange-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950/20 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl"
          animate={{
            y: [0, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, type: "spring" }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg mb-8"
          >
            <Infinity className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wide">ONE UNIFIED ECOSYSTEM</span>
            <Zap className="w-5 h-5" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black dark:font-bold text-gray-900 dark:text-white mb-4 leading-tight"
          >
            Six Portals,{" "}
            <span className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent">
              One Platform
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Every stakeholder in a student's journey — connected, synchronized, and working together.
          </motion.p>
        </motion.div>

        {/* Portal Cards - Now with more elegant rounded design */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
          {portals.map((portal, index) => (
            <PortalCard key={portal.title} {...portal} index={index} />
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 lg:mt-16"
        >
          <div
            className="relative overflow-hidden rounded-[2rem] p-8 lg:p-10 text-center"
            style={{
              background: "linear-gradient(135deg, rgb(249, 115, 22) 0%, rgb(194, 65, 12) 50%, rgb(139, 92, 246) 100%)",
            }}
          >
            {/* Floating decorative icons */}
            <motion.div
              animate={{ y: [0, 0], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-6 left-8 text-white/20"
            >
              <GraduationCap className="w-10 h-10" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
              className="absolute bottom-6 right-8 text-white/20"
            >
              <BookOpen className="w-10 h-10" />
            </motion.div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-6">
              <div className="text-white text-center">
                <h3 className="text-2xl lg:text-3xl font-bold mb-2">
                  Ready to transform your journey?
                </h3>
                <p className="text-white/90">
                  Join thousands using Career Compass today.
                </p>
              </div>
              <Link
                href="/sign-up"
                className="group px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-8 lg:gap-12 pt-8"
        >
          {[
            { icon: Shield, text: "Secure & Private" },
            { icon: Eye, text: "Real-time Sync" },
            { icon: Infinity, text: "Unlimited Access" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm"
            >
              <item.icon className="w-5 h-5" style={{ color: solidColors[Object.keys(colors)[i] as keyof typeof solidColors] }} />
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
