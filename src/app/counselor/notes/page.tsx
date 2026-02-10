/**
 * COUNSELOR - STUDENT NOTES
 *
 * Features:
 * - Confidential notes on students
 * - Note categories (academic, behavioral, personal)
 * - Search and filter notes
 * - Note sharing permissions
 * - Uses counselor_notes table
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  User,
  GraduationCap,
  MapPin,
  Edit,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Heart,
  TrendingUp,
  Tag,
} from "lucide-react";
import Link from "next/link";

// Mock notes data using counselor_notes table structure
const mockNotes = [
  {
    id: "NOTE001",
    counselorId: "COUN001",
    studentId: "STU001",
    studentName: "Tashi Dorji",
    grade: 12,
    school: "Thimphu Higher Secondary School",
    category: "academic",
    note: "Student showing excellent progress in mathematics. Recently completed calculus unit with 92%. Teacher reports increased class participation. Recommended for advanced placement program.",
    isPrivate: false,
    isSensitive: false,
    createdAt: "2024-02-10T10:30:00",
    updatedAt: "2024-02-10T10:30:00",
    tags: ["mathematics", "achievement", "placement"],
  },
  {
    id: "NOTE002",
    counselorId: "COUN001",
    studentId: "STU002",
    studentName: "Karma Wangmo",
    grade: 10,
    school: "Yangchenphug Higher Secondary School",
    category: "personal",
    note: "Family situation impacting attendance. Mother experiencing health issues. Student responsible for caring for younger siblings. Referenced school social worker for family support. Will monitor attendance weekly.",
    isPrivate: true,
    isSensitive: true,
    createdAt: "2024-02-08T14:20:00",
    updatedAt: "2024-02-10T09:15:00",
    tags: ["family", "attendance", "social-work"],
  },
  {
    id: "NOTE003",
    counselorId: "COUN001",
    studentId: "STU003",
    studentName: "Pema Lhamo",
    grade: 11,
    school: "Moiyul Goenpa HSS",
    category: "behavioral",
    note: "Significant improvement in social adjustment. Student joined debate club and made friends. Reports feeling more connected to school community. Previous concerns about isolation have been resolved.",
    isPrivate: false,
    isSensitive: false,
    createdAt: "2024-02-05T11:00:00",
    updatedAt: "2024-02-05T11:00:00",
    tags: ["social", "improvement", "extracurricular"],
  },
  {
    id: "NOTE004",
    counselorId: "COUN001",
    studentId: "STU004",
    studentName: "Dorji Wangchuk",
    grade: 12,
    school: "Pelkhil HSS",
    category: "academic",
    note: "Career exploration session completed. Student expressed strong interest in civil engineering but concerned about mathematics requirements. Provided information on RUB engineering programs and scholarship opportunities. Recommended summer bridge program.",
    isPrivate: false,
    isSensitive: false,
    createdAt: "2024-02-03T15:45:00",
    updatedAt: "2024-02-03T15:45:00",
    tags: ["career", "engineering", "RUB", "scholarship"],
  },
  {
    id: "NOTE005",
    counselorId: "COUN001",
    studentId: "STU005",
    studentName: "Sonam Yangdon",
    grade: 10,
    school: "Rigsum HSS",
    category: "academic",
    note: "Anxiety regarding upcoming board exams. Student expressing pressure from family expectations. Discussed stress management techniques and created study schedule. Recommended speaking with school psychologist for additional support.",
    isPrivate: true,
    isSensitive: false,
    createdAt: "2024-02-01T09:30:00",
    updatedAt: "2024-02-07T13:20:00",
    tags: ["exams", "anxiety", "stress-management"],
  },
  {
    id: "NOTE006",
    counselorId: "COUN001",
    studentId: "STU006",
    studentName: "Karma Tshering",
    grade: 11,
    school: "Thimphu HSS",
    category: "behavioral",
    note: "Incident report: Student involved in conflict with peer during lunch. Mediated discussion between both parties. Root cause identified as misunderstanding. Both students agreed to resolution and will participate in restorative justice activity.",
    isPrivate: true,
    isSensitive: false,
    createdAt: "2024-01-30T16:00:00",
    updatedAt: "2024-01-30T16:00:00",
    tags: ["conflict", "mediation", "restorative-justice"],
  },
  {
    id: "NOTE007",
    counselorId: "COUN001",
    studentId: "STU007",
    studentName: "Tshering Yangdon",
    grade: 12,
    school: "Yangchenphug HSS",
    category: "personal",
    note: "Student shared aspirations to pursue data science career. Excellent RIASEC results showing strong investigative and conventional scores. Provided resources on online courses and RUB computer science programs. Student very motivated.",
    isPrivate: false,
    isSensitive: false,
    createdAt: "2024-01-28T10:15:00",
    updatedAt: "2024-01-28T10:15:00",
    tags: ["career", "data-science", "RIASEC"],
  },
  {
    id: "NOTE008",
    counselorId: "COUN001",
    studentId: "STU008",
    studentName: "Dorji Tshering",
    grade: 9,
    school: "Moiyul Goenpa HSS",
    category: "academic",
    note: "Initial career counseling session. Student uncertain about interests. Introduced to various career clusters through interactive assessment. Scheduled follow-up session after family discusses options at home.",
    isPrivate: false,
    isSensitive: false,
    createdAt: "2024-01-25T14:00:00",
    updatedAt: "2024-01-25T14:00:00",
    tags: ["career-exploration", "assessment", "initial"],
  },
];

const categoryOptions = ["All", "Academic", "Behavioral", "Personal", "Career"];
const privacyOptions = ["All", "Private", "Shared"];
const schoolOptions = ["All", "Thimphu HSS", "Yangchenphug HSS", "Moiyul Goenpa HSS", "Pelkhil HSS", "Rigsum HSS"];

export default function CounselorNotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPrivacy, setSelectedPrivacy] = useState("All");
  const [selectedSchool, setSelectedSchool] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter notes
  const filteredNotes = mockNotes.filter((note) => {
    const matchesSearch =
      note.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || note.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPrivacy = selectedPrivacy === "All" ||
      (selectedPrivacy === "Private" && note.isPrivate) ||
      (selectedPrivacy === "Shared" && !note.isPrivate);
    const matchesSchool = selectedSchool === "All" || note.school === selectedSchool;

    return matchesSearch && matchesCategory && matchesPrivacy && matchesSchool;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const paginatedNotes = filteredNotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryBadge = (category: string) => {
    const styles = {
      academic: "bg-blue-100 text-blue-700 border-blue-200",
      behavioral: "bg-orange-100 text-orange-700 border-orange-200",
      personal: "bg-purple-100 text-purple-700 border-purple-200",
      career: "bg-green-100 text-green-700 border-green-200",
    };
    const icons = {
      academic: BookOpen,
      behavioral: AlertCircle,
      personal: Heart,
      career: TrendingUp,
    };
    const Icon = icons[category as keyof typeof icons] || BookOpen;
    return { className: styles[category as keyof typeof styles] || styles.academic, icon: Icon };
  };

  // Stats
  const totalNotes = mockNotes.length;
  const privateNotes = mockNotes.filter((n) => n.isPrivate).length;
  const sensitiveNotes = mockNotes.filter((n) => n.isSensitive).length;
  const thisWeekNotes = mockNotes.filter((n) => {
    const noteDate = new Date(n.createdAt);
    const today = new Date();
    const weekAgo = new Date(today.setDate(today.getDate() - 7));
    return noteDate >= weekAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counselor Notes</h1>
          <p className="text-gray-600 mt-1">
            Confidential notes on student progress and interactions
          </p>
        </div>
        <Button
          className="gap-2"
          style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <FileText className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalNotes}</p>
                <p className="text-sm text-gray-500">Total Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{privateNotes}</p>
                <p className="text-sm text-gray-500">Private Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sensitiveNotes}</p>
                <p className="text-sm text-gray-500">Sensitive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{thisWeekNotes}</p>
                <p className="text-sm text-gray-500">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by student, note content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "All Categories" : category}
                </option>
              ))}
            </select>

            <select
              value={selectedPrivacy}
              onChange={(e) => setSelectedPrivacy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {privacyOptions.map((privacy) => (
                <option key={privacy} value={privacy}>
                  {privacy === "All" ? "All Privacy" : privacy}
                </option>
              ))}
            </select>

            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {schoolOptions.map((school) => (
                <option key={school} value={school}>
                  {school === "All" ? "All Schools" : school}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {paginatedNotes.map((note) => {
          const categoryBadge = getCategoryBadge(note.category);
          const CategoryIcon = categoryBadge.icon;

          return (
            <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setSelectedNote(note);
              setShowDetailModal(true);
            }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                    {note.studentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{note.studentName}</h3>
                      <span className="text-gray-500">Grade {note.grade}</span>
                      <Badge className={categoryBadge.className} variant="outline">
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {note.category}
                      </Badge>
                      {note.isPrivate && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                      {note.isSensitive && (
                        <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Sensitive
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {note.note}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {note.school}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {note.tags.slice(0, 2).join(", ")}
                        {note.tags.length > 2 && ` +${note.tags.length - 2}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {paginatedNotes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or create a new note</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSelectedPrivacy("All");
              setSelectedSchool("All");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredNotes.length)} of {filteredNotes.length}{" "}
            notes
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  style={currentPage === pageNum ? { background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' } : {}}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create New Note</CardTitle>
                  <CardDescription>Add a confidential counselor note</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select a student</option>
                  <option value="STU001">Tashi Dorji - Grade 12</option>
                  <option value="STU002">Karma Wangmo - Grade 10</option>
                  <option value="STU003">Pema Lhamo - Grade 11</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="academic">Academic</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="personal">Personal</option>
                  <option value="career">Career</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[120px]"
                  placeholder="Enter your note..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <Input placeholder="e.g., mathematics, achievement, placement" />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Privacy Settings</h4>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Mark as private (only visible to you)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-red-600" />
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Mark as sensitive (requires additional access)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
                  <Unlock className="w-4 h-4" />
                  <span>Share with school admin</span>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Confidentiality Notice</p>
                    <p>Counselor notes are confidential and protected. Only authorized personnel can access private notes.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Save Note
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Note Detail Modal */}
      {showDetailModal && selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                    {selectedNote.studentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <CardTitle>{selectedNote.studentName}</CardTitle>
                    <CardDescription>Grade {selectedNote.grade} - {selectedNote.id}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getCategoryBadge(selectedNote.category).className} variant="outline">
                  {(() => {
                    const Icon = getCategoryBadge(selectedNote.category).icon;
                    return Icon ? <Icon className="w-3 h-3 mr-1" /> : null;
                  })()}
                  {selectedNote.category}
                </Badge>
                {selectedNote.isPrivate && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                )}
                {selectedNote.isSensitive && (
                  <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Sensitive
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">School</h4>
                <p className="text-gray-600">{selectedNote.school}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Note</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedNote.note}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} className="bg-gray-100 text-gray-700 border-gray-200" variant="outline">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                  <p className="text-gray-600">{new Date(selectedNote.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                  <p className="text-gray-600">{new Date(selectedNote.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedNote.isSensitive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Sensitive Information</p>
                      <p>This note contains sensitive information. Handle with appropriate confidentiality.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-between">
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Note
              </Button>
              <Button
                style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
                asChild
              >
                <Link href={`/counselor/students/${selectedNote.studentId}`}>
                  <User className="w-4 h-4 mr-2" />
                  View Student Profile
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
