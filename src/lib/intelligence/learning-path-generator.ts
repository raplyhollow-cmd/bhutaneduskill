/**
 * LEARNING PATH GENERATOR
 *
 * Creates personalized learning roadmaps for students based on:
 * - Current skills vs career requirements (skills gap)
 * - Assessment results (RIASEC, MBTI)
 * - Learning pace and performance
 * - Available resources (videos, courses, projects)
 *
 * Output: Week-by-week plan to reach career readiness
 */

import { db } from "@/lib/db";
import { users, studentSkills, careers, careerMatches, homeworkSubmissions, homework, riasecResults } from "@/lib/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface LearningStep {
  stepId: string;
  week: number;
  title: string;
  description: string;
  skills: string[];
  resources: LearningResource[];
  projects: Project[];
  estimatedHours: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "not_started" | "in_progress" | "completed";
}

export interface LearningResource {
  type: "video" | "article" | "course" | "book" | "practice";
  title: string;
  url?: string;
  provider: string;
  duration: string;
  free: boolean;
}

export interface Project {
  title: string;
  description: string;
  skills: string[];
  estimatedTime: string;
  outcome: string;
}

export interface LearningPath {
  studentId: string;
  studentName: string;
  targetCareer: {
    id: string;
    title: string;
    matchScore: number;
  };
  currentReadiness: number; // 0-100
  skillsGap: {
    matchingSkills: Array<{ skill: string; level: string }>;
    missingSkills: Array<{ skill: string; priority: "critical" | "high" | "medium" }>;
  };
  estimatedWeeks: number;
  steps: LearningStep[];
  milestones: Array<{
    week: number;
    title: string;
    readinessTarget: number;
  }>;
  recommendations: string[];
  lastUpdated: Date;
}

// ============================================================================
// BHUTAN-SPECIFIC LEARNING RESOURCES
// ============================================================================

