"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Home, User, MoreHorizontal, LogIn, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalSelector } from "./portal-selector";
import { MobileMenuSheet } from "./mobile-menu-sheet";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: User },
];

export function CompactNav() {
  const pathname = usePathname();
  const [portalOpen, setPortalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const portalButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const nearTop = currentScrollY < 50;

      setScrolled(currentScrollY > 20);

      // Hide on scroll down, show on scroll up or near top
      if (scrollingDown && !nearTop) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handlePortalClick = () => {
    setPortalOpen(true);
  };

  // Mobile Tab Bar Component
  const MobileTabBar = () => (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: navVisible ? 0 : 100 }}
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
      animate={{
        y: navVisible ? 16 : -100,
        opacity: navVisible ? 1 : 0,
      }}
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

        {/* Portals Dropdown */}
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

      {/* Desktop Portal Dropdown (rendered below the nav) */}
      <AnimatePresence>
        {portalOpen && (
          <div className="fixed inset-0 z-30" onClick={() => setPortalOpen(false)}>
            {/* This creates an overlay that closes the dropdown */}
          </div>
        )}
      </AnimatePresence>
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
