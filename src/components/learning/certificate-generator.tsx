/**
 * CERTIFICATE GENERATOR
 * Generate completion certificates for learning modules
 */
"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Award } from "lucide-react";

export interface CertificateData {
  studentName: string;
  studentId: string;

  moduleTitle: string;
  moduleName: string;
  completionDate: string;
  certificateNumber: string;

  instructorName?: string;
  schoolName?: string;
  schoolLogo?: string;

  grade?: string;
  score?: number;
}

interface CertificateGeneratorProps {
  data: CertificateData;
  onDownload?: () => void;
  showActions?: boolean;
}

export function CertificateGenerator({
  data,
  onDownload,
  showActions = true,
}: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // In production, this would generate a PDF
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      )}

      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="bg-white max-w-4xl mx-auto shadow-2xl aspect-[1.414/1] relative overflow-hidden border-8 border-double border-amber-600"
      >
        {/* Decorative Border Pattern */}
        <div className="absolute inset-0 border-4 border-amber-400 m-4 pointer-events-none" />

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-12 text-center">
          {/* School Logo */}
          {data.schoolLogo && (
            <img
              src={data.schoolLogo}
              alt={`${data.schoolName || 'School'} logo`}
              className="w-20 h-20 mb-4"
            />
          )}

          {/* Header */}
          <div className="text-amber-700 mb-4">
            <Award className="w-16 h-16 mx-auto mb-2" />
            <p className="text-xl tracking-widest uppercase">Certificate of Completion</p>
          </div>

          {/* School Name */}
          {data.schoolName && (
            <p className="text-lg text-gray-600 mb-2">{data.schoolName}</p>
          )}

          {/* Presented To */}
          <p className="text-gray-500 mt-6 mb-2">This is to certify that</p>

          {/* Student Name */}
          <h1 className="text-5xl font-bold text-gray-800 mb-2 font-serif">
            {data.studentName}
          </h1>

          {/* Student ID */}
          <p className="text-sm text-gray-500 mb-6">ID: {data.studentId}</p>

          {/* Has Successfully Completed */}
          <p className="text-gray-600 mb-2">has successfully completed</p>

          {/* Module Title */}
          <h2 className="text-3xl font-semibold text-amber-700 mb-2">
            {data.moduleTitle}
          </h2>

          {/* Module Name/Description */}
          <p className="text-lg text-gray-600 mb-8">{data.moduleName}</p>

          {/* Score/Grade */}
          {data.score !== undefined && (
            <div className="flex items-center gap-4 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{data.score}%</p>
                <p className="text-sm text-gray-500">Score</p>
              </div>
              {data.grade && (
                <>
                  <div className="w-px h-12 bg-gray-300" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">{data.grade}</p>
                    <p className="text-sm text-gray-500">Grade</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Certificate Number */}
          <p className="text-sm text-gray-400 mb-8">
            Certificate No: {data.certificateNumber}
          </p>

          {/* Footer - Date and Signatures */}
          <div className="flex justify-between w-full max-w-2xl mt-auto">
            <div className="text-center">
              <p className="text-sm text-gray-500">Date of Completion</p>
              <p className="font-semibold text-gray-700">
                {new Date(data.completionDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="text-center">
              <div className="border-t border-gray-400 pt-1 mt-16 w-40">
                <p className="text-sm text-gray-500">Instructor Signature</p>
                <p className="font-semibold text-gray-700">
                  {data.instructorName || "Instructor"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          Issued by {data.schoolName || "Career Guidance Platform"}
        </div>
      </div>
    </div>
  );
}

// Generate certificate number
export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

// Calculate grade based on score
export function calculateGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}
