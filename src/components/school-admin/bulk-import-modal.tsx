"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, AlertCircle, X } from "lucide-react";

interface StudentData {
  name: string;
  email?: string;
  phone?: string;
  grade?: string;
  section?: string;
  admissionNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  schoolId?: string;
}

export function BulkImportModal({ open, onClose, schoolId }: BulkImportModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setData(parsed);
      toast({
        title: `${parsed.length} students detected`,
        description: "Review the data before importing",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to parse file",
        description: "Please check the file format and try again",
        variant: "error",
      });
      setFile(null);
    } finally {
      setParsing(false);
    }
  }, [toast]);

  const parseCSV = (text: string): StudentData[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    // Parse header
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));

    // Parse data rows
    const result: StudentData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || !values[0]) continue;

      const student: StudentData = { name: values[0].trim() };

      // Map columns by header name
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (!value) return;

        switch (header) {
          case "name":
            student.name = value;
            break;
          case "email":
            student.email = value;
            break;
          case "phone":
          case "contact":
            student.phone = value;
            break;
          case "grade":
          case "class":
            student.grade = value;
            break;
          case "section":
            student.section = value;
            break;
          case "admission":
          case "admission_no":
          case "admissionnumber":
            student.admissionNumber = value;
            break;
          case "dob":
          case "date_of_birth":
            student.dateOfBirth = value;
            break;
          case "gender":
            student.gender = value;
            break;
          case "address":
            student.address = value;
            break;
          case "parent_name":
          case "parent":
          case "guardian":
            student.parentName = value;
            break;
          case "parent_phone":
          case "parent_contact":
          case "guardian_phone":
            student.parentPhone = value;
            break;
        }
      });

      if (student.name) {
        result.push(student);
      }
    }

    return result;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const handleImport = async () => {
    if (data.length === 0) return;

    setLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (schoolId) {
        headers["x-school-id"] = schoolId;
      }

      const response = await fetch("/api/school-admin/students/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          studentList: data,
          createClass: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if it's a capacity error
        if (response.status === 409 && result.capacityInfo) {
          toast({
            title: "Seat Capacity Exceeded",
            description: `Your school has reached its limit. Current: ${result.capacityInfo.currentCount}/${result.capacityInfo.maxCount} students.`,
            variant: "error",
          });
        } else {
          toast({
            title: "Import Failed",
            description: result.error || "An unknown error occurred",
            variant: "error",
          });
        }
        return;
      }

      const { successful, failed } = result.data;

      if (failed === 0) {
        toast({
          title: "Import Complete!",
          description: `Successfully imported ${successful} students.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Import Partially Complete",
          description: `${successful} succeeded, ${failed} failed.`,
          variant: "warning",
        });
      }

      router.refresh();
      handleClose();

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error instanceof Error ? error.message : String(error) : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setData([]);
    onClose();
  };

  const removeStudent = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-purple-400">
            Bulk Student Import
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a CSV file to import multiple students at once. The file should include a header row
            with columns like: name, email, phone, grade, section, admissionNumber, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* File Upload */}
          {!data.length && (
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={parsing}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-semibold mb-2">
                  {parsing ? "Parsing file..." : "Click to upload CSV file"}
                </p>
                <p className="text-sm text-slate-500">
                  or drag and drop. Maximum 500 students per import.
                </p>
              </label>
            </div>
          )}

          {/* Preview */}
          {data.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-purple-400">
                  {data.length} students ready to import
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setData([]);
                  }}
                >
                  Clear All
                </Button>
              </div>

              <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Grade</th>
                        <th className="p-2 text-left">Section</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {data.slice(0, 50).map((student, index) => (
                        <tr key={index} className="hover:bg-slate-700/50">
                          <td className="p-2">{student.name}</td>
                          <td className="p-2 text-slate-400">{student.email || "-"}</td>
                          <td className="p-2">{student.grade || "-"}</td>
                          <td className="p-2">{student.section || "-"}</td>
                          <td className="p-2">
                            <button
                              onClick={() => removeStudent(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.length > 50 && (
                  <div className="p-2 text-center text-xs text-slate-500 bg-slate-800">
                    ... and {data.length - 50} more students
                  </div>
                )}
              </div>

              {/* Capacity Warning (static - actual check happens on server) */}
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-500">Seat Capacity Check</p>
                  <p className="text-slate-400">
                    Your school&apos;s subscription tier has a student limit. If this import exceeds your
                    capacity, it will be rejected. Contact your administrator to upgrade if needed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={data.length === 0 || loading}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Importing {data.length} students...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {data.length} students
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * CSV Format Reference:
 *
 * Required columns: name
 * Optional columns: email, phone, grade, section, admissionNumber, dateOfBirth,
 *                    gender, address, parentName, parentPhone
 *
 * Example CSV:
 * name,email,phone,grade,section,admissionNumber
 * "Tashi Wangmo","tashi.wangmo@school.edu.bt","+975-123-4567","10","A","ADM001"
 * "Karma Dorji","karma.dorji@school.edu.bt","+975-234-5678","10","A","ADM002"
 * "Pema Lhazen",,"10","B","ADM003"
 */
