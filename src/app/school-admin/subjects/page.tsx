/**
 * SCHOOL ADMIN - SUBJECTS MANAGEMENT
 */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Edit, Trash2, X } from "lucide-react";

const mockSubjects = [
  { id: "SUB001", code: "MATH-101", name: "Mathematics", nameDz: "རྩིས་རིམ།", grade: 10, icon: "📐", color: "#3B82F6", isActive: true },
  { id: "SUB002", code: "ENG-101", name: "English", nameDz: "ཨིང་ལིཤ།", grade: 10, icon: "📖", color: "#10B981", isActive: true },
  { id: "SUB003", code: "PHY-101", name: "Physics", nameDz: "རིག་འགྲུབ།", grade: 10, icon: "⚡", color: "#8B5CF6", isActive: true },
  { id: "SUB004", code: "CHE-101", name: "Chemistry", nameDz: "རྫས་འགྱུར།", grade: 10, icon: "🧪", color: "#EF4444", isActive: true },
  { id: "SUB005", code: "DZO-101", name: "Dzongkha", nameDz: "རྫོང་ཁ།", grade: 10, icon: "🏔️", color: "#F59E0B", isActive: true },
];

export default function SchoolAdminSubjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  const filtered = mockSubjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Subjects Management</h1><p className="text-gray-600">{filtered.length} subjects</p></div>
        <Button className="bg-primary-600" onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4 mr-2" />Add Subject</Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6 text-primary-600" /></div><div><p className="text-2xl font-bold">{mockSubjects.length}</p><p className="text-sm text-gray-500">Total Subjects</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6 text-green-600" /></div><div><p className="text-2xl font-bold">{mockSubjects.filter(s => s.isActive).length}</p><p className="text-sm text-gray-500">Active</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6 text-blue-600" /></div><div><p className="text-2xl font-bold">{new Set(mockSubjects.map(s => s.grade)).size}</p><p className="text-sm text-gray-500">Grade Levels</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6 text-purple-600" /></div><div><p className="text-2xl font-bold">PP-12</p><p className="text-sm text-gray-500">Range</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search subjects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map(s => (
              <Card key={s.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: s.color + "20" }}>{s.icon}</div>
                      <div>
                        <h3 className="font-semibold">{s.name}</h3>
                        <p className="text-sm text-gray-500">{s.code}</p>
                      </div>
                    </div>
                    <Badge className={s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>Grade {s.grade}</span>
                    <span>{s.nameDz}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1"><Edit className="w-4 h-4 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Subject</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Subject Name *</label><Input placeholder="e.g., Mathematics" /></div>
              <div><label className="block text-sm font-medium mb-1">Subject Code *</label><Input placeholder="e.g., MATH-101" /></div>
              <div><label className="block text-sm font-medium mb-1">Dzongkha Name</label><Input placeholder="རྩིས་རིམ།" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Grade</label><select className="w-full px-3 py-2 border rounded-lg">{Array.from({length: 13}, (_, i) => <option key={i} value={i === 0 ? "PP" : i}>{i === 0 ? "PP" : `Grade ${i}`}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Icon</label><Input placeholder="📐" /></div></div>
              <div><label className="block text-sm font-medium mb-1">Color</label><Input type="color" defaultValue="#3B82F6" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button><Button className="bg-primary-600">Add Subject</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
