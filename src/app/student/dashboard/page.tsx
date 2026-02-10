"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  Briefcase,
  Target,
  TrendingUp,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <Card style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }} className="text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
              <p className="text-orange-50">
                Continue your career exploration journey. You're making great progress!
              </p>
            </div>
            <Sparkles className="w-16 h-16 text-orange-200 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3/5</div>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
            <Progress value={60} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">24</div>
            <p className="text-xs text-gray-500 mt-1">Top matches found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">7/12</div>
            <p className="text-xs text-gray-500 mt-1">Goals achieved</p>
            <Progress value={58} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              XP Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">1,450</div>
            <p className="text-xs text-gray-500 mt-1">Level 5</p>
            <Progress value={45} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
          <CardDescription>Based on your profile and progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Complete DISC Assessment</p>
                <p className="text-sm text-gray-500">Discover your behavioral style</p>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-700">Recommended</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Update Your Career Plan</p>
                <p className="text-sm text-gray-500">Add new goals for this semester</p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/student/plan">
                Update
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Explore RUB Colleges</p>
                <p className="text-sm text-gray-500">Check programs that match your profile</p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/student/rub">
                Explore
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scholarship Application</p>
                <p className="text-sm text-gray-500">Druk Scholarship Program</p>
              </div>
              <Badge variant="outline">3 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Career Plan Review</p>
                <p className="text-sm text-gray-500">Monthly check-in with counselor</p>
              </div>
              <Badge variant="outline">1 week</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="flex-1">Completed RIASEC Assessment</span>
              <span className="text-gray-500">2 days ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="flex-1">Saved 5 career matches</span>
              <span className="text-gray-500">3 days ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="flex-1">Updated career plan</span>
              <span className="text-gray-500">1 week ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
