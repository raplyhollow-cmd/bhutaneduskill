"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, User, LogIn, Compass, GraduationCap, BookOpen, MessageSquare, Settings, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuSections = [
  {
    title: "Explore",
    items: [
      { name: "Home", href: "/", icon: Home },
      { name: "Careers", href: "/dashboard/careers", icon: Compass },
      { name: "About", href: "/about", icon: User },
      { name: "Contact", href: "/contact", icon: MessageSquare },
    ],
  },
  {
    title: "Portals",
    items: [
      { name: "Student", href: "/student", icon: GraduationCap },
      { name: "Teacher", href: "/teacher", icon: BookOpen },
      { name: "Parent", href: "/parent", icon: User },
      { name: "Counselor", href: "/counselor", icon: HeartHandshake },
    ],
  },
];

export function MobileMenuSheet({ isOpen, onClose }: MobileMenuSheetProps) {
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
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {menuSections.map((section, sectionIndex) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: sectionIndex * 0.1 + itemIndex * 0.05,
                            type: "spring",
                            stiffness: 300,
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-4 p-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
              <Link
                href="/sign-in"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200"
                style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
