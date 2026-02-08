import type { LearningStylesResult, LearningStyle } from "./types";

/**
 * VARK Learning Styles Assessment
 *
 * The VARK model categorizes learning preferences into four styles:
 * - Visual (V): Learning by seeing
 * - Auditory (A): Learning by hearing
 * - Read/Write (R): Learning by reading and writing
 * - Kinesthetic (K): Learning by doing and experiencing
 */

export interface LearningStylesInput {
  [questionId: string]: LearningStyle; // Selected learning style
}

/**
 * Calculate learning styles from assessment answers
 */
export function calculateLearningStyles(
  answers: LearningStylesInput,
  questions: Array<{ id: string }>
): LearningStylesResult {
  // Count responses for each style
  const counts = {
    visual: 0,
    auditory: 0,
    readWrite: 0,
    kinesthetic: 0,
  };

  // Count selections
  Object.values(answers).forEach((style) => {
    counts[style]++;
  });

  // Calculate percentages
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const visual = total > 0 ? Math.round((counts.visual / total) * 100) : 0;
  const auditory = total > 0 ? Math.round((counts.auditory / total) * 100) : 0;
  const readWrite = total > 0 ? Math.round((counts.readWrite / total) * 100) : 0;
  const kinesthetic = total > 0 ? Math.round((counts.kinesthetic / total) * 100) : 0;

  // Determine dominant style
  const allScores = [
    { style: "visual" as LearningStyle, score: visual },
    { style: "auditory" as LearningStyle, score: auditory },
    { style: "read_write" as LearningStyle, score: readWrite },
    { style: "kinesthetic" as LearningStyle, score: kinesthetic },
  ].sort((a, b) => b.score - a.score);

  const dominantStyle = allScores[0].style;
  const secondaryStyle = allScores[1].score >= allScores[0].score * 0.7 ? allScores[1].style : undefined;

  return {
    visual,
    auditory,
    readWrite,
    kinesthetic,
    dominantStyle,
    secondaryStyle,
    description: getLearningStyleDescription(dominantStyle, secondaryStyle),
    recommendations: getRecommendations(dominantStyle, secondaryStyle),
  };
}

/**
 * Get description for learning style
 */
function getLearningStyleDescription(dominant: LearningStyle, secondary?: LearningStyle): string {
  const descriptions: Record<LearningStyle, string> = {
    visual: "You learn best by seeing information. You prefer pictures, diagrams, charts, and written directions.",
    auditory: "You learn best by hearing information. You prefer lectures, discussions, and verbal instructions.",
    read_write: "You learn best by reading and writing. You prefer textbooks, notes, lists, and handouts.",
    kinesthetic: "You learn best by doing. You prefer hands-on activities, experiments, and practical experiences.",
  };

  let description = descriptions[dominant];
  if (secondary) {
    description += ` You also benefit from ${descriptions[secondary].toLowerCase()}`;
  }

  return description;
}

/**
 * Get recommendations based on learning style
 */
function getRecommendations(dominant: LearningStyle, secondary?: LearningStyle) {
  const allRecommendations = {
    visual: {
      studyTips: [
        "Use diagrams, charts, and graphs to understand information",
        "Highlight key points in different colors",
        "Create mind maps and concept maps",
        "Watch videos and tutorials",
        "Use flashcards with images",
        "Sit near the front of the class to see clearly",
      ],
      teachingMethods: [
        "Visual presentations with slides and diagrams",
        "Video demonstrations",
        "Written instructions and handouts",
        "Graphic organizers",
        "Charts and graphs",
      ],
      careerSuggestions: [
        "Graphic Designer",
        "Architect",
        "Photographer",
        "Artist",
        "UX/UI Designer",
        "Data Analyst",
        "Video Editor",
        "Surgeon",
      ],
    },
    auditory: {
      studyTips: [
        "Record lectures and listen to them later",
        "Discuss topics with classmates",
        "Read notes aloud to yourself",
        "Use mnemonics and rhymes to remember facts",
        "Teach concepts to others",
        "Participate in class discussions",
      ],
      teachingMethods: [
        "Lectures and discussions",
        "Oral explanations",
        "Group discussions",
        "Q&A sessions",
        "Audio recordings",
      ],
      careerSuggestions: [
        "Teacher",
        "Musician",
        "Radio Host",
        "Speech Therapist",
        "Counselor",
        "Journalist",
        "Sales Representative",
        "Broadcaster",
      ],
    },
    read_write: {
      studyTips: [
        "Take detailed notes during lectures",
        "Rewrite and organize your notes regularly",
        "Read textbooks and supplementary materials",
        "Make lists and outlines",
        "Write summaries of what you learn",
        "Use written study guides",
      ],
      teachingMethods: [
        "Reading assignments",
        "Written exercises",
        "Handouts and textbooks",
        "Written instructions",
        "Note-taking templates",
      ],
      careerSuggestions: [
        "Writer",
        "Editor",
        "Researcher",
        "Librarian",
        "Lawyer",
        "Accountant",
        "Historian",
        "Journalist",
      ],
    },
    kinesthetic: {
      studyTips: [
        "Use hands-on activities when possible",
        "Take breaks while studying to move around",
        "Build models or do experiments",
        "Use flashcards and manipulate them physically",
        "Study while standing or walking",
        "Apply concepts to real-world situations",
      ],
      teachingMethods: [
        "Laboratory experiments",
        "Hands-on activities",
        "Field trips",
        "Role-playing exercises",
        "Practical demonstrations",
      ],
      careerSuggestions: [
        "Athlete",
        "Chef",
        "Mechanic",
        "Surgeon",
        "Physical Therapist",
        "Carpenter",
        "Dancer",
        "Personal Trainer",
      ],
    },
  };

  const primary = allRecommendations[dominant];

  // If there's a secondary style, blend recommendations
  if (secondary) {
    const secondaryRecs = allRecommendations[secondary];
    return {
      studyTips: [...primary.studyTips.slice(0, 4), ...secondaryRecs.studyTips.slice(0, 2)],
      teachingMethods: [...primary.teachingMethods.slice(0, 3), ...secondaryRecs.teachingMethods.slice(0, 2)],
      careerSuggestions: [...primary.careerSuggestions.slice(0, 5), ...secondaryRecs.careerSuggestions.slice(0, 3)],
    };
  }

  return primary;
}

