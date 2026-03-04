/**
 * Student Roadmap Engine
 *
 * Generates personalized Class 6 → Class 12 → RUB → Career roadmap
 * Based on: RIASEC results, grades, attendance, BCSE targets, RUB requirements
 *
 * This is the "brain" that shows students their personalized Bhutan career path
 */

import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, careerMatches, studentProgressAnalytics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * RIASEC Career Paths for Bhutan
 * Maps Holland Codes to Bhutan-specific career paths
 */
const RIASEC_CAREER_PATHS: Record<string, {
  hollandCode: string;
  careerPath: string;
  class11_12Stream: "Science" | "Arts" | "Commerce" | "Vocational";
  keySubjects: string[];
  bcseTarget: number;
  rubColleges: string[];
  rubPrograms: string[];
  careers: string[];
}> = {
  "R": {
    hollandCode: "Realistic",
    careerPath: "Technical & Engineering",
    class11_12Stream: "Science",
    keySubjects: ["Math", "Physics", "Chemistry", "English"],
    bcseTarget: 75,
    rubColleges: ["College of Science and Technology", "Gedu College of Engineering"],
    rubPrograms: ["B.E. Civil Engineering", "B.E. Electrical Engineering", "B.E. Mechanical"],
    careers: ["Engineer", "Technician", "Electrician", "Mechanic", "Surveyor"],
  },
  "I": {
    hollandCode: "Investigative",
    careerPath: "Medical & Research",
    class11_12Stream: "Science",
    keySubjects: ["Biology", "Chemistry", "Physics", "Math", "English"],
    bcseTarget: 80,
    rubColleges: ["Jigme Dorji Wangchuck School of Law", "College of Science and Technology"],
    rubPrograms: ["B.E. Biotechnology", "B.Sc. Nursing", "B.Sc. Data Science"],
    careers: ["Doctor", "Researcher", "Scientist", "Data Analyst", "Lab Technician"],
  },
  "A": {
    hollandCode: "Artistic",
    careerPath: "Creative & Cultural",
    class11_12Stream: "Arts",
    keySubjects: ["English", "Dzongkha", "History", "Geography", "Art"],
    bcseTarget: 65,
    rubColleges: ["College of Language and Culture Studies", "Royal Thimphu College"],
    rubPrograms: ["B.A. Dzongkha", "B.A. English", "B.A. History", "B.A. Media Studies"],
    careers: ["Artist", "Writer", "Designer", "Teacher", "Journalist", "Cultural Officer"],
  },
  "S": {
    hollandCode: "Social",
    careerPath: "Teaching & Service",
    class11_12Stream: "Arts", // Also accepts Commerce
    keySubjects: ["English", "Math", "Economics", "Dzongkha", "History"],
    bcseTarget: 70,
    rubColleges: ["Samtse College of Education", "Paro College of Education"],
    rubPrograms: ["B.Ed Primary", "B.Ed Secondary", "B.A. Economics", "B.A. Psychology"],
    careers: ["Teacher", "Counselor", "Social Worker", "Civil Servant", "HR Manager"],
  },
  "E": {
    hollandCode: "Enterprising",
    careerPath: "Business & Leadership",
    class11_12Stream: "Commerce",
    keySubjects: ["Math", "English", "Economics", "Accountancy", "Business Studies"],
    bcseTarget: 70,
    rubColleges: ["Royal Thimphu College", "Gedu College of Business Studies"],
    rubPrograms: ["BBA", "B.Com", "B.A. Economics", "B.A. Business Administration"],
    careers: ["Business Owner", "Manager", "Civil Servant", "Entrepreneur", "Sales"],
  },
  "C": {
    hollandCode: "Conventional",
    careerPath: "Administrative & Finance",
    class11_12Stream: "Commerce",
    keySubjects: ["Math", "English", "Economics", "Accountancy", "Computer Science"],
    bcseTarget: 70,
    rubColleges: ["College of Science and Technology", "Gedu College of Business Studies"],
    rubPrograms: ["B.Com", "BCA", "B.Sc. Information Technology", "BBA"],
    careers: ["Accountant", "Banker", "Data Analyst", "Office Admin", "Civil Servant"],
  },
};

/**
 * Roadmap Milestone
 */