const BHUTAN_LEARNING_RESOURCES = {
  // Free/Online resources
  digital: [
    {
      skills: ["Computer", "Digital Literacy", "IT"],
      resources: [
        { type: "course", title: "Digital Literacy Basics", provider: "NIEIT", duration: "4 weeks", free: true },
        { type: "video", title: "Computer Basics in Dzongkha", provider: "YouTube", duration: "10 hours", free: true },
      ]
    },
    {
      skills: ["Mathematics", "Problem Solving"],
      resources: [
        { type: "practice", title: "Khan Academy Math", provider: "Khan Academy", duration: "Self-paced", free: true },
        { type: "video", title: "Practical Math Skills", provider: "YouTube", duration: "8 hours", free: true },
      ]
    },
    {
      skills: ["English", "Communication", "Writing"],
      resources: [
        { type: "course", title: "Business Communication", provider: "Coursera", duration: "6 weeks", free: true },
        { type: "practice", title: "Grammar & Writing", provider: "Duolingo", duration: "Self-paced", free: true },
      ]
    },
  ],

  // Vocational/T vocational skills
  vocational: [
    {
      skills: ["Carpentry", "Woodworking"],
      resources: [
        { type: "video", title: "Woodworking Fundamentals", provider: "YouTube", duration: "15 hours", free: true },
        { type: "project", title: "Build a Simple Table", provider: "Hands-on", duration: "1 week", free: true },
        { type: "article", title: "Introduction to Carpentry Tools", provider: "WikiHow", duration: "2 hours", free: true },
      ]
    },
    {
      skills: ["Painting", "Art", "Design"],
      resources: [
        { type: "video", title: "Painting Techniques for Beginners", provider: "YouTube", duration: "12 hours", free: true },
        { type: "course", title: "Color Theory Basics", provider: "Skillshare", duration: "2 weeks", free: false },
        { type: "project", title: "Create Your Own Painting", provider: "Hands-on", duration: "1 week", free: true },
      ]
    },
    {
      skills: ["Electrical", "Wiring"],
      resources: [
        { type: "video", title: "Basic Electrical Work", provider: "YouTube", duration: "10 hours", free: true },
        { type: "article", title: "Home Wiring Safety", provider: "WikiHow", duration: "3 hours", free: true },
      ]
    },
    {
      skills: ["Plumbing", "Pipe Fitting"],
      resources: [
        { type: "video", title: "Plumbing Basics", provider: "YouTube", duration: "8 hours", free: true },
        { type: "project", title: "Fix a Leaking Tap", provider: "Hands-on", duration: "1 day", free: true },
      ]
    },
    {
      skills: ["Welding", "Metal Work"],
      resources: [
        { type: "video", title: "Welding Fundamentals", provider: "YouTube", duration: "20 hours", free: true },
        { type: "course", title: "Introduction to Welding", provider: "TVET Institute", duration: "6 weeks", free: false },
      ]
    },
    {
      skills: ["Tailoring", "Sewing", "Fashion Design"],
      resources: [
        { type: "video", title: "Sewing Basics", provider: "YouTube", duration: "10 hours", free: true },
        { type: "project", title: "Sew a Simple Shirt", provider: "Hands-on", duration: "1 week", free: true },
        { type: "course", title: "Traditional Bhutanese Textile Design", provider: "Textile Museum", duration: "4 weeks", free: false },
      ]
    },
    {
      skills: ["Weaving", "Textile"],
      resources: [
        { type: "course", title: "Traditional Thangka Weaving", provider: "TVET", duration: "8 weeks", free: false },
        { type: "project", title: "Weave a Simple Pattern", provider: "Hands-on", duration: "2 weeks", free: true },
      ]
    },
    {
      skills: ["Cooking", "Culinary"],
      resources: [
        { type: "video", title: "Cooking Fundamentals", provider: "YouTube", duration: "15 hours", free: true },
        { type: "project", title: "Prepare a Traditional Bhutanese Meal", provider: "Hands-on", duration: "1 day", free: true },
      ]
    },
  ],

  // Service skills
  service: [
    {
      skills: ["Customer Service", "Communication"],
      resources: [
        { type: "course", title: "Customer Service Excellence", provider: "Coursera", duration: "4 weeks", free: true },
        { type: "article", title: "Dealing with Difficult Customers", provider: "HubSpot", duration: "2 hours", free: true },
      ]
    },
    {
      skills: ["Sales", "Marketing"],
      resources: [
        { type: "course", title: "Sales Fundamentals", provider: "HubSpot Academy", duration: "3 weeks", free: true },
        { type: "video", title: "Marketing Basics", provider: "YouTube", duration: "6 hours", free: true },
      ]
    },
    {
      skills: ["Teaching", "Tutoring"],
      resources: [
        { type: "course", title: "Teaching Methods", provider: "Coursera", duration: "6 weeks", free: true },
        { type: "project", title: "Tutor a Junior Student", provider: "School", duration: "Ongoing", free: true },
      ]
    },
  ],

  // Soft skills
  soft: [
    {
      skills: ["Leadership", "Teamwork"],
      resources: [
        { type: "course", title: "Leadership Fundamentals", provider: "Khan Academy", duration: "4 weeks", free: true },
        { type: "project", title: "Lead a Group Project", provider: "School", duration: "2 weeks", free: true },
      ]
    },
    {
      skills: ["Time Management", "Organization"],
      resources: [
        { type: "article", title: "Time Management for Students", provider: "MindTools", duration: "2 hours", free: true },
        { type: "practice", title: "Weekly Planning Exercise", provider: "Self", duration: "Ongoing", free: true },
      ]
    },
    {
      skills: ["Communication", "Public Speaking"],
      resources: [
        { type: "course", title: "Public Speaking Basics", provider: "TED-Ed", duration: "3 weeks", free: true },
        { type: "project", title: "Present to Class", provider: "School", duration: "1 day", free: true },
      ]
    },
  ],
};

// ============================================================================
// LEARNING PATH GENERATOR CLASS
// ============================================================================

export class LearningPathGenerator {
  /**
   * Generate a complete learning path for a student
   */
  async generateLearningPath(studentId: string): Promise<LearningPath | null> {
    // Get student info
    const [student] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) return null;

    // Get student's top career match
    const [topMatch] = await db
      .select({
        careerId: careerMatches.careerId,
        matchScore: careerMatches.matchScore,
      })
      .from(careerMatches)
      .where(eq(careerMatches.studentId, studentId))
      .orderBy(desc(careerMatches.matchScore))
      .limit(1);

    if (!topMatch) {
      return null;
    }

    // Get career details
    const [career] = await db
      .select({
        id: careers.id,
        title: careers.title,
        skills: careers.skills,
        educationLevel: careers.educationLevel,
      })
      .from(careers)
      .where(eq(careers.id, topMatch.careerId))
      .limit(1);

