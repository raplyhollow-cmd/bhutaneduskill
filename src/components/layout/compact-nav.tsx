"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Home, User, MoreHorizontal, LogIn, Zap, GraduationCap, BookOpen, Users, HeartHandshake, Building, Shield, Trophy, Landmark, GraduationCap as AlumniIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalSelector } from "./portal-selector";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { Button } from "@/components/ui/button";
import { portal as portalTokens, semantic } from "@/styles/design-tokens";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: User },
  { name: "Journey", href: "/journey", icon: Trophy },
];

const portals = [
  {
    name: "Student",
    href: "/student",
    icon: GraduationCap,
    color: portalTokens.student.primary,
    description: "Take assessments, explore careers, plan your future"
  },
  {
    name: "Teacher",
    href: "/teacher",
    icon: BookOpen,
    color: portalTokens.teacher.primary,
    description: "Manage classes, homework, track student progress"
  },
  {
    name: "Parent",
    href: "/parent",
    icon: Users,
    color: portalTokens.parent.primary,
    description: "Monitor child's progress and communicate"
  },
  {
    name: "Counselor",
    href: "/counselor",
    icon: HeartHandshake,
    color: portalTokens.counselor.primary,
    description: "Student interventions, sessions, resources"
  },
  {
    name: "Alumni",
    href: "/alumni",
    icon: AlumniIcon,
    color: semantic.success.primary,
    description: "Network, mentorship, and career opportunities"
  },
  {
    name: "School Admin",
    href: "/school-admin",
    icon: Building,
    color: portalTokens.schoolAdmin.primary,
    description: "Manage school operations, students, teachers"
  },
  {
    name: "Ministry",
    href: "/ministry",
    icon: Landmark,
    color: portalTokens.counselor.primary,
    description: "National education oversight, analytics, policies"
  },
  {
    name: "Platform Admin",
    href: "/admin",
    icon: Shield,
    color: portalTokens.admin.primary,
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ceramic-white/90 dark:bg-ceramic-gray-900/90 backdrop-blur-xl border-t border-ceramic-border pb-safe"
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
              ? "text-ceramic-brand"
              : "text-ceramic-secondary"
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
              ? "text-ceramic-brand"
              : "text-ceramic-secondary"
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
              ? "text-ceramic-brand"
              : "text-ceramic-secondary"
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
              ? "text-ceramic-brand"
              : "text-ceramic-secondary"
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
              ? "text-ceramic-brand"
              : "text-ceramic-secondary"
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
        className="flex items-center gap-1 px-2 py-2 rounded-full bg-ceramic-white/85 dark:bg-ceramic-gray-900/85 backdrop-blur-xl border border-ceramic-border shadow-xl"
        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: portalTokens.student.gradient }}
          >
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-ceramic-primary dark:text-white text-sm hidden lg:block">
            Bhutan EduSkill
          </span>
        </Link>

        <div className="w-px h-6 bg-ceramic-border" />

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
                  ? "text-ceramic-brand bg-ceramic-brand/10"
                  : "text-ceramic-secondary hover:text-ceramic-primary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{link.name}</span>
            </Link>
          );
        })}

        <div className="w-px h-6 bg-ceramic-border" />

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
                ? "text-ceramic-brand bg-ceramic-brand/10"
                : "text-ceramic-secondary hover:text-ceramic-primary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
            )}
          >
            <Compass className="w-4 h-4" />
            <span>Portals</span>
          </button>

          {/* Hover Dropdown */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50">
            <div className="bg-ceramic-white/95 dark:bg-ceramic-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-ceramic-border p-2 w-64">
              <div className="grid grid-cols-1 gap-1">
                {portals.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <Link
                      key={portal.name}
                      href={portal.href}
                      className="group/item flex items-center gap-3 p-3 rounded-xl hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800 transition-all duration-200"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200 flex-shrink-0"
                        style={{ background: `${portal.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: portal.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ceramic-primary group-hover/item:text-ceramic-brand transition-colors truncate">
                          {portal.name}
                        </p>
                        <p className="text-xs text-ceramic-dimmed truncate">
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

        <div className="w-px h-6 bg-ceramic-border" />

        {/* Sign In */}
        <Link
          href="/sign-in"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium",
            pathname === "/sign-in"
              ? "text-ceramic-brand bg-ceramic-brand/10"
              : "text-ceramic-secondary hover:text-ceramic-primary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
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