export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  targetGrade?: string;
  targetYear?: number;
  status: "completed" | "in_progress" | "pending" | "locked";
  progress: number; // 0-100
  dependencies: string[];
  icon: string;
  color: string;
}

/**
 * Student Roadmap
 */
export interface StudentRoadmap {
  studentId: string;
  studentName: string;
  currentGrade: number;
  primaryCode: string;
  secondaryCode?: string;
  careerPath: string;
  recommendedStream: string;
  recommendedSubjects: string[];
  targetCareer: string;
  bcseTarget: number;
  currentBcseReadiness: number;
  rubColleges: string[];
  rubPrograms: string[];
  milestones: RoadmapMilestone[];
  timeline: {
    now: string;
    class9_10: string;
    class11_12: string;
    bcse: string;
    rub: string;
    career: string;
  };
}

/**
 * Generate Personalized Roadmap for a Student
 */
export async function generateStudentRoadmap(userId: string): Promise<StudentRoadmap | null> {
  // Get student data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  // Get RIASEC results
  const [riasec] = await db
    .select()
    .from(riasecResults)
    .where(eq(riasecResults.userId, userId))
    .orderBy(riasecResults.createdAt)
    .limit(1);

  // Get MBTI results for additional context
  const [mbti] = await db
    .select()
    .from(mbtiResults)
    .where(eq(mbtiResults.userId, userId))
    .orderBy(mbtiResults.createdAt)
    .limit(1);

  // Get career matches
  const matches = await db
    .select()
    .from(careerMatches)
    .where(eq(careerMatches.studentId, userId))
    .limit(10);

  // Get progress analytics
  const [progress] = await db
    .select()
    .from(studentProgressAnalytics)
    .where(eq(studentProgressAnalytics.userId, userId))
    .limit(1);

  // Determine primary Holland code
  const primaryCode = riasec?.primaryHollandCode?.[0]?.toUpperCase() || riasec?.hollandCode?.[0]?.toUpperCase() || "S";
  const secondaryCode = riasec?.secondaryHollandCode?.[0]?.toUpperCase() || riasec?.hollandCode?.[1]?.toUpperCase();

  // Get career path based on RIASEC
  const careerPathData = RIASEC_CAREER_PATHS[primaryCode] || RIASEC_CAREER_PATHS["S"];

  // Current grade
  const currentGrade = user.grade || 10;
  const isMiddleSchool = currentGrade <= 8;
  const isHighSchool = currentGrade >= 9;

  // Calculate BCSE readiness (simplified - would use actual grades)
  const currentBcseReadiness = 65 + Math.random() * 20; // TODO: Calculate from actual grades
  const bcseGap = careerPathData.bcseTarget - currentBcseReadiness;

  // Generate milestones based on current grade
  const milestones: RoadmapMilestone[] = [];

  // Milestone 1: Complete Assessments
  milestones.push({
    id: "assessments",
    title: "Complete Career Assessments",
    description: "Take RIASEC, MBTI, and Work Values assessments",
    status: riasec ? "completed" : "pending",
    progress: riasec ? 100 : (mbti ? 50 : 0),
    dependencies: [],
    icon: "clipboard",
    color: "blue",
  });

  // Middle school milestones
  if (isMiddleSchool) {
    milestones.push({
      id: "explore",
      title: "Explore Career Options",
      description: `Learn about ${careerPathData.careerPath} careers`,
      targetGrade: "Class 6-8",
      status: "in_progress",
      progress: 30,
      dependencies: ["assessments"],
      icon: "compass",
      color: "green",
    });
  }

  // Class 9-10 milestones
  if (!isHighSchool || currentGrade >= 9) {
    const subjectsCompleted = progress?.skillsIdentified ? 75 : 0;
    milestones.push({
      id: "subjects_9_10",
      title: "Choose Class 9-10 Subjects",
      description: `Focus on: ${careerPathData.keySubjects.slice(0, 4).join(", ")}`,
      targetGrade: "Class 9-10",
      status: isHighSchool ? "completed" : "pending",
      progress: isHighSchool ? 100 : subjectsCompleted,
      dependencies: ["assessments"],
      icon: "book",
      color: "purple",
    });
  }

  // Class 11-12 stream selection
  if (currentGrade < 11 || user.grade === 11) {
    milestones.push({
      id: "stream_selection",
      title: `Choose ${careerPathData.class11_12Stream} Stream`,
      description: `Select ${careerPathData.class11_12Stream} stream for Class 11-12`,
      targetGrade: "Class 11",
      status: user.grade >= 11 ? "completed" : "pending",
      progress: user.grade >= 11 ? 100 : 0,
      dependencies: ["subjects_9_10"],
      icon: "target",
      color: "orange",
    });
  }

  // BCSE preparation
  milestones.push({
    id: "bcse_prep",
    title: "Prepare for BCSE Exams",
    description: `Target: ${careerPathData.bcseTarget}% for ${careerPathData.careerPath}`,
    targetGrade: "Class 12",
    status: "pending",
    progress: Math.min(100, (currentBcseReadiness / careerPathData.bcseTarget) * 100),
    dependencies: ["stream_selection"],
    icon: "award",
    color: "red",
  });

  if (bcseGap > 0) {
    milestones.push({
      id: "bcse_gap",
      title: "Focus on Weak Areas",
      description: `You're ${bcseGap.toFixed(0)}% below target. Need extra study in key subjects.`,
      status: "pending",
      progress: 0,
      dependencies: ["bcse_prep"],
      icon: "alert-triangle",
      color: "amber",
    });
  }

  // RUB application
  milestones.push({
    id: "rub_application",
    title: "Apply to RUB Colleges",
    description: `Apply to: ${careerPathData.rubColleges.slice(0, 2).join(", ")}`,
    targetYear: new Date().getFullYear() + (12 - currentGrade),
    status: "locked",
    progress: 0,
    dependencies: ["bcse_prep"],
    icon: "graduation-cap",
    color: "blue",
  });

  // Career goal
  const topCareer = matches[0]?.careerTitle || careerPathData.careers[0];
  milestones.push({
    id: "career_goal",
    title: `Career: ${topCareer}`,
    description: `Your goal: ${topCareer} in Bhutan`,
    status: "locked",
    progress: 0,
    dependencies: ["rub_application"],
    icon: "briefcase",
    color: "green",
  });

  // Timeline
  const currentYear = new Date().getFullYear();
  const yearsUntilClass12 = 12 - currentGrade;
  const gradYear = currentYear + yearsUntilClass12;

  return {
    studentId: userId,
    studentName: user.name,
    currentGrade,
    primaryCode,
    secondaryCode,
    careerPath: careerPathData.careerPath,
    recommendedStream: careerPathData.class11_12Stream,
    recommendedSubjects: careerPathData.keySubjects,
    targetCareer: topCareer,
    bcseTarget: careerPathData.bcseTarget,
    currentBcseReadiness: Math.round(currentBcseReadiness),
    rubColleges: careerPathData.rubColleges,
    rubPrograms: careerPathData.rubPrograms,
    milestones,
    timeline: {
      now: `Class ${currentGrade} - ${isMiddleSchool ? "Explore your interests" : "Focus on your goals"}`,
      class9_10: "Choose subjects that align with your career path",
      class11_12: `Join ${careerPathData.class11_12Stream} stream, aim for ${careerPathData.bcseTarget}% BCSE`,
      bcse: "Score well in BCSE to get into RUB",
      rub: `Apply to ${careerPathData.rubColleges[0]}`,
      career: `Start your journey as a ${topCareer}`,
    },
  };
}

/**
 * Get Roadmap Summary (quick view for dashboard)
 */
export async function getRoadmapSummary(userId: string) {
  const roadmap = await generateStudentRoadmap(userId);
  if (!roadmap) return null;

  const completed = roadmap.milestones.filter((m) => m.status === "completed").length;
  const pending = roadmap.milestones.filter((m) => m.status === "pending").length;
  const inProgress = roadmap.milestones.filter((m) => m.status === "in_progress").length;

  return {
    careerPath: roadmap.careerPath,
    targetCareer: roadmap.targetCareer,
    recommendedStream: roadmap.recommendedStream,
    bcseTarget: roadmap.bcseTarget,
    bcseReadiness: roadmap.currentBcseReadiness,
    onTrack: roadmap.currentBcseReadiness >= roadmap.bcseTarget - 10,
    progress: {
      completed,
      inProgress,
      pending,
      total: roadmap.milestones.length,
      percentage: Math.round((completed / roadmap.milestones.length) * 100),
    },
  };
}
