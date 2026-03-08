/**
 * INTERACTIVE TIMETABLE GRID
 *
 * A modern, drag-and-drop timetable display with real-time conflict detection
 * and smooth animations. Part of the AI-powered intelligent timetable system.
 *
 * Features:
 * - Drag-and-drop period cards
 * - Real-time conflict highlighting
 * - Teacher workload heatmap
 * - Borderless glassmorphism design
 * - 60fps smooth animations
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Users, AlertTriangle, Check, Sparkles, RefreshCw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

export interface TimetableGridEntry {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectColor?: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
}

export interface TimetableGridProps {
  entries: TimetableGridEntry[];
  periods: Array<{ order: number; name: string; startTime: string; endTime: string; type: "class" | "break" | "lunch" }>;
  days: string[];
  onEntryClick?: (entry: TimetableGridEntry) => void;
  onEntryDrop?: (entry: TimetableGridEntry, targetDay: string, targetPeriod: number) => void;
  onOptimizeClick?: () => void;
  isLoading?: boolean;
}

interface ConflictInfo {
  type: "teacher" | "room" | "class";
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-100 text-blue-700 border-blue-200",
  English: "bg-purple-100 text-purple-700 border-purple-200",
  Dzongkha: "bg-orange-100 text-orange-700 border-orange-200",
  Science: "bg-green-100 text-green-700 border-green-200",
  "IT/Computer": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Social Studies": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Physical Education": "bg-red-100 text-red-700 border-red-200",
  Arts: "bg-pink-100 text-pink-700 border-pink-200",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function InteractiveTimetableGrid({
  entries,
  periods,
  days,
  onEntryClick,
  onEntryDrop,
  onOptimizeClick,
  isLoading = false,
}: TimetableGridProps) {
  const [draggedEntry, setDraggedEntry] = useState<TimetableGridEntry | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: string; period: number } | null>(null);
  const [conflicts, setConflicts] = useState<Map<string, ConflictInfo>>(new Map());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Group entries by day and period
  const gridMap = new Map<string, TimetableGridEntry>();
  entries.forEach((entry) => {
    const key = `${entry.dayOfWeek}-${entry.periodNumber}`;
    gridMap.set(key, entry);
  });

  // Detect conflicts
  const detectConflicts = useCallback(() => {
    const conflictMap = new Map<string, ConflictInfo>();
    const teacherMap = new Map<string, string>();
    const roomMap = new Map<string, string>();

    entries.forEach((entry) => {
      const key = `${entry.dayOfWeek}-${entry.periodNumber}`;

      // Check teacher conflicts
      const teacherKey = `${entry.dayOfWeek}-${entry.periodNumber}-${entry.teacherId}`;
      if (teacherMap.has(teacherKey)) {
        conflictMap.set(key, {
          type: "teacher",
          message: `${entry.teacherName} is double-booked`,
        });
      }
      teacherMap.set(teacherKey, key);

      // Check room conflicts
      if (entry.roomId) {
        const roomKey = `${entry.dayOfWeek}-${entry.periodNumber}-${entry.roomId}`;
        if (roomMap.has(roomKey)) {
          conflictMap.set(key, {
            type: "room",
            message: `Room ${entry.roomName} is double-booked`,
          });
        }
        roomMap.set(roomKey, key);
      }
    });

    setConflicts(conflictMap);
  }, [entries]);

  // Detect conflicts on mount and entries change
  detectConflicts();

  // Get subject color
  const getSubjectColor = (subjectName: string) => {
    return SUBJECT_COLORS[subjectName] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Handle drag start
  const handleDragStart = (entry: TimetableGridEntry) => {
    setDraggedEntry(entry);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedEntry(null);
    setHoveredCell(null);
  };

  // Handle drop
  const handleDrop = (day: string, periodNumber: number) => {
    if (draggedEntry && onEntryDrop) {
      onEntryDrop(draggedEntry, day, periodNumber);
    }
    setDraggedEntry(null);
    setHoveredCell(null);
  };

  // Get entry for a cell
  const getEntryForCell = (day: string, period: number): TimetableGridEntry | null => {
    return gridMap.get(`${day}-${period}`) || null;
  };

  // Check if cell is a break
  const isBreak = (periodNumber: number) => {
    const period = periods.find((p) => p.order === periodNumber);
    return period?.type !== "class";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Weekly Timetable</h2>
          <p className="text-sm text-gray-500 mt-1">
            {entries.length} periods scheduled • {conflicts.size} conflicts detected
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOptimizeClick}
            disabled={isLoading}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Optimize
          </Button>
        </div>
      </div>

      {/* Conflicts Warning */}
      {conflicts.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium text-red-900">
            {conflicts.size} conflict{conflicts.size > 1 ? "s" : ""} detected - Click AI Optimize to resolve
          </span>
        </motion.div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border-0 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-violet-50 to-purple-50">
                <th className="p-3 text-left text-sm font-semibold text-violet-900 border-b border-violet-100 w-32">
                  Period
                </th>
                {days.map((day) => (
                  <th key={day} className="p-3 text-center text-sm font-semibold text-violet-900 border-b border-violet-100 min-w-[120px]">
                    {DAY_LABELS[day] || day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period, periodIndex) => (
                <tr
                  key={period.order}
                  className={cn(
                    "border-b border-gray-100 transition-colors",
                    period.type === "break" && "bg-gray-50"
                  )}
                >
                  <td className="p-3">
                    <div className="text-sm font-medium text-gray-900">{period.name}</div>
                    <div className="text-xs text-gray-500">
                      {period.startTime} - {period.endTime}
                    </div>
                  </td>
                  {days.map((day) => {
                    const entry = getEntryForCell(day, period.order);
                    const conflict = conflicts.get(`${day}-${period.order}`);
                    const isHovered = hoveredCell?.day === day && hoveredCell?.period === period.order;
                    const isTarget = !isBreak(period.order) && draggedEntry;

                    return (
                      <td
                        key={day}
                        className={cn(
                          "p-2 border-l border-gray-100 min-w-[120px] relative",
                          isHovered && "bg-violet-50"
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (isTarget) setHoveredCell({ day, period: period.order });
                        }}
                        onDragLeave={() => setHoveredCell(null)}
                        onDrop={() => handleDrop(day, period.order)}
                      >
                        {isBreak(period.order) ? (
                          <div className="h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400 italic">Break</span>
                          </div>
                        ) : entry ? (
                          <motion.div
                            key={entry.id}
                            layoutId={entry.id}
                            draggable
                            onDragStart={() => handleDragStart(entry)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onEntryClick && onEntryClick(entry)}
                            animate={{
                              scale: draggedEntry?.id === entry.id ? 0.95 : 1,
                              rotate: draggedEntry?.id === entry.id ? 2 : 0,
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "relative overflow-hidden rounded-xl p-2 cursor-grab active:cursor-grabbing border transition-all",
                              conflict && "border-red-300 bg-red-50",
                              !conflict && getSubjectColor(entry.subjectName),
                              "shadow-sm hover:shadow-md"
                            )}
                          >
                            {conflict && (
                              <div className="absolute top-1 right-1">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                              </div>
                            )}
                            <div className="text-xs font-semibold text-gray-900 line-clamp-1">
                              {entry.subjectName}
                            </div>
                            <div className="text-[10px] text-gray-600 truncate mt-0.5">
                              {entry.teacherName}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">
                              {entry.className}
                            </div>
                          </motion.div>
                        ) : (
                          <div
                            className={cn(
                              "h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors",
                              isTarget && "border-violet-300 bg-violet-50/50"
                            )}
                          >
                            {draggedEntry && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-violet-400"
                              >
                                <Plus className="w-4 h-4" />
                              </motion.div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DRAGGABLE PERIOD CARD
// ============================================================================

interface DraggablePeriodCardProps {
  entry: TimetableGridEntry;
  isDragging?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showConflict?: boolean;
}

export function DraggablePeriodCard({
  entry,
  isDragging = false,
  onClick,
  onDragStart,
  onDragEnd,
  showConflict = false,
}: DraggablePeriodCardProps) {
  const getSubjectColor = (subjectName: string) => {
    return SUBJECT_COLORS[subjectName] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <motion.div
      draggable
      animate={{
        scale: isDragging ? 0.95 : 1,
        rotate: isDragging ? 2 : 0,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl p-2 cursor-grab active:cursor-grabing border transition-all shadow-sm hover:shadow-md",
        showConflict && "border-red-300 bg-red-50",
        !showConflict && getSubjectColor(entry.subjectName)
      )}
    >
      {showConflict && (
        <div className="absolute top-1 right-1">
          <AlertTriangle className="w-3 h-3 text-red-600" />
        </div>
      )}
      <div className="text-xs font-semibold text-gray-900 line-clamp-1">
        {entry.subjectName}
      </div>
      <div className="text-[10px] text-gray-600 truncate mt-0.5">
        {entry.teacherName}
      </div>
      <div className="text-[10px] text-gray-500 truncate">
        {entry.className}
      </div>
    </motion.div>
  );
}

// ============================================================================
// WORKLOAD HEATMAP
// ============================================================================

interface WorkloadHeatmapProps {
  teacherWorkloads: Map<
    string,
    {
      totalPeriods: number;
      dailyBreakdown: Record<string, number>;
      maxConsecutive: number;
    }
  >;
  days: string[];
}

export function WorkloadHeatmap({ teacherWorkloads, days }: WorkloadHeatmapProps) {
  const maxPeriods = Math.max(
    ...Array.from(teacherWorkloads.values()).map((t) => t.totalPeriods),
    30 // Default max
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Teacher Workload
      </h3>
      <div className="space-y-2">
        {Array.from(teacherWorkloads.entries()).map(([teacherId, data]) => {
          const loadPercent = (data.totalPeriods / maxPeriods) * 100;
          const intensity =
            loadPercent > 80 ? "high" : loadPercent > 50 ? "medium" : "low";

          return (
            <div key={teacherId} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-700 truncate">{teacherId}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loadPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "h-full rounded-full",
                    intensity === "high" && "bg-red-500",
                    intensity === "medium" && "bg-yellow-500",
                    intensity === "low" && "bg-green-500"
                  )}
                />
              </div>
              <div className="text-xs text-gray-500 w-8 text-right">{data.totalPeriods}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// AI SUGGESTIONS CARD
// ============================================================================

interface AISuggestionsProps {
  suggestions: string[];
  onApplySuggestion?: (suggestion: string) => void;
  isAnalyzing?: boolean;
}

export function AISuggestionsCard({ suggestions, onApplySuggestion, isAnalyzing = false }: AISuggestionsProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5" />
      <div className="relative">
        <h3 className="text-sm font-semibold text-violet-900 flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" />
          AI Insights
        </h3>
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-violet-700">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Analyzing timetable...</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-violet-700">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
