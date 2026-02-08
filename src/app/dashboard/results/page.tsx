"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, TrendingUp } from "lucide-react";

const CLASS_OPTIONS = [
  { value: "class-8", label: "Class 8" },
  { value: "class-10", label: "Class 10" },
  { value: "class-12", label: "Class 12" },
];

const SUBJECTS = [
  "English",
  "Dzongkha",
  "Mathematics",
  "Science",
  "Social Studies",
  "ICT",
  "Business Studies",
  "Economics",
  "Geography",
  "History",
  "Physics",
  "Chemistry",
  "Biology",
];

export default function ResultsPage() {
  const [showEntry, setShowEntry] = useState(false);
  const [examType, setExamType] = useState("");
  const [examYear, setExamYear] = useState(new Date().getFullYear());
  const [subjects, setSubjects] = useState<Array<{ subject: string; marks: number; totalMarks: number }>>([]);

  const handleAddSubject = () => {
    setSubjects([...subjects, { subject: "", marks: 0, totalMarks: 100 }]);
  };

  const handleSubjectChange = (index: number, field: string, value: any) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setSubjects(newSubjects);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (subjects.length === 0) {
      alert("Please add at least one subject");
      return;
    }

    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examType,
          examYear,
          subjects: subjects.map((s) => ({
            ...s,
            percentage: Math.round((s.marks / s.totalMarks) * 100),
          })),
        }),
      });

      if (response.ok) {
        alert("Results saved successfully!");
        setShowEntry(false);
        setExamType("");
        setExamYear(new Date().getFullYear());
        setSubjects([]);
      }
    } catch (error) {
      console.error("Failed to save results:", error);
      alert("Failed to save results");
    }
  };

  // Mock data for demonstration
  const existingResults = [
    { id: "1", examType: "Class 10", examYear: 2024, totalPercentage: 78, division: "Second" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-600">Track and manage your academic performance</p>
        </div>
        <Button onClick={() => setShowEntry(!showEntry)}>
          {showEntry ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add New Result</>}
        </Button>
      </div>

      {/* Entry Form */}
      {showEntry && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Enter Exam Results</CardTitle>
            <CardDescription>Add your exam results for Classes 8, 10, or 12</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Type</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Exam Year</Label>
                <Input type="number" value={examYear} onChange={(e) => setExamYear(parseInt(e.target.value))} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Subjects</Label>
                <Button size="sm" onClick={handleAddSubject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </div>
              <div className="space-y-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={subject.subject}
                      onValueChange={(value) => handleSubjectChange(index, "subject", value)}
                      className="flex-1"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Marks"
                      value={subject.marks}
                      onChange={(e) => handleSubjectChange(index, "marks", parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-gray-500">/</span>
                    <Input
                      type="number"
                      placeholder="Total"
                      value={subject.totalMarks}
                      onChange={(e) => handleSubjectChange(index, "totalMarks", parseInt(e.target.value) || 100)}
                      className="w-24"
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveSubject(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowEntry(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Results</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Results */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Results</h2>
        {existingResults.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results yet. Add your first exam result!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {existingResults.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{result.examType}</h3>
                      <p className="text-gray-500">Year: {result.examYear}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{result.totalPercentage}%</div>
                      <Badge variant={result.division === "First" ? "default" : result.division === "Second" ? "secondary" : "outline"}>
                        {result.division} Division
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">About Results Tracking</h3>
          <p className="text-blue-800 text-sm">
            Track your BCSEA examination results for Classes 8, 10, and 12. This helps us provide better career recommendations
            based on your academic performance. You can manually enter your results or connect with official sources when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
