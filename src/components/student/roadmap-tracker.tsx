"use client";

/**
 * Student Roadmap Tracker
 *
 * Interactive timeline visualization showing the learning path
 * from Class 10 to RUB college and career.
 *
 * Features:
 * - Horizontal scrollable timeline
 * - Dynamic stages based on current grade
 * - Status indicators (completed, current, upcoming, locked)
 * - Milestone cards for each stage
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Map,
  CheckCircle2,
  Circle,
  Lock,
  GraduationCap,
  BookOpen,
  Briefcase,
  Flag,
  ChevronRight,
} from "lucide-react";
import type { RoadmapStage, StageStatus, StudentRoadmap } from "@/types/student";

const STATUS_ICONS: Record<StageStatus, React.ElementType> = {
  completed: CheckCircle2,
  current: Flag,
  upcoming: Circle,
  locked: Lock,
};

const STATUS_COLORS: Record<StageStatus, string> = {
  completed: "text-green-600",
  current: "text-orange-600",
  upcoming: "text-gray-400",
  locked: "text-gray-300",
};

const STATUS_BADGES: Record<StageStatus, "ceramic-success" | "ceramic-warning" | "ceramic-default" | "outline"> = {
  completed: "ceramic-success",
  current: "ceramic-warning",
  upcoming: "ceramic-default",
  locked: "outline",
};

// Default roadmap stages (fallback if API fails)
const DEFAULT_STAGES: RoadmapStage[] = [
  {
    id: "foundation",
    title: "Foundation",
    description: "Build strong basics in all subjects",
    icon: "📚",
    gradeRange: [6, 8],
    status: "completed",
    milestones: [
      { id: "m1", title: "Master basic Math", description: "Arithmetic, algebra basics", completed: true },
      { id: "m2", title: "Read regularly", description: "Develop reading habit", completed: true },
      { id: "m3", title: "Explore interests", description: "Try different activities", completed: true },
    ],
    color: "rgb(34 197 94)",
  },
  {
    id: "bcse",
    title: "BCSE Preparation",
    description: "Class 10 board exams - important milestone",
    icon: "📝",
    gradeRange: [9, 10],
    status: "current",
    milestones: [
      { id: "m4", title: "Complete syllabus", description: "Finish all chapters", completed: false },
      { id: "m5", title: "Practice papers", description: "Solve past BCSE papers", completed: false },
      { id: "m6", title: "BCSE Exam", description: "Ace your board exams!", completed: false },
    ],
    color: "rgb(249 115 22)",
  },
  {
    id: "specialization",
    title: "Specialization",
    description: "Choose your stream and focus subjects",
    icon: "🎯",
    gradeRange: [11, 12],
    status: "upcoming",
    milestones: [
      { id: "m7", title: "Select stream", description: "Science/Commerce/Arts", completed: false },
      { id: "m8", title: "Deep learning", description: "Master chosen subjects", completed: false },
      { id: "m9", title: "Class 12 Exams", description: "Prepare for RUB entrance", completed: false },
    ],
    color: "rgb(59 130 246)",
  },
  {
    id: "college",
    title: "RUB College",
    description: "Undergraduate degree at Royal University",
    icon: "🎓",
    gradeRange: [13, 16],
    status: "locked",
    milestones: [
      { id: "m10", title: "Choose college", description: "Sherubtse, CNR, CST, etc.", completed: false },
      { id: "m11", title: "Get admitted", description: "Clear entrance exams", completed: false },
      { id: "m12", title: "Complete degree", description: "Graduate with honors", completed: false },
    ],
    color: "rgb(168 85 247)",
  },
  {
    id: "career",
    title: "Career",
    description: "Start your professional journey",
    icon: "💼",
    gradeRange: [17, 100],
    status: "locked",
    milestones: [
      { id: "m13", title: "Find opportunities", description: "Job hunting or further studies", completed: false },
      { id: "m14", title: "Contribute", description: "Build Bhutan's future", completed: false },
    ],
    color: "rgb(236 72 153)",
  },
];

interface RoadmapTrackerProps {
  className?: string;
}

export function RoadmapTracker({ className = "" }: RoadmapTrackerProps) {
  const [roadmap, setRoadmap] = useState<StudentRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      const response = await fetch("/api/student/roadmap");
      if (response.ok) {
        const data = await response.json();
        setRoadmap(data);
      } else {
        // Use default stages on error
        setRoadmap({ stages: DEFAULT_STAGES, currentGrade: 10 });
      }
    } catch {
      // Use default stages on error
      setRoadmap({ stages: DEFAULT_STAGES, currentGrade: 10 });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card variant="ceramic" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-48 shrink-0 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stages = roadmap?.stages || DEFAULT_STAGES;
  const currentGrade = roadmap?.currentGrade || 10;

  // Count completed milestones
  const totalMilestones = stages.reduce(
    (sum, stage) => sum + stage.milestones.length,
    0
  );
  const completedMilestones = stages.reduce(
    (sum, stage) =>
      sum + stage.milestones.filter((m) => m.completed).length,
    0
  );
  const progressPercent = Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <Card variant="ceramic" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-orange-600" />
              Your Learning Path
            </CardTitle>
            <CardDescription>
              Track your journey from Class {currentGrade} to your dream career
            </CardDescription>
          </div>
          <Badge variant={progressPercent > 50 ? "ceramic-success" : "ceramic-warning"}>
            {progressPercent}% Complete
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {stages.map((stage, index) => (
              <StageCard key={stage.id} stage={stage} isLast={index === stages.length - 1} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {roadmap?.personalizedNote && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>💡 Tip:</strong> {roadmap.personalizedNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STAGE CARD COMPONENT
// ============================================================================

interface StageCardProps {
  stage: RoadmapStage;
  isLast: boolean;
}

function StageCard({ stage, isLast }: StageCardProps) {
  const StatusIcon = STATUS_ICONS[stage.status];
  const statusColor = STATUS_COLORS[stage.status];
  const badgeVariant = STATUS_BADGES[stage.status];

  return (
    <div
      className={`shrink-0 w-56 p-4 rounded-lg border-2 transition-all ${
        stage.status === "completed"
          ? "bg-green-50 border-green-200"
          : stage.status === "current"
          ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 shadow-sm"
          : stage.status === "upcoming"
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-100 opacity-70"
      }`}
    >
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{stage.icon}</div>
        <Badge variant={badgeVariant} className="text-[10px]">
          {stage.status === "completed"
            ? "Done"
            : stage.status === "current"
            ? "Current"
            : stage.status === "upcoming"
            ? "Next"
            : "Locked"}
        </Badge>
      </div>

      {/* Stage Title */}
      <h4 className="font-semibold text-sm mb-1">{stage.title}</h4>
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{stage.description}</p>

      {/* Milestones */}
      <div className="space-y-2">
        {stage.milestones.slice(0, 3).map((milestone) => (
          <div key={milestone.id} className="flex items-start gap-2">
            <div className="mt-0.5">
              {milestone.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.3 text-gray-300 shrink-0" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-medium truncate ${
                  milestone.completed ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {milestone.title}
              </p>
            </div>
          </div>
        ))}
        {stage.milestones.length > 3 && (
          <p className="text-xs text-gray-400 pl-5">
            +{stage.milestones.length - 3} more milestones
          </p>
        )}
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
          <ChevronRight className={`w-6 h-6 ${
            stage.status === "completed" ? "text-green-400" : "text-gray-300"
          }`} />
        </div>
      )}

      {/* Grade Range Badge */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-500">
          Class {stage.gradeRange[0]}
          {stage.gradeRange[1] > stage.gradeRange[0] && ` - ${stage.gradeRange[1]}`}
        </p>
      </div>
    </div>
  );
}
