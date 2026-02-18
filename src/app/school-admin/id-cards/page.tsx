/**
 * ID CARDS PAGE (School Admin)
 * Generate ID cards for students, teachers, and staff
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, IdCard, Loader2, Users, CheckCircle, AlertCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  type: string;
  employeeId?: string;
  rollNumber?: string;
  grade?: number;
  section?: string;
  department?: string;
  profileImage?: string;
}

export default function IdCardsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userType, setUserType] = useState<string>("student");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const grades = ["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  useEffect(() => {
    fetchUsers();
  }, [userType, selectedGrade]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const gradeParam = selectedGrade ? `&grade=${selectedGrade}` : "";
      const res = await fetch(`/api/school-admin/id-cards?userType=${userType}${gradeParam}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users || []);
        if (data.data.users?.length > 0 && !selectedUser) {
          setSelectedUser(data.data.users[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedUser) {
      setMessage({ type: "error", text: "Please select a user" });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/school-admin/id-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: selectedUser }),
      });

      const data = await res.json();

      if (data.success && data.data.pdf) {
        // Download PDF
        const link = document.createElement("a");
        link.href = data.data.pdf;
        link.download = data.data.filename || "IDCard.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMessage({ type: "success", text: "ID card downloaded successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to generate ID card" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate ID card" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBulk = async () => {
    if (users.length === 0) {
      setMessage({ type: "error", text: "No users to generate cards for" });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      // Generate cards one by one (in production, use bulk endpoint)
      const promises = users.slice(0, 20).map((user) =>
        fetch("/api/school-admin/id-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: user.id }),
        })
      );

      await Promise.all(promises);
      setMessage({ type: "success", text: `Generated ${Math.min(users.length, 20)} ID cards!` });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate bulk ID cards" });
    } finally {
      setGenerating(false);
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case "student": return "Students";
      case "teacher": return "Teachers";
      case "school_admin": return "School Admin";
      case "counselor": return "Counselors";
      case "staff": return "Staff";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ID Cards</h1>
          <p className="text-gray-500">Generate ID cards for students, teachers, and staff</p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Selection Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Select User Type</CardTitle>
                <CardDescription>Choose the type of ID card to generate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "student", label: "Students", icon: Users },
                    { value: "teacher", label: "Teachers", icon: IdCard },
                    { value: "school_admin", label: "School Admin", icon: IdCard },
                    { value: "counselor", label: "Counselors", icon: IdCard },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setUserType(type.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        userType === type.value
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <type.icon className="w-4 h-4 inline mr-2" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grade Filter (for students) */}
            {userType === "student" && (
              <Card>
                <CardHeader>
                  <CardTitle>Filter by Grade</CardTitle>
                  <CardDescription>Select a grade to filter students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {grades.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setSelectedGrade(grade === selectedGrade ? "" : grade)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          selectedGrade === grade
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                  {selectedGrade && (
                    <button
                      onClick={() => setSelectedGrade("")}
                      className="mt-2 text-sm text-blue-500 hover:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* User List & Generate */}
            <Card>
              <CardHeader>
                <CardTitle>Select {userType === "student" ? "Student" : "Person"}</CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${users.length} ${getUserTypeLabel(userType)} found`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No users found</p>
                ) : (
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                        {user.grade && ` - Class ${user.grade}`}
                        {user.section && `-${user.section}`}
                        {user.employeeId && ` - ${user.employeeId}`}
                      </option>
                    ))}
                  </select>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !selectedUser}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IdCard className="w-4 h-4 mr-2" />
                      Generate ID Card
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>ID Card Preview</CardTitle>
                <CardDescription>Preview of the generated ID card</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                {selectedUser ? (
                  <div className="text-center">
                    <IdCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">ID card will be generated as PDF</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Standard credit card size (85.6mm × 53.98mm)
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <IdCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>Select a user to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Generate ID Cards</CardTitle>
              <CardDescription>
                Generate ID cards for all {getUserTypeLabel(userType).toLowerCase()}
                {selectedGrade && ` in Class ${selectedGrade}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <span className="font-medium">{users.length}</span> {getUserTypeLabel(userType).toLowerCase()} will be processed.
                  This may take a few moments.
                </p>
              </div>

              <Button
                onClick={handleGenerateBulk}
                disabled={generating || users.length === 0}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <IdCard className="w-4 h-4 mr-2" />
                    Generate All ID Cards ({Math.min(users.length, 20)})
                  </>
                )}
              </Button>

              {users.length > 20 && (
                <p className="text-sm text-gray-500 text-center">
                  Limited to 20 cards at a time. {users.length - 20} more remaining.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
