"use client";

/**
 * STUDENT RUB COLLEGE SEARCH PAGE
 * Search and filter RUB programs, view requirements, track applications
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  GraduationCap,
  Building2,
  Users,
  BookOpen,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronRight,
  Award,
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";

// Types for RUB data
interface RUBCollege {
  id: string;
  name: string;
  code: string;
  dzongkhag: string;
  location: string;
  type: "constituent" | "private";
  programs: number;
  hasHostel: boolean;
  hasLab: boolean;
  hasSports: boolean;
  website: string;
}

interface RUBProgram {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  collegeName: string;
  level: "bachelor" | "diploma" | "certificate";
  field: string;
  duration: number;
  durationType: string;
  totalSeats: number;
  minPercentage: number;
  requiredSubjects: string[];
  tuitionFee: number;
  hostelFee: number;
  otherFees: number;
  totalFee: number;
  admissionOpen: boolean;
  description: string;
  careerProspects: string[];
}

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  type: "merit" | "need_based";
  coveragePercentage: number;
  minPercentage?: number;
  annualIncomeLimit?: number;
  description: string;
  deadline: string;
}

interface ApplicationStatus {
  hasApplication: boolean;
  status: string;
  submittedDate: string | null;
  preferences: Array<{ rank: number; program: string; college: string }>;
  documents: Array<{ name: string; status: string }>;
}

const dzongkhags = ["All", "Thimphu", "Paro", "Punakha", "Chukha", "Trashigang", "Samtse"];
const fields = ["All", "Engineering", "Science", "Business", "Education", "Arts"];
const levels = ["All", "Bachelor", "Diploma", "Certificate"];

function StudentRUBPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDzongkhag, setSelectedDzongkhag] = useState("All");
  const [selectedField, setSelectedField] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"programs" | "colleges" | "scholarships" | "application">("programs");

  // Data from API
  const [colleges, setColleges] = useState<RUBCollege[]>([]);
  const [programs, setPrograms] = useState<RUBProgram[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({
    hasApplication: false,
    status: "not_started",
    submittedDate: null,
    preferences: [],
    documents: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch RUB data from API
        const [collegesRes, programsRes, scholarshipsRes, applicationRes] = await Promise.all([
          fetch("/api/rub/colleges").catch(() => null),
          fetch("/api/rub/programs").catch(() => null),
          fetch("/api/rub/scholarships").catch(() => null),
          fetch("/api/student/rub-application").catch(() => null),
        ]);

        if (collegesRes?.ok) {
          const data = await collegesRes.json();
          setColleges(data.colleges || []);
        }

        if (programsRes?.ok) {
          const data = await programsRes.json();
          setPrograms(data.programs || []);
        }

        if (scholarshipsRes?.ok) {
          const data = await scholarshipsRes.json();
          setScholarships(data.scholarships || []);
        }

        if (applicationRes?.ok) {
          const data = await applicationRes.json();
          setApplicationStatus(data.application || applicationStatus);
        }
      } catch (err) {
        logger.error("Error fetching RUB data:", err);
        setError("Failed to load RUB data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter programs
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.code.toLowerCase().includes(searchQuery.toLowerCase());

    const college = colleges.find((c) => c.id === program.collegeId);
    const matchesDzongkhag = selectedDzongkhag === "All" || college?.dzongkhag === selectedDzongkhag;
    const matchesField = selectedField === "All" || program.field.toLowerCase() === selectedField.toLowerCase();
    const matchesLevel = selectedLevel === "All" || program.level.toLowerCase().includes(selectedLevel.toLowerCase());

    return matchesSearch && matchesDzongkhag && matchesField && matchesLevel;
  });

  // Filter colleges
  const filteredColleges = colleges.filter((college) => {
    const matchesSearch =
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDzongkhag = selectedDzongkhag === "All" || college.dzongkhag === selectedDzongkhag;

    return matchesSearch && matchesDzongkhag;
  });

  const formatCurrency = (amount: number) => {
    return `Nu. ${amount.toLocaleString()}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "bachelor":
        return "bg-blue-100 text-blue-700";
      case "diploma":
        return "bg-green-100 text-green-700";
      case "certificate":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getFieldColor = (field: string) => {
    switch (field) {
      case "engineering":
        return "bg-orange-100 text-orange-700";
      case "science":
        return "bg-emerald-100 text-emerald-700";
      case "business":
        return "bg-amber-100 text-amber-700";
      case "education":
        return "bg-blue-100 text-blue-700";
      case "arts":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mr-3" />
          <span className="text-gray-600">Loading RUB colleges and programs...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Failed to load data</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
      {/* Application Status Banner */}
        <Card className="mb-6" style={{ background: applicationStatus.hasApplication ? 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)' : 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {applicationStatus.hasApplication ? "Application Submitted" : "Start Your RUB Application"}
                </h2>
                <p className="text-white/80">
                  {applicationStatus.hasApplication
                    ? "Track your application status and updates"
                    : "Begin your journey to higher education with RUB"}
                </p>
              </div>
              <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90 min-h-[44px]">
                {applicationStatus.hasApplication ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    View Status
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Start Application
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={activeTab === "programs" ? "default" : "outline"}
            onClick={() => setActiveTab("programs")}
            className="min-h-[44px] whitespace-nowrap"
            style={activeTab === "programs" ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : {}}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Programs
          </Button>
          <Button
            variant={activeTab === "colleges" ? "default" : "outline"}
            onClick={() => setActiveTab("colleges")}
            className="min-h-[44px] whitespace-nowrap"
            style={activeTab === "colleges" ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : {}}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Colleges
          </Button>
          <Button
            variant={activeTab === "scholarships" ? "default" : "outline"}
            onClick={() => setActiveTab("scholarships")}
            className="min-h-[44px] whitespace-nowrap"
            style={activeTab === "scholarships" ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : {}}
          >
            <Award className="w-4 h-4 mr-2" />
            Scholarships
          </Button>
          <Button
            variant={activeTab === "application" ? "default" : "outline"}
            onClick={() => setActiveTab("application")}
            className="min-h-[44px] whitespace-nowrap"
            style={activeTab === "application" ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : {}}
          >
            <FileText className="w-4 h-4 mr-2" />
            My Application
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={activeTab === "programs" ? "Search programs, colleges..." : "Search colleges..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="min-h-[44px]"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {showFilters && (
            <div className="grid sm:grid-cols-3 gap-4 mt-4 p-4 bg-white rounded-lg border">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Dzongkhag</label>
                <select
                  value={selectedDzongkhag}
                  onChange={(e) => setSelectedDzongkhag(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 border rounded-md"
                >
                  {dzongkhags.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {activeTab === "programs" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Field</label>
                    <select
                      value={selectedField}
                      onChange={(e) => setSelectedField(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 border rounded-md"
                    >
                      {fields.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Level</label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 border rounded-md"
                    >
                      {levels.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Programs Tab */}
        {activeTab === "programs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">{filteredPrograms.length} programs found</p>
            </div>

            {filteredPrograms.map((program) => (
              <Card
                key={program.id}
                className="hover:shadow-md transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getLevelColor(program.level)}>{program.level}</Badge>
                        <Badge className={getFieldColor(program.field)}>{program.field}</Badge>
                        {program.admissionOpen && (
                          <Badge className="bg-green-100 text-green-700">Admissions Open</Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{program.collegeName}</p>

                      <p className="text-sm text-gray-600 mt-3">{program.description}</p>

                      {/* Quick Info */}
                      <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          <span>{program.code}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{program.duration} {program.durationType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{program.totalSeats} seats</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatCurrency(program.totalFee)}/year</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedProgram(expandedProgram === program.id ? null : program.id)}
                      className="min-h-[44px] shrink-0 ml-4"
                    >
                      {expandedProgram === program.id ? "Less" : "Details"}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {expandedProgram === program.id && (
                    <div className="mt-6 pt-6 border-t space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Eligibility */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Eligibility</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Minimum Percentage:</span>
                              <span className="font-medium">{program.minPercentage}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Required Subjects:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {program.requiredSubjects.map((subject) => (
                                  <Badge key={subject} variant="outline" className="text-xs">{subject}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fees Breakdown */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Fee Structure (per semester)</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tuition Fee:</span>
                              <span className="font-medium">{formatCurrency(program.tuitionFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hostel Fee:</span>
                              <span className="font-medium">{formatCurrency(program.hostelFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Other Fees:</span>
                              <span className="font-medium">{formatCurrency(program.otherFees)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t font-semibold">
                              <span>Total:</span>
                              <span className="text-orange-600">{formatCurrency(program.totalFee)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Career Prospects */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Career Prospects</h4>
                        <div className="flex flex-wrap gap-2">
                          {program.careerProspects.map((prospect) => (
                            <Badge key={prospect} variant="secondary">{prospect}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button size="sm" className="min-h-[44px]" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
                          <FileText className="w-4 h-4 mr-2" />
                          Apply Now
                        </Button>
                        <Button size="sm" variant="outline" className="min-h-[44px]">
                          <Star className="w-4 h-4 mr-2" />
                          Save Program
                        </Button>
                        <Button size="sm" variant="ghost" className="min-h-[44px]">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          View College
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredPrograms.length === 0 && (
              <Card className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No programs found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              </Card>
            )}
          </div>
        )}

        {/* Colleges Tab */}
        {activeTab === "colleges" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColleges.map((college) => (
              <Card
                key={college.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="group-hover:text-orange-600 transition-colors">
                          {college.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{college.code}</Badge>
                        <Badge
                          className={college.type === "constituent" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}
                        >
                          {college.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {college.location}, {college.dzongkhag}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Facilities */}
                  <div className="flex flex-wrap gap-2">
                    {college.hasHostel && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Hostel
                      </Badge>
                    )}
                    {college.hasLab && (
                      <Badge variant="outline" className="text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Lab
                      </Badge>
                    )}
                    {college.hasSports && (
                      <Badge variant="outline" className="text-xs">
                        Sports
                      </Badge>
                    )}
                  </div>

                  {/* Programs Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{college.programs} programs</span>
                    <Link href={`?college=${college.id}`} className="text-orange-600 hover:underline flex items-center">
                      View Programs
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>

                  <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Scholarships Tab */}
        {activeTab === "scholarships" && (
          <div className="grid md:grid-cols-2 gap-6">
            {scholarships.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No scholarships found</p>
                </CardContent>
              </Card>
            ) : (
              scholarships.map((scholarship) => (
              <Card key={scholarship.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{scholarship.name}</CardTitle>
                      <CardDescription>{scholarship.provider}</CardDescription>
                    </div>
                    <Badge className={scholarship.type === "merit" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                      {scholarship.type === "merit" ? "Merit-Based" : "Need-Based"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{scholarship.description}</p>

                  {/* Coverage */}
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coverage</span>
                      <span className="font-semibold text-orange-600">{scholarship.coveragePercentage}%</span>
                    </div>
                  </div>

                  {/* Eligibility */}
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-gray-900">Eligibility:</p>
                    {scholarship.minPercentage && (
                      <p className="text-gray-600">• Minimum {scholarship.minPercentage}% in Class 12</p>
                    )}
                    {scholarship.annualIncomeLimit && (
                      <p className="text-gray-600">• Annual family income below Nu. {scholarship.annualIncomeLimit.toLocaleString()}</p>
                    )}
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Deadline: {new Date(scholarship.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>
                    </div>
                    <Button size="sm" variant="outline" className="min-h-[44px]">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        )}

        {/* Application Tab */}
        {activeTab === "application" && (
          <div className="max-w-3xl mx-auto">
            {applicationStatus.hasApplication ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Application</CardTitle>
                  <CardDescription>Application Number: RUB-2025-12345</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Steps */}
                  <div className="space-y-4">
                    {[
                      { label: "Application Submitted", status: "completed", date: "2025-02-01" },
                      { label: "Document Verification", status: "completed", date: "2025-02-05" },
                      { label: "Merit List", status: "in_progress", date: null },
                      { label: "Counseling", status: "upcoming", date: null },
                      { label: "Admission", status: "upcoming", date: null },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center shrink-0
                          ${step.status === "completed" ? "bg-green-500" : step.status === "in_progress" ? "bg-orange-500" : "bg-gray-200"}
                        `}>
                          {step.status === "completed" ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <div className="w-3 h-3 bg-current rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{step.label}</p>
                          {step.date && <p className="text-sm text-gray-500">{step.date}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preferences */}
                  <div>
                    <h3 className="font-semibold mb-3">Program Preferences</h3>
                    <div className="space-y-2">
                      {[
                        { rank: 1, program: "B.E Computer Science", college: "CST" },
                        { rank: 2, program: "B.E Civil Engineering", college: "CST" },
                      ].map((pref) => (
                        <div key={pref.rank} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold">
                            {pref.rank}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{pref.program}</p>
                            <p className="text-sm text-gray-600">{pref.college}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="font-semibold mb-3">Documents</h3>
                    <div className="space-y-2">
                      {[
                        { name: "Class 12 Marksheet", status: "verified" },
                        { name: "Class 10 Certificate", status: "verified" },
                        { name: "Citizen ID Copy", status: "verified" },
                        { name: "Recent Photograph", status: "pending" },
                      ].map((doc) => (
                        <div key={doc.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {doc.status === "verified" ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-orange-600" />
                            )}
                            <span>{doc.name}</span>
                          </div>
                          <Badge className={doc.status === "verified" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Application</h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Begin your journey to higher education. Apply to RUB colleges and programs through our centralized application system.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="min-h-[48px]" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
                      <FileText className="w-5 h-5 mr-2" />
                      Start New Application
                    </Button>
                    <Link href="/student/scholarships">
                      <Button size="lg" variant="outline" className="min-h-[48px]">
                        <Award className="w-5 h-5 mr-2" />
                        View Scholarships
                      </Button>
                    </Link>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="mt-12 text-left max-w-md mx-auto">
                    <h3 className="font-semibold text-gray-900 mb-4">Required Documents</h3>
                    <ul className="space-y-3">
                      {[
                        "Class 12 Marksheet/Pass Certificate",
                        "Class 10 Certificate",
                        "Citizen ID (CID) Copy",
                        "Recent Passport Size Photo",
                        "Character Certificate from School",
                        "Relevant Certificates (if any)",
                      ].map((req, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </>
      )}
    </div>
  );
}

export default StudentRUBPage;
