import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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
} from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
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
    { name: "Student Portal", href: "/portal/student", icon: User, description: "Your personal learning hub" },
    { name: "Parent Portal", href: "/portal/parent", icon: Users, description: "Track your child's progress" },
    { name: "Teacher Portal", href: "/portal/teacher", icon: GraduationCap, description: "Class analytics & insights" },
    { name: "Counselor Portal", href: "/portal/counselor", icon: MessageSquare, description: "Student guidance & sessions" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <span className="font-bold text-lg text-gray-900">Career Compass</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome back!</span>
              <Button variant="ghost" size="sm" asChild>
                <a href="/sign-out">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4">
          <nav className="space-y-6">
            {/* Main Navigation */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">Menu</h3>
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Portals Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">Portals</h3>
              <nav className="space-y-1">
                {portals.map((portal) => (
                  <Link
                    key={portal.name}
                    href={portal.href}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm"
                  >
                    <portal.icon className="w-4 h-4" />
                    <div>
                      <span className="font-medium">{portal.name}</span>
                      <p className="text-xs text-gray-500">{portal.description}</p>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
