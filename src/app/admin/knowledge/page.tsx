"use client";

/**
 * KNOWLEDGE MANAGEMENT PAGE
 *
 * Platform for ingesting and managing external knowledge:
 * - RUB college requirements
 * - National scholarships
 * - Career pathways
 * - Curriculum data
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Link as LinkIcon,
  GraduationCap,
  Award,
  Briefcase,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";

interface KnowledgeDraft {
  id: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  structuredData: Array<Record<string, unknown>>;
  confidenceScore: number;
  status: "pending" | "approved" | "rejected";
  estimatedRecords: number;
  createdAt: string;
}

type IngestResult = {
  success: boolean;
  draftId?: string;
  recordsExtracted?: number;
  message?: string;
};

const sourceTypes = [
  { value: "rub", label: "RUB Requirements", icon: GraduationCap, color: "text-purple-500 bg-purple-50" },
  { value: "scholarship", label: "Scholarships", icon: Award, color: "text-amber-500 bg-amber-50" },
  { value: "career", label: "Career Pathways", icon: Briefcase, color: "text-emerald-500 bg-emerald-50" },
  { value: "college", label: "College Programs", icon: FileText, color: "text-blue-500 bg-blue-50" },
];

export default function KnowledgeManagementPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<KnowledgeDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ingest modal state
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState("rub");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);

  // Draft detail modal
  const [selectedDraft, setSelectedDraft] = useState<KnowledgeDraft | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const response = await fetch("/api/admin/knowledge/ingest");
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.data || []);
      }
    } catch (error) {
      logger.error("Failed to load drafts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestContent && !ingestUrl) return;

    setIsIngesting(true);
    setIngestResult(null);

    try {
      const response = await fetch("/api/admin/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: selectedSourceType,
          content: ingestContent,
          url: ingestUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setIngestResult(data.data);

      // Reload drafts
      await loadDrafts();
    } catch (error) {
      logger.error("Failed to ingest:", error);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleApprove = async (draftId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/knowledge/drafts/${draftId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await loadDrafts();
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      logger.error("Failed to approve draft:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (draftId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/knowledge/drafts/${draftId}/approve`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes: "Rejected by admin" }),
      });

      if (response.ok) {
        await loadDrafts();
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      logger.error("Failed to reject draft:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ceramic-primary">Knowledge Management</h1>
          <p className="text-ceramic-secondary mt-1">
            Ingest and manage RUB requirements, scholarships, and career data
          </p>
        </div>
        <Button onClick={() => setIsIngestModalOpen(true)} className="bg-cyan-600">
          <Upload className="w-4 h-4 mr-2" />
          Import Knowledge
        </Button>
      </div>

      {/* Source Type Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sourceTypes.map((type) => {
          const Icon = type.icon;
          const count = drafts.filter((d) => d.sourceType === type.value && d.status === "pending").length;

          return (
            <Card key={type.value} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", type.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-ceramic-dimmed">
                      {count > 0 ? `${count} pending` : "All processed"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Drafts List */}
      <Card>
        <CardHeader>
          <CardTitle>Import Drafts</CardTitle>
          <CardDescription>
            Review AI-parsed content before importing into the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-ceramic-dimmed" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-ceramic-dimmed mb-4" />
              <p className="text-ceramic-dimmed">No drafts yet. Import knowledge to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => {
                const typeInfo = sourceTypes.find((t) => t.value === draft.sourceType);
                const Icon = typeInfo?.icon || FileText;

                return (
                  <div
                    key={draft.id}
                    className="flex items-center gap-4 p-4 border border-ceramic-border rounded-lg hover:bg-ceramic-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedDraft(draft);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <div className={cn("p-2 rounded-lg", typeInfo?.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ceramic-primary truncate">{draft.sourceName}</p>
                      <p className="text-sm text-ceramic-dimmed">
                        {draft.estimatedRecords} records • {Math.round(draft.confidenceScore * 100)}% confidence
                      </p>
                    </div>
                    {getStatusBadge(draft.status)}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingest Modal */}
      <Dialog open={isIngestModalOpen} onOpenChange={setIsIngestModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Knowledge</DialogTitle>
            <DialogDescription>
              AI will parse and structure the content. Review before importing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source Type Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Source Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sourceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedSourceType(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                        selectedSourceType === type.value
                          ? "border-cyan-500 bg-cyan-50"
                          : "border-ceramic-border hover:border-ceramic-border"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", selectedSourceType === type.value ? "text-cyan-600" : "text-ceramic-dimmed")} />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Source URL (optional)
              </label>
              <Input
                placeholder="https://example.com/data"
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
              />
            </div>

            {/* Content Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Content to Import</label>
              <Textarea
                placeholder="Paste content here or enter URL above..."
                value={ingestContent}
                onChange={(e) => setIngestContent(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-ceramic-dimmed mt-1">
                AI will parse this content and extract structured data.
              </p>
            </div>

            {/* Ingest Result */}
            {ingestResult && (
              <div className="bg-ceramic-gray-50 rounded-lg p-4 border border-ceramic-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Parse Result</span>
                  <Badge variant="outline">
                    {Math.round(ingestResult.confidenceScore * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-ceramic-secondary">
                  Extracted {ingestResult.estimatedRecords} records
                </p>
                {ingestResult.preview && ingestResult.preview.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-ceramic-dimmed mb-1">Preview:</p>
                    {ingestResult.preview.map((item: string, i: number) => (
                      <p key={i} className="text-xs font-mono text-ceramic-primary">• {item}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsIngestModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIngest}
              disabled={isIngesting || (!ingestContent && !ingestUrl)}
              className="bg-cyan-600"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Parse Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDraft?.sourceName}</DialogTitle>
            <DialogDescription>
              Review parsed data before approving import
            </DialogDescription>
          </DialogHeader>

          {selectedDraft && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedDraft.status)}
                <Badge variant="outline">
                  {selectedDraft.estimatedRecords} records
                </Badge>
                <Badge variant="outline">
                  {Math.round(selectedDraft.confidenceScore * 100)}% confidence
                </Badge>
              </div>

              <div className="bg-ceramic-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono text-ceramic-primary whitespace-pre-wrap">
                  {JSON.stringify(selectedDraft.structuredData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDetailModalOpen(false)}
              disabled={isProcessing}
            >
              Close
            </Button>
            {selectedDraft?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => selectedDraft && handleReject(selectedDraft.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => selectedDraft && handleApprove(selectedDraft.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Import
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
