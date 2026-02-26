/**
 * GAMIFICATION SYSTEM
 *
 * Make the platform ADDICTIVE for students through:
 * - XP Points and Levels
 * - Badges and Achievements
 * - Streaks and Daily Goals
 * - Leaderboards (optional)
 * - Rewards and Unlockables
 *
 * The more engaged students are, the more data we collect.
 */

export interface XPAction {
  id: string;
  name: string;
  xp: number;
  description: string;
  category: "assessment" | "exploration" | "planning" | "learning" | "social";
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  requirement: string;
  xp: number;
  progress?: { current: number; total: number };
}

export interface Streak {
  current: number;
  longest: number;
  lastActivity: Date | null;
}

export interface UserGamification {
  userId: string;
  xp: number;
  level: number;
  badges: Badge[];
  streak: Streak;
  dailyGoals: DailyGoal[];
  lastLogin: Date | null;
}

export interface DailyGoal {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  progress: number;
  target: number;
}

// ============================================================================
// XP ACTIONS - What gives points
// ============================================================================

export const xpActions: XPAction[] = [
  // Assessment actions
  { id: "assessment_start", name: "Start Assessment", xp: 10, description: "Begin any assessment", category: "assessment" },
  { id: "assessment_complete", name: "Complete Assessment", xp: 100, description: "Finish any assessment", category: "assessment" },
  { id: "riasec_complete", name: "RIASEC Explorer", xp: 150, description: "Complete RIASEC assessment", category: "assessment" },
  { id: "mbti_complete", name: "Personality Discoverer", xp: 150, description: "Complete MBTI assessment", category: "assessment" },
  { id: "disc_complete", name: "Style Master", xp: 150, description: "Complete DISC assessment", category: "assessment" },

  // Exploration actions
  { id: "career_view", name: "Career Explorer", xp: 5, description: "View a career profile", category: "exploration" },
  { id: "career_save", name: "Career Saver", xp: 15, description: "Save a career to favorites", category: "exploration" },
  { id: "rub_view", name: "College Researcher", xp: 10, description: "View RUB program details", category: "exploration" },

  // Planning actions
  { id: "plan_create", name: "Path Creator", xp: 50, description: "Create a career plan", category: "planning" },
  { id: "goal_set", name: "Goal Setter", xp: 25, description: "Add a goal to your plan", category: "planning" },
  { id: "goal_complete", name: "Achiever", xp: 100, description: "Complete a goal", category: "planning" },

  // Learning actions
  { id: "ai_chat", name: "Curious Mind", xp: 10, description: "Ask AI Career Coach a question", category: "learning" },
  { id: "skill_view", name: "Skill Seeker", xp: 15, description: "View skill requirements", category: "learning" },
  { id: "resource_view", name: "Knowledge Hunter", xp: 10, description: "View learning resource", category: "learning" },

  // Journal actions
  { id: "journal_create", name: "Reflective Writer", xp: 20, description: "Write a journal entry", category: "learning" },
  { id: "journal_streak_3", name: "Consistent Writer", xp: 50, description: "Journal for 3 days in a row", category: "learning" },

  // Social actions
  { id: "share_plan", name: "Path Sharer", xp: 30, description: "Share your career plan", category: "social" },
];

// ============================================================================
// LEVELS - XP thresholds
// ============================================================================

export const levels = [
  { level: 1, name: "Explorer", xp: 0, color: "#9ca3af" },
  { level: 2, name: "Pathfinder", xp: 100, color: "#22c55e" },
  { level: 3, name: "Navigator", xp: 300, color: "#3c89c3" },
  { level: 4, name: "Discoverer", xp: 600, color: "#a855f7" },
  { level: 5, name: "Achiever", xp: 1000, color: "#f59e0b" },
  { level: 6, name: "Career Scout", xp: 1500, color: "#ef4444" },
  { level: 7, name: "Visionary", xp: 2200, color: "#ec4899" },
  { level: 8, name: "Trailblazer", xp: 3000, color: "#14b8a6" },
  { level: 9, name: "Champion", xp: 4000, color: "#8b5cf6" },
  { level: 10, name: "Legend", xp: 5500, color: "#fbbf24" },
];

