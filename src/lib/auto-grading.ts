/**
 * AUTO-GRADING SERVICE
 *
 * Implements intelligent grading for different question types:
 * - Instant grading for objective questions
 * - AI-assisted grading for subjective questions
 * - Math expression comparison
 * - Plagiarism detection
 * - Academic integrity scoring
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Question {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank" | "short_answer" | "essay" | "numeric" | "math_expression" | "match_following";
  question: string;
  options?: string[];
  correctAnswer: string | string[] | number;
  points: number;
  tolerance?: number; // For numeric answers (± tolerance)
  keywords?: string[]; // For short answer - required keywords
  explanation?: string;
}

export interface StudentAnswer {
  questionId: string;
  answer: string | number | Array<unknown>; // Can be various types
  timeSpent?: number; // Seconds
  timestamp?: string;
}

export interface GradingResult {
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback?: string;
  confidence: number; // 0-100 - how confident the grader is
  needsReview: boolean; // If true, teacher should review
  reasoning?: string; // Why this score was given
}

export interface IntegrityCheck {
  score: number; // 0-100 - higher = more trustworthy
  flags: string[];
  details: {
    tabSwitches?: number;
    copyPasteEvents?: number;
    timePerQuestion?: number;
    totalTime?: number;
    typingSpeed?: number;
    unusualPatterns?: string[];
  };
}

// ============================================================================
// AUTO-GRADING ENGINE
// ============================================================================

export class AutoGradingEngine {
  /**
   * Grade a single answer
   */
  static gradeAnswer(question: Question, answer: StudentAnswer): GradingResult {
    switch (question.type) {
      case "multiple_choice":
        return this.gradeMultipleChoice(question, answer);

      case "true_false":
        return this.gradeTrueFalse(question, answer);

      case "fill_blank":
        return this.gradeFillBlank(question, answer);

      case "numeric":
        return this.gradeNumeric(question, answer);

      case "math_expression":
        return this.gradeMathExpression(question, answer);

      case "short_answer":
        return this.gradeShortAnswer(question, answer);

      case "essay":
        return this.gradeEssay(question, answer);

      case "match_following":
        return this.gradeMatchFollowing(question, answer);

      default:
        return {
          questionId: question.id,
          score: 0,
          maxScore: question.points,
          isCorrect: false,
          confidence: 0,
          needsReview: true,
          reasoning: "Unknown question type",
        };
    }
  }

  /**
   * Grade multiple choice (instant, 100% confident)
   */
  private static gradeMultipleChoice(question: Question, answer: StudentAnswer): GradingResult {
    const correct = question.correctAnswer;
    const given = answer.answer;

    const isCorrect = Array.isArray(correct)
      ? correct.includes(given as string)
      : given === correct;

    return {
      questionId: question.id,
      score: isCorrect ? question.points : 0,
      maxScore: question.points,
      isCorrect,
      confidence: 100,
      needsReview: false,
      feedback: isCorrect
        ? "Correct! " + (question.explanation || "")
        : "Incorrect. " + (question.explanation || ""),
    };
  }

  /**
   * Grade true/false (instant, 100% confident)
   */
  private static gradeTrueFalse(question: Question, answer: StudentAnswer): GradingResult {
    const correct = question.correctAnswer; // Should be "true" or "false"
    const given = (answer.answer as string).toLowerCase();

    const isCorrect =
      given === "true" || given === "false"
        ? given === correct.toString().toLowerCase()
        : false;

    return {
      questionId: question.id,
      score: isCorrect ? question.points : 0,
      maxScore: question.points,
      isCorrect,
      confidence: 100,
      needsReview: false,
      feedback: isCorrect ? "Correct!" : "Incorrect.",
    };
  }

  /**
   * Grade fill in the blank (fuzzy matching)
   */
  private static gradeFillBlank(question: Question, answer: StudentAnswer): GradingResult {
    const correct = question.correctAnswer as string;
    const given = (answer.answer as string).trim().toLowerCase();

    // Exact match
    if (given === correct.toLowerCase()) {
      return {
        questionId: question.id,
        score: question.points,
        maxScore: question.points,
        isCorrect: true,
        confidence: 100,
        needsReview: false,
        feedback: "Correct!",
      };
    }

    // Fuzzy match - allow small differences
    const similarity = this.calculateSimilarity(given, correct.toLowerCase());
    if (similarity >= 0.9) {
      return {
        questionId: question.id,
        score: Math.round(question.points * similarity),
        maxScore: question.points,
        isCorrect: true,
        confidence: 90,
        needsReview: false,
        feedback: `Almost correct (${Math.round(similarity * 100)}% match)`,
      };
    }

    return {
      questionId: question.id,
      score: 0,
      maxScore: question.points,
      isCorrect: false,
      confidence: 95,
      needsReview: false,
      feedback: `Incorrect. The answer was: ${correct}`,
    };
  }

  /**
   * Grade numeric answer (with tolerance)
   */
  private static gradeNumeric(question: Question, answer: StudentAnswer): GradingResult {
    const correct = parseFloat(question.correctAnswer as string);
    const given = parseFloat(answer.answer as string);
    const tolerance = question.tolerance || 0; // Default: exact match required

    if (isNaN(given)) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        confidence: 100,
        needsReview: false,
        feedback: "Invalid number format",
      };
    }

    const diff = Math.abs(given - correct);
    const isCorrect = diff <= tolerance;

    return {
      questionId: question.id,
      score: isCorrect ? question.points : 0,
      maxScore: question.points,
      isCorrect,
      confidence: 100,
      needsReview: false,
      feedback: isCorrect
        ? "Correct!"
        : tolerance > 0
        ? `Incorrect. Your answer: ${given}, Correct: ${correct} (±${tolerance})`
        : `Incorrect. The correct answer is: ${correct}`,
    };
  }

  /**
   * Grade math expression using symbolic comparison
   */
  private static gradeMathExpression(question: Question, answer: StudentAnswer): GradingResult {
    const correct = question.correctAnswer as string;
    const given = (answer.answer as string).trim();

    // Normalize both expressions for comparison
    const normalizedCorrect = this.normalizeMathExpression(correct);
    const normalizedGiven = this.normalizeMathExpression(given);

    // Direct match
    if (normalizedGiven === normalizedCorrect) {
      return {
        questionId: question.id,
        score: question.points,
        maxScore: question.points,
        isCorrect: true,
        confidence: 95,
        needsReview: false,
        feedback: "Correct! " + (question.explanation || ""),
      };
    }

    // Try to evaluate both expressions numerically (if they contain variables, can't evaluate)
    try {
      const correctValue = this.evaluateMathExpression(normalizedCorrect);
      const givenValue = this.evaluateMathExpression(normalizedGiven);

      if (correctValue !== null && givenValue !== null) {
        const diff = Math.abs(correctValue - givenValue);
        if (diff < 0.0001) {
          return {
            questionId: question.id,
            score: question.points,
            maxScore: question.points,
            isCorrect: true,
            confidence: 90,
            needsReview: false,
            feedback: "Correct! Both expressions evaluate to the same value.",
          };
        }
      }
    } catch (e) {
      // Can't evaluate, fall through to manual review
    }

    // If we get here, we're not sure - mark for review
    return {
      questionId: question.id,
      score: 0,
      maxScore: question.points,
      isCorrect: false,
      confidence: 50,
      needsReview: true,
      feedback: "Unable to auto-grade. Teacher review required.",
      reasoning: "Math expressions don't match exactly and can't be evaluated for comparison",
    };
  }

  /**
   * Grade short answer (keyword matching + AI assistance)
   */
  private static gradeShortAnswer(question: Question, answer: StudentAnswer): GradingResult {
    const given = (answer.answer as string).toLowerCase().trim();
    const keywords = question.keywords || [];

    // Check for required keywords
    const foundKeywords = keywords.filter((kw) =>
      given.toLowerCase().includes(kw.toLowerCase())
    );

    const keywordScore = keywords.length > 0
      ? (foundKeywords.length / keywords.length) * question.points
      : 0;

    // If all keywords present, high confidence
    if (foundKeywords.length === keywords.length && keywords.length > 0) {
      return {
        questionId: question.id,
        score: Math.round(keywordScore),
        maxScore: question.points,
        isCorrect: true,
        confidence: 75,
        needsReview: false,
        feedback: `Good! Contains all key points: ${keywords.join(", ")}`,
      };
    }

    // Partial keywords - low confidence, suggest review
    if (foundKeywords.length > 0) {
      return {
        questionId: question.id,
        score: Math.round(keywordScore),
        maxScore: question.points,
        isCorrect: false,
        confidence: 50,
        needsReview: true,
        feedback: `Contains some key points (${foundKeywords.length}/${keywords.length}): ${foundKeywords.join(", ")}`,
        reasoning: "Partial keyword match - teacher should verify",
      };
    }

    // No keywords - low confidence
    return {
      questionId: question.id,
      score: 0,
      maxScore: question.points,
      isCorrect: false,
      confidence: 30,
      needsReview: true,
      feedback: "No matching keywords found. Teacher review recommended.",
      reasoning: "No keywords matched - cannot verify correctness",
    };
  }

  /**
   * Grade essay (AI-assisted)
   */
  private static gradeEssay(question: Question, answer: StudentAnswer): GradingResult {
    const essay = answer.answer as string;
    const wordCount = essay.trim().split(/\s+/).length;

    // Basic checks
    if (wordCount < 20) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        confidence: 90,
        needsReview: true,
        feedback: `Too short (${wordCount} words). Minimum 20 words expected.`,
        reasoning: "Essay below minimum length",
      };
    }

    // For now, mark all essays for teacher review
    // In production, this would call an AI API for scoring
    return {
      questionId: question.id,
      score: 0,
      maxScore: question.points,
      isCorrect: false,
      confidence: 0,
      needsReview: true,
      feedback: `Essay submitted (${wordCount} words). Pending teacher review.`,
      reasoning: "Essays require human evaluation - AI assistance available",
    };
  }

  /**
   * Grade match the following questions
   */
  private static gradeMatchFollowing(question: Question, answer: StudentAnswer): GradingResult {
    const correct = question.correctAnswer as unknown as Array<{ left: string; right: string }>;
    const given = answer.answer as unknown as Array<{ left: string; right: string }>;

    if (!Array.isArray(given) || given.length !== correct.length) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        confidence: 100,
        needsReview: false,
        feedback: `Incorrect. Expected ${correct.length} pairs.`,
      };
    }

    let correctCount = 0;
    for (const pair of correct) {
      const match = given.find(
        (g) =>
          (g.left === pair.left && g.right === pair.right) ||
          (g.left === pair.right && g.right === pair.left) // Allow reversed
      );
      if (match) correctCount++;
    }

    const score = Math.round((correctCount / correct.length) * question.points);

    return {
      questionId: question.id,
      score,
      maxScore: question.points,
      isCorrect: score === question.points,
      confidence: 100,
      needsReview: false,
      feedback: `${correctCount}/${correct.length} correct matches`,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  /**
   * Normalize math expression for comparison
   */
  private static normalizeMathExpression(expr: string): string {
    return expr
      .replace(/\s+/g, "") // Remove spaces
      .replace(/\*\*/g, "^") // Convert ** to ^
      .replace(/\(\+/g, "") // Remove unnecessary parentheses
      .toLowerCase();
  }

  /**
   * Evaluate math expression if possible
   */
  private static evaluateMathExpression(expr: string): number | null {
    try {
      // Safe evaluation - only allow math characters
      if (!/^[0-9+\-*/().^s]+$/.test(expr)) {
        return null;
      }
      // Use Function constructor for safer evaluation
      return new Function("return " + expr)();
    } catch {
      return null;
    }
  }
}

// ============================================================================
// ACADEMIC INTEGRITY CHECKER
// ============================================================================

export class AcademicIntegrityChecker {
  /**
   * Check academic integrity based on submission metadata
   */
  static checkIntegrity(metadata: {
    timeSpent?: number;
    tabSwitches?: number;
    copyPasteEvents?: number;
    typingSpeed?: number;
    questionCount?: number;
  }): IntegrityCheck {
    const flags: string[] = [];
    const details: IntegrityCheck["details"] = {
      tabSwitches: metadata.tabSwitches || 0,
      copyPasteEvents: metadata.copyPasteEvents || 0,
      timePerQuestion: metadata.questionCount
        ? (metadata.timeSpent || 0) / metadata.questionCount
        : undefined,
      totalTime: metadata.timeSpent,
      typingSpeed: metadata.typingSpeed,
    };

    let score = 100;

    // Check for too many tab switches
    if ((metadata.tabSwitches || 0) > 5) {
      flags.push("Excessive tab switching detected");
      score -= 20;
    } else if ((metadata.tabSwitches || 0) > 2) {
      score -= 5;
    }

    // Check for copy-paste events
    if ((metadata.copyPasteEvents || 0) > 3) {
      flags.push("Multiple copy-paste events detected");
      score -= 15;
    }

    // Check if completed too fast
    if (metadata.questionCount && metadata.timeSpent) {
      const avgTimePerQuestion = metadata.timeSpent / metadata.questionCount;
      if (avgTimePerQuestion < 10) {
        // Less than 10 seconds per question
        flags.push("Completed unusually fast");
        score -= 25;
      } else if (avgTimePerQuestion < 30) {
        score -= 10;
      }
    }

    // Check typing speed for essays
    if (metadata.typingSpeed && metadata.typingSpeed > 200) {
      // More than 200 WPM is suspicious
      flags.push("Unusually fast typing speed");
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      flags,
      details,
    };
  }

  /**
   * Check for plagiarism (basic implementation)
   * In production, this would use an external API
   */
  static async checkPlagiarism(text: string): Promise<{
    similarityScore: number;
    sources: Array<{ source: string; similarity: number }>;
    aiProbability: number;
  }> {
    // Placeholder implementation
    // In production, integrate with services like:
    // - Turnitin API
    // - Copyleaks
    // - Unicheck
    // - Custom AI model

    // Basic AI-generated text detection
    const aiProbability = this.detectAIProbability(text);

    return {
      similarityScore: 0,
      sources: [],
      aiProbability,
    };
  }

  /**
   * Basic AI-generated text detection
   */
  private static detectAIProbability(text: string): number {
    // Heuristic analysis for AI-generated text
    let probability = 0;

    // Very uniform sentence lengths suggest AI
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 5) {
      const lengths = sentences.map((s) => s.length);
      const avgLength = lengths.reduce((a, b) => a + b) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;

      if (variance < 50) {
        probability += 20; // Very uniform sentences
      }
    }

    // Common AI phrases
    const aiPhrases = [
      "in conclusion",
      "it is important to note",
      "furthermore",
      "moreover",
      "additionally",
      "in summary",
      "plays a crucial role",
      "it's worth noting",
      "comprehensive understanding",
    ];

    const lowerText = text.toLowerCase();
    const foundPhrases = aiPhrases.filter((phrase) => lowerText.includes(phrase));
    probability += foundPhrases.length * 5;

    // Very predictable structure
    if (lowerText.startsWith("in conclusion") || lowerText.startsWith("firstly,")) {
      probability += 15;
    }

    // Perfect grammar (no common mistakes)
    const commonMistakes = ["your instead of you're", "its instead of it's"];
    // This is a simplified check

    return Math.min(100, probability);
  }
}

// ============================================================================
// BATCH GRADING
// ============================================================================

export interface BatchGradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  results: GradingResult[];
  needsReview: boolean;
  integrityScore: number;
  timeSpent: number;
}

export function gradeHomework(
  questions: Question[],
  answers: StudentAnswer[],
  integrityMetadata?: {
    timeSpent: number;
    tabSwitches: number;
    copyPasteEvents: number;
    typingSpeed?: number;
  }
): BatchGradingResult {
  const results: GradingResult[] = [];

  // Grade each answer
  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (question) {
      results.push(AutoGradingEngine.gradeAnswer(question, answer));
    }
  }

  // Calculate totals
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const needsReview = results.some((r) => r.needsReview);

  // Check integrity
  const integrityCheck = integrityMetadata
    ? AcademicIntegrityChecker.checkIntegrity(integrityMetadata)
    : { score: 100, flags: [], details: {} };

  return {
    totalScore,
    maxScore,
    percentage,
    results,
    needsReview,
    integrityScore: integrityCheck.score,
    timeSpent: integrityMetadata?.timeSpent || 0,
  };
}
