"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Home, User, MoreHorizontal, LogIn, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { portal as portalTokens } from "@/styles/design-tokens";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: User },
  { name: "Journey", href: "/journey", icon: Trophy },
];

export function CompactNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] active:scale-95 active:bg-gray-100",
              pathname === "/"
                ? "text-orange-600"
                : "text-gray-900"
            )}
          >
            <Home className={cn("w-5 h-5", pathname === "/" && "fill-current")} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
        </motion.div>

        {/* About Tab */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/about"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] active:scale-95 active:bg-gray-100",
              pathname === "/about"
                ? "text-orange-600"
                : "text-gray-900"
            )}
          >
            <User className={cn("w-5 h-5", pathname === "/about" && "fill-current")} />
            <span className="text-[10px] font-medium">About</span>
          </Link>
        </motion.div>

        {/* Portals Tab */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/portals"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] active:scale-95 active:bg-gray-100",
              pathname === "/portals"
                ? "text-orange-600"
                : "text-gray-900"
            )}
          >
            <Compass className={cn("w-5 h-5", pathname === "/portals" && "fill-current")} />
            <span className="text-[10px] font-medium">Portals</span>
          </Link>
        </motion.div>

        {/* Sign In Tab */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/sign-in"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] active:scale-95 active:bg-gray-100",
              pathname?.startsWith("/sign-in")
                ? "text-orange-600"
                : "text-gray-900"
            )}
          >
            <LogIn className={cn("w-5 h-5", pathname?.startsWith("/sign-in") && "fill-current")} />
            <span className="text-[10px] font-medium">Sign In</span>
          </Link>
        </motion.div>

        {/* Menu Tab */}
        <motion.button
          onClick={() => setMenuOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] active:scale-95 active:bg-gray-100",
            menuOpen
              ? "text-orange-600"
              : "text-gray-900"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MoreHorizontal className={cn("w-5 h-5", menuOpen && "fill-current")} />
          <span className="text-[10px] font-medium">Menu</span>
        </motion.button>
      </div>
    </motion.nav>
  );

  // Desktop Floating Pill Component
  const DesktopPillNav = () => (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 16, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden lg:block fixed top-4 left-1/2 -translate-x-1/2 z-40 max-w-full"
    >
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-full bg-ceramic-white/85 dark:bg-ceramic-gray-900/85 backdrop-blur-xl border border-ceramic-border shadow-xl whitespace-nowrap"
        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)" }}
      >
        {/* Logo - BES abbreviation with full text */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 whitespace-nowrap"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: portalTokens.student.gradient }}
            >
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-ceramic-primary dark:text-white text-sm whitespace-nowrap">
              Bhutan EduSkill
            </span>
          </Link>
        </motion.div>

        <div className="w-px h-6 bg-ceramic-border flex-shrink-0" />

        {/* Nav Links */}
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <motion.div
              key={link.name}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98, y: 0 }}
            >
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium whitespace-nowrap",
                  isActive
                    ? "text-ceramic-brand bg-ceramic-brand/10"
                    : "text-ceramic-secondary hover:text-ceramic-primary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{link.name}</span>
              </Link>
            </motion.div>
          );
        })}

        <div className="w-px h-6 bg-ceramic-border flex-shrink-0" />

        {/* Portals Link */}
        <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98, y: 0 }}>
          <Link
            href="/portals"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium whitespace-nowrap",
              pathname === "/portals"
                ? "text-ceramic-brand bg-ceramic-brand/10"
                : "text-ceramic-secondary hover:text-ceramic-primary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
            )}
          >
            <Compass className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Portals</span>
          </Link>
        </motion.div>

        <div className="w-px h-6 bg-ceramic-border flex-shrink-0" />

        {/* Sign In / Get Started Button */}
        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98, y: 0 }}
        >
          <Link
            href="/sign-in"
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium text-white hover:shadow-lg whitespace-nowrap block"
            style={{
              background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
            }}
          >
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Sign In / Get Started</span>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  );

  // Tablet/Small Desktop Nav - Compact version
  const TabletNav = () => (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 16, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:block lg:hidden fixed top-4 left-1/2 -translate-x-1/2 z-40"
    >
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-full bg-ceramic-white/85 dark:bg-ceramic-gray-900/85 backdrop-blur-xl border border-ceramic-border shadow-xl"
        style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)" }}
      >
        {/* Logo - BES abbreviation */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="flex items-center gap-2 px-2 py-2 rounded-full transition-all duration-200"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: portalTokens.student.gradient }}
            >
              <Compass className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-ceramic-primary dark:text-white text-xs">
              BES
            </span>
          </Link>
        </motion.div>

        <div className="w-px h-5 bg-ceramic-border flex-shrink-0" />

        {/* Nav Links - Icons only */}
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <motion.div
              key={link.name}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95, y: 0 }}
            >
              <Link
                href={link.href}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200",
                  isActive
                    ? "text-ceramic-brand bg-ceramic-brand/10"
                    : "text-ceramic-secondary hover:text-ceramic-primary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
                )}
                title={link.name}
              >
                <Icon className="w-4 h-4" />
              </Link>
            </motion.div>
          );
        })}

        <div className="w-px h-5 bg-ceramic-border flex-shrink-0" />

        {/* Portals Link - Icon only */}
        <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95, y: 0 }}>
          <Link
            href="/portals"
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200",
              pathname === "/portals"
                ? "text-ceramic-brand bg-ceramic-brand/10"
                : "text-ceramic-secondary hover:text-ceramic-primary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
            )}
            title="Portals"
          >
            <Compass className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="w-px h-5 bg-ceramic-border flex-shrink-0" />

        {/* Sign In Button - Compact */}
        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98, y: 0 }}
        >
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-xs font-semibold text-white hover:shadow-lg block"
            style={{
              background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
            }}
            title="Sign In / Get Started"
          >
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Sign In</span>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  );

  return (
    <>
      <DesktopPillNav />
      <TabletNav />
      <MobileTabBar />

      {/* Mobile Menu Sheet */}
      <MobileMenuSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Spacer for mobile to prevent content hidden behind tab bar */}
      <div className="md:hidden h-16" />
      {/* Spacer for tablet to prevent content hidden behind floating nav */}
      <div className="hidden md:block lg:hidden h-20" />
      {/* Spacer for desktop to prevent content hidden behind floating nav */}
      <div className="hidden lg:block h-24" />
    </>
  );
}
