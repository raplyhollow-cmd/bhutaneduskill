"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, GraduationCap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PublicNavProps {
  transparent?: boolean;
}

export function PublicNav({ transparent = false }: PublicNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Packages", href: "/packages" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className={cn(
      "border-ceramic-border sticky top-0 z-50 backdrop-blur-sm",
      transparent ? "bg-white/70 dark:bg-black/50" : "bg-ceramic-white dark:bg-[#131316]"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
            >
              <GraduationCap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-ceramic-primary dark:text-white">Bhutan EduSkill</span>
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex bg-ceramic-brand/10 text-ceramic-brand border-ceramic-brand/20">Beta</Badge>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ceramic-secondary hover:text-ceramic-primary font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ceramic-ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button
                variant="ceramic"
                style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-ceramic-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-ceramic-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-ceramic-primary hover:text-ceramic-brand font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-ceramic-border">
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ceramic-outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ceramic"
                    className="w-full"
                    style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
                  >
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