// ============================================================================
// BADGES - Achievements to unlock
// ============================================================================

export const allBadges: Badge[] = [
  // Assessment badges
  {
    id: "first_assessment",
    name: "First Steps",
    description: "Complete your very first assessment",
    icon: "🎯",
    rarity: "common",
    requirement: "Complete 1 assessment",
    xp: 50,
  },
  {
    id: "assessment_master",
    name: "Assessment Master",
    description: "Complete all available assessments",
    icon: "🏆",
    rarity: "epic",
    requirement: "Complete 5 assessments",
    xp: 500,
  },

  // Career exploration badges
  {
    id: "career_explorer_10",
    name: "Explorer",
    description: "View 10 different careers",
    icon: "🗺️",
    rarity: "common",
    requirement: "View 10 careers",
    xp: 100,
  },
  {
    id: "career_explorer_50",
    name: "Career Expert",
    description: "View 50 different careers",
    icon: "🧭",
    rarity: "rare",
    requirement: "View 50 careers",
    xp: 300,
  },

  // AI Coach badges
  {
    id: "ai_chatty_10",
    name: "Curious Mind",
    description: "Ask 10 questions to AI Career Coach",
    icon: "💬",
    rarity: "common",
    requirement: "10 AI queries",
    xp: 100,
  },
  {
    id: "ai_chatty_50",
    name: "Knowledge Seeker",
    description: "Ask 50 questions to AI Career Coach",
    icon: "🧠",
    rarity: "rare",
    requirement: "50 AI queries",
    xp: 300,
  },

  // Streak badges
  {
    id: "streak_3",
    name: "Consistent",
    description: "Log in for 3 days in a row",
    icon: "🔥",
    rarity: "common",
    requirement: "3-day streak",
    xp: 100,
  },
  {
    id: "streak_7",
    name: "Dedicated",
    description: "Log in for 7 days in a row",
    icon: "⚡",
    rarity: "rare",
    requirement: "7-day streak",
    xp: 250,
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    description: "Log in for 30 days in a row",
    icon: "👑",
    rarity: "legendary",
    requirement: "30-day streak",
    xp: 1000,
  },

  // Planning badges
  {
    id: "planner_newbie",
    name: "Path Creator",
    description: "Create your first career plan",
    icon: "📝",
    rarity: "common",
    requirement: "Create 1 career plan",
    xp: 100,
  },
  {
    id: "goal_setter_5",
    name: "Goal Getter",
    description: "Set 5 goals in your career plan",
    icon: "🎯",
    rarity: "rare",
    requirement: "Set 5 goals",
    xp: 200,
  },
  {
    id: "goal_complete_5",
    name: "Achiever",
    description: "Complete 5 goals from your plan",
    icon: "✨",
    rarity: "epic",
    requirement: "Complete 5 goals",
    xp: 500,
  },

  // Journal badges
  {
    id: "journal_newbie",
    name: "Reflection Starter",
    description: "Write your first journal entry",
    icon: "📓",
    rarity: "common",
    requirement: "Write 1 journal entry",
    xp: 50,
  },
  {
    id: "journal_regular",
    name: "Diary Keeper",
    description: "Write 10 journal entries",
    icon: "📔",
    rarity: "rare",
    requirement: "Write 10 entries",
    xp: 200,
  },
];

// ============================================================================
// DAILY GOALS - Keep them coming back daily
// ============================================================================

export function generateDailyGoals(): DailyGoal[] {
  return [
    {
      id: "daily_assessment",
      title: "Take an Assessment",
      description: "Complete any assessment today",
      xp: 50,
      completed: false,
      progress: 0,
      target: 1,
    },
    {
      id: "daily_career_explore",
      title: "Explore Careers",
      description: "View 5 career profiles",
      xp: 30,
      completed: false,
      progress: 0,
      target: 5,
    },
    {
      id: "daily_ai_chat",
      title: "Ask AI Coach",
      description: "Ask 3 questions to AI Career Coach",
      xp: 20,
      completed: false,
      progress: 0,
      target: 3,
    },
    {
      id: "daily_journal",
      title: "Daily Reflection",
      description: "Write a journal entry",
      xp: 25,
      completed: false,
      progress: 0,
      target: 1,
    },
  ];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * User statistics for gamification
 */
export interface UserStats {
  assessmentsCompleted?: number;
  careersViewed?: number;
  aiQueries?: number;
  journalEntries?: number;
  goalsCompleted?: number;
  goalsSet?: number;
  plansCreated?: number;
  currentStreak?: number;
}

/**
 * Calculate level from XP
 */
export function getLevelFromXP(xp: number): number {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xp) {
      return levels[i].level;
    }
  }
  return 1;
}

