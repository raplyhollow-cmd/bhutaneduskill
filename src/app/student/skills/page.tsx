"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Code,
  Palette,
  Calculator,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Clock,
  Star,
  Filter,
  Loader2,
  Users,
  Beaker,
  Plus,
  Check,
  X,
  Briefcase,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Target,
  PlayCircle,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ============================================================================
// TYPES
// ============================================================================

interface InferredSkill {
  id: string;
  name: string;
  category: string;
  level: string;
  confidence: number;
  source: string;
  isInferred: boolean;
}

interface CareerGap {
  careerId: string;
  careerTitle: string;
  matchScore: number;
  isTopMatch: boolean;
  skills: {
    total: number;
    matching: number;
    missing: number;
    matchingSkills: string[];
    missingSkills: string[];
    readiness: number;
  };
}

interface LearningStep {
  stepId: string;
  week: number;
  title: string;
  description: string;
  skills: string[];
  resources: Array<{
    type: string;
    title: string;
    provider: string;
    duration: string;
    free: boolean;
    url?: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    skills: string[];
    estimatedTime: string;
    outcome: string;
  }>;
  estimatedHours: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "not_started" | "in_progress" | "completed";
}

interface LearningPath {
  studentId: string;
  studentName: string;
  targetCareer: {
    id: string;
    title: string;
    matchScore: number;
  };
  currentReadiness: number;
  skillsGap: {
    matchingSkills: Array<{ skill: string; level: string }>;
    missingSkills: Array<{ skill: string; priority: string }>;
  };
  estimatedWeeks: number;
  steps: LearningStep[];
  milestones: Array<{
    week: number;
    title: string;
    readinessTarget: number;
  }>;
  recommendations: string[];
}