    if (!career) return null;

    const careerSkills = (career.skills as string[]) || [];

    // Get student's current skills
    const studentSkillsList = await db
      .select({
        skillName: studentSkills.skillName,
        level: studentSkills.level,
        confidence: studentSkills.confidence,
      })
      .from(studentSkills)
      .where(eq(studentSkills.userId, studentId));

    // Calculate skills gap
    const studentSkillNames = studentSkillsList.map(s => s.skillName.toLowerCase());
    const matchingSkills: Array<{ skill: string; level: string }> = [];
    const missingSkills: Array<{ skill: string; priority: "critical" | "high" | "medium" }> = [];

    for (const requiredSkill of careerSkills) {
      const hasSkill = studentSkillNames.some(s => s.includes(requiredSkill.toLowerCase()));

      if (hasSkill) {
        const studentSkill = studentSkillsList.find(s =>
          s.skillName.toLowerCase().includes(requiredSkill.toLowerCase())
        );
        matchingSkills.push({
          skill: requiredSkill,
          level: studentSkill?.level || "beginner",
        });
      } else {
        // Determine priority based on how common the skill is across careers
        const priority = this.getSkillPriority(requiredSkill);
        missingSkills.push({ skill: requiredSkill, priority });
      }
    }

    // Calculate current readiness
    const currentReadiness = careerSkills.length > 0
      ? Math.round((matchingSkills.length / careerSkills.length) * 100)
      : 0;

    // Generate learning steps
    const steps = await this.generateLearningSteps(
      missingSkills,
      matchingSkills,
      currentReadiness,
      career
    );

