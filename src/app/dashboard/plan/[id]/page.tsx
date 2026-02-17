"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Target, Calendar, CheckCircle2, Plus, Trash2, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

const CAREER_PHASES = {
  self_assessment: { name: "Self Assessment", description: "Understand your interests, values, and personality" },
  career_exploration: { name: "Career Exploration", description: "Research and explore career options" },
  goal_setting: { name: "Goal Setting", description: "Set short-term and long-term goals" },
  planning: { name: "Planning", description: "Create a detailed action plan" },
  implementation: { name: "Implementation", description: "Take action toward your goals" },
  review: { name: "Review", description: "Review progress and adjust plans" },
};

type Goal = {
  id: string;
  title: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
};

type CareerPlan = {
  id: string;
  currentPhase: keyof typeof CAREER_PHASES;
  targetCareer?: string;
  shortTermGoals: Goal[];
  longTermGoals: Goal[];
  milestones: Goal[];
  status: string;
};

export default function CareerPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");

  useEffect(() => {
    if (params.id !== "new") {
      fetchPlan();
    } else {
      setPlan({
        id: "new",
        currentPhase: "self_assessment",
        shortTermGoals: [],
        longTermGoals: [],
        milestones: [],
        status: "active",
      });
      setLoading(false);
      setIsEditing(true);
    }
  }, [params.id]);

  const fetchPlan = async () => {
    try {
      const response = await fetch("/api/plans");
      if (response.ok) {
        const data = await response.json();
        const foundPlan = data.plans?.find((p: CareerPlan) => p.id === params.id);
        if (foundPlan) {
          setPlan(foundPlan);
        }
      }
    } catch (error) {
      logger.error("Failed to fetch plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;

    try {
      const url = params.id === "new" ? "/api/plans" : `/api/plans/${params.id}`;
      const method = params.id === "new" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCareer: plan.targetCareer,
          currentPhase: plan.currentPhase,
          shortTermGoals: plan.shortTermGoals,
          longTermGoals: plan.longTermGoals,
          milestones: plan.milestones,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
        setIsEditing(false);
        if (params.id === "new") {
          router.push(`/dashboard/plan/${data.plan.id}`);
        }
      }
    } catch (error) {
      logger.error("Failed to save plan:", error);
      alert("Failed to save plan");
    }
  };

  const addGoal = (type: "shortTermGoals" | "longTermGoals" | "milestones") => {
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title: newGoalTitle,
      deadline: newGoalDeadline,
      status: "pending",
    };

    setPlan({
      ...plan!,
      [type]: [...(plan![type] as Goal[]), newGoal],
    });
    setNewGoalTitle("");
    setNewGoalDeadline("");
  };

  const removeGoal = (type: "shortTermGoals" | "longTermGoals" | "milestones", goalId: string) => {
    setPlan({
      ...plan!,
      [type]: (plan![type] as Goal[]).filter((g) => g.id !== goalId),
    });
  };

  const toggleGoalStatus = (type: "shortTermGoals" | "longTermGoals" | "milestones", goalId: string) => {
    setPlan({
      ...plan!,
      [type]: (plan![type] as Goal[]).map((g) =>
        g.id === goalId
          ? {
              ...g,
              status: g.status === "completed" ? "pending" : "completed",
            }
          : g
      ),
    });
  };

  const updatePhase = (phase: keyof typeof CAREER_PHASES) => {
    setPlan({ ...plan!, currentPhase: phase });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getCompletedCount = (goals: Goal[]) => goals.filter((g) => g.status === "completed").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Plan
            </Button>
          )}
        </div>
      </div>

      {/* Current Phase */}
      <Card>
        <CardHeader>
          <CardTitle>Six-Phase Career Planning</CardTitle>
          <CardDescription>Based on O*NET framework for comprehensive career development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(CAREER_PHASES).map(([key, value]) => {
              const phaseIndex = Object.keys(CAREER_PHASES).indexOf(key);
              const isCurrent = plan?.currentPhase === key;
              const isPast = phaseIndex < Object.keys(CAREER_PHASES).indexOf(plan?.currentPhase || "");

              return (
                <button
                  key={key}
                  onClick={() => isEditing && updatePhase(key as keyof typeof CAREER_PHASES)}
                  disabled={!isEditing}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    isCurrent
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : isPast
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  } ${isEditing ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="text-2xl mb-1">
                    {isPast ? "✓" : isCurrent ? "→" : phaseIndex + 1}
                  </div>
                  <p className="text-xs font-medium">{value.name}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Target Career */}
      <Card>
        <CardHeader>
          <CardTitle>Target Career</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              value={plan?.targetCareer || ""}
              onChange={(e) => setPlan({ ...plan!, targetCareer: e.target.value })}
              placeholder="Enter your target career..."
            />
          ) : (
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Target Career</p>
                <p className="text-xl font-semibold">{plan?.targetCareer || "Not set"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Short Term Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Short-Term Goals
            <Badge variant="outline">
              {plan?.shortTermGoals?.length || 0} goals
            </Badge>
          </CardTitle>
          <CardDescription>Goals to achieve in the next 3-6 months</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {plan?.shortTermGoals?.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => isEditing && toggleGoalStatus("shortTermGoals", goal.id)}
                  disabled={!isEditing}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    goal.status === "completed" ? "bg-green-500 border-green-500" : "border-gray-300"
                  } ${isEditing ? "cursor-pointer" : ""}`}
                >
                  {goal.status === "completed" && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${goal.status === "completed" ? "line-through text-gray-400" : ""}`}>
                    {goal.title}
                  </p>
                  <p className="text-xs text-gray-500">Due: {goal.deadline || "No deadline"}</p>
                </div>
                {isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => removeGoal("shortTermGoals", goal.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            )) || <p className="text-sm text-gray-500">No short-term goals set</p>}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="New goal..."
                className="flex-1"
              />
              <Input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
              />
              <Button size="sm" onClick={() => addGoal("shortTermGoals")}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Long Term Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Long-Term Goals
            <Badge variant="outline">
              {plan?.longTermGoals?.length || 0} goals
            </Badge>
          </CardTitle>
          <CardDescription>Goals to achieve in the next 1-3 years</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {plan?.longTermGoals?.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => isEditing && toggleGoalStatus("longTermGoals", goal.id)}
                  disabled={!isEditing}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    goal.status === "completed" ? "bg-green-500 border-green-500" : "border-gray-300"
                  } ${isEditing ? "cursor-pointer" : ""}`}
                >
                  {goal.status === "completed" && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${goal.status === "completed" ? "line-through text-gray-400" : ""}`}>
                    {goal.title}
                  </p>
                  <p className="text-xs text-gray-500">Due: {goal.deadline || "No deadline"}</p>
                </div>
                {isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => removeGoal("longTermGoals", goal.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            )) || <p className="text-sm text-gray-500">No long-term goals set</p>}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="New goal..."
                className="flex-1"
              />
              <Input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
              />
              <Button size="sm" onClick={() => addGoal("longTermGoals")}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Key Milestones
            <Badge variant="outline">
              {plan?.milestones?.length || 0} milestones
            </Badge>
          </CardTitle>
          <CardDescription>Important checkpoints on your journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {plan?.milestones?.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className={`font-medium ${milestone.status === "completed" ? "line-through text-gray-400" : ""}`}>
                    {milestone.title}
                  </p>
                  <p className="text-xs text-gray-500">{milestone.deadline || "No date"}</p>
                </div>
                {isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => removeGoal("milestones", milestone.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            )) || <p className="text-sm text-gray-500">No milestones set</p>}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="New milestone..."
                className="flex-1"
              />
              <Input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
              />
              <Button size="sm" onClick={() => addGoal("milestones")}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Short-Term Goals</span>
              <span className="text-sm text-gray-500">
                {plan?.shortTermGoals && getCompletedCount(plan.shortTermGoals)}/{plan?.shortTermGoals?.length}
              </span>
            </div>
            <Progress
              value={plan?.shortTermGoals ? (getCompletedCount(plan.shortTermGoals) / Math.max(plan.shortTermGoals.length, 1)) * 100 : 0}
              className="h-2"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Long-Term Goals</span>
              <span className="text-sm text-gray-500">
                {plan?.longTermGoals && getCompletedCount(plan.longTermGoals)}/{plan?.longTermGoals?.length}
              </span>
            </div>
            <Progress
              value={plan?.longTermGoals ? (getCompletedCount(plan.longTermGoals) / Math.max(plan.longTermGoals.length, 1)) * 100 : 0}
              className="h-2"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Milestones</span>
              <span className="text-sm text-gray-500">
                {plan?.milestones && getCompletedCount(plan.milestones)}/{plan?.milestones?.length}
              </span>
            </div>
            <Progress
              value={plan?.milestones ? (getCompletedCount(plan.milestones) / Math.max(plan.milestones.length, 1)) * 100 : 0}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {plan?.targetCareer && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-4">Based on your career plan for {plan.targetCareer}, consider taking relevant assessments:</p>
            <Button asChild>
              <Link href="/dashboard/assessment">
                View Assessments
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
