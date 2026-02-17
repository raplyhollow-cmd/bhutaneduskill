"use client";

/**
 * PARENT DOCUMENTS PAGE
 *
 * Features:
 * - View child documents (report cards, certificates, etc.)
 * - Download documents
 * - Upload consent forms
 * - Document categories
 */


import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  Upload,
  Folder,
  FileCheck,
  AlertCircle,
  Loader2,
  X,
  Search,
  Filter,
  Calendar,
} from "lucide-react";

// Document categories
type DocumentCategory = "report_card" | "certificate" | "consent_form" | "assessment" | "other";

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  url: string;
  createdAt: string;
  description?: string;
  expiryDate?: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  classGrade?: number;
  section?: string;
  name: string;
}

interface UploadResponse {
  file: {
    id: string;
    url: string;
    originalName: string;
  };
}

const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; icon: string; color: string }> = {
  report_card: { label: "Report Cards", icon: "Report Card", color: "bg-blue-100 text-blue-700" },
  certificate: { label: "Certificates", icon: "Certificate", color: "bg-green-100 text-green-700" },
  consent_form: { label: "Consent Forms", icon: "Consent Form", color: "bg-purple-100 text-purple-700" },
  assessment: { label: "Assessments", icon: "Assessment", color: "bg-orange-100 text-orange-700" },
  other: { label: "Other Documents", icon: "Document", color: "bg-gray-100 text-gray-700" },
};

const CONSENT_FORM_TEMPLATES: Array<{ id: string; title: string; description: string }> = [
  {
    id: "field_trip",
    title: "Field Trip Consent",
    description: "Permission for educational field trips and excursions",
  },
  {
    id: "medical",
    title: "Medical Treatment Consent",
    description: "Authorization for emergency medical treatment",
  },
  {
    id: "photo",
    title: "Photo/Video Consent",
    description: "Permission for school photographs and videos",
  },
  {
    id: "extracurricular",
    title: "Extracurricular Activity Consent",
    description: "Permission for after-school activities and sports",
  },
];

export default function ParentDocumentsPage() {
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const hasFetched = useRef(false);

  // Selected child data
  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Show alert helper
  const showAlert = useCallback((type: "success" | "error", title: string, message: string) => {
    setAlertMessage({ type, title, message });
    setTimeout(() => setAlertMessage(null), 5000);
  }, []);

  // Fetch children and documents
  const fetchDocuments = useCallback(async (childId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/parent/documents?childId=${childId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchChildren = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/parent/children");
        if (!response.ok) {
          throw new Error("Failed to fetch children");
        }

        const data = await response.json();
        if (data.children && Array.isArray(data.children) && data.children.length > 0) {
          setChildren(data.children);
          const firstChild = data.children[0];
          setSelectedChildId(firstChild.id);
          fetchDocuments(firstChild.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching children:", err);
        setError("Failed to load children");
        setLoading(false);
      }
    };

    fetchChildren();
  }, [fetchDocuments]);

  // Handle child change
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    fetchDocuments(childId);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      showAlert("error", "Invalid file type", "Please upload PDF, DOC, DOCX, or image files only.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showAlert("error", "File too large", "Please upload files smaller than 10MB.");
      return;
    }

    setFileToUpload(file);
  };

  // Handle document upload
  const handleUpload = async () => {
    if (!fileToUpload || !selectedChildId) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("entityType", "consent_form");
      formData.append("entityId", selectedChildId);
      formData.append("description", uploadDescription);

      const response = await fetch("/api/parent/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data: UploadResponse = await response.json();

      showAlert("success", "Document uploaded", `${data.file.originalName} has been uploaded successfully.`);

      // Reset form and fetch updated documents
      setFileToUpload(null);
      setUploadDescription("");
      setShowUploadModal(false);
      setSelectedTemplate(null);
      if (selectedChildId) {
        fetchDocuments(selectedChildId);
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      showAlert("error", "Upload failed", "Failed to upload the document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Handle document download
  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${docId}?download=true`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showAlert("success", "Download started", `${fileName} is being downloaded.`);
    } catch (err) {
      console.error("Error downloading document:", err);
      showAlert("error", "Download failed", "Failed to download the document. Please try again.");
    }
  };

  // Filter documents by category and search query
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesSearch = doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get file icon
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
    if (mimeType.includes("image")) return "IMG";
    return "FILE";
  };

  // Get file color
  const getFileColor = (mimeType: string): string => {
    if (mimeType.includes("pdf")) return "bg-red-100 text-red-700";
    if (mimeType.includes("word") || mimeType.includes("document")) return "bg-blue-100 text-blue-700";
    if (mimeType.includes("image")) return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  if (loading && children.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading documents...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && children.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Documents</h2>
            <p className="text-red-700">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-500 mb-6">
              You don&apos;t have any children linked to your account yet.
              Please contact school administration to link your children.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Message */}
      {alertMessage && (
        <Card className={`border-2 ${alertMessage.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {alertMessage.type === "error" ? (
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alertMessage.type === "error" ? "text-red-600" : "text-green-600"}`} />
                ) : (
                  <FileCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${alertMessage.type === "error" ? "text-red-900" : "text-green-900"}`}>{alertMessage.title}</p>
                  <p className={`text-sm ${alertMessage.type === "error" ? "text-red-700" : "text-green-700"}`}>{alertMessage.message}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAlertMessage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">
            View and manage documents for {selectedChild?.name || "your child"}
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Consent Form
        </Button>
      </div>

      {/* Multi-child Selector */}
      {children.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <Badge className="bg-gray-100 text-gray-700 px-3 py-1.5 whitespace-nowrap">
                {children.length} Children
              </Badge>
              <div className="flex gap-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChildId === child.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChildChange(child.id)}
                    className="whitespace-nowrap"
                    style={
                      selectedChildId === child.id
                        ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                        : undefined
                    }
                  >
                    {child.firstName} {child.lastName}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-5 h-5 text-gray-500" />
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          All Documents
        </Button>
        {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            <Folder className="w-4 h-4 mr-1" />
            {DOCUMENT_CATEGORIES[cat].label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search documents by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <p className="ml-3 text-gray-600">Loading documents...</p>
          </CardContent>
        </Card>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* File Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileColor(doc.mimeType)}`}>
                      <FileText className="w-6 h-6" />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.originalName}</h3>
                        <Badge className={getFileColor(doc.mimeType)}>
                          {getFileIcon(doc.mimeType)}
                        </Badge>
                        {doc.category !== "other" && (
                          <Badge variant="outline">
                            {DOCUMENT_CATEGORIES[doc.category]?.label || "Other"}
                          </Badge>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-1">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.id, doc.originalName)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Documents Found</h2>
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== "all"
                ? "No documents match your search criteria."
                : "No documents are available for this child yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Consent Form</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadModal(false);
                    setFileToUpload(null);
                    setUploadDescription("");
                    setSelectedTemplate(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Upload signed consent forms for {selectedChild?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div>
                <Label>Select Consent Form Type</Label>
                <div className="grid gap-2 mt-2">
                  {CONSENT_FORM_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      style={
                        selectedTemplate === template.id
                          ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                          : undefined
                      }
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setUploadDescription(`${template.title}: ${template.description}`);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <FileCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{template.title}</p>
                          <p className="text-xs opacity-80">{template.description}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="file-upload">Upload Signed Document</Label>
                <div className="mt-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                  </p>
                </div>
              </div>

              {/* Selected File */}
              {fileToUpload && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{fileToUpload.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(fileToUpload.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFileToUpload(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Add any additional notes..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                />
              </div>

              {/* Upload Button */}
              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={!fileToUpload || uploading}
                style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
