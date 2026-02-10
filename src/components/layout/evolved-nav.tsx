"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface NavLink {
  name: string;
  href: string;
  shortcut?: string;
}

interface EvolvedNavProps {
  transparent?: boolean;
}

export function EvolvedNav({ transparent = false }: EvolvedNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());
  const pathname = usePathname();

  const navLinks: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq", shortcut: "?" },
    { name: "Contact", href: "/contact" },
  ];

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

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
        window.location.href = "/faq";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 nav-visible" aria-label="Main navigation">
      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="group relative flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
            aria-label="Career Compass - Home"
          >
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-primary/50 group-hover:shadow-lg">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground leading-tight">
                Career Compass
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                Beta
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div
            ref={navRef}
            className="hidden md:flex items-center relative px-1.5 py-1.5 bg-muted/50 backdrop-blur-md rounded-full border border-border/60"
            role="navigation"
            aria-label="Main menu"
          >
            {/* Sliding highlight indicator */}
            <div
              className="absolute top-1.5 bottom-1.5 bg-background dark:bg-card rounded-full shadow-sm pointer-events-none transition-all duration-300 ease-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            />

            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                ref={(el) => {
                  if (el) linkRefs.current.set(index, el);
                }}
                href={link.href}
                className={`relative px-4 py-1.5 text-sm font-medium transition-all duration-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  hoveredIndex === index ? "text-foreground scale-[0.98]" : "text-muted-foreground hover:text-foreground"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.name}
                {link.shortcut && (
                  <span
                    className={`absolute -top-1 -right-1 ml-1 px-1 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-medium rounded bg-muted/80 text-muted-foreground border border-border/50 transition-opacity duration-200 ${
                      hoveredIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {link.shortcut}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5" role="group" aria-label="Account actions">
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="font-medium transition-all duration-200 hover:bg-muted/50 active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="font-medium shadow-sm shadow-primary/20 transition-all duration-200 hover:shadow-md hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label="Create a new account">
                <Zap className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 text-foreground rounded-lg hover:bg-muted/50 active:bg-muted/80 transition-all duration-150 active:scale-[0.94] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-primary/10 text-foreground font-semibold"
                    : "text-foreground hover:bg-muted/50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                <span className="font-medium">{link.name}</span>
                {link.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded border border-border/50">
                    {link.shortcut}
                  </kbd>
                )}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-border/60">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
                aria-label="Go to sign in page"
              >
                <Button variant="outline" className="w-full font-medium" type="button">
                  Sign In
                </Button>
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
                aria-label="Go to sign up page"
              >
                <Button className="w-full font-medium shadow-sm shadow-primary/20" type="button">
                  <Zap className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </nav>
  );
}

// Export simplified versions
export function EvolvedNavSimple() {
  return <EvolvedNav transparent={false} />;
}

export function EvolvedNavTransparent() {
  return <EvolvedNav transparent={true} />;
}
