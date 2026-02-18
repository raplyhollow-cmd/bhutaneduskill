/**
 * Student RUB Applications Page
 * Submit and track RUB college applications
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RUBApplication {
  id: string;
  applicationNumber: string;
  applicationYear: number;
  academicYear: string;
  status: string;
  preferences: Array<{
    collegeId: string;
    collegeName: string;
    programId: string;
    programName: string;
    priority: number;
  }>;
  submittedDate: string;
  admittedCollegeId?: string;
  admittedProgramId?: string;
  admittedCollegeName?: string;
  admittedProgramName?: string;
  admissionDate?: string;
}

interface RUBCollege {
  id: string;
  name: string;
  code: string;
  dzongkhag: string;
  location: string;
}

interface RUBProgram {
  id: string;
  name: string;
  code: string;
  level: string;
  field: string;
  duration: number;
  minPercentage?: number;
  collegeId: string;
}

export default function StudentRUBApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RUBApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "new">("list");
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [colleges, setColleges] = useState<RUBCollege[]>([]);
  const [programs, setPrograms] = useState<RUBProgram[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchApplications();
    fetchColleges();
    fetchPrograms();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/student/rub-applications");
      const data = await response.json();

      if (data.success) {
        setApplications(data.data.applications);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await fetch("/api/rub/colleges");
      const data = await response.json();

      if (data.success) {
        setColleges(data.data.colleges);
      }
    } catch (error) {
      console.error("Failed to fetch colleges:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/rub/programs");
      const data = await response.json();

      if (data.success) {
        setPrograms(data.data.programs);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    }
  };

  const handleSubmitApplication = async () => {
    if (selectedPrograms.length === 0) {
      alert("Please select at least one program");
      return;
    }

    setSubmitting(true);

    try {
      // Build preferences with college info
      const preferences = selectedPrograms.map((programId) => {
        const program = programs.find((p) => p.id === programId);
        return {
          collegeId: program?.collegeId,
          programId: program?.id,
        };
      });

      // Get student's BCSE result
      const bcseResponse = await fetch("/api/student/bcse-results");
      const bcseData = await bcseResponse.json();

      let examType = "BCSE_12";
      let examYear = new Date().getFullYear();

      if (bcseData.success && bcseData.data.results.length > 0) {
        const latestResult = bcseData.data.results[0];
        examType = latestResult.examType;
        examYear = latestResult.examYear;
      }

      const response = await fetch("/api/student/rub-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences,
          examType,
          examYear,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Application submitted successfully!");
        setSelectedPrograms([]);
        setView("list");
        fetchApplications();
      } else {
        alert(data.error || "Failed to submit application");
      }
    } catch (error) {
      console.error("Failed to submit application:", error);
      alert("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      under_review: "bg-yellow-100 text-yellow-700",
      document_verified: "bg-purple-100 text-purple-700",
      selected: "bg-green-100 text-green-700",
      admitted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      waitlisted: "bg-orange-100 text-orange-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under Review",
      document_verified: "Documents Verified",
      selected: "Selected",
      admitted: "Admitted",
      rejected: "Rejected",
      waitlisted: "Waitlisted",
    };
    return labels[status] || status;
  };

  const groupedPrograms = programs.reduce((acc, program) => {
    if (!acc[program.collegeId]) {
      acc[program.collegeId] = {
        college: colleges.find((c) => c.id === program.collegeId),
        programs: [],
      };
    }
    acc[program.collegeId].programs.push(program);
    return acc;
  }, {} as Record<string, { college: RUBCollege | undefined; programs: RUBProgram[] }>);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RUB College Applications</h1>
              <p className="text-sm text-gray-500 mt-1">
                Apply to Royal University of Bhutan colleges and track your admission status
              </p>
            </div>
            <button
              onClick={() => setView("new")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              + New Application
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === "list" ? (
          <>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900">No Applications Yet</h3>
                <p className="text-gray-500 mt-2 mb-6">
                  Start your journey to higher education by applying to RUB colleges.
                </p>
                <button
                  onClick={() => setView("new")}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Start Application
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map((application) => (
                  <div key={application.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">Application No: {application.applicationNumber}</div>
                          <div className="text-xl font-bold mt-1">
                            {application.admittedCollegeName || "Application in Process"}
                          </div>
                          <div className="text-sm opacity-90">{application.academicYear}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Program Preferences</h4>
                      <div className="space-y-2">
                        {application.preferences.map((pref, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full font-bold">
                                {pref.priority}
                              </span>
                              <div>
                                <div className="font-medium text-gray-900">{pref.programName}</div>
                                <div className="text-sm text-gray-500">{pref.collegeName}</div>
                              </div>
                            </div>
                            {application.admittedProgramId === pref.programId && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                ✓ Admitted
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Submitted: {new Date(application.submittedDate).toLocaleDateString()}
                        </div>
                        <Link
                          href={`/student/rub/applications/${application.id}`}
                          className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* New Application Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Program Preferences</h2>
              <p className="text-gray-600 mb-6">
                Choose up to 10 programs in order of preference. Your first choice should be the program you want most.
              </p>

              <div className="space-y-6">
                {Object.entries(groupedPrograms).map(([collegeId, { college, programs: collegePrograms }]) => (
                  <div key={collegeId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900">
                      {college?.name} - {college?.location}
                    </div>
                    <div className="p-4 space-y-2">
                      {collegePrograms.map((program) => {
                        const isSelected = selectedPrograms.includes(program.id);
                        const selectedIndex = selectedPrograms.indexOf(program.id);

                        return (
                          <div
                            key={program.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                              isSelected
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPrograms(selectedPrograms.filter((id) => id !== program.id));
                              } else if (selectedPrograms.length < 10) {
                                setSelectedPrograms([...selectedPrograms, program.id]);
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition ${
                                isSelected ? "border-purple-500 bg-purple-500 text-white" : "border-gray-300"
                              }`}>
                                {isSelected && selectedIndex + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{program.name}</div>
                                <div className="text-sm text-gray-500">
                                  {program.level} • {program.field} • {program.duration} years
                                  {program.minPercentage && ` • Min ${program.minPercentage}%`}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPrograms(selectedPrograms.filter((id) => id !== program.id));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Programs Summary */}
              {selectedPrograms.length > 0 && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Your Preferences ({selectedPrograms.length}/10)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrograms.map((programId, index) => {
                      const program = programs.find((p) => p.id === programId);
                      return (
                        <span
                          key={programId}
                          className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm flex items-center gap-2"
                        >
                          <span className="font-bold">{index + 1}.</span>
                          {program?.name}
                          <button
                            onClick={() => setSelectedPrograms(selectedPrograms.filter((id) => id !== programId))}
                            className="hover:text-purple-200"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedPrograms([]);
                  setView("list");
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={selectedPrograms.length === 0 || submitting}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedPrograms.length === 0 || submitting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {submitting ? "Submitting..." : `Submit Application (${selectedPrograms.length} preferences)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
