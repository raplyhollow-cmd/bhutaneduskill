/**
 * COUNSELOR - STUDENT PROFILE VIEW
 *
 * Features:
 * - Comprehensive student profile view
 * - Assessment results and career matches
 * - Academic performance tracking
 * - Session history and notes
 * - Career planning progress
 * - Direct actions for counselor
 */

import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Target,
  TrendingUp,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  BookOpen,
  Brain,
  Sparkles,
  MessageSquare,
  Video,
  Download,
  Edit,
  Briefcase,
  Award,
  Plus,
} from "lucide-react";
import Link from "next/link";

// Mock student data - in production, this would come from the database
const getMockStudent = (id: string) => {
  const students: Record<string, {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    grade: number;
    section: string;
    school: string;
    address: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    counselor: string;
    enrollmentDate: string;
    gpa: number;
    attendanceRate: number;
    assessmentStatus: string;
    assessmentsTaken: number;
    topCareer: string;
    careerMatch: number;
    planStatus: string;
    riasecResults: {
      realistic: number;
      investigative: number;
      artistic: number;
      social: number;
      enterprising: number;
      conventional: number;
      code: string;
    };
    mbtiResult: string;
    workValues: string[];
    careerMatches: Array<{
      career: string;
      match: number;
      category: string;
    }>;
    academicStrengths: string[];
    areasForImprovement: string[];
    sessionHistory: Array<{
      date: string;
      type: string;
      topic: string;
      notes: string;
    }>;
    notes: Array<{
      date: string;
      content: string;
      author: string;
    }>;
    nextSession: string;
  }> = {
    STU001: {
      id: "STU001",
      firstName: "Tashi",
      lastName: "Dorji",
      email: "tashi.dorji@school.edu.bt",
      phone: "+975 17 12 34 56",
      dateOfBirth: "2006-05-15",
      grade: 12,
      section: "A",
      school: "Thimphu Higher Secondary School",
      address: "Thimphu, Babesa",
      guardianName: "Karma Dorji",
      guardianPhone: "+975 17 23 45 67",
      guardianEmail: "karma.dorji@mail.com",
      counselor: "Dr. Karma Wangchuk",
      enrollmentDate: "2021-03-15",
      gpa: 3.8,
      attendanceRate: 94,
      assessmentStatus: "completed",
      assessmentsTaken: 4,
      topCareer: "Software Engineer",
      careerMatch: 92,
      planStatus: "in_progress",
      riasecResults: {
        realistic: 78,
        investigative: 92,
        artistic: 65,
        social: 71,
        enterprising: 58,
        conventional: 69,
        code: "IAR",
      },
      mbtiResult: "INTJ - The Architect",
      workValues: ["Autonomy", "Innovation", "Achievement"],
      careerMatches: [
        { career: "Software Engineer", match: 92, category: "Technology" },
        { career: "Data Scientist", match: 88, category: "Technology" },
        { career: "Civil Engineer", match: 79, category: "Engineering" },
        { career: "Research Scientist", match: 76, category: "Science" },
        { career: "Systems Analyst", match: 74, category: "Technology" },
      ],
      academicStrengths: ["Mathematics", "Physics", "Computer Science"],
      areasForImprovement: ["Communication", "Team Leadership"],
      sessionHistory: [
        { date: "2024-02-08", type: "One-on-One", topic: "Career Planning Review", notes: "Discussed university options for Computer Science. Student expressed strong interest in RUB programs." },
        { date: "2024-01-25", type: "Assessment Review", topic: "RIASEC Results", notes: "Reviewed assessment results. High investigative score confirms aptitude for research and analysis." },
        { date: "2024-01-10", type: "Initial Consultation", topic: "Introduction", notes: "First meeting with student. Established rapport and discussed career counseling services." },
      ],
      notes: [
        { date: "2024-02-10", content: "Student is showing great progress in career exploration. Recommend focusing on RUB College of Science and Technology.", author: "Dr. Karma Wangchuk" },
        { date: "2024-01-28", content: "Parents expressed concern about study abroad options. Will provide information during next session.", author: "Dr. Karma Wangchuk" },
      ],
      nextSession: "2024-02-20",
    },
  };
  return students[id] || null;
};

