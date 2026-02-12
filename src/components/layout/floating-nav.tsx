"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Compass, User, LogIn, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const portals = [
  { name: "Student", href: "/student", color: "orange" },
  { name: "Teacher", href: "/teacher", color: "blue" },
  { name: "Parent", href: "/parent", color: "purple" },
  { name: "Counselor", href: "/counselor", color: "violet" },
];

export function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);
  const portalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePortalEnter = () => {
    if (portalTimeoutRef.current) {
      clearTimeout(portalTimeoutRef.current);
    }
    setPortalOpen(true);
  };

  const handlePortalLeave = () => {
    portalTimeoutRef.current = setTimeout(() => {
      setPortalOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (portalTimeoutRef.current) {
        clearTimeout(portalTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Micro-Premium Navigation - 220px wide, fixed top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-gray-950 dark:text-white text-sm">
              Bhutan EduSkill
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <span className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200">
                  {link.name}
                </span>
              </Link>
            ))}

            {/* Portals */}
            <div
              ref={portalRef}
              className="relative"
              onMouseEnter={handlePortalEnter}
              onMouseLeave={handlePortalLeave}
            >
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200">
                Portals
                <motion.span
                  animate={{ rotate: portalOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </button>

              <AnimatePresence>
                {portalOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl p-1"
                    onMouseEnter={handlePortalEnter}
                    onMouseLeave={handlePortalLeave}
                  >
                    {portals.map((portal) => (
                      <Link
                        key={portal.name}
                        href={portal.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-md bg-${portal.color}-500/10 flex items-center justify-center`}>
                          <div className={`w-3 h-3 rounded-full bg-${portal.color}-500`} />
                        </div>
                        </Link>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side - Auth */}
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="h-10 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg">
                Sign In
              </Button>
            </Link>

            <Link href="/sign-up">
              <Button
                size="sm"
                className="h-10 px-4 bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-sm font-medium rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors shadow-lg shadow-gray-950/10"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Toggle menu"
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-14 left-0 right-0 max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

              <div className="flex flex-col gap-1">
                <div className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Portals
                </div>
                {portals.map((portal) => (
                  <Link
                    key={portal.name}
                    href={portal.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-md bg-${portal.color}-500/10 flex items-center justify-center`}>
                      <div className={`w-3 h-3 rounded-full bg-${portal.color}-500`} />
                    </div>
                    <span>{portal.name}</span>
                  </Link>
                ))}
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

              <div className="flex flex-col gap-2">
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center px-3 py-2 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-lg font-medium text-base hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