/**
 * Get VARK learning styles questions
 */
export function getLearningStylesQuestions(): Array<{
  id: string;
  text: string;
  options: Array<{ value: LearningStyle; label: string }>;
}> {
  return [
    {
      id: "ls_001",
      text: "When you need to learn something new, you prefer:",
      options: [
        { value: "visual", label: "Watching a video or demonstration" },
        { value: "auditory", label: "Listening to someone explain it" },
        { value: "read_write", label: "Reading about it" },
        { value: "kinesthetic", label: "Trying it out yourself" },
      ],
    },
    {
      id: "ls_002",
      text: "When giving directions, you prefer to:",
      options: [
        { value: "visual", label: "Draw a map" },
        { value: "auditory", label: "Tell them the directions" },
        { value: "read_write", label: "Write down the instructions" },
        { value: "kinesthetic", label: "Show them by going there" },
      ],
    },
    {
      id: "ls_003",
      text: "When you're bored, you prefer to:",
      options: [
        { value: "visual", label: "Watch TV or look at photos" },
        { value: "auditory", label: "Listen to music or podcasts" },
        { value: "read_write", label: "Read a book or write" },
        { value: "kinesthetic", label: "Exercise or do something active" },
      ],
    },
    {
      id: "ls_004",
      text: "When studying for a test, you prefer to:",
      options: [
        { value: "visual", label: "Look at diagrams and charts" },
        { value: "auditory", label: "Discuss the material with friends" },
        { value: "read_write", label: "Read your notes repeatedly" },
        { value: "kinesthetic", label: "Walk around while reciting information" },
      ],
    },
    {
      id: "ls_005",
      text: "When you meet someone for the first time, you remember:",
      options: [
        { value: "visual", label: "Their face" },
        { value: "auditory", label: "Their voice" },
        { value: "read_write", label: "Their name (when written)" },
        { value: "kinesthetic", label: "The handshake or how they felt" },
      ],
    },
    {
      id: "ls_006",
      text: "When you have a problem, you prefer to:",
      options: [
        { value: "visual", label: "Draw a diagram of the situation" },
        { value: "auditory", label: "Talk about it with someone" },
        { value: "read_write", label: "Write down possible solutions" },
        { value: "kinesthetic", label: "Try different solutions" },
      ],
    },
    {
      id: "ls_007",
      text: "When assembling furniture, you prefer:",
      options: [
        { value: "visual", label: "Looking at the pictures" },
        { value: "auditory", label: "Having someone explain the steps" },
        { value: "read_write", label: "Reading the written instructions" },
        { value: "kinesthetic", label: "Just starting to assemble it" },
      ],
    },
    {
      id: "ls_008",
      text: "When choosing a restaurant, you prefer:",
      options: [
        { value: "visual", label: "Looking at photos of the food" },
        { value: "auditory", label: "Hearing recommendations from friends" },
        { value: "read_write", label: "Reading reviews online" },
        { value: "kinesthetic", label: "Trying it out yourself" },
      ],
    },
    {
      id: "ls_009",
      text: "When watching a movie, you remember:",
      options: [
        { value: "visual", label: "The costumes and scenery" },
        { value: "auditory", label: "The dialogue and music" },
        { value: "read_write", label: "Reading the subtitles or plot summary" },
        { value: "kinesthetic", label: "The feelings and emotions" },
      ],
    },
    {
      id: "ls_010",
      text: "When learning a new game, you prefer:",
      options: [
        { value: "visual", label: "Watch others play first" },
        { value: "auditory", label: "Have the rules explained" },
        { value: "read_write", label: "Read the rulebook" },
        { value: "kinesthetic", label: "Just start playing" },
      ],
    },
    {
      id: "ls_011",
      text: "When you need to concentrate, you prefer:",
      options: [
        { value: "visual", label: "A quiet, well-lit space" },
        { value: "auditory", label: "Background music or white noise" },
        { value: "read_write", label: "Having something to fiddle with" },
        { value: "kinesthetic", label: "Being able to move around" },
      ],
    },
    {
      id: "ls_012",
      text: "When shopping for clothes, you prefer:",
      options: [
        { value: "visual", label: "Seeing how they look" },
        { value: "auditory", label: "Asking for others' opinions" },
        { value: "read_write", label: "Reading the fabric descriptions" },
        { value: "kinesthetic", label: "Feeling the fabric" },
      ],
    },
  ];
}
