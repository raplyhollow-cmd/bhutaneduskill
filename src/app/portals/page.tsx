"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Users,
  HeartHandshake,
  Building,
  Landmark,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Zap,
  BarChart3,
  FileText,
  Target,
  Globe,
  MessageSquare,
  Database,
  Settings,
  AlertCircle,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";
import { CompactNav } from "@/components/layout/compact-nav";
import { Footer } from "@/components/layout/footer";

const portalCategories = [
  {
    id: "academic",
    title: "Academic Excellence",
    subtitle: "Teaching, learning, and assessment",
    gradient: "from-orange-500 to-amber-500",
    portals: ["student", "teacher", "parent"],
  },
  {
    id: "administration",
    title: "Administration & Leadership",
    subtitle: "Streamlined school operations",
    gradient: "from-blue-500 to-indigo-500",
    portals: ["school-admin", "counselor"],
  },
  {
    id: "governance",
    title: "National Governance",
    subtitle: "Data-driven decision making",
    gradient: "from-emerald-500 to-teal-500",
    portals: ["ministry", "admin"],
  },
];

const portals = {
  student: {
    name: "Student Portal",
    shortName: "Students",
    icon: GraduationCap,
    href: "/student",
    description: "Career assessments, academic tracking, RUB discovery, homework management.",
    features: ["RIASEC Assessment", "Learning Modules", "Progress Tracking", "RUB & Scholarships", "Homework", "Attendance"],
    color: "#f97316",
    bgGradient: "from-orange-500 to-amber-500",
  },
  teacher: {
    name: "Teacher Portal",
    shortName: "Teachers",
    icon: BookOpen,
    href: "/teacher",
    description: "Class management, homework creator, performance analytics, automated reports.",
    features: ["Class Management", "8-Format Homework", "Analytics", "Attendance", "Parent Communication", "Reports"],
    color: "#3b82f6",
    bgGradient: "from-blue-500 to-indigo-500",
  },
  parent: {
    name: "Parent Portal",
    shortName: "Parents",
    icon: Users,
    href: "/parent",
    description: "Real-time dashboard, homework tracking, fees, direct teacher messaging.",
    features: ["Academic Dashboard", "Teacher Messages", "Progress Reports", "Homework", "Fee Payments", "Consents"],
    color: "#a855f7",
    bgGradient: "from-purple-500 to-pink-500",
  },
  "school-admin": {
    name: "School Admin Portal",
    shortName: "School Admin",
    icon: Building,
    href: "/school-admin",
    description: "Student enrollment, teacher management, class scheduling, fee management.",
    features: ["Student Management", "Teacher Management", "Class Scheduling", "Fee Management", "Inventory", "Reports"],
    color: "#6366f1",
    bgGradient: "from-indigo-500 to-purple-500",
  },
  counselor: {
    name: "Counselor Portal",
    shortName: "Counselors",
    icon: HeartHandshake,
    href: "/counselor",
    description: "Student profiling, interventions, session scheduling, resource management.",
    features: ["Student Profiles", "Interventions", "Sessions", "Case Notes", "Career Resources", "Analytics"],
    color: "#f43f5e",
    bgGradient: "from-rose-500 to-pink-500",
  },
  ministry: {
    name: "Ministry Portal",
    shortName: "Ministry",
    icon: Landmark,
    href: "/ministry",
    description: "National analytics, EMIS integration, GNH monitoring, policy management.",
    features: ["School Registry", "Analytics", "Labor Market", "EMIS Sync", "Policies", "Infrastructure"],
    color: "#10b981",
    bgGradient: "from-emerald-500 to-teal-500",
  },
  admin: {
    name: "Platform Admin Portal",
    shortName: "Platform Admin",
    icon: Shield,
    href: "/admin",
    description: "School onboarding, user management, content curation, billing operations.",
    features: ["School Management", "User Administration", "Content CMS", "Analytics", "Billing", "Settings"],
    color: "#475569",
    bgGradient: "from-slate-600 to-slate-800",
  },
};

function PortalCard({ portalKey }: { portalKey: keyof typeof portals }) {
  const portal = portals[portalKey];
  const Icon = portal.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${portal.bgGradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300 rounded-xl`}
      />

      <div className="relative h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group-hover:border-transparent transition-all duration-300">
        {/* Compact Header */}
        <div className={`px-4 py-3 bg-gradient-to-r ${portal.bgGradient} transition-all duration-300 group-hover:scale-105 origin-left`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg group-hover:bg-white/30 transition-colors">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{portal.name}</h3>
              <p className="text-white/80 text-xs truncate">{portal.shortName}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
            {portal.description}
          </p>
        </div>

        {/* Features List */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
            {portal.features.slice(0, 6).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                <div className="w-1 h-1 rounded-full flex-shrink-0 transition-all duration-300 group-hover:w-1.5 group-hover:h-1.5" style={{ backgroundColor: portal.color }} />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action */}
          <Link
            href={portal.href}
            className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-white text-sm font-semibold bg-gradient-to-r ${portal.bgGradient} hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]`}
          >
            Access Portal
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function PortalsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <CompactNav />

      {/* Compact Hero */}
      <section className="relative pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              7 Specialized Portals • One Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="text-gray-900 dark:text-white">Meet Your </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
              Digital Portals
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8"
          >
            Purpose-built interfaces for every stakeholder in Bhutan's education ecosystem.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3"
          >
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 transition-opacity"
            >
              <Zap className="w-4 h-4" />
              Get Started
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Portal Categories */}
      {portalCategories.map((category, catIdx) => (
        <section
          key={category.id}
          className={catIdx % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50/50 dark:bg-gray-900/50"}
        >
          <div className="max-w-6xl mx-auto px-6 py-12">
            {/* Category Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-8"
            >
              <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${category.gradient}`} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{category.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{category.subtitle}</p>
              </div>
            </motion.div>

            {/* Portals Grid */}
            <div className={`grid gap-6 ${
              category.portals.length === 2
                ? 'md:grid-cols-2 max-w-4xl mx-auto'
                : 'md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {category.portals.map((portalKey) => (
                <PortalCard key={portalKey} portalKey={portalKey as keyof typeof portals} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Integration Section - Compact */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Seamless Integration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              All portals work in harmony, sharing data in real-time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "Unified Data",
                description: "Single source of truth with real-time sync",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                description: "Granular permissions for privacy & security",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: TrendingUp,
                title: "Cross-Portal Analytics",
                description: "Data flows enabling comprehensive insights",
                gradient: "from-emerald-500 to-teal-500",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <CheckCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Ready to Transform Your School?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Join hundreds of schools across Bhutan using Bhutan EduSkill.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Start Your Journey
                <Zap className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Schedule Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
