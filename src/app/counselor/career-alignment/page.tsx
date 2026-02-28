"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  TrendingUp,
  BookOpen,
  Users,
  Loader2,
  Search,
  Stamp,
} from "lucide-react";
import Link from "next/link";

interface StudentCareerMatch {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string | null;
  schoolName: string;
  careerMatches: Array<{
    careerId: string;
    careerTitle: string;
    matchScore: number;
    matchReason: string;
  }>;
  hollandCode?: string;
  mbtiType?: string;
  avgMarks?: number;
}

interface SelectedCareer {
  careerId: string;
  careerTitle: string;
  matchScore: number;
  matchReason: string;
  riasecCode?: string;
}

interface ApprovalRequest {
  studentId: string;
  careerTitle: string;
  careerField: string;
  suitabilityScore: number;
  academicAlignment: string;
  skillsGap: string[];
  counselorNotes: string;
  reservations: string;
  recommendedPreparation: Array<{
    action: string;
    priority: string;
    timeline: string;
  }>;
  approvalStatus: "approved" | "approved_with_reservations" | "not_recommended";
  scholarshipReady: boolean;
  gnhAlignment: string[];
}

const RUB_COLLEGES = [
  { id: "cst", name: "College of Science and Technology", programs: ["Engineering", "IT", "Architecture"] },
  { id: "cnr", name: "College of Natural Resources", programs: ["Agriculture", "Forestry", "Environment"] },
  { id: "gcbs", name: "Gedu College of Business Studies", programs: ["Business", "Management", "Commerce"] },
  { id: "sherubtse", name: "Sherubtse College", programs: ["Arts", "Science", "Computer Science"] },
  { id: "paro", name: "Paro College of Education", programs: ["Education", "Teaching"] },
  { id: "samtse", name: "Samtse College of Education", programs: ["Education", "Teaching"] },
];