type SkillCategory = "academic" | "soft" | "technical" | "creative" | "service" | "vocational" | "other";
type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  academic: { bg: "bg-blue-100", text: "text-blue-700", icon: BookOpen },
  soft: { bg: "bg-green-100", text: "text-green-700", icon: Users },
  technical: { bg: "bg-purple-100", text: "text-purple-700", icon: Code },
  creative: { bg: "bg-pink-100", text: "text-pink-700", icon: Palette },
  service: { bg: "bg-orange-100", text: "text-orange-700", icon: MessageCircle },
  vocational: { bg: "bg-amber-100", text: "text-amber-700", icon: Beaker },
  other: { bg: "bg-gray-100", text: "text-gray-700", icon: Star },
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-yellow-100 text-yellow-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-green-100 text-green-800",
  expert: "bg-purple-100 text-purple-800",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SkillsPage() {
  const [skills, setSkills] = useState<InferredSkill[]>([]);
  const [careerGaps, setCareerGaps] = useState<CareerGap[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loadingLearningPath, setLoadingLearningPath] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showLearningPath, setShowLearningPath] = useState(false);

  // Add skill form state
  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "other" as SkillCategory,
    level: "beginner" as SkillLevel,
    evidence: "",
  });

  // Fetch skills data
  const fetchSkills = async (includeCareerGaps = true) => {
    try {
      const response = await fetch(`/api/student/skills/inferred?includeCareerGaps=${includeCareerGaps}`);
      const data = await response.json();
      if (data.success) {
        setSkills(data.skills || []);
        setCareerGaps(data.careerGaps || []);
      }
    } catch (error) {
      console.error("Failed to fetch skills:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch learning path
  const fetchLearningPath = async () => {
    try {
      setLoadingLearningPath(true);
      const response = await fetch("/api/student/learning-path");
      if (response.ok) {
        const data = await response.json();
        setLearningPath(data);
      }
    } catch (error) {
      console.error("Failed to fetch learning path:", error);
    } finally {
      setLoadingLearningPath(false);
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchLearningPath();
  }, []);

  // Refresh skills
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSkills();
  };

  // Add self-reported skill
  const handleAddSkill = async () => {
    try {
      const response = await fetch("/api/student/skills/self-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSkill),
      });
      const data = await response.json();
      if (data.success) {
        // Reset form and refetch
        setNewSkill({ name: "", category: "other", level: "beginner", evidence: "" });
        setShowAddSkill(false);
        await fetchSkills(false);
      }
    } catch (error) {
      console.error("Failed to add skill:", error);
    }
  };

  // Filter skills
  const filteredSkills = skills.filter(skill =>
    filterCategory === "all" || skill.category === filterCategory
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Analyzing your skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Skills</h1>
          <p className="text-gray-600">
            Skills inferred from your homework, attendance, journals, and assessments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddSkill(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
            <div className="text-sm text-gray-600">Total Skills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {skills.filter(s => s.isInferred).length}
            </div>
            <div className="text-sm text-gray-600">System Detected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {skills.filter(s => !s.isInferred).length}
            </div>
            <div className="text-sm text-gray-600">Self Reported</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length) || 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </CardContent>
        </Card>
      </div>

      {/* Skills by Category */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                Your Skills
              </CardTitle>
              <CardDescription>
                {skills.filter(s => s.isInferred).length} skills detected from your activities,
                {skills.filter(s => !s.isInferred).length > 0 && ` ${skills.filter(s => !s.isInferred).length} self-reported`}
              </CardDescription>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="soft">Soft Skills</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="vocational">Vocational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSkills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No skills found. Take assessments and complete homework to get skills detected!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => {
                const catData = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.other;
                const Icon = catData.icon;

                return (
                  <div
                    key={skill.id}
                    className={`p-4 rounded-lg border ${skill.isInferred ? "border-blue-200 bg-blue-50" : "border-purple-200 bg-purple-50"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${catData.bg}`}>
                          <Icon className={`w-4 h-4 ${catData.text}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                          <p className="text-xs text-gray-500 capitalize">{skill.category}</p>
                        </div>
                      </div>
                      <Badge className={LEVEL_COLORS[skill.level] || "bg-gray-100"}>
                        {skill.level}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Confidence</span>
                        <span className="font-medium">{skill.confidence}%</span>
                      </div>
                      <Progress value={skill.confidence} className="h-1.5" />
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>From: {skill.source}</span>
                        {skill.isInferred ? (
                          <Badge variant="outline" className="text-xs">
                            Auto-detected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-purple-600">
                            Self-reported
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career Skills Gaps */}
      {careerGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Skills vs Your Career Matches
            </CardTitle>
            <CardDescription>
              See how your skills match with careers recommended for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {careerGaps.map((gap) => (
              <div
                key={gap.careerId}
                className={`p-4 rounded-lg border ${gap.isTopMatch ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{gap.careerTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge>{gap.matchScore}% Match</Badge>
                      <span className="text-sm text-gray-500">
                        {gap.skills.readiness}% Skills Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Matching Skills */}
                {gap.skills.matchingSkills.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      You have ({gap.skills.matchingSkills.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {gap.skills.matchingSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {gap.skills.missingSkills.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Need to develop ({gap.skills.missingSkills.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {gap.skills.missingSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Skill Modal */}
      {showAddSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add a Self-Reported Skill</CardTitle>
              <CardDescription>
                Add skills you have outside school (farming, weaving, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="skill-name">Skill Name</Label>
                <Input
                  id="skill-name"
                  placeholder="e.g., Farming, Weaving, Cooking"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="skill-category">Category</Label>
                <Select
                  value={newSkill.category}
                  onValueChange={(value) => setNewSkill({ ...newSkill, category: value as SkillCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="soft">Soft Skills</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="vocational">Vocational</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="skill-level">Your Level</Label>
                <Select
                  value={newSkill.level}
                  onValueChange={(value) => setNewSkill({ ...newSkill, level: value as SkillLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="skill-evidence">Evidence (optional)</Label>
                <Textarea
                  id="skill-evidence"
                  placeholder="Describe how you developed this skill..."
                  value={newSkill.evidence}
                  onChange={(e) => setNewSkill({ ...newSkill, evidence: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddSkill(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSkill} disabled={!newSkill.name}>
                  Add Skill
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Learning Path Section */}
      {learningPath ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Your Learning Path
                </CardTitle>
                <CardDescription>
                  Personalized roadmap to become a {learningPath.targetCareer.title}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLearningPath(!showLearningPath)}
              >
                {showLearningPath ? "Hide" : "Show"} Full Path
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Readiness Overview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Career Readiness: {learningPath.currentReadiness}%
                </span>
                <span className="text-sm text-gray-500">
                  {learningPath.estimatedWeeks} weeks planned
                </span>
              </div>
              <Progress value={learningPath.currentReadiness} className="h-3" />
            </div>

            {/* Skills Gap Summary */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    Skills You Have ({learningPath.skillsGap.matchingSkills.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {learningPath.skillsGap.matchingSkills.slice(0, 5).map((s) => (
                    <Badge key={s.skill} variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {s.skill}
                    </Badge>
                  ))}
                  {learningPath.skillsGap.matchingSkills.length > 5 && (
                    <span className="text-xs text-green-600">
                      +{learningPath.skillsGap.matchingSkills.length - 5} more
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <X className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    Skills to Develop ({learningPath.skillsGap.missingSkills.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {learningPath.skillsGap.missingSkills.slice(0, 5).map((s) => (
                    <Badge key={s.skill} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                      {s.skill}
                    </Badge>
                  ))}
                  {learningPath.skillsGap.missingSkills.length > 5 && (
                    <span className="text-xs text-orange-600">
                      +{learningPath.skillsGap.missingSkills.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Current Week Focus */}
            {!showLearningPath && learningPath.steps[0] && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">This Week's Focus</span>
                  <Badge className="ml-auto">Week {learningPath.steps[0].week}</Badge>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{learningPath.steps[0].title}</h4>
                <p className="text-sm text-gray-600 mb-3">{learningPath.steps[0].description}</p>
                <div className="flex flex-wrap gap-2">
                  {learningPath.steps[0].skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Full Learning Path */}
            {showLearningPath && (
              <div className="space-y-4">
                {/* Milestones */}
                <div className="flex items-center justify-between text-sm">
                  {learningPath.milestones.map((milestone, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        learningPath.currentReadiness >= milestone.readinessTarget
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        {learningPath.currentReadiness >= milestone.readinessTarget ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <span className="text-xs mt-1 text-gray-600">Week {milestone.week}</span>
                      <span className="text-xs text-gray-500">{milestone.title}</span>
                    </div>
                  ))}
                </div>

                {/* Learning Steps */}
                <div className="space-y-3">
                  {learningPath.steps.slice(0, 6).map((step, index) => (
                    <div
                      key={step.stepId}
                      className={`p-4 rounded-lg border ${
                        index === 0
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {step.week}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{step.title}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={step.difficulty === "beginner" ? "secondary" : "default"} className="text-xs">
                            {step.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">{step.estimatedHours}h</span>
                        </div>
                      </div>

                      {/* Skills for this step */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {step.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {/* Resources */}
                      {step.resources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Resources:</p>
                          <div className="space-y-1">
                            {step.resources.slice(0, 3).map((resource, idx) => (
                              <a
                                key={idx}
                                href={resource.url || "#"}
                                target={resource.url ? "_blank" : undefined}
                                rel={resource.url ? "noopener noreferrer" : undefined}
                                className={`flex items-center gap-2 text-sm ${
                                  resource.url ? "text-blue-600 hover:underline" : "text-gray-600"
                                }`}
                              >
                                <ChevronRight className="w-3 h-3" />
                                <span>{resource.title}</span>
                                <Badge variant="outline" className="text-xs ml-auto">
                                  {resource.free ? "Free" : "Paid"}
                                </Badge>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project */}
                      {step.projects.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Project: {step.projects[0].title}</span>
                          </div>
                          <p className="text-xs text-purple-700">{step.projects[0].description}</p>
                          <p className="text-xs text-purple-600 mt-1">
                            Time: {step.projects[0].estimatedTime} → {step.projects[0].outcome}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Learning Resources</CardTitle>
            <CardDescription>
              Complete an assessment to get your personalized learning path
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Take a career assessment to generate your personalized learning roadmap</p>
              <Button className="mt-4" asChild>
                <a href="/student/assessment">Take Assessment</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
