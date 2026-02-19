"use client";

import { motion } from "framer-motion";
import { Rocket, Sparkles, Smartphone, MessageSquare, BarChart3, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface FuturePhase {
  id: string;
  name: string;
  description: string;
  status: "coming-soon" | "planned" | "vision";
  icon: React.ReactNode;
  features: string[];
  color: string;
  gradient: string;
}

const futurePhases: FuturePhase[] = [
  {
    id: "phase4",
    name: "Phase 4: Advanced Features",
    description: "Enhanced functionality and integrations",
    status: "coming-soon",
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      "Advanced analytics dashboards",
      "Integration with BCSE exam results",
      "RUB college application tracking",
      "Scholarship matching algorithm",
      "Parent-teacher communication portal"
    ],
    color: "rgb(168 85 247)",
    gradient: "from-purple-500 to-violet-600"
  },
  {
    id: "phase5",
    name: "Phase 5: Ministry Analytics",
    description: "National-level insights and reporting",
    status: "planned",
    icon: <BarChart3 className="w-6 h-6" />,
    features: [
      "National education statistics",
      "School performance comparison",
      "Student outcome tracking",
      "Policy impact analysis",
      "Ministry reporting dashboard"
    ],
    color: "rgb(59 130 246)",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    id: "phase6",
    name: "Phase 6: Mobile & SMS",
    description: "Native apps and communication channels",
    status: "vision",
    icon: <Smartphone className="w-6 h-6" />,
    features: [
      "iOS and Android mobile apps",
      "SMS notification system",
      "Offline mode support",
      "Push notifications",
      "USSD interface for remote areas"
    ],
    color: "rgb(249 115 22)",
    gradient: "from-orange-500 to-red-600"
  }
];

function PhaseCard({ phase, index }: { phase: FuturePhase; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative"
    >
      {/* Status badge */}
      <div className="absolute -top-3 -right-3 z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
          phase.status === "coming-soon"
            ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
            : phase.status === "planned"
            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
            : "bg-gray-500/20 text-gray-300 border-gray-500/30"
        }`}>
          {phase.status === "coming-soon" ? "Coming Soon" : phase.status === "planned" ? "Planned" : "Vision"}
        </div>
      </div>

      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"
          style={{ background: `linear-gradient(135deg, ${phase.color}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${phase.gradient} text-white flex-shrink-0`}>
            {phase.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{phase.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{phase.description}</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {phase.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: phase.color }} />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function FutureVision() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950" />

      {/* Animated gradient */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)",
          backgroundSize: "200% 200%"
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
            <Rocket className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-gray-300">What's Next</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            The Road <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">Ahead</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We're at 98% vision complete. Here's what's coming next to take us to 100% and beyond.
          </p>
        </motion.div>

        {/* Current progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-16 p-8 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Current Status</h3>
                <p className="text-sm text-gray-400">98% of initial vision complete</p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "98%" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Start</span>
                <span className="text-green-400">98% Complete</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Future phases */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {futurePhases.map((phase, index) => (
            <PhaseCard key={phase.id} phase={phase} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-block">
            <Link href="/sign-up">
              <button className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-orange-500/30">
                <Sparkles className="w-5 h-5" />
                Join the Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Be part of Bhutan's education transformation. Free for students.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
