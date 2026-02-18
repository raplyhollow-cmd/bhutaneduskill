/**
 * School Admin BCSE Registration Page
 * Manage student registrations for BCSE examinations
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface BCSERegistration {
  id: string;
  studentId: string;
  studentName: string;
  cidNumber: string;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  academicYear: string;
  registrationStatus: string;
  bcseRegistrationNumber: string | null;
  bcseIndexNumber: string | null;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    isCompulsory: boolean;
  }>;
  submittedDate: string;
  feeStatus: string;
}

export default function SchoolAdminBCSEPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<BCSERegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    examType: "BCSE_12",
    examYear: new Date().getFullYear().toString(),
    status: "",
  });
  const hasFetched = useRef(false);

  // Fetch registrations
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        examType: filter.examType,
        examYear: filter.examYear,
      });

      if (filter.status) {
        params.set("status", filter.status);
      }

      const response = await fetch(`/api/school-admin/bcse-registrations?${params}`);
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.data.registrations);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      submitted: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      approved: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getExamTypeLabel = (type: string) => {
    return type === "BCSE_10" ? "Class 10 BCSE" : "Class 12 BCSE";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BCSE Registrations</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage student registrations for Bhutan Council of School Examinations
              </p>
            </div>
            <button
              onClick={() => router.push("/school-admin/students")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Register Students
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select
                value={filter.examType}
                onChange={(e) => setFilter({ ...filter, examType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="confirmed">Confirmed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchRegistrations}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">{registrations.length}</div>
            <div className="text-sm text-gray-500">Total Registrations</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">
              {registrations.filter((r) => r.registrationStatus === "confirmed").length}
            </div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">
              {registrations.filter((r) => r.registrationStatus === "submitted").length}
            </div>
            <div className="text-sm text-gray-500">Submitted</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {registrations.filter((r) => r.feeStatus === "paid").length}
            </div>
            <div className="text-sm text-gray-500">Fees Paid</div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No registrations found for the selected filters.</p>
              <button
                onClick={() => router.push("/school-admin/students")}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Register Students
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CID Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Index Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{registration.studentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.cidNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getExamTypeLabel(registration.examType)} ({registration.examYear})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(registration.registrationStatus)}`}>
                          {registration.registrationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {registration.bcseIndexNumber || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          registration.feeStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {registration.feeStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/school-admin/students/${registration.studentId}`)}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* BCSE Info Box */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">About BCSE Registration</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Register Class 10 and Class 12 students for BCSE examinations</li>
            <li>• Track registration status from pending to confirmed</li>
            <li>• Manage fee payments and generate index numbers</li>
            <li>• Import BCSE results when announced</li>
            <li>• Check scholarship eligibility based on results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
