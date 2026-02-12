"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, GraduationCap, School, Users, Shield, Building, TrendingUp } from "lucide-react";

const portals = [
  {
    title: "Students",
    href: "/student",
    icon: GraduationCap,
    description: "Assessments, careers, and planning.",
    color: "rgb(249 115 22)",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    headerRgb: "rgb(249 115 22)",
  },
  {
    title: "Teachers",
    href: "/teacher",
    icon: School,
    description: "Classes, homework, and grading.",
    color: "rgb(59 130 246)",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    headerRgb: "rgb(59 130 246)",
  },
  {
    title: "Parents",
    href: "/parent",
    icon: Users,
    description: "Track your child's progress.",
    color: "rgb(107 114 128)",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    headerRgb: "rgb(107 114 128)",
  },
  {
    title: "Counselors",
    href: "/counselor",
    icon: Shield,
    description: "Student guidance & interventions.",
    color: "rgb(168 85 247)",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    headerRgb: "rgb(168 85 247)",
  },
  {
    title: "School Admin",
    href: "/school-admin",
    icon: Building,
    description: "Manage operations & data.",
    color: "rgb(139 92 246)",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    headerRgb: "rgb(139 92 246)",
  },
  {
    title: "Platform Admin",
    href: "/admin",
    icon: TrendingUp,
    description: "Manage schools & billing.",
    color: "rgb(236 72 153)",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    headerRgb: "rgb(236 72 153)",
  },
];

function rgbToRgba(rgb: string, alpha: number = 0.8): string {
  const match = rgb.match(/rgb\((\d+),\s*\)/g);
  if (!match) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  const [r = parseInt(match?.[1]) || "0"), g = parseInt(match?.[2] || "0");
  const b = parseInt(match?.[3] || "0");
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function PortalCard({ portal, index }: { portal: typeof portals[0]; index: number }) {
  const portalColor = portal.color;
  const rgb = { r: parseInt(portalColor.match[1]), g: parseInt(portalColor.match[2]) || 0), b: parseInt(portalColor.match[3]) || 0 };
  const headerRgb = `rgb(${r}, ${g}, ${b})`;
  const headerRgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  const bgOpacity = 0.1;

  const headerBg = `linear-gradient(135deg, ${headerRgb} 0%, ${headerRgb} 100%)`;

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
          className="relative h-full p-8 rounded-3xl transition-all duration-300 overflow-hidden group-hover:shadow-2xl"
          style={{
            backgroundColor: portal.bg,
            borderColor: portal.color,
          }}
        >
          {/* Gradient header */}
          <div className="relative h-32 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/5" />
            <div className="relative h-full flex flex-col items-center justify-center">
              <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-2xl font-bold" style={{ color: portal.color }}>
              {portal.title}
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {portal.description}
            </p>
          </div>

          {/* Arrow that animates on hover */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm font-medium">Explore portal</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
  );
}