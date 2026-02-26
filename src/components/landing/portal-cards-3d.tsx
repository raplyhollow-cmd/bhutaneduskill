"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, GraduationCap, School, Users, Shield, Building, TrendingUp } from "lucide-react";
import { portal } from "@/styles/design-tokens";

const portals = [
  {
    title: "Students",
    href: "/sign-in?redirect=/student",
    icon: GraduationCap,
    description: "Assessments, careers, and planning.",
    color: portal.student.primary,
    bg: "bg-orange-50 dark:bg-orange-950/20",
    headerRgb: portal.student.primary,
  },
  {
    title: "Teachers",
    href: "/sign-in?redirect=/teacher",
    icon: School,
    description: "Classes, homework, and grading.",
    color: portal.teacher.primary,
    bg: "bg-blue-50 dark:bg-blue-950/20",
    headerRgb: portal.teacher.primary,
  },
  {
    title: "Parents",
    href: "/sign-in?redirect=/parent",
    icon: Users,
    description: "Track your child's progress.",
    color: portal.parent.primary,
    bg: "bg-purple-50 dark:bg-purple-950/20",
    headerRgb: portal.parent.primary,
  },
  {
    title: "Counselors",
    href: "/sign-in?redirect=/counselor",
    icon: Shield,
    description: "Student guidance & interventions.",
    color: portal.counselor.primary,
    bg: "bg-violet-50 dark:bg-violet-950/20",
    headerRgb: portal.counselor.primary,
  },
  {
    title: "School Admin",
    href: "/sign-in?redirect=/school-admin",
    icon: Building,
    description: "Manage operations & data.",
    color: portal.schoolAdmin.primary,
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    headerRgb: portal.schoolAdmin.primary,
  },
  {
    title: "Platform Admin",
    href: "/sign-in?redirect=/admin",
    icon: TrendingUp,
    description: "Manage schools & billing.",
    color: portal.admin.primary,
    bg: "bg-pink-50 dark:bg-pink-950/20",
    headerRgb: portal.admin.primary,
  },
];

function rgbToRgba(rgb: string, alpha: number = 0.8): string {
  const match = rgb.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\)/);
  if (!match) return rgb;
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function PortalCard({ portal, index }: { portal: typeof portals[0]; index: number }) {
  const Icon = portal.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ y: -12 }}
      className="h-full"
    >
      <Link href={portal.href} className="block h-full group">
        <div
          className="relative h-full p-8 rounded-3xl transition-all duration-300 overflow-hidden group-hover:shadow-2xl bg-white dark:bg-gray-800"
        >
          {/* Icon */}
          <div className="relative h-24 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundColor: portal.color }}
            />
            <Icon className="w-12 h-12 relative z-10" style={{ color: portal.color }} strokeWidth={1.5} />
          </div>

          {/* Content */}
          <div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: portal.color }}>
              {portal.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {portal.description}
            </p>
          </div>

          {/* Arrow on hover */}
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-5 h-5" style={{ color: portal.color }} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function PortalCards3D() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal, index) => (
            <PortalCard key={portal.href} portal={portal} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}