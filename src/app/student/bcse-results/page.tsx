/**
 * Student BCSE Results Page
 * View BCSE examination results and scholarship eligibility
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface BCSEResult {
  id: string;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  academicYear: string;
  indexNumber: string;
  division: string;
  percentage: number;
  aggregateMarks: number;
  totalMarks: number;
  passed: boolean;
  passedSubjects: number;
  failedSubjects: number;
  subjectResults: Array<{
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    grade: string;
    remarks: string;
  }>;
  resultDeclaredDate: string;
}

interface ScholarshipEligibility {
  scholarshipCode: string;
  scholarshipName: string;
  provider: string;
  eligible: boolean;
  eligibilityScore: number;
  requirementsMet: string[];
  requirementsNotMet: string[];
  recommendedPrograms: Array<{
    field: string;
    programs: string[];
  }>;
}

export default function StudentBCSEResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<BCSEResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<BCSEResult | null>(null);
  const [eligibility, setEligibility] = useState<ScholarshipEligibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"results" | "scholarships" | "colleges">("results");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student/bcse-results");
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        if (data.data.results.length > 0) {
          setSelectedResult(data.data.results[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScholarships = async () => {
    if (!selectedResult) return;

    try {
      const response = await fetch("/api/student/bcse-scholarships?includeColleges=true&includeCareers=true");
      const data = await response.json();

      if (data.success) {
        setEligibility(data.data.scholarshipEligibility);
      }
    } catch (error) {
      console.error("Failed to fetch scholarships:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "scholarships" && eligibility.length === 0) {
      fetchScholarships();
    }
  }, [activeTab]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A") || grade === "A+") return "text-green-600";
    if (grade.startsWith("B")) return "text-blue-600";
    if (grade.startsWith("C")) return "text-yellow-600";
    return "text-red-600";
  };

  const getDivisionColor = (division: string) => {
    if (division.toLowerCase().includes("first")) return "text-green-600";
    if (division.toLowerCase().includes("second")) return "text-blue-600";
    if (division.toLowerCase().includes("third")) return "text-yellow-600";
    return "text-red-600";
  };

  const eligibleScholarships = eligibility.filter((s) => s.eligible);
  const partialScholarships = eligibility.filter(
    (s) => !s.eligible && s.eligibilityScore >= 50
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">BCSE Results</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your Bhutan Council of School Examinations results and scholarship eligibility
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900">No Results Found</h3>
            <p className="text-gray-500 mt-2">
              Your BCSE results will appear here once they are published by your school.
            </p>
          </div>
        ) : (
          <>
            {/* Result Selector */}
            {results.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
                <div className="flex flex-wrap gap-2">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className={`px-4 py-2 rounded-lg transition ${
                        selectedResult?.id === result.id
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {result.examType === "BCSE_10" ? "Class 10" : "Class 12"} - {result.examYear}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result Summary Card */}
            {selectedResult && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">{selectedResult.examType === "BCSE_10" ? "Class 10" : "Class 12"} BCSE Examination</div>
                      <div className="text-3xl font-bold mt-1">{selectedResult.division}</div>
                      <div className="text-sm opacity-90 mt-1">{selectedResult.academicYear}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold">{(selectedResult.percentage / 100).toFixed(2)}%</div>
                      <div className="text-sm opacity-90 mt-1">{selectedResult.aggregateMarks}/{selectedResult.totalMarks}</div>
                    </div>
                  </div>
                  {selectedResult.passed ? (
                    <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm">
                      <span className="mr-2">✓</span> Passed with {selectedResult.passedSubjects} subjects
                    </div>
                  ) : (
                    <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm">
                      <span className="mr-2">✗</span> Failed - {selectedResult.failedSubjects} subjects to clear
                    </div>
                  )}
                </div>

                {/* Subject Results */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Results</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Marks</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedResult.subjectResults.map((subject, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium text-gray-900">{subject.subjectName}</td>
                            <td className="px-4 py-3 text-center text-gray-700">
                              {subject.marksObtained}/{subject.totalMarks}
                            </td>
                            <td className={`px-4 py-3 text-center font-semibold ${getGradeColor(subject.grade)}`}>
                              {subject.grade}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{subject.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("results")}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === "results"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Results
              </button>
              <button
                onClick={() => setActiveTab("scholarships")}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === "scholarships"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Scholarships
                {eligibleScholarships.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    {eligibleScholarships.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("colleges")}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === "colleges"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                RUB Colleges
              </button>
            </div>

            {/* Scholarship Tab */}
            {activeTab === "scholarships" && (
              <div className="space-y-6">
                {eligibleScholarships.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-4">✓ Eligible Scholarships</h3>
                    <div className="grid gap-4">
                      {eligibleScholarships.map((scholarship) => (
                        <div key={scholarship.scholarshipCode} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{scholarship.scholarshipName}</h4>
                              <p className="text-sm text-gray-500">{scholarship.provider}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                              {scholarship.eligibilityScore}% Match
                            </span>
                          </div>
                          <div className="mt-4">
                            <div className="text-sm text-gray-600">Requirements met:</div>
                            <ul className="mt-2 space-y-1">
                              {scholarship.requirementsMet.map((req, i) => (
                                <li key={i} className="text-sm text-gray-700">✓ {req}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {partialScholarships.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-700 mb-4">⚠ Partially Eligible</h3>
                    <div className="grid gap-4">
                      {partialScholarships.map((scholarship) => (
                        <div key={scholarship.scholarshipCode} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{scholarship.scholarshipName}</h4>
                              <p className="text-sm text-gray-500">{scholarship.provider}</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                              {scholarship.eligibilityScore}% Match
                            </span>
                          </div>
                          <div className="mt-4">
                            <div className="text-sm text-red-600">Missing requirements:</div>
                            <ul className="mt-2 space-y-1">
                              {scholarship.requirementsNotMet.map((req, i) => (
                                <li key={i} className="text-sm text-gray-700">✗ {req}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eligibleScholarships.length === 0 && partialScholarships.length === 0 && (
                  <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-500">Loading scholarship information...</p>
                  </div>
                )}
              </div>
            )}

            {/* Colleges Tab */}
            {activeTab === "colleges" && selectedResult && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recommended RUB Colleges
                </h3>
                <p className="text-gray-600 mb-4">
                  Based on your BCSE performance, here are colleges and programs that match your profile:
                </p>
                <div className="grid gap-4">
                  {[
                    { name: "College of Science and Technology", programs: ["B.E. Civil", "B.E. Electrical", "B.E. IT"], match: 85 },
                    { name: "Sherubtse College", programs: ["B.Sc Physics", "B.Sc Chemistry", "B.A English"], match: 78 },
                    { name: "Royal Thimphu College", programs: ["BBA", "B.Com", "B.A Economics"], match: 72 },
                    { name: "Gedu College of Business Studies", programs: ["BBA", "B.Com"], match: 70 },
                  ].map((college) => (
                    <div key={college.name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{college.name}</h4>
                        <span className="text-sm font-medium text-purple-600">{college.match}% match</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {college.programs.map((program) => (
                          <span key={program} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {program}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