export default async function CounselorStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = getMockStudent(id);

  if (!student) {
    notFound();
  }

  const calculateAge = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/counselor/students">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
            <p className="text-gray-500">Student ID: {student.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Profile
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/counselor/students/${student.id}/edit`}>
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </Button>
          <Button className="gap-2" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }} asChild>
            <Link href={`/counselor/schedule?student=${student.id}`}>
              <Video className="w-4 h-4" />
              Schedule Session
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{student.assessmentsTaken}</p>
                <p className="text-xs text-gray-500">Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{student.careerMatch}%</p>
                <p className="text-xs text-gray-500">Top Match</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{student.gpa}</p>
                <p className="text-xs text-gray-500">GPA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{student.attendanceRate}%</p>
                <p className="text-xs text-gray-500">Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <Video className="w-5 h-5" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{student.sessionHistory?.length || 0}</p>
                <p className="text-xs text-gray-500">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-gray-500">Grade {student.grade} - Section {student.section}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{student.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{student.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {new Date(student.dateOfBirth).toLocaleDateString()} ({calculateAge(student.dateOfBirth)} years)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{student.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* School Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">School</p>
                <p className="font-medium text-gray-900">{student.school}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Grade & Section</p>
                <p className="font-medium text-gray-900">Grade {student.grade} - Section {student.section}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Counselor</p>
                <p className="font-medium text-gray-900">{student.counselor}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Enrollment Date</p>
                <p className="font-medium text-gray-900">{new Date(student.enrollmentDate).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Guardian Name</p>
                <p className="font-medium text-gray-900">{student.guardianName}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{student.guardianPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{student.guardianEmail}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Career & Academic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assessment Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Assessment Results
                  </CardTitle>
                  <CardDescription>Career and personality assessment outcomes</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/assessment`}>View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RIASEC Results */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">RIASEC Holland Code</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {Object.entries(student.riasecResults).filter(([key]) => key !== 'code').map(([trait, score]) => (
                    <div key={trait} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold" style={{ color: 'rgb(147 51 234)' }}>{String(score)}%</p>
                      <p className="text-xs text-gray-600 capitalize">{trait}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                    Holland Code: {student.riasecResults.code}
                  </Badge>
                </div>
              </div>

              {/* MBTI */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">MBTI Personality Type</p>
                    <p className="font-semibold text-gray-900">{student.mbtiResult}</p>
                  </div>
                </div>
              </div>

              {/* Work Values */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Work Values</h3>
                <div className="flex flex-wrap gap-2">
                  {student.workValues.map((value: string) => (
                    <Badge key={value} className="bg-green-100 text-green-700 border-green-200" variant="outline">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Matches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Career Matches
                  </CardTitle>
                  <CardDescription>Recommended careers based on assessment results</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/counselor/plans?student=${student.id}`}>Manage Plan</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.careerMatches.map((match: { career: string; match: number; category: string }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{match.career}</p>
                        <p className="text-sm text-gray-500">{match.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: 'rgb(147 51 234)' }}>{match.match}%</p>
                        <p className="text-xs text-gray-500">Match</p>
                      </div>
                      {index === 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                          Top Match
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Academic Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Academic Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Strengths</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {student.academicStrengths.map((strength: string) => (
                      <Badge key={strength} className="bg-green-100 text-green-700 border-green-200" variant="outline">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Areas for Improvement</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {student.areasForImprovement.map((area: string) => (
                      <Badge key={area} className="bg-orange-100 text-orange-700 border-orange-200" variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Session History
                  </CardTitle>
                  <CardDescription>Past counseling sessions with this student</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href={`/counselor/schedule?student=${student.id}`}>
                    <Plus className="w-4 h-4" />
                    New Session
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {student.sessionHistory.map((session: { date: string; type: string; topic: string; notes: string }, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{session.topic}</p>
                        <p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                        {session.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{session.notes}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Counselor Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Counselor Notes
                  </CardTitle>
                  <CardDescription>Private notes about this student</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.notes.map((note: { date: string; content: string; author: string }, index: number) => (
                  <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm text-gray-900">{note.content}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{note.author}</span>
                      <span>•</span>
                      <span>{new Date(note.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Session */}
          {student.nextSession && (
            <Card className="border-purple-200" style={{ background: 'linear-gradient(to right, rgb(168 85 247 / 0.1), rgb(147 51 234 / 0.1))' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Scheduled Session</p>
                      <p className="text-lg font-semibold text-gray-900">{new Date(student.nextSession).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link href={`/counselor/schedule?session=${student.id}`}>
                      <Edit className="w-4 h-4" />
                      Reschedule
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