/**
 * Get XP progress to next level
 */
export function getLevelProgress(xp: number): { current: number; total: number; percentage: number } {
  const currentLevel = getLevelFromXP(xp);
  const currentLevelXP = levels[currentLevel - 1]?.xp || 0;
  const nextLevelXP = levels[currentLevel]?.xp || levels[levels.length - 1].xp;

  const progressInLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return {
    current: progressInLevel,
    total: xpNeeded,
    percentage: Math.round((progressInLevel / xpNeeded) * 100),
  };
}

/**
 * Check if badge is earned
 */
export function checkBadgeProgress(badgeId: string, userStats: UserStats): Badge | null {
  const badge = allBadges.find((b) => b.id === badgeId);
  if (!badge) return null;

  // Calculate progress based on badge type
  let progress = { current: 0, total: 1 };

  switch (badgeId) {
    case "first_assessment":
      progress = { current: userStats.assessmentsCompleted || 0, total: 1 };
      break;
    case "assessment_master":
      progress = { current: userStats.assessmentsCompleted || 0, total: 5 };
      break;
    case "career_explorer_10":
    case "career_explorer_50":
      progress = { current: userStats.careersViewed || 0, total: badgeId.includes("10") ? 10 : 50 };
      break;
    case "ai_chatty_10":
    case "ai_chatty_50":
      progress = { current: userStats.aiQueries || 0, total: badgeId.includes("10") ? 10 : 50 };
      break;
    // Add more badge checks...
  }

  const earned = progress.current >= progress.total;

  return {
    ...badge,
    progress: earned ? undefined : progress,
  };
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: string): string {
  const colors = {
    common: "#9ca3af",      // Gray
    rare: "#3c89c3",        // Blue
    epic: "#a855f7",        // Purple
    legendary: "#f59e0b",   // Gold
  };
  return colors[rarity as keyof typeof colors] || colors.common;
}

/**
 * Get rarity glow effect
 */
export function getRarityGlow(rarity: string): string {
  const glows = {
    common: "none",
    rare: "0 0 20px rgba(59, 130, 246, 0.5)",
    epic: "0 0 20px rgba(168, 85, 247, 0.5)",
    legendary: "0 0 30px rgba(245, 158, 11, 0.6)",
  };
  return glows[rarity as keyof typeof glows] || glows.common;
}

// ============================================================================
// GAMIFICATION API HELPERS
// ============================================================================

/**
 * Award XP to a user
 */
export async function awardXP(userId: string, actionId: string): Promise<{
  xpAwarded: number;
  newXP: number;
  newLevel: number;
  levelUp: boolean;
}> {
  const action = xpActions.find((a) => a.id === actionId);
  if (!action) {
    throw new Error(`Unknown action: ${actionId}`);
  }

  // In production, this would update the database
  // For now, return mock data
  return {
    xpAwarded: action.xp,
    newXP: action.xp,
    newLevel: 1,
    levelUp: false,
  };
}

/**
 * Check and award badges
 */
export async function checkBadges(userId: string, userStats: UserStats): Promise<Badge[]> {
  const newBadges: Badge[] = [];

  for (const badge of allBadges) {
    const result = checkBadgeProgress(badge.id, userStats);
    if (result && result.progress && result.progress.current >= result.progress.total) {
      newBadges.push(result);
    }
  }

  return newBadges;
}

export default {
  xpActions,
  levels,
  allBadges,
  generateDailyGoals,
  getLevelFromXP,
  getLevelProgress,
  checkBadgeProgress,
  awardXP,
  checkBadges,
};
