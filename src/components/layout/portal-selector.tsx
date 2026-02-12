"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, Users, HeartHandshake, Building, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Portal {
  name: string;
  href: string;
  icon: typeof GraduationCap;
  color: string;
  description: string;
}

const portals: Portal[] = [
  {
    name: "Student",
    href: "/student",
    icon: GraduationCap,
    color: "rgb(249 115 22)",
    description: "Take assessments, explore careers, plan your future"
  },
  {
    name: "Teacher",
    href: "/teacher",
    icon: BookOpen,
    color: "rgb(59 130 246)",
    description: "Manage classes, homework, track student progress"
  },
  {
    name: "Parent",
    href: "/parent",
    icon: Users,
    color: "rgb(107 114 128)",
    description: "Monitor child's progress and communicate"
  },
  {
    name: "Counselor",
    href: "/counselor",
    icon: HeartHandshake,
    color: "rgb(168 85 247)",
    description: "Student interventions, sessions, resources"
  },
  {
    name: "School Admin",
    href: "/school-admin",
    icon: Building,
    color: "rgb(139 92 246)",
    description: "Manage school operations, students, teachers"
  },
  {
    name: "Platform Admin",
    href: "/admin",
    icon: Shield,
    color: "rgb(236 72 153)",
    description: "Platform management, schools, billing"
  },
];

interface PortalSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export function PortalSelector({ isOpen, onClose, triggerRef }: PortalSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Mobile Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: isOpen ? 0 : "100%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl p-6"
          >
            <div className="w-full">
              {/* Drag Handle */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Choose Your Portal
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {portals.map((portal, index) => {
                  const Icon = portal.icon;
                  return (
                    <motion.div
                      key={portal.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                    >
                      <Link
                        href={portal.href}
                        onClick={onClose}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-transparent transition-all duration-200 group"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)"
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ background: `${portal.color}15` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: portal.color }} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {portal.name} Portal
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {portal.description}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>

          {/* Desktop Dropdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block fixed z-50 left-1/2 -translate-x-1/2 top-20"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 w-96">
              <div className="grid grid-cols-2 gap-2">
                {portals.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <Link
                      key={portal.name}
                      href={portal.href}
                      onClick={onClose}
                      className="group relative overflow-hidden rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      {/* Hover glow effect */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `${portal.color}08` }}
                      />

                      <div className="relative">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 mx-auto group-hover:scale-110 transition-transform duration-200"
                          style={{ background: `${portal.color}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: portal.color }} />
                        </div>
                        <p className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-tight">
                          {portal.name}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
