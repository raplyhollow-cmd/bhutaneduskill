/**
 * LESSON DETAIL PAGE - EXAMPLE
 *
 * Demonstrates viewing a single record using the unified components.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FeatureView } from "@/components/unified";
import { LessonFeature } from "@/features/lessons.feature";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLesson() {
      try {
        setLoading(true);
        const response = await fetch(`/api/resources/lessons/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to load lesson");
        }
        const result = await response.json();
        setLesson(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-destructive">{error || "Lesson not found"}</p>
        <Link href="/examples/lessons">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/examples/lessons">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground">{lesson.description}</p>
          </div>
        </div>

        <Link href={`/examples/lessons/${params.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="grid gap-6">
        {/* Quick info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg">{lesson.lessonDate ? new Date(lesson.lessonDate).toLocaleDateString() : "—"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg">
                {lesson.startTime || "—"} {lesson.startTime && lesson.endTime && `- ${lesson.endTime}`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Room</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg">{lesson.roomNumber || "—"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Status badge */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={
                lesson.status === "completed" ? "default" :
                lesson.status === "scheduled" ? "secondary" :
                "destructive"
              }>
                {lesson.status?.charAt(0).toUpperCase() + lesson.status?.slice(1) || "Unknown"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Full details using FeatureView */}
        <FeatureView
          schema={LessonFeature.config.schema as any}
          data={lesson}
          title="Lesson Details"
        />
      </div>
    </div>
  );
}
