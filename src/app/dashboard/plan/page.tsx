"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, Target, Compass, Flag, Map, Play, Eye, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import { CAREER_PHASES } from "@/lib/assessments";

const PHASE_ICONS = {
  self_assessment: <CheckCircle2 className="w-6 h-6" />,
  career_exploration: <Compass className="w-6 h-6" />,
  goal_setting: <Target className="w-6 h-6" />,
  planning: <Map className="w-6 h-6" />,
  implementation: <Play className="w-6 h-6" />,
  review: <Eye className="w-6 h-6" />,
};

// Mock career plan data
const mockPlan = {
  currentPhase: "self_assessment",
  targetCareer: "Software Engineer",
  phases: [
    { id: "self_assessment", status: "completed", title: "Self Assessment", description: "Understand your interests, values, and personality" },
    { id: "career_exploration", status: "in_progress", title: "Career Exploration", description: "Research and explore career options" },
    { id: "goal_setting", status: "pending", title: "Goal Setting", description: "Set short-term and long-term goals" },
    { id: "planning", status: "pending", title: "Planning", description: "Create a detailed action plan" },
    { id: "implementation", status: "pending", title: "Implementation", description: "Take action toward your goals" },
    { id: "review", status: "pending", title: "Review", description: "Review progress and adjust plans" },
  ],
  goals: [
    { id: "1", title: "Complete RIASEC assessment", status: "completed" },
    { id: "2", title: "Research software engineering careers", status: "in_progress" },
    { id: "3", title: "Learn programming fundamentals", status: "pending" },
    { id: "4", title: "Build a portfolio project", status: "pending" },
    { id: "5", title: "Apply to Computer Science programs", status: "pending" },
  ],
};

