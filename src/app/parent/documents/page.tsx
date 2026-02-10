/**
 * PARENT DOCUMENTS PAGE
 *
 * Allows parents to:
 * - View and download important school documents
 * - Access child's report cards and certificates
 * - Download fee receipts
 * - View school policies and guidelines
 * - Access consent forms and permission slips
 * - Download exam results and transcripts
 *
 * Document Categories:
 * - Academic (Report cards, transcripts, certificates)
 * - Administrative (Fee receipts, enrollment forms)
 * - Policies (School policies, handbooks)
 * - Communications (Newsletters, announcements)
 * - Consent (Permission slips, consent forms)
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  Folder,
  File,
  Award,
  Receipt,
  BookOpen,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Printer,
  Mail,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

type DocumentCategory =
  | "academic"
  | "administrative"
  | "policies"
  | "communication"
  | "consent";

type DocumentFormat = "pdf" | "doc" | "xls" | "jpg" | "png";

interface Document {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  format: DocumentFormat;
  size: string;
  uploadDate: string;
  childId: string;
  documentType: string;
  isImportant: boolean;
  downloadUrl: string;
  previewUrl?: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  count: number;
}

// ============================================================================
// MOCK DATA - Will be replaced with API calls
// ============================================================================

const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    grade: "Class 10",
    school: "Yangchenphug HSS",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    grade: "Class 8",
    school: "Motithang HSS",
  },
];

const mockDocuments: Document[] = [
  // Academic Documents
  {
    id: "doc1",
    name: "Term 1 Report Card 2025",
    description: "Academic performance report for Term 1",
    category: "academic",
    format: "pdf",
    size: "245 KB",
    uploadDate: "2025-01-20",
    childId: "child1",
    documentType: "report_card",
    isImportant: true,
    downloadUrl: "/documents/report-card-term1.pdf",
  },
  {
    id: "doc2",
    name: "Career Assessment Certificate",
    description: "Certificate of completion for RIASEC assessment",
    category: "academic",
    format: "pdf",
    size: "128 KB",
    uploadDate: "2025-02-01",
    childId: "child1",
    documentType: "certificate",
    isImportant: false,
    downloadUrl: "/documents/career-assessment-cert.pdf",
  },
  {
    id: "doc3",
    name: "Attendance Certificate Term 1",
    description: "Attendance record and certificate",
    category: "academic",
    format: "pdf",
    size: "95 KB",
    uploadDate: "2025-01-25",
    childId: "child1",
    documentType: "certificate",
    isImportant: false,
    downloadUrl: "/documents/attendance-cert.pdf",
  },
  {
    id: "doc4",
    name: "Term 1 Report Card 2025",
    description: "Academic performance report for Term 1",
    category: "academic",
    format: "pdf",
    size: "230 KB",
    uploadDate: "2025-01-20",
    childId: "child2",
    documentType: "report_card",
    isImportant: true,
    downloadUrl: "/documents/report-card-pema-term1.pdf",
  },

  // Administrative Documents
  {
    id: "doc5",
    name: "Fee Receipt - January 2025",
    description: "Payment receipt for January tuition fee",
    category: "administrative",
    format: "pdf",
    size: "85 KB",
    uploadDate: "2025-01-15",
    childId: "child1",
    documentType: "receipt",
    isImportant: false,
    downloadUrl: "/documents/receipt-jan2025.pdf",
  },
  {
    id: "doc6",
    name: "Student Enrollment Form",
    description: "Academic year 2025 enrollment confirmation",
    category: "administrative",
    format: "pdf",
    size: "156 KB",
    uploadDate: "2024-12-01",
    childId: "child1",
    documentType: "enrollment",
    isImportant: true,
    downloadUrl: "/documents/enrollment-form.pdf",
  },
  {
    id: "doc7",
    name: "ID Card",
    description: "School identity card",
    category: "administrative",
    format: "jpg",
    size: "420 KB",
    uploadDate: "2024-02-15",
    childId: "child1",
    documentType: "id_card",
    isImportant: false,
    downloadUrl: "/documents/id-card.jpg",
    previewUrl: "/documents/id-card.jpg",
  },

  // Policy Documents
  {
    id: "doc8",
    name: "School Handbook 2025",
    description: "Complete school policies and guidelines",
    category: "policies",
    format: "pdf",
    size: "2.4 MB",
    uploadDate: "2025-01-01",
    childId: "",
    documentType: "handbook",
    isImportant: true,
    downloadUrl: "/documents/school-handbook.pdf",
  },
  {
    id: "doc9",
    name: "Attendance Policy",
    description: "School attendance requirements and procedures",
    category: "policies",
    format: "pdf",
    size: "180 KB",
    uploadDate: "2025-01-01",
    childId: "",
    documentType: "policy",
    isImportant: false,
    downloadUrl: "/documents/attendance-policy.pdf",
  },
  {
    id: "doc10",
    name: "Fee Structure 2025",
    description: "Breakdown of all school fees",
    category: "policies",
    format: "pdf",
    size: "95 KB",
    uploadDate: "2025-01-01",
    childId: "",
    documentType: "fee_structure",
    isImportant: true,
    downloadUrl: "/documents/fee-structure.pdf",
  },

  // Communication Documents
  {
    id: "doc11",
    name: "Monthly Newsletter - January",
    description: "School news and updates for January",
    category: "communication",
    format: "pdf",
    size: "1.2 MB",
    uploadDate: "2025-01-31",
    childId: "",
    documentType: "newsletter",
    isImportant: false,
    downloadUrl: "/documents/newsletter-jan.pdf",
  },
  {
    id: "doc12",
    name: "Exam Schedule 2025",
    description: "Mid-term and final examination schedule",
    category: "communication",
    format: "pdf",
    size: "145 KB",
    uploadDate: "2025-02-01",
    childId: "",
    documentType: "schedule",
    isImportant: true,
    downloadUrl: "/documents/exam-schedule.pdf",
  },

  // Consent Documents
  {
    id: "doc13",
    name: "Photography Consent Form",
    description: "Permission for school photography and videography",
    category: "consent",
    format: "pdf",
    size: "78 KB",
    uploadDate: "2024-12-15",
    childId: "child1",
    documentType: "consent",
    isImportant: false,
    downloadUrl: "/documents/photo-consent.pdf",
  },
  {
    id: "doc14",
    name: "Field Trip Consent",
    description: "Permission slip for upcoming field trip",
    category: "consent",
    format: "pdf",
    size: "92 KB",
    uploadDate: "2025-02-05",
    childId: "child1",
    documentType: "permission",
    isImportant: true,
    downloadUrl: "/documents/field-trip-consent.pdf",
  },
];

const documentFolders: DocumentFolder[] = [
  {
    id: "academic",
    name: "Academic",
    description: "Report cards, transcripts, certificates",
    icon: <Award className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-700",
    count: mockDocuments.filter((d) => d.category === "academic").length,
  },
  {
    id: "administrative",
    name: "Administrative",
    description: "Fee receipts, enrollment forms, ID cards",
    icon: <Receipt className="w-5 h-5" />,
    color: "bg-green-100 text-green-700",
    count: mockDocuments.filter((d) => d.category === "administrative").length,
  },
  {
    id: "policies",
    name: "Policies",
    description: "School policies, handbooks, guidelines",
    icon: <BookOpen className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-700",
    count: mockDocuments.filter((d) => d.category === "policies").length,
  },
  {
    id: "communication",
    name: "Communication",
    description: "Newsletters, announcements, schedules",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-orange-100 text-orange-700",
    count: mockDocuments.filter((d) => d.category === "communication").length,
  },
  {
    id: "consent",
    name: "Consent Forms",
    description: "Permission slips, consent forms",
    icon: <FileCheck className="w-5 h-5" />,
    color: "bg-pink-100 text-pink-700",
    count: mockDocuments.filter((d) => d.category === "consent").length,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentDocumentsPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Filter documents by selected child and category
  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesChild =
      doc.childId === "" || doc.childId === selectedChild.id;
    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesChild && matchesCategory && matchesSearch;
  });

  const getFormatIcon = (format: DocumentFormat) => {
    const icons = {
      pdf: <FileText className="w-5 h-5 text-red-500" />,
      doc: <File className="w-5 h-5 text-blue-500" />,
      xls: <File className="w-5 h-5 text-green-500" />,
      jpg: <File className="w-5 h-5 text-purple-500" />,
      png: <File className="w-5 h-5 text-purple-500" />,
    };
    return icons[format];
  };

  const getDocumentTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      report_card: { label: "Report Card", color: "bg-blue-100 text-blue-700" },
      certificate: { label: "Certificate", color: "bg-yellow-100 text-yellow-700" },
      receipt: { label: "Receipt", color: "bg-green-100 text-green-700" },
      enrollment: { label: "Enrollment", color: "bg-purple-100 text-purple-700" },
      id_card: { label: "ID Card", color: "bg-pink-100 text-pink-700" },
      handbook: { label: "Handbook", color: "bg-gray-100 text-gray-700" },
      policy: { label: "Policy", color: "bg-gray-100 text-gray-700" },
      fee_structure: { label: "Fee Structure", color: "bg-green-100 text-green-700" },
      newsletter: { label: "Newsletter", color: "bg-orange-100 text-orange-700" },
      schedule: { label: "Schedule", color: "bg-blue-100 text-blue-700" },
      consent: { label: "Consent", color: "bg-pink-100 text-pink-700" },
      permission: { label: "Permission Slip", color: "bg-red-100 text-red-700" },
    };
    const badge = badges[type] || { label: type, color: "bg-gray-100 text-gray-700" };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const handleDownload = (doc: Document) => {
    // In production, this would trigger a download
    console.log("Downloading:", doc.name);
    window.open(doc.downloadUrl, "_blank");
  };

  const handlePreview = (doc: Document) => {
    setSelectedDocument(doc);
    setShowPreview(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Documents
        </h1>
        <p className="text-gray-600">
          View and download important documents for {selectedChild.name}
        </p>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Document Folders */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`p-4 rounded-lg border text-left transition-all ${
            selectedCategory === "all"
              ? "border-gray-500 bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Folder className="w-6 h-6 mb-2" style={{ color: "rgb(107 114 128)" }} />
          <p className="font-medium">All Documents</p>
          <p className="text-sm text-gray-500">{mockDocuments.length} files</p>
        </button>
        {documentFolders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setSelectedCategory(folder.id as DocumentCategory)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selectedCategory === folder.id
                ? "border-gray-500 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${folder.color}`}>
              {folder.icon}
            </div>
            <p className="font-medium text-sm">{folder.name}</p>
            <p className="text-xs text-gray-500">{folder.count} files</p>
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="administrative">Administrative</option>
            <option value="policies">Policies</option>
            <option value="communication">Communication</option>
            <option value="consent">Consent Forms</option>
          </select>
        </div>
      </div>

      {/* Important Documents Alert */}
      {filteredDocuments.some((d) => d.isImportant) && (
        <div
          className="p-4 rounded-lg border bg-amber-50 border-amber-200"
          style={{ background: "linear-gradient(to right, rgb(254 252 229), rgb(253 247 231))" }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Important Documents</p>
              <p className="text-sm text-amber-700 mt-1">
                Some documents require your attention. Please review and take necessary action.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCategory === "all"
              ? "All Documents"
              : documentFolders.find((f) => f.id === selectedCategory)?.name}
          </CardTitle>
          <CardDescription>
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                    doc.isImportant ? "border-amber-200 bg-amber-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getFormatIcon(doc.format)}
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${doc.isImportant ? "text-amber-900" : "text-gray-900"}`}>
                              {doc.name}
                            </h3>
                            {doc.isImportant && (
                              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(doc.uploadDate)}
                            </span>
                            <span>•</span>
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span className="uppercase">{doc.format}</span>
                          </div>
                          <div className="mt-2">
                            {getDocumentTypeBadge(doc.documentType)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {doc.previewUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={doc.downloadUrl} target="_blank">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Download className="w-5 h-5" />
              <span className="text-sm">Download All</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Printer className="w-5 h-5" />
              <span className="text-sm">Print Documents</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Mail className="w-5 h-5" />
              <span className="text-sm">Email Documents</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/parent/fees/pay">
                <Receipt className="w-5 h-5" />
                <span className="text-sm">View Fees</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {showPreview && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedDocument.name}</CardTitle>
                  <CardDescription>{selectedDocument.description}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
              {selectedDocument.previewUrl ? (
                <img
                  src={selectedDocument.previewUrl}
                  alt={selectedDocument.name}
                  className="w-full h-auto"
                />
              ) : (
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Preview not available for this file format
                  </p>
                  <Button onClick={() => handleDownload(selectedDocument)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            ← Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
