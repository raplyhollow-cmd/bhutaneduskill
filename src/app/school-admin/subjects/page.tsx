/**
 * SCHOOL ADMIN - SUBJECTS MANAGEMENT
 *
 * Now using real database data via server actions.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Edit, Trash2 } from "lucide-react";
import { fetchSubjects } from "../_actions";

export default async function SchoolAdminSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  // Fetch subjects from database
  const result = await fetchSubjects({
    search,
    limit: 100,
  });

  const { subjects, total } = result;

  // Calculate stats
  const totalActive = subjects.filter((s) => s.isActive).length;
  const gradeLevels = new Set(subjects.map((s) => s.grade).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subjects Management</h1>
          <p className="text-gray-600">{total} subjects</p>
        </div>
        <Button className="bg-primary-600">
          <Plus className="w-4 h-4 mr-2" />Add Subject
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-gray-500">Total Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActive}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{gradeLevels}</p>
                <p className="text-sm text-gray-500">Grade Levels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">PP-12</p>
                <p className="text-sm text-gray-500">Range</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search subjects..."
              defaultValue={search}
              name="search"
              className="pl-10"
            />
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subjects found. Add your first subject to get started.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {subjects.map((s) => (
                <Card key={s.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: s.color ? `${s.color}20` : "#f3f4f6" }}
                        >
                          {s.icon || "📚"}
                        </div>
                        <div>
                          <h3 className="font-semibold">{s.name}</h3>
                          <p className="text-sm text-gray-500">{s.code}</p>
                        </div>
                      </div>
                      <Badge className={s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>Grade {s.grade || "Not assigned"}</span>
                      <span>{s.nameDz || ""}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
