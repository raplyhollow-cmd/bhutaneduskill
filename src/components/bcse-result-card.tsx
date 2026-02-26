/**
 * BCSE Result Card Component
 * Displays BCSE examination results in a card format
 */

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubjectResult {
  subjectCode: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks: string;
}

interface BCSEResultCardProps {
  studentName: string;
  cidNumber?: string;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  indexNumber: string;
  division: string;
  percentage: number; // Actual percentage (e.g., 78.5)
  aggregateMarks: number;
  totalMarks: number;
  passed: boolean;
  subjectResults: SubjectResult[];
  transcriptUrl?: string;
  certificateUrl?: string;
  showActions?: boolean;
  onViewDetails?: () => void;
  onDownloadCertificate?: () => void;
}

export function BCSEResultCard({
  studentName,
  cidNumber,
  examType,
  examYear,
  indexNumber,
  division,
  percentage,
  aggregateMarks,
  totalMarks,
  passed,
  subjectResults,
  transcriptUrl,
  certificateUrl,
  showActions = true,
  onViewDetails,
  onDownloadCertificate,
}: BCSEResultCardProps) {
  const getDivisionColor = (div: string) => {
    if (div.includes("Distinction")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (div.includes("First")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (div.includes("Second")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (div.includes("Third")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-emerald-600";
    if (grade.startsWith("B")) return "text-blue-600";
    if (grade.startsWith("C")) return "text-yellow-600";
    return "text-red-600";
  };

  const getPassFailColor = (passed: boolean) => {
    return passed ? "text-emerald-600" : "text-red-600";
  };

  const examLabel = examType === "BCSE_10" ? "Class 10 BCSE" : "Class 12 BCSE";

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{studentName}</h3>
          {cidNumber && (
            <p className="text-sm text-gray-500 font-mono mt-1">CID: {cidNumber}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={getDivisionColor(division)}>
            {division}
          </Badge>
          <span className={`text-sm font-medium ${getPassFailColor(passed)}`}>
            {passed ? "Passed" : "Failed"}
          </span>
        </div>
      </div>

      {/* Exam Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Exam</div>
            <div className="font-medium text-gray-900">{examLabel}</div>
          </div>
          <div>
            <div className="text-gray-500">Year</div>
            <div className="font-medium text-gray-900">{examYear}</div>
          </div>
          <div>
            <div className="text-gray-500">Index No.</div>
            <div className="font-medium text-gray-900 font-mono text-xs">{indexNumber}</div>
          </div>
          <div>
            <div className="text-gray-500">Percentage</div>
            <div className={`font-bold text-lg ${percentage >= 75 ? "text-emerald-600" : percentage >= 60 ? "text-blue-600" : "text-yellow-600"}`}>
              {percentage.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Marks */}
      <div className="flex items-center justify-center mb-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-500">Aggregate Marks</div>
          <div className="text-2xl font-bold text-gray-900">
            {aggregateMarks} <span className="text-lg text-gray-400">/ {totalMarks}</span>
          </div>
        </div>
      </div>

      {/* Subject Results */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Subject Results</h4>
        <div className="space-y-2">
          {subjectResults.slice(0, 4).map((subject, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{subject.subjectName}</div>
                <div className="text-xs text-gray-500">{subject.subjectCode}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {subject.marksObtained} / {subject.totalMarks}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((subject.marksObtained / subject.totalMarks) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={`text-lg font-bold ${getGradeColor(subject.grade)}`}>
                  {subject.grade}
                </div>
              </div>
            </div>
          ))}
          {subjectResults.length > 4 && (
            <div className="text-center text-sm text-gray-500 py-2">
              + {subjectResults.length - 4} more subjects
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              View Details
            </button>
          )}
          {certificateUrl && onDownloadCertificate && (
            <button
              onClick={onDownloadCertificate}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
            >
              Download Certificate
            </button>
          )}
          {transcriptUrl && (
            <a
              href={transcriptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium text-center"
            >
              View Transcript
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Compact BCSE Result Card for lists
 */
interface CompactBCSEResultCardProps {
  studentName: string;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  percentage: number;
  division: string;
  passed: boolean;
  indexNumber: string;
  onClick?: () => void;
}

export function CompactBCSEResultCard({
  studentName,
  examType,
  examYear,
  percentage,
  division,
  passed,
  indexNumber,
  onClick,
}: CompactBCSEResultCardProps) {
  const getDivisionBadgeColor = (div: string) => {
    if (div.includes("Distinction")) return "bg-purple-100 text-purple-800";
    if (div.includes("First")) return "bg-emerald-100 text-emerald-800";
    if (div.includes("Second")) return "bg-blue-100 text-blue-800";
    if (div.includes("Third")) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{studentName}</div>
          <div className="text-xs text-gray-500 mt-1">
            {examType === "BCSE_10" ? "Class 10" : "Class 12"} • {examYear}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-lg font-bold ${percentage >= 75 ? "text-emerald-600" : percentage >= 60 ? "text-blue-600" : "text-yellow-600"}`}>
              {percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">{indexNumber}</div>
          </div>
          <Badge className={getDivisionBadgeColor(division)}>
            {division.includes("First") ? "1st" : division.includes("Second") ? "2nd" : division.includes("Third") ? "3rd" : "F"}
          </Badge>
          <div className={`w-2 h-2 rounded-full ${passed ? "bg-emerald-500" : "bg-red-500"}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * BCSE Result Stats Card
 */
interface BCSEResultStatsProps {
  totalStudents: number;
  passedStudents: number;
  passPercentage: number;
  firstDivision: number;
  secondDivision: number;
  thirdDivision: number;
  distinctionCount?: number;
}

export function BCSEResultStatsCard({
  totalStudents,
  passedStudents,
  passPercentage,
  firstDivision,
  secondDivision,
  thirdDivision,
  distinctionCount,
}: BCSEResultStatsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">BCSE Results Summary</h3>

      <div className="space-y-4">
        {/* Pass Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Pass Rate</span>
          <span className="text-lg font-bold text-emerald-600">{passPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${passPercentage}%` }}
          />
        </div>

        <div className="h-px bg-gray-200" />

        {/* Division Breakdown */}
        <div className="space-y-3">
          {distinctionCount !== undefined && distinctionCount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-600">Distinction</span>
              </div>
              <span className="font-medium text-gray-900">{distinctionCount}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">First Division</span>
            </div>
            <span className="font-medium text-gray-900">{firstDivision}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Second Division</span>
            </div>
            <span className="font-medium text-gray-900">{secondDivision}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-600">Third Division</span>
            </div>
            <span className="font-medium text-gray-900">{thirdDivision}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Failed</span>
            </div>
            <span className="font-medium text-gray-900">{totalStudents - passedStudents}</span>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Students</span>
          <span className="text-lg font-bold text-gray-900">{totalStudents}</span>
        </div>
      </div>
    </Card>
  );
}
