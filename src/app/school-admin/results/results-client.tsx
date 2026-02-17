"use client";

import { logger } from "@/lib/logger";
/**
 * RESULTS CLIENT COMPONENT
 *
 * Client-side component for exam results management with server actions.
 */


import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  Upload,
  Download,
  TrendingUp,
  Users,
  Award,
  Eye,
  X,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { fetchExamResults } from "../_actions";
import type { ExamResultData } from "@/lib/api/school-admin";

interface ResultsClientProps {
  initialResults: ExamResultData[];
  initialTotal: number;
  initialSearch: string;
}

export function ResultsClient({
  initialResults,
  initialTotal,
  initialSearch,
}: ResultsClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [results, setResults] = useState<ExamResultData[]>(initialResults);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        loadResults();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const result = await fetchExamResults({
        search: searchQuery,
        limit: 50,
        offset: 0,
      });
      setResults(result.results);
      setTotal(result.total);
    } catch (error) {
      logger.error("Failed to load results:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      midterm: "bg-blue-100 text-blue-700 border-blue-200",
      final: "bg-purple-100 text-purple-700 border-purple-200",
      unit_test: "bg-green-100 text-green-700 border-green-200",
      board_exam: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Calculate stats from real data
  const totalStudents = results.reduce((sum, r) => sum + r.students, 0);
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.avgPercentage, 0) / results.length)
    : 0;
  const distinctions = results.filter(r => r.avgPercentage >= 70).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-600 mt-1">
            {total} exam{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPublishModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Results
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <Link href="/school-admin/results/export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Link>
          </Button>
          <Button
            asChild
            style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
          >
            <Link href="/school-admin/results/create">
              <Plus className="w-4 h-4 mr-2" />
              Add Results
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: "rgb(239 246 255)" }}
              >
                <FileText className="w-6 h-6" style={{ color: "rgb(139 92 246)" }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-500">Exams</p>
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
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-500">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
                <p className="text-sm text-gray-500">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{distinctions}</p>
                <p className="text-sm text-gray-500">Distinctions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading results...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exam results found. Add your first exam results to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Exam Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Students</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Avg %</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{r.examName}</td>
                      <td className="py-3 px-4">
                        <Badge className={getTypeBadge(r.examType)} variant="outline">
                          {r.examType.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{r.class}</td>
                      <td className="py-3 px-4">{r.date}</td>
                      <td className="py-3 px-4">{r.students}</td>
                      <td className="py-3 px-4 font-semibold">{r.avgPercentage}%</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={r.published
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }
                          variant="outline"
                        >
                          {r.published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/school-admin/results/${r.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Import Exam Results</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPublishModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop CSV file</p>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <code className="text-xs">studentId, name, subject, marksObtained, maxMarks, grade</code>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPublishModal(false)}>
                Cancel
              </Button>
              <Button
                style={{ background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)" }}
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}