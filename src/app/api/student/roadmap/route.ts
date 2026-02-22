import { logger } from "@/lib/logger";
/**
 * Student Roadmap API
 *
 * GET /api/student/roadmap
 *
 * Returns a personalized learning roadmap based on:
 * - Student's current grade level
 * - Assessment results (RIASEC codes)
 * - Career matches
 * - Academic progress
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, riasecResults, careerMatches, assessments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { RoadmapStage, StudentRoadmap, StageStatus } from "@/types/student";

// Cache response for 5 minutes
export const revalidate = 300;

function getStageStatus(currentGrade: number, gradeRange: [number, number]): StageStatus {
  const [from, to] = gradeRange;

  if (currentGrade > to) {
    return "completed";
  } else if (currentGrade >= from && currentGrade <= to) {
    return "current";
  } else if (currentGrade < from && from - currentGrade <= 2) {
    return "upcoming";
  } else {
    return "locked";
  }
}

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

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    // Get student profile
    const student = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const currentGrade = student.classGrade || 10;

    // Get RIASEC results for personalization
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, userId),
      orderBy: desc(riasecResults.createdAt),
    });

    // Get career matches for personalization
    const userAssessments = await db.query.assessments.findMany({
      where: eq(assessments.userId, userId),
    });

    let topCareer: string | undefined;
    const assessmentIds = userAssessments.map((a) => a.id);
    if (assessmentIds.length > 0) {
      const matches = await db.query.careerMatches.findMany({
        where: eq(careerMatches.assessmentId, assessmentIds[0]),
        orderBy: desc(careerMatches.matchScore),
        limit: 1,
      });
      if (matches.length > 0) {
        topCareer = matches[0].careerTitle;
      }
    }

    // Update stage statuses based on current grade
    const stages = DEFAULT_STAGES.map((stage) => ({
      ...stage,
      status: getStageStatus(currentGrade, stage.gradeRange),
    }));

    // Generate personalized note
    let personalizedNote = "";

    if (currentGrade <= 10) {
      personalizedNote =
        "Focus on your BCSE exams - good grades here open doors to top RUB colleges!";
    } else if (currentGrade <= 12) {
      personalizedNote =
        "Choose subjects that align with your career goals. Check RUB college requirements!";
    } else {
      personalizedNote =
        "You're on your way! Keep building skills for your dream career.";
    }

    if (topCareer) {
      personalizedNote += ` Your interest in ${topCareer} is a great direction!`;
    }

    const roadmap: StudentRoadmap = {
      stages,
      currentGrade,
      targetCareer: topCareer,
      personalizedNote,
    };

    return NextResponse.json(roadmap);
  } catch (error: any) {
    logger.apiError(error, { route: "/api/student/roadmap", method: "GET" });

    // Return default roadmap on error
    return NextResponse.json({
      stages: DEFAULT_STAGES,
      currentGrade: 10,
    });
  }
}