export default function CareerAlignmentPage() {
  const [students, setStudents] = useState<StudentCareerMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentCareerMatch | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<SelectedCareer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalData, setApprovalData] = useState<ApprovalRequest>({
    studentId: "",
    careerTitle: "",
    careerField: "",
    suitabilityScore: 70,
    academicAlignment: "well_aligned",
    skillsGap: [],
    counselorNotes: "",
    reservations: "",
    recommendedPreparation: [],
    approvalStatus: "approved",
    scholarshipReady: false,
    gnhAlignment: [],
  });

  // Fetch students with career matches
  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/counselor/students');
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match StudentCareerMatch interface
        const students = (data.data.students || []).map((student: {
          id: string;
          name: string;
          grade?: string;
          school?: string;
          gpa?: number;
        }) => ({
          id: student.id,
          studentId: student.id,
          studentName: student.name,
          studentClass: student.grade || null,
          schoolName: student.school || 'Unknown School',
          careerMatches: [], // Would need to fetch from career matches API
          hollandCode: undefined,
          mbtiType: undefined,
          avgMarks: student.gpa || undefined,
        }));
        setStudents(students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function selectStudent(student: StudentCareerMatch) {
    setSelectedStudent(student);
    if (student.careerMatches.length > 0) {
      selectCareer(student.careerMatches[0]);
    }
  }

  function selectCareer(career: { careerId: string; careerTitle: string; matchScore: number; matchReason: string; riasecCode?: string }) {
    setSelectedCareer(career);
    setApprovalData({
      ...approvalData,
      studentId: selectedStudent?.studentId || "",
      careerTitle: career.careerTitle,
      careerField: inferCareerField(career.careerTitle),
    });
  }

  function inferCareerField(careerTitle: string): string {
    const title = careerTitle.toLowerCase();
    if (title.includes("software") || title.includes("developer") || title.includes("engineer")) {
      return "engineering";
    }
    if (title.includes("doctor") || title.includes("nurse") || title.includes("medical")) {
      return "medicine";
    }
    if (title.includes("teacher") || title.includes("professor")) {
      return "education";
    }
    if (title.includes("business") || title.includes("accountant") || title.includes("manager")) {
      return "business";
    }
    return "other";
  }

  function updateSuitabilityScore(value: number) {
    setApprovalData({ ...approvalData, suitabilityScore: value });
  }

  function toggleSkillGap(skill: string) {
    setApprovalData({
      ...approvalData,
      skillsGap: approvalData.skillsGap.includes(skill)
        ? approvalData.skillsGap.filter((s) => s !== skill)
        : [...approvalData.skillsGap, skill],
    });
  }

  function toggleGnhAlignment(principle: string) {
    setApprovalData({
      ...approvalData,
      gnhAlignment: approvalData.gnhAlignment.includes(principle)
        ? approvalData.gnhAlignment.filter((p) => p !== principle)
        : [...approvalData.gnhAlignment, principle],
    });
  }

  async function submitApproval() {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/counselor/career-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalData),
      });

      if (!response.ok) throw new Error("Approval failed");

      alert("Career alignment approved successfully!");
      setSelectedStudent(null);
      setSelectedCareer(null);
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit approval. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredStudents = students.filter((s) =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Stamp className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Career Alignment</h1>
        </div>
        <p className="text-gray-600 mt-1">
          Review AI career roadmaps and provide human approval for RUB scholarships
        </p>
      </div>

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle>Find Student</CardTitle>
          <CardDescription>
            Search for students with completed career assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* No Selection State */}
      {!selectedStudent ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select a Student to Review
            </h3>
            <p className="text-gray-600">
              Search for a student above to view their career matches and provide counselor approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Student Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-purple-600" />
                    {selectedStudent.studentName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span>Class {selectedStudent.studentClass || "N/A"}</span>
                    <span>•</span>
                    <span>{selectedStudent.schoolName}</span>
                    {selectedStudent.hollandCode && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-sm bg-purple-100 px-2 py-0.5 rounded">
                          {selectedStudent.hollandCode}
                        </span>
                      </>
                    )}
                    {selectedStudent.mbtiType && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-sm bg-blue-100 px-2 py-0.5 rounded">
                          {selectedStudent.mbtiType}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  Back to Search
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Career Matches */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Career List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Career Matches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedStudent.careerMatches.map((match, index) => (
                  <button
                    key={match.careerId}
                    onClick={() => selectCareer(match)}
                    className={`w-full p-3 rounded-lg text-left border-2 transition-all ${
                      selectedCareer?.careerId === match.careerId
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="font-medium text-sm">{match.careerTitle}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`text-xs px-2 py-0.5 rounded ${
                          match.matchScore >= 80
                            ? "bg-green-100 text-green-700"
                            : match.matchScore >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {match.matchScore}% match
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Top Match
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Approval Form */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stamp className="w-5 h-5 text-purple-600" />
                  Counselor Assessment: {selectedCareer?.careerTitle}
                </CardTitle>
                <CardDescription>
                  Review and approve this career path for RUB scholarship applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Suitability Score Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Suitability Score</label>
                    <span className="text-lg font-bold text-purple-600">
                      {approvalData.suitabilityScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={approvalData.suitabilityScore}
                    onChange={(e) => updateSuitabilityScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor Fit</span>
                    <span>Excellent Fit</span>
                  </div>
                </div>

                {/* Academic Alignment */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Academic Alignment</label>
                  <Select
                    value={approvalData.academicAlignment}
                    onValueChange={(value) =>
                      setApprovalData({ ...approvalData, academicAlignment: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="well_aligned">Well Aligned - Student is on track</SelectItem>
                      <SelectItem value="needs_improvement">Needs Improvement - Some gaps to address</SelectItem>
                      <SelectItem value="misaligned">Misaligned - Consider alternative paths</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills Gap */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Skills to Develop</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Mathematics",
                      "Science",
                      "Communication",
                      "Leadership",
                      "Technical Skills",
                      "Creative Thinking",
                      "Problem Solving",
                      "Teamwork",
                    ].map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkillGap(skill)}
                        className={`p-2 rounded border text-sm text-left transition-all ${
                          approvalData.skillsGap.includes(skill)
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {approvalData.skillsGap.includes(skill) && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {skill}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* GNH Alignment */}
                <div>
                  <label className="text-sm font-medium mb-2 block">GNH Principles Supported</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Psychological Wellbeing",
                      "Community Vitality",
                      "Time Use Balance",
                      "Cultural Preservation",
                      "Ecological Stewardship",
                      "Good Governance",
                    ].map((principle) => (
                      <button
                        key={principle}
                        type="button"
                        onClick={() => toggleGnhAlignment(principle)}
                        className={`p-2 rounded border text-sm text-left transition-all ${
                          approvalData.gnhAlignment.includes(principle)
                            ? "border-green-600 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {approvalData.gnhAlignment.includes(principle) && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {principle}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Counselor Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Counselor Notes</label>
                  <Textarea
                    rows={3}
                    placeholder="Add any observations or recommendations..."
                    value={approvalData.counselorNotes}
                    onChange={(e) =>
                      setApprovalData({ ...approvalData, counselorNotes: e.target.value })
                    }
                  />
                </div>

                {/* Approval Decision */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Your Decision</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setApprovalData({
                          ...approvalData,
                          approvalStatus: "approved",
                          reservations: "",
                        })
                      }
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        approvalData.approvalStatus === "approved"
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <div className="font-medium text-sm">Approve</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Recommend for scholarships
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setApprovalData({ ...approvalData, approvalStatus: "approved_with_reservations" })
                      }
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        approvalData.approvalStatus === "approved_with_reservations"
                          ? "border-yellow-600 bg-yellow-50"
                          : "border-gray-200 hover:border-yellow-300"
                      }`}
                    >
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                      <div className="font-medium text-sm">With Reservations</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Approve with conditions
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setApprovalData({ ...approvalData, approvalStatus: "not_recommended" })
                      }
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        approvalData.approvalStatus === "not_recommended"
                          ? "border-red-600 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                      <div className="font-medium text-sm">Not Recommended</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Suggest alternatives
                      </div>
                    </button>
                  </div>
                </div>

                {/* Reservations Field (conditional) */}
                {approvalData.approvalStatus === "approved_with_reservations" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Specify Reservations/Conditions
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Describe concerns or conditions for approval..."
                      value={approvalData.reservations}
                      onChange={(e) =>
                        setApprovalData({ ...approvalData, reservations: e.target.value })
                      }
                      className="border-yellow-300 bg-yellow-50"
                    />
                  </div>
                )}

                {/* RUB College Matching */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Matching RUB Programs</h4>
                  </div>
                  <div className="space-y-2">
                    {RUB_COLLEGES.filter((college) =>
                      college.programs.some((p) =>
                        p.toLowerCase().includes(approvalData.careerField.toLowerCase())
                      )
                    ).map((college) => (
                      <div
                        key={college.id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div>
                          <div className="font-medium text-sm">{college.name}</div>
                          <div className="text-xs text-gray-500">
                            {college.programs.join(", ")}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Recommended
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={submitApproval}
                    disabled={isSubmitting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Stamp className="w-4 h-4 mr-2" />
                        Submit Approval
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
