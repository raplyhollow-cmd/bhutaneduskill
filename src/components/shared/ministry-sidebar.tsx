"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Bell,
  DollarSign,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MinistrySidebarProps {
  userName?: string;
}

export function MinistrySidebar({ userName = "Ministry User" }: MinistrySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/ministry", icon: LayoutDashboard },
    { name: "Schools", href: "/ministry/schools", icon: Building2 },
    { name: "Analytics", href: "/ministry/analytics", icon: BarChart3 },
    { name: "Notifications", href: "/ministry/notifications", icon: Bell },
    { name: "Billing", href: "/ministry/billing", icon: DollarSign },
    { name: "Policies", href: "/ministry/policies", icon: FileText },
    { name: "Users", href: "/ministry/users", icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Purple/violet theme colors
  const colors = {
    primary: "rgb(168 85 247)",
    secondary: "rgb(147 51 234)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    hover: "rgb(147 51 234)",
    bg: "rgb(250 245 255)",
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        style={{ color: colors.primary }}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: colors.gradient }}
            >
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-gray-900">Ministry Portal</h1>
                <p className="text-xs text-gray-500">Education Bhutan</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: colors.primary }}
          />
        </button>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "text-white shadow-md"
                    : "text-gray-700 hover:bg-purple-50",
                  isCollapsed && "justify-center"
                )}
                style={isActive ? { background: colors.gradient } : undefined}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ background: colors.gradient }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500">Ministry of Education</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
