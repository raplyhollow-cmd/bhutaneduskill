/**
 * INTELLIGENT TIMETABLE - MODERN LUXURY EDITION
 *
 * A world-class intelligent timetable system using Google Gemini AI.
 * Features:
 * - AI-powered constraint-based optimization
 * - Drag-and-drop interactive scheduling
 * - Peer-to-peer teacher swap requests
 * - Real-time conflict detection
 * - Teacher workload heatmap
 * - Borderless glassmorphism design
 * - 60fps smooth animations
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowLeftRight,
  Settings,
  Download,
  RefreshCw,
  Zap,
  Calendar,
  Users,
  Grid3x3,
  X,
  Plus,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InteractiveTimetableGrid, type TimetableGridEntry } from "@/components/timetable/timetable-grid-interactive";
import { SwapRequestModal, SwapNotificationBadge } from "@/components/timetable/swap-request-modal";
import { AIConstraintBuilder } from "@/components/timetable/ai-constraint-builder";
import type {
  TimetableConstraints,
  TimetableEntry,
  OptimizationResult,
  SwapRequest,
  BellPeriod,
} from "@/lib/types/timetable-constraints";

// ============================================================================
// TYPES
// ============================================================================

interface TimePeriod {
  order: number;
  name: string;
  startTime: string;
  endTime: string;
  type: "class" | "break" | "lunch";
}

// ============================================================================
// GLASS CARD COMPONENT
// ============================================================================

function GlassCard({
  children,
  className,
  gradient = "from-violet-500/10 to-purple-500/10",
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-xl shadow-xl", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div className="relative">{children}</div>
    </div>
  );
}

// ============================================================================
// QUICK ACTION BUTTON
// ============================================================================

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
  isLoading?: boolean;
}

function QuickAction({ icon, label, description, color, onClick, isLoading }: QuickActionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "relative overflow-hidden p-5 rounded-2xl border-0 bg-white/70 backdrop-blur-xl shadow-lg text-left transition-all",
        isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", color)} />
      <div className="relative">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3", color.replace("/50", ""))}>
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : icon}
        </div>
        <h3 className="font-bold text-gray-900 mb-1">{label}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.button>
  );
}

// ============================================================================
// AI SUGGESTION CARD
// ============================================================================

interface AISuggestion {
  type: "conflict" | "optimization" | "workload" | "insight";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

function AISuggestionCard({ suggestion, onApply, onDismiss }: { suggestion: AISuggestion; onApply: () => void; onDismiss: () => void }) {
  const colors = {
    conflict: "from-red-500/10 to-orange-500/10",
    optimization: "from-blue-500/10 to-indigo-500/10",
    workload: "from-amber-500/10 to-yellow-500/10",
    insight: "from-emerald-500/10 to-green-500/10",
  };

  const icons = {
    conflict: <AlertCircle className="w-5 h-5 text-red-600" />,
    optimization: <Zap className="w-5 h-5 text-blue-600" />,
    workload: <TrendingUp className="w-5 h-5 text-amber-600" />,
    insight: <Sparkles className="w-5 h-5 text-emerald-600" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icons[suggestion.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">{suggestion.title}</h4>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                suggestion.impact === "high" && "bg-red-100 text-red-700",
                suggestion.impact === "medium" && "bg-amber-100 text-amber-700",
                suggestion.impact === "low" && "bg-gray-100 text-gray-700"
              )}
            >
              {suggestion.impact}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mb-3">{suggestion.description}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onApply}>
              Apply
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STATS CARD
// ============================================================================

function StatsCard({
  value,
  label,
  icon,
  color,
  trend,
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) {
  return (
    <div className="relative overflow-hidden p-5 rounded-2xl border-0 bg-white/70 backdrop-blur-xl shadow-lg">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", color)} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color.replace("/30", "/20"))}>
            {icon}
          </div>
          {trend && (
            <Badge variant="secondary" className="text-xs">
              {trend}
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function IntelligentTimetablePage() {
  // View state
  const [view, setView] = useState<"grid" | "constraints" | "analytics">("grid");

  // Data state
  const [timetableEntries, setTimetableEntries] = useState<TimetableGridEntry[]>([]);
  const [periods, setPeriods] = useState<TimePeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Optimization state
  const [constraints, setConstraints] = useState<TimetableConstraints>({
    teacherAvailability: [],
    subjectRules: [],
    roomRules: [],
    classRules: [],
  });
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Swap state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapModalType, setSwapModalType] = useState<"request" | "respond" | "success">("request");
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);

  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([
    {
      type: "conflict",
      title: "3 conflicts detected",
      description: "Teacher double-booked on Monday Period 3",
      impact: "high",
    },
    {
      type: "workload",
      title: "Unbalanced workload",
      description: "Ms. Dorji has 35 periods vs. 25 average",
      impact: "medium",
    },
  ]);

  // Mock data for periods
  useEffect(() => {
    const mockPeriods: TimePeriod[] = [
      { name: "Period 1", order: 1, startTime: "08:00", endTime: "08:45", type: "class" },
      { name: "Period 2", order: 2, startTime: "08:50", endTime: "09:35", type: "class" },
      { name: "Break", order: 3, startTime: "09:35", endTime: "09:50", type: "break" },
      { name: "Period 3", order: 4, startTime: "09:50", endTime: "10:35", type: "class" },
      { name: "Period 4", order: 5, startTime: "10:40", endTime: "11:25", type: "class" },
      { name: "Lunch", order: 6, startTime: "11:25", endTime: "12:10", type: "lunch" },
      { name: "Period 5", order: 7, startTime: "12:10", endTime: "12:55", type: "class" },
      { name: "Period 6", order: 8, startTime: "13:00", endTime: "13:45", type: "class" },
    ];
    setPeriods(mockPeriods);

    // Mock timetable entries
    const mockEntries: TimetableGridEntry[] = [
      {
        id: "1",
        classId: "class-1",
        className: "Class 10A",
        subjectId: "sub-1",
        subjectName: "Mathematics",
        subjectColor: "bg-blue-100 text-blue-700 border-blue-200",
        teacherId: "t-1",
        teacherName: "Mr. Dorji",
        roomId: "room-1",
        roomName: "Room 101",
        dayOfWeek: "mon",
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:45",
      },
      {
        id: "2",
        classId: "class-1",
        className: "Class 10A",
        subjectId: "sub-2",
        subjectName: "English",
        subjectColor: "bg-purple-100 text-purple-700 border-purple-200",
        teacherId: "t-2",
        teacherName: "Ms. Wangmo",
        roomId: "room-1",
        roomName: "Room 101",
        dayOfWeek: "mon",
        periodNumber: 2,
        startTime: "08:50",
        endTime: "09:35",
      },
      {
        id: "3",
        classId: "class-2",
        className: "Class 10B",
        subjectId: "sub-1",
        subjectName: "Mathematics",
        subjectColor: "bg-blue-100 text-blue-700 border-blue-200",
        teacherId: "t-1",
        teacherName: "Mr. Dorji",
        roomId: "room-2",
        roomName: "Room 102",
        dayOfWeek: "mon",
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:45",
      },
    ];
    setTimetableEntries(mockEntries);
    setIsLoading(false);
  }, []);

  // Handle AI optimization
  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch("/api/ai/timetable/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          constraints,
          currentTimetable: timetableEntries,
          scope: "all",
          academicYear: "2026",
        }),
      });

      const result = await response.json();
      if (result.success) {
        setOptimizationResult(result.data);
        setTimetableEntries(result.data.optimizedSchedule);
      }
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle swap request
  const handleSwapRequest = (message: string) => {
    console.log("Swap request:", message);
    setSwapModalType("success");
  };

  // Handle swap response
  const handleSwapResponse = (response: "accept" | "reject", alternative?: { day: string; period: number }) => {
    console.log("Swap response:", response, alternative);
    setSwapModalOpen(false);
  };

  // Days for display
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-violet-50/30 to-purple-50/30">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Intelligent Timetable</h1>
              <p className="text-sm text-gray-500">AI-powered schedule optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Swap Notification Badge */}
            <SwapNotificationBadge count={swapRequests.length} onClick={() => setSwapModalOpen(true)} />

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100/80 rounded-xl p-1 backdrop-blur-sm">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  view === "grid" ? "bg-white text-violet-700 shadow-sm" : "text-gray-600"
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("constraints")}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  view === "constraints" ? "bg-white text-violet-700 shadow-sm" : "text-gray-600"
                )}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("analytics")}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  view === "analytics" ? "bg-white text-violet-700 shadow-sm" : "text-gray-600"
                )}
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <Button size="sm" variant="outline" className="shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="p-6 max-w-[1800px] mx-auto">
        <AnimatePresence mode="wait">
          {/* GRID VIEW */}
          {view === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickAction
                  icon={<Sparkles className="w-6 h-6 text-white" />}
                  label="AI Generate"
                  description="Create full timetable"
                  color="from-violet-500/50 to-purple-500/50"
                  onClick={handleOptimize}
                  isLoading={isOptimizing}
                />
                <QuickAction
                  icon={<ArrowLeftRight className="w-6 h-6 text-white" />}
                  label="Emergency Swap"
                  description="Teacher replacement"
                  color="from-blue-500/50 to-indigo-500/50"
                  onClick={() => setSwapModalOpen(true)}
                />
                <QuickAction
                  icon={<TrendingUp className="w-6 h-6 text-white" />}
                  label="Balance Workload"
                  description="Redistribute periods"
                  color="from-amber-500/50 to-orange-500/50"
                  onClick={() => {}}
                />
                <QuickAction
                  icon={<RefreshCw className="w-6 h-6 text-white" />}
                  label="Auto Resolve"
                  description="Fix all conflicts"
                  color="from-emerald-500/50 to-green-500/50"
                  onClick={() => {}}
                />
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                  value="156"
                  label="Total Periods"
                  icon={<Clock className="w-5 h-5 text-violet-600" />}
                  color="from-violet-500/30 to-purple-500/30"
                />
                <StatsCard
                  value="12"
                  label="Teachers"
                  icon={<Users className="w-5 h-5 text-blue-600" />}
                  color="from-blue-500/30 to-indigo-500/30"
                />
                <StatsCard
                  value="8"
                  label="Classes"
                  icon={<Grid3x3 className="w-5 h-5 text-emerald-600" />}
                  color="from-emerald-500/30 to-green-500/30"
                />
                <StatsCard
                  value="0"
                  label="Conflicts"
                  icon={<Check className="w-5 h-5 text-green-600" />}
                  color="from-green-500/30 to-emerald-500/30"
                  trend="Clean"
                />
              </div>

              {/* Main Grid */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Weekly Schedule</h2>
                    <p className="text-sm text-gray-500">Drag and drop to reassign periods</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Show All
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  </div>
                ) : (
                  <InteractiveTimetableGrid
                    entries={timetableEntries}
                    periods={periods}
                    days={days}
                    onEntryClick={(entry) => console.log("Clicked:", entry)}
                    onEntryDrop={(entry, targetDay, targetPeriod) => console.log("Dropped:", entry, targetDay, targetPeriod)}
                    onOptimizeClick={handleOptimize}
                    isLoading={isOptimizing}
                  />
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* CONSTRAINTS VIEW */}
          {view === "constraints" && (
            <motion.div
              key="constraints"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard className="p-6">
                <AIConstraintBuilder
                  constraints={constraints}
                  onChange={setConstraints}
                  teachers={[
                    { id: "t-1", name: "Mr. Dorji" },
                    { id: "t-2", name: "Ms. Wangmo" },
                    { id: "t-3", name: "Mrs. Tshering" },
                  ]}
                  subjects={[
                    { id: "sub-1", name: "Mathematics" },
                    { id: "sub-2", name: "English" },
                    { id: "sub-3", name: "Dzongkha" },
                  ]}
                />
              </GlassCard>
            </motion.div>
          )}

          {/* ANALYTICS VIEW */}
          {view === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* AI Suggestions */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  AI Suggestions
                </h3>
                {aiSuggestions.map((suggestion, index) => (
                  <AISuggestionCard
                    key={index}
                    suggestion={suggestion}
                    onApply={() => setAiSuggestions((s) => s.filter((_, i) => i !== index))}
                    onDismiss={() => setAiSuggestions((s) => s.filter((_, i) => i !== index))}
                  />
                ))}
                {aiSuggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>All clear!</p>
                    <p className="text-sm">No suggestions at this time</p>
                  </div>
                )}
              </div>

              {/* Optimization Results */}
              <div className="lg:col-span-2">
                <GlassCard className="p-6 h-full">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Optimization Metrics
                  </h3>

                  {optimizationResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                          <p className="text-sm text-green-600 mb-1">Conflicts Removed</p>
                          <p className="text-2xl font-bold text-green-700">
                            {optimizationResult.metrics.conflictsRemoved}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                          <p className="text-sm text-blue-600 mb-1">Workload Improved</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {optimizationResult.metrics.workloadBalanceImproved}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                          <p className="text-sm text-violet-600 mb-1">Optimization Score</p>
                          <p className="text-2xl font-bold text-violet-700">
                            {optimizationResult.metrics.optimizationScore}%
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-sm text-amber-600 mb-1">Teacher Utilization</p>
                          <p className="text-2xl font-bold text-amber-700">
                            {optimizationResult.metrics.teacherUtilizationRate}%
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">AI Insights</p>
                        <p className="text-sm text-gray-600">{optimizationResult.aiInsights}</p>
                      </div>

                      {optimizationResult.improvements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-3">Improvements Made</p>
                          <div className="space-y-2">
                            {optimizationResult.improvements.slice(0, 5).map((improvement, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {improvement.description}
                                  </p>
                                  <p className="text-xs text-gray-500">{improvement.type}</p>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    improvement.impact === "high" && "bg-red-100 text-red-700",
                                    improvement.impact === "medium" && "bg-amber-100 text-amber-700"
                                  )}
                                >
                                  {improvement.impact}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                      <p className="font-medium">No optimization run yet</p>
                      <p className="text-sm">Click "AI Generate" to optimize your timetable</p>
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Swap Request Modal */}
      <SwapRequestModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        type={swapModalType}
        requestData={{
          requesterId: "t-1",
          requesterName: "Mr. Dorji",
          targetId: "t-2",
          targetName: "Ms. Wangmo",
          requesterPeriod: {
            day: "Monday",
            period: 3,
            startTime: "09:50",
            endTime: "10:35",
            subject: "Mathematics",
            class: "Class 10A",
          },
          reason: "emergency",
          aiCompatibilityScore: 85,
        }}
        onRequest={handleSwapRequest}
        onResponse={handleSwapResponse}
      />
    </div>
  );
}
