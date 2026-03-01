"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, Download, X, CheckCircle, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkImportSchoolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface SchoolRow {
  name: string;
  code: string;
  type: string;
  schoolType: string;
  level: string;
  address: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  subscriptionTier: string;
}

export function BulkImportSchoolsModal({ isOpen, onClose, onSuccess }: BulkImportSchoolsModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSchools, setParsedSchools] = useState<SchoolRow[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [currentStep, setCurrentStep] = useState<"upload" | "preview" | "processing" | "complete">("upload");

  // Reset state when modal closes
  const handleClose = () => {
    setParsedSchools([]);
    setImportErrors([]);
    setSuccessCount(0);
    setCurrentStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  // Parse CSV content
  const parseCSV = (content: string): SchoolRow[] => {
    const lines = content.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    // Skip header row
    const dataLines = lines.slice(1);
    const schools: SchoolRow[] = [];

    dataLines.forEach((line, index) => {
      // Handle CSV with commas in quotes
      const regex = /(?:,|\n|^)(?:"([^"]*)"|([^",\n]*))/g;
      const values: string[] = [];
      let match;

      while ((match = regex.exec(line)) !== null) {
        values.push(match[1] || match[2]);
      }

      if (values.length >= 3) {
        schools.push({
          name: values[0]?.trim() || "",
          code: values[1]?.trim() || "",
          type: values[2]?.trim() || "public",
          schoolType: values[3]?.trim() || "middle_secondary",
          level: values[4]?.trim() || "",
          address: values[5]?.trim() || "",
          city: values[6]?.trim() || "Thimphu",
          contactEmail: values[7]?.trim() || "",
          contactPhone: values[8]?.trim() || "",
          subscriptionTier: values[9]?.trim() || "basic",
        });
      }
    });

    return schools;
  };

  // Validate parsed schools
  const validateSchools = (schools: SchoolRow[]): ImportError[] => {
    const errors: ImportError[] = [];

    schools.forEach((school, index) => {
      if (!school.name) {
        errors.push({ row: index + 2, field: "name", message: "School name is required" });
      }
      if (!school.code) {
        errors.push({ row: index + 2, field: "code", message: "School code is required" });
      } else if (!/^[A-Z]{3}-[A-Z]{3}-\d{4}$/.test(school.code)) {
        errors.push({ row: index + 2, field: "code", message: "Invalid format (expected ABC-DIST-YYYY)" });
      }
      if (school.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(school.contactEmail)) {
        errors.push({ row: index + 2, field: "contactEmail", message: "Invalid email format" });
      }
    });

    return errors;
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      processFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Process uploaded file
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const schools = parseCSV(content);
      const errors = validateSchools(schools);

      setParsedSchools(schools);
      setImportErrors(errors);

      if (schools.length > 0 && errors.length === 0) {
        setCurrentStep("preview");
      } else if (errors.length > 0) {
        setCurrentStep("preview");
      }
    };
    reader.readAsText(file);
  };

  // Import schools
  const handleImport = async () => {
    setIsProcessing(true);
    setCurrentStep("processing");

    let success = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < parsedSchools.length; i++) {
      const school = parsedSchools[i];

      try {
        const response = await fetch("/api/admin/schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: school.name,
            code: school.code,
            type: school.type,
            schoolType: school.schoolType,
            level: school.level || (school.schoolType === "primary" ? "PP-VI" : school.schoolType === "middle_secondary" ? "PP-X" : "XI-XII"),
            address: school.address,
            city: school.city,
            districtId: school.city,
            contactEmail: school.contactEmail,
            contactPhone: school.contactPhone,
            subscriptionTier: school.subscriptionTier,
            maxStudents: 1000,
          }),
        });

        if (response.ok) {
          success++;
        } else {
          const data = await response.json();
          errors.push({ row: i + 2, field: "api", message: data.error || "Failed to create" });
        }
      } catch (error) {
        errors.push({ row: i + 2, field: "api", message: "Network error" });
      }
    }

    setSuccessCount(success);
    setImportErrors(errors);
    setIsProcessing(false);
    setCurrentStep("complete");

    if (success > 0) {
      onSuccess();
      router.refresh();
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = `name,code,type,schoolType,level,address,city,contactEmail,contactPhone,subscriptionTier
Yangchenphug Higher Secondary School,YAN-THI-2026,public,higher_secondary,XI-XII,"Yangchenphug, Thimphu",Thimphu,principal@yangchenphug.edu.bt,+975-2-322456,basic
Paro High School,PAR-PAR-2026,public,higher_secondary,XI-XII,"Paro, Bhutan",Paro,admin@parohigh.edu.bt,+975-2-321234,basic`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schools_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-pink-600" />
              Bulk Import Schools
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === "upload" && "Upload a CSV file to import multiple schools at once"}
              {currentStep === "preview" && `Review ${parsedSchools.length} school(s) before importing`}
              {currentStep === "processing" && "Importing schools..."}
              {currentStep === "complete" && `Import complete - ${successCount} school(s) imported`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === "upload" && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the CSV template below</li>
                  <li>Fill in your school details</li>
                  <li>Upload the completed CSV file</li>
                  <li>Review and confirm the import</li>
                </ol>
              </div>

              {/* Download Template */}
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-400 hover:bg-pink-50/50 transition-all"
              >
                <Download className="w-5 h-5 text-pink-600" />
                <span className="font-medium text-gray-700">Download CSV Template</span>
              </button>

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-8 text-center transition-all",
                  isDragging ? "border-pink-500 bg-pink-50" : "border-gray-300 hover:border-pink-400"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-1">
                  Drop your CSV file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">Only CSV files are supported</p>
              </div>

              {/* Column Guide */}
              <div className="text-sm">
                <p className="font-medium text-gray-700 mb-2">Required columns:</p>
                <div className="flex flex-wrap gap-2">
                  {["name", "code"].map(col => (
                    <span key={col} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">{col} *</span>
                  ))}
                  {["type", "schoolType", "level", "address", "city", "contactEmail", "contactPhone", "subscriptionTier"].map(col => (
                    <span key={col} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{col}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === "preview" && (
            <div className="space-y-4">
              {/* Errors Summary */}
              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-900 font-medium mb-2">
                    <AlertCircle className="w-5 h-5" />
                    Found {importErrors.length} error(s)
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importErrors.map((error, i) => (
                      <p key={i} className="text-sm text-red-700">
                        Row {error.row}: {error.field} - {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Code</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Level</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">City</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedSchools.slice(0, 10).map((school, i) => {
                        const hasError = importErrors.some(e => e.row === i + 2);
                        return (
                          <tr key={i} className={hasError ? "bg-red-50" : ""}>
                            <td className="px-3 py-2 text-gray-600">{i + 2}</td>
                            <td className="px-3 py-2 font-medium">{school.name}</td>
                            <td className="px-3 py-2 font-mono text-xs">{school.code}</td>
                            <td className="px-3 py-2">{school.type}</td>
                            <td className="px-3 py-2">{school.level || "-"}</td>
                            <td className="px-3 py-2">{school.city}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {parsedSchools.length > 10 && (
                  <p className="text-xs text-gray-500 text-center py-2 border-t border-gray-100">
                    Showing 10 of {parsedSchools.length} schools
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-pink-600 animate-spin mb-4" />
              <p className="text-gray-700 font-medium">Importing schools...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="space-y-4">
              <div className={cn(
                "rounded-lg p-6 text-center",
                successCount > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              )}>
                {successCount > 0 ? (
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {successCount > 0 ? "Import Complete!" : "Import Failed"}
                </h3>
                <p className="text-gray-600">
                  {successCount} school(s) successfully imported
                  {importErrors.length > 0 && ` • ${importErrors.length} failed`}
                </p>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium text-red-900 mb-2">Failed imports:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importErrors.map((error, i) => (
                      <p key={i} className="text-sm text-red-700">
                        Row {error.row}: {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          {currentStep === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
            </>
          )}
          {currentStep === "preview" && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep("upload")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedSchools.length === 0}
                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                className="flex-1 text-white"
              >
                Import {parsedSchools.length} School(s)
              </Button>
            </>
          )}
          {currentStep === "complete" && (
            <Button
              onClick={handleClose}
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="flex-1 text-white"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
