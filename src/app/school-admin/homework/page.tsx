/**
 * SCHOOL ADMIN - HOMEWORK OVERVIEW
 */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Eye, BookOpen, Users, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const mockHomework = [
  { id: "HW001", title: "Quadratic Equations", class: "Class 10 A", subject: "Mathematics", type: "assignment", dueDate: "2025-02-10", submitted: 32, total: 35, graded: 28 },
  { id: "HW002", title: "Essay: Bhutan Vision", class: "Class 10 B", subject: "English", type: "essay", dueDate: "2025-02-08", submitted: 35, total: 38, graded: 30 },
  { id: "HW003", title: "Physics Lab Report", class: "Class 11 A", subject: "Physics", type: "project", dueDate: "2025-02-15", submitted: 18, total: 30, graded: 5 },
];

export default function SchoolAdminHomeworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filtered = mockHomework.filter(hw => 
    hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hw.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homework Management</h1>
          <p className="text-gray-600">{filtered.length} assignments found</p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700" asChild>
          <Link href="/school-admin/homework/create"><Plus className="w-4 h-4 mr-2" />Create Homework</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-primary-600" /></div><div><p className="text-2xl font-bold">{mockHomework.length}</p><p className="text-sm text-gray-500">Total</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div><div><p className="text-2xl font-bold">{mockHomework.reduce((s,h) => s+h.submitted,0)}</p><p className="text-sm text-gray-500">Submitted</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Eye className="w-6 h-6 text-green-600" /></div><div><p className="text-2xl font-bold">{mockHomework.reduce((s,h) => s+h.graded,0)}</p><p className="text-sm text-gray-500">Graded</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"><Calendar className="w-6 h-6 text-yellow-600" /></div><div><p className="text-2xl font-bold">{mockHomework.reduce((s,h) => s+(h.total-h.submitted),0)}</p><p className="text-sm text-gray-500">Pending</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search homework..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b"><th className="text-left py-3 px-4">Title</th><th className="text-left py-3 px-4">Class</th><th className="text-left py-3 px-4">Subject</th><th className="text-left py-3 px-4">Due Date</th><th className="text-left py-3 px-4">Progress</th><th className="text-right py-3 px-4">Actions</th></tr></thead>
              <tbody>
                {filtered.map(hw => {
                  const progress = Math.round((hw.submitted/hw.total)*100);
                  return (
                    <tr key={hw.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4"><div><p className="font-medium">{hw.title}</p><Badge className="mt-1" variant="outline">{hw.type}</Badge></div></td>
                      <td className="py-3 px-4">{hw.class}</td>
                      <td className="py-3 px-4"><BookOpen className="w-4 h-4 inline mr-1"/>{hw.subject}</td>
                      <td className="py-3 px-4">{hw.dueDate}</td>
                      <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-primary-600 h-2 rounded-full" style={{width: `${progress}%`}}/></div><span className="text-sm">{hw.submitted}/{hw.total}</span></div></td>
                      <td className="py-3 px-4 text-right"><Button variant="outline" size="sm" asChild><Link href={`/school-admin/homework/${hw.id}`}><Eye className="w-4 h-4 mr-1"/>View</Link></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
