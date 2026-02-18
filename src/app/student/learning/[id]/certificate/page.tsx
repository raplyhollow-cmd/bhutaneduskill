"use client";

/**
 * STUDENT CERTIFICATE PAGE
 * View and download completion certificate for a learning module
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import {
  CertificateGenerator,
  type CertificateData,
} from "@/components/learning/certificate-generator";
import { generateCertificatePDF } from "@/lib/pdf/certificate-generator";

// API Response Type
interface CertificateApiResponse {
  success: true;
  data: {
    studentName: string;
    studentId: string;
    moduleId: string;
    moduleTitle: string;
    moduleDescription: string;
    category: string;
    level: string;
    progress: number;
    isCompleted: boolean;
    completedAt: string | null;
    timeSpent: number;
    certificateUrl: string | null;
    certificateNumber: string;
    instructorName?: string;
    schoolName?: string;
    schoolLogo?: string;
    completedLessons: number;
    estimatedHours: number;
    grade: string;
    score: number;
    isEligibleForCertificate: boolean;
  };
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: number;
  isPremium: boolean;
}

export default function StudentCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const [apiData, setApiData] = useState<CertificateApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchCertificateData();
  }, [params.id]);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/student/modules/${params.id}/certificate`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load certificate");
      }

      const result: CertificateApiResponse = await response.json();
      setApiData(result.data);

      // Set certificate data for the generator
      setCertificateData({
        studentName: result.data.studentName,
        studentId: result.data.studentId,
        moduleTitle: result.data.moduleTitle,
        moduleName: result.data.moduleDescription,
        completionDate: result.data.completedAt || new Date().toISOString(),
        certificateNumber: result.data.certificateNumber,
        instructorName: result.data.instructorName,
        schoolName: result.data.schoolName,
        schoolLogo: result.data.schoolLogo,
        score: result.data.score,
        grade: result.data.grade,
      });

      // Fetch recommendations if completed
      if (result.data.isEligibleForCertificate) {
        fetchRecommendations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certificate");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/student/modules/${params.id}/recommendations`);
      if (response.ok) {
        const result = await response.json();
        setRecommendations(result.data || []);
      }
    } catch (err) {
      // Recommendations are optional, don't error
      console.error("Failed to fetch recommendations:", err);
    }
  };

  const handleDownload = async () => {
    if (!certificateData) return;

    setIsDownloading(true);
    try {
      const pdfBlob = await generateCertificatePDF(certificateData);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateData.moduleTitle.replace(/\s+/g, '-')}-${certificateData.studentName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsDownloading(false);
    }
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
        // Share canceled
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Error state
  if (error || !apiData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Certificate Not Available</h2>
          <p className="text-muted-foreground mb-4">
            {error || "The certificate could not be found or you haven't completed this module yet."}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate time spent in hours
  const timeSpentHours = Math.round(apiData.timeSpent / 3600);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Learning
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Certificate of Completion</h1>
        <p className="text-gray-600 mt-1">{apiData.moduleTitle}</p>
      </div>

      {/* Module Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{apiData.moduleTitle}</h1>
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              </div>
              <p className="text-muted-foreground">{apiData.moduleDescription}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <Badge variant="outline">{apiData.category}</Badge>
                <Badge variant="outline" className="capitalize">
                  {apiData.level}
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
                  <p className="text-orange-100 text-sm">Progress</p>
                  <p className="font-semibold">{apiData.progress}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-orange-100 text-sm">Time Spent</p>
                  <p className="font-semibold">{timeSpentHours} hours</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-orange-100 text-sm">Completed</p>
                  <p className="font-semibold">
                    {apiData.completedAt
                      ? new Date(apiData.completedAt).toLocaleDateString()
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
                {apiData.instructorName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Lessons Completed</p>
              <p className="font-medium">{apiData.completedLessons}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Grade Achieved</p>
              <p className="font-medium text-green-600">{apiData.grade}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Your Certificate
              </CardTitle>
              <CardDescription>
                Official certificate of completion for {apiData.moduleTitle}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {certificateData && <CertificateGenerator data={certificateData} showActions={false} />}
        </CardContent>
      </Card>

      {/* What's Next - Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Recommended modules based on your completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
                    >
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{module.title}</p>
                      <p className="text-sm text-muted-foreground">{module.level} • {Math.round(module.duration / 60)}h</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/student/learning/${module.id}`)}
                  >
                    {module.isPremium ? "Enroll Now" : "Start Learning"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
  );
}
