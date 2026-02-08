/**
 * SCHOOL ADMIN - EXAM RESULTS MANAGEMENT
 */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Upload, Download, Trophy, TrendingUp, Users, Award, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const mockResults = [
  { id: "EX001", examName: "Midterm 2024", examType: "midterm", class: "Class 10 A", date: "2024-10-15", students: 35, published: true, avgPercentage: 72 },
  { id: "EX002", examName: "Final 2024", examType: "final", class: "Class 12 A", date: "2024-12-20", students: 32, published: true, avgPercentage: 68 },
  { id: "EX003", examName: "Unit Test 1", examType: "unit_test", class: "Class 9 A", date: "2025-01-10", students: 40, published: true, avgPercentage: 75 },
];

export default function SchoolAdminResultsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  const filtered = mockResults.filter(r => 
    r.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    const styles = { midterm: "bg-blue-100 text-blue-700", final: "bg-purple-100 text-purple-700", unit_test: "bg-green-100 text-green-700", board_exam: "bg-red-100 text-red-700" };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-600">{filtered.length} exams found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPublishModal(true)}><Upload className="w-4 h-4 mr-2" />Import Results</Button>
          <Button className="bg-primary-600 hover:bg-primary-700" asChild><Link href="/school-admin/results/create"><Plus className="w-4 h-4 mr-2" />Add Results</Link></Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-primary-600" /></div><div><p className="text-2xl font-bold">{mockResults.length}</p><p className="text-sm text-gray-500">Exams</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-green-600" /></div><div><p className="text-2xl font-bold">{mockResults.reduce((s,r) => s+r.students,0)}</p><p className="text-sm text-gray-500">Students</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-6 h-6 text-blue-600" /></div><div><p className="text-2xl font-bold">{Math.round(mockResults.reduce((s,r) => s+r.avgPercentage,0)/mockResults.length)}%</p><p className="text-sm text-gray-500">Avg Score</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"><Award className="w-6 h-6 text-yellow-600" /></div><div><p className="text-2xl font-bold">5</p><p className="text-sm text-gray-500">Distinctions</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search exams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b"><th className="text-left py-3 px-4">Exam Name</th><th className="text-left py-3 px-4">Type</th><th className="text-left py-3 px-4">Class</th><th className="text-left py-3 px-4">Date</th><th className="text-left py-3 px-4">Students</th><th className="text-left py-3 px-4">Avg %</th><th className="text-left py-3 px-4">Status</th><th className="text-right py-3 px-4">Actions</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{r.examName}</td>
                    <td className="py-3 px-4"><Badge className={getTypeBadge(r.examType)} variant="outline">{r.examType.replace('_', ' ')}</Badge></td>
                    <td className="py-3 px-4">{r.class}</td>
                    <td className="py-3 px-4">{r.date}</td>
                    <td className="py-3 px-4">{r.students}</td>
                    <td className="py-3 px-4 font-semibold">{r.avgPercentage}%</td>
                    <td className="py-3 px-4"><Badge className={r.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{r.published ? "Published" : "Draft"}</Badge></td>
                    <td className="py-3 px-4 text-right"><Button variant="outline" size="sm" asChild><Link href={`/school-admin/results/${r.id}`}><Eye className="w-4 h-4 mr-1"/>View</Link></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Import Exam Results</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop CSV file</p>
              <Button variant="outline" size="sm">Browse Files</Button>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg mb-4"><code className="text-xs">studentId, name, subject, marksObtained, maxMarks, grade</code></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPublishModal(false)}>Cancel</Button>
              <Button className="bg-primary-600">Import</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
