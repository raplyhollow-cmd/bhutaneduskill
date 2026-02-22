"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Compass, GraduationCap, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Careers", href: "/student/careers" },
  { name: "Assessments", href: "/student/assessment" },
  { name: "Contact", href: "/contact" },
];

export function ProfessionalNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = mounted ? pathname : "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ceramic-white/95 dark:bg-ceramic-gray-900/95 backdrop-blur-sm border-b border-ceramic-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
            >
              <GraduationCap className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-lg text-ceramic-primary dark:text-white">
              Bhutan EduSkill
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive === link.href
                    ? "text-ceramic-brand"
                    : "text-ceramic-secondary hover:text-ceramic-primary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ceramic-ghost" size="sm" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                variant="ceramic"
                size="sm"
                style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
              >
                <Zap className="w-4 h-4 mr-1" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-ceramic-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-ceramic-border">
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive === link.href
                      ? "bg-ceramic-brand/10 text-ceramic-brand"
                      : "text-ceramic-secondary hover:bg-ceramic-gray-50 dark:hover:bg-ceramic-gray-800"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-ceramic-border flex flex-col gap-2">
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ceramic-outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ceramic"
                    size="sm"
                    className="w-full"
                    style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
