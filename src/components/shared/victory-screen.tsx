"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

interface VictoryScreenProps {
  title: string;
  message: string;
  highlights?: string[];
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  portalType?: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";
  className?: string;
}

const PORTAL_GRADIENTS = {
  student: portal.student.gradient,
  teacher: portal.teacher.gradient,
  parent: portal.parent.gradient,
  counselor: portal.counselor.gradient,
  "school-admin": portal.schoolAdmin.gradient,
  admin: portal.admin.gradient,
  ministry: portal.ministry.gradient,
} as const;

const PORTAL_COLORS = {
  student: portal.student.primary,
  teacher: portal.teacher.primary,
  parent: portal.parent.primary,
  counselor: portal.counselor.primary,
  "school-admin": portal.schoolAdmin.primary,
  admin: portal.admin.primary,
  ministry: portal.ministry.primary,
} as const;

export function VictoryScreen({
  title,
  message,
  highlights = [],
  actionLabel,
  actionHref,
  onAction,
  portalType = "student",
  className,
}: VictoryScreenProps) {
  const gradient = PORTAL_GRADIENTS[portalType];
  const color = PORTAL_COLORS[portalType];

  return (
    <div className={cn("text-center space-y-8 py-12 px-6", className)}>
      {/* Animated Success Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative inline-flex"
      >
        {/* Animated rings */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ background: gradient }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0.3 }}
          className="absolute inset-0 rounded-full"
          style={{ background: gradient }}
        />

        {/* Check icon */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white"
          style={{ background: gradient }}
        >
          <CheckCircle2 className="w-12 h-12" />
        </div>
      </motion.div>

      {/* Title and Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-3">{title}</h2>
        <p className="text-slate-600 text-lg max-w-md mx-auto">{message}</p>
      </motion.div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <div
            className="p-6 rounded-2xl border-2 text-left"
            style={{
              background: `${color}08`,
              borderColor: `${color}30`,
            }}
          >
            <ul className="space-y-3">
              {highlights.map((highlight, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-start gap-3 text-sm"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color }} />
                  </span>
                  <span className="text-slate-700">{highlight}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Action Button */}
      {(actionLabel || onAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {actionHref ? (
            <Button
              asChild
              size="lg"
              className="text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ background: gradient }}
            >
              <a href={actionHref}>
                {actionLabel || "Continue"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          ) : (
            <Button
              onClick={onAction}
              size="lg"
              className="text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ background: gradient }}
            >
              {actionLabel || "Continue"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Simplified inline victory screen for wizards
interface InlineVictoryProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  portalType?: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";
}

export function InlineVictory({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  portalType = "student",
}: InlineVictoryProps) {
  const gradient = PORTAL_GRADIENTS[portalType];

  return (
    <div className="text-center py-8 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
        style={{ background: gradient }}
      >
        {icon || <CheckCircle2 className="w-8 h-8 text-white" />}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-slate-900 mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-600 mb-6"
      >
        {subtitle}
      </motion.p>

      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onAction}
          className="px-6 py-2 text-white font-medium rounded-lg"
          style={{ background: gradient }}
        >
          {actionLabel}
        </motion.button>
      )}
    </div>
  );
}
