/**
 * Platform Admin BCSE Management Page
 * Manage BCSE results, scholarships, and government seat allocation
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface BCSEStats {
  overview: {
    totalStudents: number;
    passedStudents: number;
    passPercentage: number;
  };
  divisions: {
    firstDivision: number;
    secondDivision: number;
    thirdDivision: number;
    failed: number;
  };
  scholarshipEligibility: {
    fullMerit: number;
    partialMerit: number;
    stemExcellence: number;
  };
  examBreakdown: string;
  year: string;
}

interface EligibleStudent {
  id: string;
  studentId: string;
  schoolId: string;
  studentName: string;
  cidNumber: string;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  percentage: number;
  division: string;
  aggregateMarks: number;
  indexNumber: string;
}

export default function AdminBCSEPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "scholarships" | "allocation">("overview");
  const [stats, setStats] = useState<BCSEStats | null>(null);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    examType: "BCSE_12",
    examYear: new Date().getFullYear().toString(),
    minPercentage: "65",
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "stats",
        examType: filter.examType,
        examYear: filter.examYear,
      });

      const response = await fetch(`/api/bcse/scholarships?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch BCSE stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "eligible-students",
        examType: filter.examType,
        examYear: filter.examYear,
        minPercentage: filter.minPercentage,
      });

      const response = await fetch(`/api/bcse/scholarships?${params}`);
      const data = await response.json();

      if (data.success) {
        setEligibleStudents(data.data.students);
      }
    } catch (error) {
      console.error("Failed to fetch eligible students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    if (activeTab === "overview") {
      fetchStats();
    } else if (activeTab === "scholarships") {
      fetchEligibleStudents();
    }
  };

  const handleAllocateSeats = async (studentIds: string[]) => {
    try {
      const response = await fetch("/api/bcse/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "allocate-seats",
          studentIds,
          programName: "Government Scholarship",
          collegeName: "RUB Colleges",
          academicYear: filter.examYear,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`${data.data.message}`);
      }
    } catch (error) {
      console.error("Failed to allocate seats:", error);
      alert("Failed to allocate government seats");
    }
  };

  const getDivisionLabel = (division: string) => {
    if (division.includes("Distinction")) return "First Dist";
    if (division.includes("First")) return "First";
    if (division.includes("Second")) return "Second";
    if (division.includes("Third")) return "Third";
    return "Failed";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BCSE Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage BCSE results, scholarships, and government seat allocation
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab("overview");
                  fetchStats();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab("scholarships");
                  fetchEligibleStudents();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "scholarships"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Scholarship Eligibility
              </button>
              <button
                onClick={() => setActiveTab("allocation")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "allocation"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Seat Allocation
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select
                value={filter.examType}
                onChange={(e) => setFilter({ ...filter, examType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="BCSE_12">Class 12 BCSE</option>
                <option value="BCSE_10">Class 10 BCSE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Year</label>
              <input
                type="number"
                value={filter.examYear}
                onChange={(e) => setFilter({ ...filter, examYear: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 w-32"
              />
            </div>
            {activeTab === "scholarships" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Percentage</label>
                <select
                  value={filter.minPercentage}
                  onChange={(e) => setFilter({ ...filter, minPercentage: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="75">75%+ (Full Merit)</option>
                  <option value="70">70%+ (STEM)</option>
                  <option value="65">65%+ (Partial Merit)</option>
                  <option value="60">60%+</option>
                </select>
              </div>
            )}
            <div>
              <button
                onClick={handleFilterChange}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {activeTab === "overview" && stats && (
          <>
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-3xl font-bold text-pink-600">
                  {stats.overview.totalStudents}
                </div>
                <div className="text-sm text-gray-500 mt-1">Total Students</div>
                <div className="text-xs text-gray-400 mt-2">
                  {stats.examBreakdown} - {stats.year}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-3xl font-bold text-green-600">
                  {stats.overview.passPercentage}%
                </div>
                <div className="text-sm text-gray-500 mt-1">Pass Rate</div>
                <div className="text-xs text-gray-400 mt-2">
                  {stats.overview.passedStudents} of {stats.overview.totalStudents} passed
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.divisions.firstDivision}
                </div>
                <div className="text-sm text-gray-500 mt-1">First Division</div>
                <div className="text-xs text-gray-400 mt-2">
                  {stats.divisions.secondDivision} Second, {stats.divisions.thirdDivision} Third
                </div>
              </div>
            </div>

            {/* Scholarship Eligibility */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scholarship Eligibility</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-emerald-600">
                    {stats.scholarshipEligibility.fullMerit}
                  </div>
                  <div className="text-sm text-gray-600">Full Merit (75%+)</div>
                  <div className="text-xs text-gray-400 mt-1">Tuition + Hostel + Living</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.scholarshipEligibility.partialMerit}
                  </div>
                  <div className="text-sm text-gray-600">Partial Merit (65%+)</div>
                  <div className="text-xs text-gray-400 mt-1">Tuition + Books</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.scholarshipEligibility.stemExcellence}
                  </div>
                  <div className="text-sm text-gray-600">STEM Excellence (70%+)</div>
                  <div className="text-xs text-gray-400 mt-1">Full STEM scholarship</div>
                </div>
              </div>
            </div>

            {/* Division Breakdown Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Division Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">First Division</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${stats.overview.totalStudents > 0
                          ? (stats.divisions.firstDivision / stats.overview.totalStudents) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {stats.divisions.firstDivision}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">Second Division</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: `${stats.overview.totalStudents > 0
                          ? (stats.divisions.secondDivision / stats.overview.totalStudents) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {stats.divisions.secondDivision}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">Third Division</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-yellow-500 h-full"
                      style={{
                        width: `${stats.overview.totalStudents > 0
                          ? (stats.divisions.thirdDivision / stats.overview.totalStudents) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {stats.divisions.thirdDivision}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">Failed</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-red-500 h-full"
                      style={{
                        width: `${stats.overview.totalStudents > 0
                          ? (stats.divisions.failed / stats.overview.totalStudents) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {stats.divisions.failed}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "scholarships" && (
          <>
            {/* Eligible Students */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Eligible Students ({eligibleStudents.length})
                  </h3>
                  <button
                    onClick={() => handleAllocateSeats(eligibleStudents.map((s) => s.studentId))}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm"
                    disabled={eligibleStudents.length === 0}
                  >
                    Allocate All Seats
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading eligible students...</div>
              ) : eligibleStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No students found matching the criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          CID Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Division
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Index Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {eligibleStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-xs text-gray-500">{student.examType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {student.cidNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.percentage.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              student.division.includes("First")
                                ? "bg-emerald-100 text-emerald-800"
                                : student.division.includes("Second")
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {getDivisionLabel(student.division)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {student.indexNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => router.push(`/admin/users?userId=${student.studentId}`)}
                              className="text-pink-600 hover:text-pink-800 font-medium"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "allocation" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Government Seat Allocation</h3>
            <p className="text-gray-600 mb-6">
              Allocate government scholarship seats to eligible students based on BCSE results.
              This interface allows bulk allocation to RUB colleges and programs.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">Select eligible students from the Scholarship Eligibility tab to allocate seats.</p>
              <button
                onClick={() => setActiveTab("scholarships")}
                className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
              >
                Go to Scholarship Eligibility
              </button>
            </div>
          </div>
        )}

        {/* BCSE Info Box */}
        <div className="mt-6 bg-pink-50 border border-pink-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-pink-900 mb-2">BCSE Scholarship Information</h3>
          <ul className="text-sm text-pink-800 space-y-1">
            <li>• <strong>Full Merit Scholarship:</strong> 75%+ in any field, full coverage</li>
            <li>• <strong>Partial Merit Scholarship:</strong> 65-74%, tuition + books only</li>
            <li>• <strong>STEM Excellence:</strong> 70%+ with strong Math/Science, priority for engineering/medicine</li>
            <li>• <strong>Need-Based Scholarship:</strong> 55%+ with family income &lt; Nu. 300,000</li>
            <li>• Seats are allocated based on merit ranking and government quotas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