    // Generate milestones
    const milestones = this.generateMilestones(steps, currentReadiness);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentReadiness,
      missingSkills.length,
      studentId
    );

    return {
      studentId: student.id,
      studentName: student.name,
      targetCareer: {
        id: career.id,
        title: career.title,
        matchScore: topMatch.matchScore,
      },
      currentReadiness,
      skillsGap: {
        matchingSkills,
        missingSkills,
      },
      estimatedWeeks: steps.length,
      steps,
      milestones,
      recommendations,
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate week-by-week learning steps
   */
  private async generateLearningSteps(
    missingSkills: Array<{ skill: string; priority: "critical" | "high" | "medium" }>,
    matchingSkills: Array<{ skill: string; level: string }>,
    currentReadiness: number,
    career: { title: string; educationLevel?: string }
  ): Promise<LearningStep[]> {
    const steps: LearningStep[] = [];
    let weekNumber = 1;

    // Sort missing skills by priority
    const sortedMissingSkills = [...missingSkills].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Group skills by category for efficient learning
    const skillGroups = this.groupSkillsByCategory(sortedMissingSkills);

    // Foundation phase (weeks 1-4) - Core fundamentals
    const foundationSkills = skillGroups.foundational || [];
    if (foundationSkills.length > 0) {
      steps.push({
        stepId: `step-${weekNumber}`,
        week: weekNumber++,
        title: "Build Foundation Skills",
        description: `Start with core skills needed for ${career.title}`,
        skills: foundationSkills.slice(0, 3).map(s => s.skill),
        resources: this.getResourcesForSkills(foundationSkills.slice(0, 3).map(s => s.skill)),
        projects: this.getProjectsForSkills(foundationSkills.slice(0, 2).map(s => s.skill)),
        estimatedHours: 20,
        difficulty: "beginner",
        status: "not_started",
      });
    }

    // Skill building phase (weeks 5+) - Specialized skills
    for (let i = 0; i < sortedMissingSkills.length; i += 2) {
      const batchSkills = sortedMissingSkills.slice(i, i + 2);
      const skillNames = batchSkills.map(s => s.skill);

      steps.push({
        stepId: `step-${weekNumber}`,
        week: weekNumber++,
        title: `Develop ${skillNames[0]} Skills`,
        description: `Focus on ${skillNames.join(" and ")} with hands-on practice`,
        skills: skillNames,
        resources: this.getResourcesForSkills(skillNames),
        projects: this.getProjectsForSkills(skillNames),
        estimatedHours: 15,
        difficulty: i < 4 ? "intermediate" : "advanced",
        status: "not_started",
      });
    }

    // Enhance existing skills phase
    const intermediateSkills = matchingSkills.filter(s => s.level === "beginner" || s.level === "intermediate");
    if (intermediateSkills.length > 0) {
      steps.push({
        stepId: `step-${weekNumber}`,
        week: weekNumber++,
        title: "Strengthen Existing Skills",
        description: "Advance the skills you already have to expert level",
        skills: intermediateSkills.slice(0, 3).map(s => s.skill),
        resources: this.getResourcesForSkills(intermediateSkills.slice(0, 3).map(s => s.skill)),
        projects: [],
        estimatedHours: 10,
        difficulty: "advanced",
        status: "not_started",
      });
    }

    // Career preparation phase
    steps.push({
      stepId: `step-${weekNumber}`,
      week: weekNumber++,
      title: "Career Preparation",
      description: `Get ready for your career as a ${career.title}`,
      skills: ["Portfolio Building", "Interview Skills", "Career Planning"],
      resources: [
        {
          type: "article",
          title: "How to Create a Career Portfolio",
          provider: "Career Services",
          duration: "2 hours",
          free: true,
        },
        {
          type: "article",
          title: "Interview Preparation Tips",
          provider: "Career Services",
          duration: "1 hour",
          free: true,
        },
      ],
      projects: [
        {
          title: "Create Your Career Portfolio",
          description: "Document your skills, projects, and achievements",
          skills: ["Documentation", "Presentation"],
          estimatedTime: "1 week",
          outcome: "Ready-to-share portfolio",
        },
      ],
      estimatedHours: 10,
      difficulty: "intermediate",
      status: "not_started",
    });

    return steps.slice(0, 12); // Max 12 weeks shown
  }

  /**
   * Group skills by learning category
   */
  private groupSkillsByCategory(
    skills: Array<{ skill: string; priority: string }>
  ): Record<string, Array<{ skill: string; priority: string }>> {
    const groups: Record<string, Array<{ skill: string; priority: string }>> = {
      foundational: [],
      technical: [],
      soft: [],
      specialized: [],
    };

    for (const skill of skills) {
      const lowerSkill = skill.skill.toLowerCase();

      if (["mathematics", "english", "communication", "computer", "digital literacy"].some(s =>
        lowerSkill.includes(s)
      )) {
        groups.foundational.push(skill);
      } else if (["teamwork", "leadership", "time management", "problem solving"].some(s =>
        lowerSkill.includes(s)
      )) {
        groups.soft.push(skill);
      } else {
        groups.specialized.push(skill);
      }
    }

    return groups;
  }

  /**
   * Get learning resources for specific skills
   */
  private getResourcesForSkills(skills: string[]): LearningResource[] {
    const resources: LearningResource[] = [];

    for (const skill of skills) {
      const lowerSkill = skill.toLowerCase();

      // Search in all resource categories
      for (const category of Object.values(BHUTAN_LEARNING_RESOURCES)) {
        for (const resourceGroup of category) {
          if (resourceGroup.skills.some(s => lowerSkill.includes(s.toLowerCase()) || s.toLowerCase().includes(lowerSkill))) {
            resources.push(...resourceGroup.resources.slice(0, 2).map(r => ({
              ...r,
              skills: [skill],
            })) as unknown as LearningResource[]);
          }
        }
      }
    }

    // If no specific resources found, add generic ones
    if (resources.length === 0 && skills.length > 0) {
      resources.push({
        type: "practice",
        title: `Practice ${skills[0]}`,
        provider: "Self-directed",
        duration: "Self-paced",
        free: true,
      });
    }

    return resources.slice(0, 5);
  }

  /**
   * Get project ideas for skills
   */
  private getProjectsForSkills(skills: string[]): Project[] {
    const projects: Project[] = [];

    for (const skill of skills) {
      const lowerSkill = skill.toLowerCase();

      // Skill-specific project suggestions
      if (lowerSkill.includes("paint") || lowerSkill.includes("art")) {
        projects.push({
          title: "Create a Painting Portfolio",
          description: "Paint 5 different subjects to build your portfolio",
          skills: [skill],
          estimatedTime: "2 weeks",
          outcome: "5 completed paintings",
        });
      } else if (lowerSkill.includes("wood") || lowerSkill.includes("carpent")) {
        projects.push({
          title: "Build a Small Furniture Piece",
          description: "Build a stool or small table using basic woodworking",
          skills: [skill],
          estimatedTime: "1 week",
          outcome: "Completed furniture piece",
        });
      } else if (lowerSkill.includes("sewing") || lowerSkill.includes("tailor")) {
        projects.push({
          title: "Sew a Complete Outfit",
          description: "Create a traditional Bhutanese outfit from pattern to finish",
          skills: [skill],
          estimatedTime: "2 weeks",
          outcome: "Completed outfit",
        });
      } else if (lowerSkill.includes("cook") || lowerSkill.includes("culinary")) {
        projects.push({
          title: "Prepare a 3-Course Bhutanese Meal",
          description: "Cook appetizer, main dish, and dessert",
          skills: [skill],
          estimatedTime: "1 day",
          outcome: "Complete meal experience",
        });
      } else if (lowerSkill.includes("comput") || lowerSkill.includes("digital")) {
        projects.push({
          title: "Create a Digital Portfolio",
          description: "Build a simple website or document showcasing your work",
          skills: [skill],
          estimatedTime: "1 week",
          outcome: "Online portfolio",
        });
      } else {
        projects.push({
          title: `Practice ${skill} Project`,
          description: `Apply your ${skill} knowledge in a practical project`,
          skills: [skill],
          estimatedTime: "1 week",
          outcome: `Improved ${skill} abilities`,
        });
      }
    }

    return projects.slice(0, 3);
  }

  /**
   * Get priority level for a skill
   */
  private getSkillPriority(skill: string): "critical" | "high" | "medium" {
    const criticalSkills = ["communication", "mathematics", "computer", "digital literacy"];
    const lowerSkill = skill.toLowerCase();

    if (criticalSkills.some(s => lowerSkill.includes(s))) {
      return "critical";
    }
    return "high";
  }

  /**
   * Generate milestones for the learning path
   */
  private generateMilestones(steps: LearningStep[], currentReadiness: number): Array<{
    week: number;
    title: string;
    readinessTarget: number;
  }> {
    const milestones: Array<{ week: number; title: string; readinessTarget: number }> = [];
    const readinessIncrement = Math.ceil((100 - currentReadiness) / 4);

    milestones.push({
      week: 4,
      title: "Foundation Complete",
      readinessTarget: currentReadiness + readinessIncrement,
    });

    milestones.push({
      week: 8,
      title: "Halfway to Career Ready",
      readinessTarget: currentReadiness + (readinessIncrement * 2),
    });

    milestones.push({
      week: steps.length,
      title: "Career Ready!",
      readinessTarget: 100,
    });

    return milestones;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    currentReadiness: number,
    missingSkillsCount: number,
    studentId: string
  ): string[] {
    const recommendations: string[] = [];

    if (currentReadiness < 30) {
      recommendations.push("Focus on foundational skills first before moving to advanced topics");
      recommendations.push("Consider taking extra classes in subjects related to your career goal");
    } else if (currentReadiness < 60) {
      recommendations.push("You're making good progress! Continue building on your existing skills");
      recommendations.push("Look for internship or apprenticeship opportunities");
    } else if (currentReadiness < 80) {
      recommendations.push("You're almost there! Focus on specialized skills");
      recommendations.push("Start building your portfolio and networking");
    } else {
      recommendations.push("You're well-prepared! Focus on portfolio and interview preparation");
    }

    if (missingSkillsCount > 5) {
      recommendations.push("Consider extending your timeline to master all required skills");
    }

    recommendations.push("Meet with your career counselor to review your progress monthly");

    return recommendations;
  }

  /**
   * Get quick learning path summary (for dashboard)
   */
  async getLearningPathSummary(studentId: string): Promise<{
    targetCareer: string;
    currentReadiness: number;
    currentStep: number;
    totalSteps: number;
    nextAction: string;
  } | null> {
    const path = await this.generateLearningPath(studentId);

    if (!path) return null;

    const currentStep = path.steps.findIndex(s => s.status === "in_progress") + 1 || 1;

    return {
      targetCareer: path.targetCareer.title,
      currentReadiness: path.currentReadiness,
      currentStep,
      totalSteps: path.steps.length,
      nextAction: path.steps[0]?.title || "Start your learning journey",
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const learningPathGenerator = new LearningPathGenerator();
