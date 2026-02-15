"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  User,
  FileText,
  GraduationCap,
  TrendingUp,
  Settings,
  LogOut,
  BookOpen,
  DollarSign,
  Trophy,
  Book as BookIcon,
  Bookmark,
  Map,
  Award,
  Users,
  GraduationCap as Cap,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Assessment", href: "/dashboard/assessment", icon: FileText },
    { name: "Careers", href: "/dashboard/careers", icon: TrendingUp },
    { name: "Skills", href: "/dashboard/skills", icon: BookOpen },
    { name: "Monetize", href: "/dashboard/monetize", icon: DollarSign },
    { name: "Roadmap", href: "/dashboard/roadmap", icon: Map },
    { name: "Achievements", href: "/dashboard/achievements", icon: Trophy },
    { name: "Journal", href: "/dashboard/journal", icon: BookIcon },
    { name: "Study Abroad", href: "/dashboard/study-abroad", icon: GraduationCap },
    { name: "Scholarships", href: "/dashboard/scholarships", icon: Award },
    { name: "RUB Colleges", href: "/dashboard/rub", icon: Cap },
    { name: "Saved", href: "/dashboard/saved", icon: Bookmark },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const portals = [
    { name: "Student Portal", href: "/student", icon: User, description: "Your personal learning hub" },
    { name: "Parent Portal", href: "/parent", icon: Users, description: "Track your child's progress" },
    { name: "Teacher Portal", href: "/teacher", icon: GraduationCap, description: "Class analytics & insights" },
    { name: "Counselor Portal", href: "/counselor", icon: MessageSquare, description: "Student guidance & sessions" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#131316]">
      {/* Top Navigation - Mobile Responsive */}
      <nav className="bg-white dark:bg-[#131316] border-b border-border/50 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">BE</span>
                </div>
                <span className="font-bold text-lg text-foreground hidden sm:inline">Bhutan EduSkill</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Welcome back!</span>
              <Button variant="ghost" size="sm" asChild>
                <a href="/sign-out">
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Mobile Sidebar - Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0D0D0D] border-r border-border/50 z-50 lg:hidden overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Main Navigation */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">Menu</h3>
                  <nav className="space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Portals Section */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">Portals</h3>
                  <nav className="space-y-1">
                    {portals.map((portal) => (
                      <Link
                        key={portal.name}
                        href={portal.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                      >
                        <portal.icon className="w-4 h-4" />
                        <div>
                          <span className="font-medium">{portal.name}</span>
                          <p className="text-xs text-muted-foreground">{portal.description}</p>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-[#0D0D0D] border-r border-border/50 min-h-[calc(100vh-64px)] p-4">
          <nav className="space-y-6">
            {/* Main Navigation */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">Menu</h3>
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Portals Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">Portals</h3>
              <nav className="space-y-1">
                {portals.map((portal) => (
                  <Link
                    key={portal.name}
                    href={portal.href}
                    className="flex items-center gap-3 px-4 py-2 text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                  >
                    <portal.icon className="w-4 h-4" />
                    <div>
                      <span className="font-medium">{portal.name}</span>
                      <p className="text-xs text-muted-foreground">{portal.description}</p>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          </nav>
        </aside>

        {/* Main Content - Full width on mobile, with padding on desktop */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
