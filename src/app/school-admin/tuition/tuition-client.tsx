/**
 * TUITION CENTER - CLIENT COMPONENT
 *
 * Client-side component with interactivity for tuition course management.
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus, Search, Users, BookOpen, Star, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { fetchTuitionCourses } from "../_actions";

interface Course {
  id: string;
  title: string;
  tutor?: string;
  tutorName?: string;
  type: string;
  students?: number;
  enrollmentCount?: number;
  rating?: number;
  price?: number;
  status: string;
}

interface TuitionClientProps {
  initialCourses: Course[];
  initialTotal: number;
}

export function TuitionClient({ initialCourses, initialTotal }: TuitionClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [total, setTotal] = useState(initialTotal);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await fetchTuitionCourses({ limit: 50, offset: 0 });
      setCourses(data.courses);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to refresh courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const activeCourses = courses.filter(c => c.status === "active");
  const totalEnrollments = courses.reduce((s, c) => s + (c.students || c.enrollmentCount || 0), 0);
  const avgRating = courses.length > 0
    ? courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.length
    : 0;
  const totalRevenue = courses.reduce((s, c) => s + (c.price || 0) * (c.students || c.enrollmentCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tuition Center</h1>
          <p className="text-gray-600">Manage tuition courses and tutors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/school-admin/tuition/tutors">
              <GraduationCap className="w-4 h-4 mr-2" />Manage Tutors
            </Link>
          </Button>
          <Button
            style={{
              background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)',
              color: 'white'
            }}
            asChild
          >
            <Link href="/school-admin/tuition/create">
              <Plus className="w-4 h-4 mr-2" />Create Course
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCourses.length}</p>
                <p className="text-sm text-gray-500">Active Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
                <p className="text-sm text-gray-500">Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Nu. {totalRevenue.toLocaleString('en-US')}</p>
                <p className="text-sm text-gray-500">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Badge
                  className={
                    course.type === "online_live"
                      ? "bg-purple-100 text-purple-700"
                      : course.type === "online_recorded"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }
                >
                  {course.type.replace('_', ' ')}
                </Badge>
                <Badge className="bg-green-100 text-green-700">{course.status}</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                by {course.tutor || course.tutorName || "TBD"}
              </p>
              <div className="flex items-center gap-1 mb-3">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{course.rating || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />{course.students || course.enrollmentCount || 0} students
                </span>
                <span className="font-semibold text-orange-600">
                  Nu. {(course.price || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/school-admin/tuition/${course.id}`}>View Details</Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
