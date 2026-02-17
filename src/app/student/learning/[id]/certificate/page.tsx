"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT CERTIFICATE PAGE
 * View and download completion certificate for a learning module
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  ArrowLeft,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  CertificateGenerator,
  generateCertificateNumber,
  calculateGrade,
  type CertificateData,
} from "@/components/learning/certificate-generator";

// Types
interface ModuleProgress {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  tutorName: string;
  lessonsCount: number;
  completedLessons: number;
  progress: number;
  enrollmentDate: string;
  completionDate: string | null;
  score: number | null;
  grade: string | null;
  certificateNumber: string | null;
  isEligibleForCertificate: boolean;
}

// Mock module progress data
const mockModuleProgress: ModuleProgress = {
  id: "mod1",
  title: "Introduction to Algebra",
  description: "Learn the fundamentals of algebra including equations, functions, and graphs",
  subject: "Mathematics",
  category: "Algebra",
  difficulty: "beginner",
  estimatedHours: 10,
  tutorName: "Mrs. Dorji",
  lessonsCount: 12,
  completedLessons: 12,
  progress: 100,
  enrollmentDate: "2025-01-15T10:00:00",
  completionDate: "2025-02-10T14:30:00",
  score: 92,
  grade: "A",
  certificateNumber: null, // Will be generated
  isEligibleForCertificate: true,
};

export default function StudentCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);

  useEffect(() => {
    // In production, fetch from API
    // fetch(`/api/student/learning/${params.id}/certificate`)
    //   .then(res => res.json())
    //   .then(data => {
    //     setModuleProgress(data);
    //     setCertificateData({
    //       studentName: data.studentName,
    //       studentId: data.studentId,
    //       moduleTitle: data.moduleTitle,
    //       moduleName: data.moduleName,
    //       completionDate: data.completionDate,
    //       certificateNumber: data.certificateNumber,
    //       instructorName: data.instructorName,
    //       schoolName: data.schoolName,
    //       score: data.score,
    //       grade: data.grade,
    //     });
    //   });

    // Simulate API call
    setTimeout(() => {
      setModuleProgress(mockModuleProgress);
      // Generate certificate data
      const certNumber = mockModuleProgress.certificateNumber || generateCertificateNumber();
      setCertificateData({
        studentName: "Tashi Wangmo",
        studentId: "STU-2024-001",
        moduleTitle: mockModuleProgress.title,
        moduleName: mockModuleProgress.description,
        completionDate: mockModuleProgress.completionDate || new Date().toISOString(),
        certificateNumber: certNumber,
        instructorName: mockModuleProgress.tutorName,
        schoolName: "Yangchenphug Higher Secondary School",
        score: mockModuleProgress.score || undefined,
        grade: mockModuleProgress.grade || undefined,
      });
      setLoading(false);
    }, 500);
  }, [params.id]);

  const handleDownload = () => {
    // In production, generate and download PDF
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate: ${certificateData?.moduleTitle}`,
          text: `I completed ${certificateData?.moduleTitle} with a score of ${certificateData?.score}%!`,
          url: window.location.href,
        });
      } catch (err) {
        logger.debug("Share canceled");
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="student" userName="Student" title="Certificate" />
        <div className="lg:ml-64 p-6">
          <div className="flex items-center justify-center h-64">
            <div
              className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"
              style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!moduleProgress || !certificateData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="student" userName="Student" title="Certificate" />
        <div className="lg:ml-64 p-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Certificate Not Available</h2>
              <p className="text-muted-foreground mb-4">
                The certificate could not be found or you haven't completed this module yet.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="Certificate" />
      <div className="lg:ml-64 p-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learning
        </Button>

        {/* Module Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{moduleProgress.title}</h1>
                  <Badge
                    className="bg-green-100 text-green-700"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
                <p className="text-muted-foreground">{moduleProgress.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <Badge variant="outline">{moduleProgress.subject}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {moduleProgress.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Completion Stats */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
            >
              <div className="grid md:grid-cols-4 gap-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-orange-100 text-sm">Status</p>
                    <p className="font-semibold">Completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-orange-100 text-sm">Final Score</p>
                    <p className="font-semibold">{moduleProgress.score}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-orange-100 text-sm">Time Spent</p>
                    <p className="font-semibold">{moduleProgress.estimatedHours} hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-orange-100 text-sm">Completed</p>
                    <p className="font-semibold">
                      {moduleProgress.completionDate
                        ? new Date(moduleProgress.completionDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-muted-foreground">Instructor</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {moduleProgress.tutorName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lessons Completed</p>
                <p className="font-medium">
                  {moduleProgress.completedLessons} / {moduleProgress.lessonsCount}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Grade Achieved</p>
                <p className="font-medium text-green-600">{moduleProgress.grade}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Your Certificate
                </CardTitle>
                <CardDescription>
                  Official certificate of completion for {moduleProgress.title}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CertificateGenerator data={certificateData} showActions={false} />
          </CardContent>
        </Card>

        {/* What's Next - Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Recommended modules based on your completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
                  >
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Advanced Algebra</p>
                    <p className="text-sm text-muted-foreground">Next level: Master complex equations</p>
                  </div>
                </div>
                <Button size="sm">Enroll Now</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Geometry Basics</p>
                    <p className="text-sm text-muted-foreground">Complementary skill: Shapes and angles</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Share Your Achievement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Share your certificate with friends, family, or on social media!
                </p>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={copyLink}>
                    Copy Link
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      Share on Facebook
                    </Button>
                    <Button variant="outline" size="sm">
                      Share on Twitter
                    </Button>
                  </div>
                </div>
                <Button className="w-full mt-4" onClick={() => setShowShareModal(false)}>
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