export default function CareerPlanPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no plans exist, show create prompt
  if (plans.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Career Plan
          </h1>
          <p className="text-gray-600">
            Create a personalized six-phase career plan to achieve your goals
          </p>
        </div>

        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-200" />
              <h2 className="text-2xl font-bold mb-2">Start Your Career Journey</h2>
              <p className="text-blue-100 mb-6">
                Create a personalized career plan with the six-phase O*NET model
              </p>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/dashboard/plan/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Plan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About the Six-Phase Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(CAREER_PHASES).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{value.name}</p>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show list of plans if more than one
  if (plans.length > 1) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Career Plans
            </h1>
            <p className="text-gray-600">
              Manage and track your career development
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/plan/new">
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {plans.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/dashboard/plan/${p.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{p.targetCareer || "Untitled Plan"}</h3>
                    <p className="text-sm text-gray-500">Phase: {CAREER_PHASES[p.currentPhase]?.name || p.currentPhase}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show first plan or list of plans
  const activePlan = plans[0];

  // Calculate progress for goals
  const shortTermCompleted = activePlan?.shortTermGoals?.filter((g: any) => g.status === "completed").length || 0;
  const longTermCompleted = activePlan?.longTermGoals?.filter((g: any) => g.status === "completed").length || 0;
  const milestonesCompleted = activePlan?.milestones?.filter((m: any) => m.status === "completed").length || 0;

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "in_progress":
        return <Circle className="w-5 h-5 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Career Plan
        </h1>
        <p className="text-gray-600">
          Follow the six-phase model to build your career path
        </p>
      </div>

      {/* Current Phase Banner */}
      {activePlan?.targetCareer && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Target Career</p>
                <p className="text-2xl font-bold">{activePlan.targetCareer}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Current Phase</p>
                <p className="text-xl font-semibold">{CAREER_PHASES[activePlan.currentPhase]?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Six Phase Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Six-Phase Career Planning Model</CardTitle>
          <CardDescription>Based on O*NET framework for comprehensive career development</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(CAREER_PHASES).map(([key, value], index) => {
            const phaseIndex = Object.keys(CAREER_PHASES).indexOf(key);
            const currentPhaseIndex = Object.keys(CAREER_PHASES).indexOf(activePlan?.currentPhase || "self_assessment");
            const status = phaseIndex < currentPhaseIndex ? "completed" : phaseIndex === currentPhaseIndex ? "in_progress" : "pending";

            return (
              <div
                key={key}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 ${getPhaseStatusColor(status)}`}
              >
                <div className="flex-shrink-0 mt-1">{getPhaseStatusIcon(status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Phase {index + 1}: {value.name}</span>
                    {status === "completed" && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Completed
                      </Badge>
                    )}
                    {status === "in_progress" && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
                <div className="flex-shrink-0">
                  {status === "pending" && (
                    <Badge variant="outline">Pending</Badge>
                  )}
                  {status === "in_progress" && (
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/plan/${activePlan?.id}`}>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Short-Term Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Short-Term Goals</CardTitle>
          <CardDescription>Goals to achieve in the next 3-6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activePlan?.shortTermGoals?.length > 0 ? (
              activePlan.shortTermGoals.map((goal: any) => (
                <div key={goal.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                  <div className={`w-4 h-4 rounded-full ${getGoalStatusColor(goal.status)}`} />
                  <span className={`flex-1 ${goal.status === "completed" ? "line-through text-gray-400" : ""}`}>
                    {goal.title}
                  </span>
                  {goal.status === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No short-term goals set yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Long-Term Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Long-Term Goals</CardTitle>
          <CardDescription>Goals to achieve in the next 1-3 years</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activePlan?.longTermGoals?.length > 0 ? (
              activePlan.longTermGoals.map((goal: any) => (
                <div key={goal.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                  <div className={`w-4 h-4 rounded-full ${getGoalStatusColor(goal.status)}`} />
                  <span className={`flex-1 ${goal.status === "completed" ? "line-through text-gray-400" : ""}`}>
                    {goal.title}
                  </span>
                  {goal.status === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No long-term goals set yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Key Milestones</CardTitle>
          <CardDescription>Important checkpoints on your journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activePlan?.milestones?.length > 0 ? (
              activePlan.milestones.map((milestone: any) => (
                <div key={milestone.id} className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Flag className="w-5 h-5 text-blue-600" />
                  <span className={`flex-1 ${milestone.status === "completed" ? "line-through text-gray-400" : ""}`}>
                    {milestone.title}
                  </span>
                  {milestone.status === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No milestones set yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Short-Term Goals</span>
                <span className="text-sm text-gray-500">
                  {shortTermCompleted}/{activePlan?.shortTermGoals?.length || 0}
                </span>
              </div>
              <Progress
                value={activePlan?.shortTermGoals?.length ? (shortTermCompleted / activePlan.shortTermGoals.length) * 100 : 0}
                className="h-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Long-Term Goals</span>
                <span className="text-sm text-gray-500">
                  {longTermCompleted}/{activePlan?.longTermGoals?.length || 0}
                </span>
              </div>
              <Progress
                value={activePlan?.longTermGoals?.length ? (longTermCompleted / activePlan.longTermGoals.length) * 100 : 0}
                className="h-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Milestones</span>
                <span className="text-sm text-gray-500">
                  {milestonesCompleted}/{activePlan?.milestones?.length || 0}
                </span>
              </div>
              <Progress
                value={activePlan?.milestones?.length ? (milestonesCompleted / activePlan.milestones.length) * 100 : 0}
                className="h-3"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center pt-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{shortTermCompleted + longTermCompleted}</div>
                <div className="text-sm text-gray-600">Goals Completed</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(activePlan?.shortTermGoals?.filter((g: any) => g.status === "in_progress").length || 0) +
                   (activePlan?.longTermGoals?.filter((g: any) => g.status === "in_progress").length || 0)}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{milestonesCompleted}</div>
                <div className="text-sm text-gray-600">Milestones Done</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/assessment">Take Assessments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/careers">Explore Careers</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/plan/new">Create New Plan</Link>
        </Button>
      </div>
    </div>
  );
}
