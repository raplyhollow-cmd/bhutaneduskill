"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Home, User, MoreHorizontal, LogIn, Zap, GraduationCap, BookOpen, Users, HeartHandshake, Building, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalSelector } from "./portal-selector";
import { MobileMenuSheet } from "./mobile-menu-sheet";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: User },
];

const portals = [
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

export function CompactNav() {
  const pathname = usePathname();
  const [portalOpen, setPortalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const portalButtonRef = useRef<HTMLButtonElement>(null);

  const handlePortalClick = () => {
    setPortalOpen(true);
  };

  // Mobile Tab Bar Component
  const MobileTabBar = () => (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 pb-safe"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home Tab */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
            pathname === "/"
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Home className={cn("w-5 h-5", pathname === "/" && "fill-current")} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* About Tab */}
        <Link
          href="/about"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
            pathname === "/about"
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <User className={cn("w-5 h-5", pathname === "/about" && "fill-current")} />
          <span className="text-[10px] font-medium">About</span>
        </Link>

        {/* Portals Tab */}
        <button
          ref={portalButtonRef}
          onClick={handlePortalClick}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
            portalOpen
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Compass className={cn("w-5 h-5", portalOpen && "fill-current")} />
          <span className="text-[10px] font-medium">Portals</span>
        </button>

        {/* Sign In Tab */}
        <Link
          href="/sign-in"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
            pathname === "/sign-in"
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <LogIn className={cn("w-5 h-5", pathname === "/sign-in" && "fill-current")} />
          <span className="text-[10px] font-medium">Sign In</span>
        </Link>

        {/* Menu Tab */}
        <button
          onClick={() => setMenuOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
            menuOpen
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <MoreHorizontal className={cn("w-5 h-5", menuOpen && "fill-current")} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </motion.nav>
  );

  // Desktop Floating Pill Component
  const DesktopPillNav = () => (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 16, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-40"
    >
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-full bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl shadow-gray-200/50"
        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}>
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-sm hidden lg:block">
            Bhutan EduSkill
          </span>
        </Link>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Nav Links */}
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium",
                isActive
                  ? "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-400/10"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{link.name}</span>
            </Link>
          );
        })}

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Portals Dropdown - Hover */}
        <div
          className="relative group"
        >
          <button
            ref={portalButtonRef}
            onClick={handlePortalClick}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium",
              portalOpen
                ? "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-400/10"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Compass className="w-4 h-4" />
            <span>Portals</span>
          </button>

          {/* Hover Dropdown */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 w-64">
              <div className="grid grid-cols-1 gap-1">
                {portals.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <Link
                      key={portal.name}
                      href={portal.href}
                      className="group/item flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200 flex-shrink-0"
                        style={{ background: `${portal.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: portal.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors truncate">
                          {portal.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {portal.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Sign In */}
        <Link
          href="/sign-in"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium",
            pathname === "/sign-in"
              ? "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-400/10"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden lg:inline">Sign In</span>
        </Link>

        {/* Get Started Button */}
        <Link
          href="/sign-up"
          className="flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium text-white hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Zap className="w-4 h-4" />
          <span className="hidden lg:inline">Get Started</span>
        </Link>
      </div>
    </motion.nav>
  );

  return (
    <>
      <DesktopPillNav />
      <MobileTabBar />

      {/* Portal Selector Overlay */}
      <PortalSelector
        isOpen={portalOpen}
        onClose={() => setPortalOpen(false)}
        triggerRef={portalButtonRef}
      />

      {/* Mobile Menu Sheet */}
      <MobileMenuSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Spacer for mobile to prevent content hidden behind tab bar */}
      <div className="md:hidden h-16" />
      {/* Spacer for desktop to prevent content hidden behind floating nav */}
      <div className="hidden md:block h-24" />
    </>
  );
}
