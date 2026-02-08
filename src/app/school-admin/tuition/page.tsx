/**
 * SCHOOL ADMIN - TUITION CENTER
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus, Search, Users, BookOpen, TrendingUp, DollarSign, Star, Calendar } from "lucide-react";
import Link from "next/link";

const mockCourses = [
  { id: "TC001", title: "Class 10 Mathematics", tutor: "Tashi Dorji", type: "online_live", students: 25, rating: 4.5, price: 5000, status: "active" },
  { id: "TC002", title: "Physics Foundation", tutor: "Pema Lhamo", type: "online_recorded", students: 45, rating: 4.8, price: 3000, status: "active" },
  { id: "TC003", title: "English Writing", tutor: "Karma Wangmo", type: "physical", students: 15, rating: 4.2, price: 4000, status: "active" },
];

export default function SchoolAdminTuitionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tuition Center</h1>
          <p className="text-gray-600">Manage tuition courses and tutors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/school-admin/tuition/tutors"><GraduationCap className="w-4 h-4 mr-2" />Manage Tutors</Link></Button>
          <Button className="bg-primary-600" asChild><Link href="/school-admin/tuition/create"><Plus className="w-4 h-4 mr-2" />Create Course</Link></Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6 text-primary-600" /></div><div><p className="text-2xl font-bold">{mockCourses.length}</p><p className="text-sm text-gray-500">Active Courses</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-green-600" /></div><div><p className="text-2xl font-bold">{mockCourses.reduce((s,c) => s+c.students,0)}</p><p className="text-sm text-gray-500">Enrollments</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"><Star className="w-6 h-6 text-yellow-600" /></div><div><p className="text-2xl font-bold">{(mockCourses.reduce((s,c) => s+c.rating,0)/mockCourses.length).toFixed(1)}</p><p className="text-sm text-gray-500">Avg Rating</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-blue-600" /></div><div><p className="text-2xl font-bold">Nu. {mockCourses.reduce((s,c) => s+c.price*c.students,0).toLocaleString('en-US')}</p><p className="text-sm text-gray-500">Revenue</p></div></div></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {mockCourses.map(course => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Badge className={course.type === "online_live" ? "bg-purple-100 text-purple-700" : course.type === "online_recorded" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>{course.type.replace('_', ' ')}</Badge>
                <Badge className="bg-green-100 text-green-700">{course.status}</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-3">by {course.tutor}</p>
              <div className="flex items-center gap-1 mb-3"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /><span className="text-sm font-medium">{course.rating}</span></div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.students} students</span>
                <span className="font-semibold text-primary-600">Nu. {course.price.toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild><Link href={`/school-admin/tuition/${course.id}`}>View Details</Link></Button>
                <Button variant="outline" size="sm"><Calendar className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
