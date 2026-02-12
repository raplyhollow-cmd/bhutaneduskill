"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap, ChevronDown, Compass, Mountain, GraduationCap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

interface NavLink {
  name: string;
  href: string;
  icon?: React.ReactNode;
  shortcut?: string;
  badge?: string;
}

interface FuturisticNavProps {
  transparent?: boolean;
}

export function FuturisticNav({ transparent = false }: FuturisticNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());
  const pathname = usePathname();

  // Magnetic effect values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const navLinks: NavLink[] = [
    { name: "Home", href: "/", icon: <Compass className="w-4 h-4" /> },
    { name: "About", href: "/about" },
    { name: "Careers", href: "/dashboard/careers", badge: "New" },
    { name: "Assessments", href: "/dashboard/assessment" },
    { name: "Contact", href: "/contact", shortcut: "?" },
  ];

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update indicator position with smooth spring-like transition
  useEffect(() => {
    if (hoveredIndex !== null) {
      const link = linkRefs.current.get(hoveredIndex);
      if (link && navRef.current) {
        const itemRect = link.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        setIndicatorStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
          opacity: 1,
        });
      }
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [hoveredIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !mobileMenuOpen) {
        e.preventDefault();
        window.location.href = "/contact";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm transition-all duration-300"
      aria-label="Main navigation"
    >
      {/* Animated gradient line at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-md focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Animated on hover */}
          <Link
            href="/"
            className="group relative flex items-center gap-3 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-xl"
            aria-label="Career Compass - Home"
          >
            {/* Animated glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                repeatDelay: 1,
              }}
            />

            {/* Logo icon */}
            <div className="relative">
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30"
                whileHover={{
                  rotate: [0, 10, 0],
                  transition: { duration: 0.5 },
                }}
              >
                <Mountain className="w-6 h-6 text-white" />
              </motion.div>
              {/* Orbiting dots */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full"
                animate={{
                  x: [0, 40, 0],
                  y: [0, -20, 0],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
              />
            </div>

            <div className="flex flex-col">
              <motion.span
                className="font-bold text-xl text-gray-900 dark:text-white leading-tight"
                whileHover={{ letterSpacing: "0.05em" }}
                transition={{ duration: 0.3 }}
              >
                Career Compass
              </motion.span>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold tracking-widest uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Floating Pill */}
          <div
            ref={navRef}
            className="hidden lg:flex items-center relative px-2 py-2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl shadow-orange-500/5"
            role="navigation"
            aria-label="Main menu"
          >
            {/* Glowing sliding indicator */}
            <motion.div
              className="absolute top-2 bottom-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg shadow-orange-500/10 pointer-events-none"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
              animate={{
                opacity: indicatorStyle.opacity,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl" />
            </motion.div>

            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                ref={(el) => {
                  if (el) linkRefs.current.set(index, el);
                }}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                <span
                  className={`relative z-10 flex items-center gap-2 transition-colors duration-200 ${
                    hoveredIndex === index || pathname === link.href
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {link.icon && (
                    <motion.span
                      animate={
                        hoveredIndex === index
                          ? { rotate: [0, 10, 0] }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                    >
                      {link.icon}
                    </motion.span>
                  )}
                  {link.name}
                  {link.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full"
                    >
                      {link.badge}
                    </motion.span>
                  )}
                  {link.shortcut && (
                    <kbd
                      className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-opacity duration-200 ${
                        hoveredIndex === index ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {link.shortcut}
                    </kbd>
                  )}
                </span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions - Magnetic Buttons */}
          <div className="hidden md:flex items-center gap-3" role="group" aria-label="Account actions">
            <Link href="/dashboard/assessment" className="group">
              <Button
                variant="ghost"
                className="font-medium transition-all duration-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 relative overflow-hidden group"
              >
                <span className="relative z-10">Try Assessment</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    repeatDelay: 1,
                  }}
                />
              </Button>
            </Link>
            <Link href="/sign-up" className="group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="font-semibold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/30 relative overflow-hidden group/btn">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative z-10 flex items-center gap-2">
                    <Zap className="w-4 h-4 group-hover/btn:animate-pulse" />
                    Get Started Free
                  </span>
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-3 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            type="button"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Menu - Animated */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="py-6 space-y-2"
              >
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                        pathname === link.href
                          ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex items-center gap-3 font-medium">
                        {link.icon && <span>{link.icon}</span>}
                        {link.name}
                      </span>
                      {link.badge && (
                        <span className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800"
                >
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full font-semibold border-2 h-12"
                      type="button"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full font-semibold bg-gradient-to-r from-orange-500 to-red-600 h-12 shadow-lg shadow-orange-500/30" type="button">
                      <Zap className="w-4 h-4 mr-2" />
                      Get Started Free
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

// Export simplified versions
export function FuturisticNavSimple() {
  return <FuturisticNav transparent={false} />;
}

export function FuturisticNavTransparent() {
  return <FuturisticNav transparent={true} />;
}
