/**
 * VITAL SIGNS PANEL COMPONENT
 *
 * Displays Pulse, Breath, and Synapse indicators with animations.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Activity, Brain, Zap } from "lucide-react";

interface VitalSignsData {
  overall: {
    health: number;
    status: "healthy" | "degraded" | "critical";
    avgLatency: number;
    errorCount: number;
  };
  system: {
    cpu: number;
    memory: number;
    heartbeatRate: number;
  };
  synapse: {
    healingSuggestions: number;
    needsAttention: boolean;
    criticalIssues: number;
  };
}

interface VitalSignsPanelProps {
  vitalSigns: VitalSignsData | null;
  loading?: boolean;
}

export function VitalSignsPanel({ vitalSigns, loading = false }: VitalSignsPanelProps) {
  const [pulsePhase, setPulsePhase] = useState(0);

  // Animate pulse
  useEffect(() => {
    if (!vitalSigns) return;

    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 3);
    }, 1000);

    return () => clearInterval(interval);
  }, [vitalSigns]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-400";
      case "degraded": return "text-yellow-400";
      case "critical": return "text-red-400";
      default: return "text-blue-400";
    }
  };

  // Get status background
  const getStatusBg = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-500/20";
      case "degraded": return "bg-yellow-500/20";
      case "critical": return "bg-red-500/20";
      default: return "bg-blue-500/20";
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-700 rounded-lg" />
          <div className="h-20 bg-gray-700 rounded-lg" />
          <div className="h-20 bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!vitalSigns) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <p className="text-gray-400">No vital signs data</p>
      </div>
    );
  }

  const heartbeatDuration = 60 / (vitalSigns.system.heartbeatRate || 60);

  return (
    <div className="space-y-4">
      {/* Overall Status Card */}
      <div className={`${getStatusBg(vitalSigns.overall.status)} backdrop-blur-sm rounded-xl p-6 border border-gray-700`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">System Health</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(vitalSigns.overall.status)} ${getStatusColor(vitalSigns.overall.status)}`}>
            {vitalSigns.overall.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Health Score Circle */}
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-700"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className={getStatusColor(vitalSigns.overall.status)}
                initial={{ strokeDasharray: 226 }}
                animate={{ strokeDashoffset: 226 - (226 * vitalSigns.overall.health) / 100 }}
                transition={{ duration: 1 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getStatusColor(vitalSigns.overall.status)}`}>
                {vitalSigns.overall.health}%
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Latency</span>
              <span className="text-white font-medium">{vitalSigns.overall.avgLatency}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Errors</span>
              <span className={vitalSigns.overall.errorCount > 0 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                {vitalSigns.overall.errorCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PULSE - Latency Indicator */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Activity className={`w-5 h-5 ${vitalSigns.overall.status === "critical" ? "text-red-500 animate-pulse" : "text-blue-400"}`} />
          <h3 className="text-lg font-semibold text-white">Pulse</h3>
        </div>

        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: vitalSigns.overall.avgLatency < 100 ? 2 : vitalSigns.overall.avgLatency < 300 ? 1.5 : 0.5,
              repeat: Infinity,
            }}
            className={`w-4 h-4 rounded-full ${
              vitalSigns.overall.avgLatency < 100 ? "bg-green-500" :
              vitalSigns.overall.avgLatency < 300 ? "bg-blue-500" :
              vitalSigns.overall.avgLatency < 1000 ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
          <div className="flex-1">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  vitalSigns.overall.avgLatency < 100 ? "bg-green-500" :
                  vitalSigns.overall.avgLatency < 300 ? "bg-blue-500" :
                  vitalSigns.overall.avgLatency < 1000 ? "bg-yellow-500" : "bg-red-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, vitalSigns.overall.avgLatency / 10)}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {vitalSigns.overall.avgLatency < 100 ? "Athletic" :
               vitalSigns.overall.avgLatency < 300 ? "Normal" :
               vitalSigns.overall.avgLatency < 1000 ? "Elevated" : "Critical"}
            </p>
          </div>
        </div>
      </div>

      {/* BREATH - System Load */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-5 h-5 text-rose-400" />
          <h3 className="text-lg font-semibold text-white">Breath</h3>
        </div>

        {/* Heartbeat Animation */}
        <div className="flex items-center justify-center mb-4">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: heartbeatDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              vitalSigns.system.cpu > 80 ? "bg-red-500/30" : "bg-rose-500/20"
            }`}
          >
            <Heart className={`w-8 h-8 ${vitalSigns.system.cpu > 80 ? "text-red-400" : "text-rose-400"}`} />
          </motion.div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">CPU</span>
            <span className="text-white">{vitalSigns.system.cpu.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Memory</span>
            <span className="text-white">{vitalSigns.system.memory.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Heart Rate</span>
            <span className="text-white">{vitalSigns.system.heartbeatRate.toFixed(0)} BPM</span>
          </div>
        </div>
      </div>

      {/* SYNAPSE - AI Healing */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Brain className={`w-5 h-5 ${vitalSigns.synapse.needsAttention ? "text-purple-400 animate-pulse" : "text-gray-400"}`} />
          <h3 className="text-lg font-semibold text-white">Synapse</h3>
          {vitalSigns.synapse.healingSuggestions > 0 && (
            <span className="ml-auto px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
              {vitalSigns.synapse.healingSuggestions} suggestions
            </span>
          )}
        </div>

        {vitalSigns.synapse.needsAttention ? (
          <div className="space-y-2">
            <p className="text-sm text-yellow-400">
              ⚠️ {vitalSigns.synapse.criticalIssues} critical issues detected
            </p>
            <p className="text-sm text-gray-400">
              AI analyzing self-healing options...
            </p>
          </div>
        ) : (
          <p className="text-sm text-green-400">
            ✓ All systems operating normally
          </p>
        )}
      </div>
    </div>
  );
}
