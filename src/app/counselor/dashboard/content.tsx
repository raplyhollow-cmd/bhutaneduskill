/**
 * COUNSELOR DASHBOARD PAGE (WITH AI INSIGHTS)
 *
 * Key features:
 * - Student overview with AI-powered insights
 * - Assessment analytics
 * - Students needing attention
 * - Quick actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  FileText,
  Sparkles,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Download,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { fetchCounselorStats } from "../_actions";

// Extend the existing _actions to return AI insights
export interface CounselorStats {
  totalStudents: number;
  activeSchools: number;
  pendingReports: number;
  assessmentsThisWeek: number;
  aiCoachUsage: number;
}

// Server component to fetch stats with AI insights
async function counselorDashboardContent() {
  const stats = await fetchCounselorStats();

  // Mock recent students data (would come from database)
  const recentStudents: StudentInsight[] = [
    {
      id: "1",
      name: "Tashi Dorji",
      school: "Thimphu HSS",
      grade: "12",
      attendance: 82,
      lastActivity: "2 hours ago",
      assessmentStatus: "completed",
      topCareer: "Software Engineer",
      needsAttention: true,
    },
    {
      id: "2",
      name: "Karma Wangmo",
      school: "Yangchenphug HSS",
      grade: "10",
      attendance: 45,
      lastActivity: "1 day ago",
      assessmentStatus: "in_progress",
      topCareer: null,
      needsAttention: true,
    },
    {
      id: "3",
      name: "Pema Lhamo",
      school: "Moiyul Goenpa HSS",
      grade: "11",
      attendance: 78,
      lastActivity: "5 hours ago",
      assessmentStatus: "pending",
      topCareer: null,
      needsAttention: false,
    },
    {
      id: "4",
      name: "Dorji",
      school: "Rigsum HSS",
      grade: "11",
      attendance: 91,
      lastActivity: "3 days ago",
      assessmentStatus: "completed",
      topCareer: "Data Analyst",
      needsAttention: true,
    },
    {
      id: "5",
      name: "Dorji",
      school: "Pelkhil HSS",
      grade: "11",
      attendance: 68,
      lastActivity: "1 day ago",
      assessmentStatus: "completed",
      topCareer: "Nurse",
      needsAttention: false,
    },
  ];

  return {
    stats,
    recentStudents,
  };
}

// Server wrapper component
export default async function CounselorDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Counselor Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your students and activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" asChild>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Coach
          </Button>
        </div>
      </div>

      {/* Server Component - Data Fetching */}
      <counselorDashboardContent />
    </div>
  );
}

export { counselorDashboardContent };
import { fetchCounselorStats } from "../_actions.ts";
