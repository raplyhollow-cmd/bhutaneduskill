"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateSupportTicket } from "@/app/admin/support/actions";

// Ticket type from schema
interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution: string | null;
  satisfactionRating: number | null;
  satisfactionFeedback: string | null;
  assignedToName: string | null;
  assignedToId: string | null;
}

interface EditTicketModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticket: Ticket | null;
}

export function EditTicketModal({ open, onClose, onSuccess, ticket }: EditTicketModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [status, setStatus] = useState<"open" | "in_progress" | "waiting" | "resolved" | "closed">("open");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [assignedToName, setAssignedToName] = useState("");
  const [resolution, setResolution] = useState("");
  const [satisfactionRating, setSatisfactionRating] = useState<number>(0);
  const [satisfactionFeedback, setSatisfactionFeedback] = useState("");

  // Populate form when ticket changes
  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status as typeof status);
      setPriority(ticket.priority as typeof priority);
      setAssignedToName(ticket.assignedToName || "");
      setResolution(ticket.resolution || "");
      setSatisfactionRating(ticket.satisfactionRating || 0);
      setSatisfactionFeedback(ticket.satisfactionFeedback || "");
    }
  }, [ticket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setIsLoading(true);

    try {
      const payload = {
        status,
        priority,
        assignedToName: assignedToName || undefined,
        resolution: resolution || undefined,
        satisfactionRating: satisfactionRating > 0 ? satisfactionRating : undefined,
        satisfactionFeedback: satisfactionFeedback || undefined,
      };

      const result = await updateSupportTicket(ticket.id, payload);

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("[EDIT TICKET] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to update ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ticket {ticket.ticketNumber}</DialogTitle>
          <DialogDescription>Update ticket status, assignment, and resolution details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Ticket Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{ticket.subject}</p>
              <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select value={status} onValueChange={(value: typeof status) => setStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select value={priority} onValueChange={(value: typeof priority) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedToName">Assigned To</Label>
              <Select value={assignedToName} onValueChange={setAssignedToName}>
                <SelectTrigger id="assignedToName">
                  <SelectValue placeholder="Select an agent or team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Support Team">Support Team</SelectItem>
                  <SelectItem value="Tech Team">Tech Team</SelectItem>
                  <SelectItem value="Finance Team">Finance Team</SelectItem>
                  <SelectItem value="Dev Team">Dev Team</SelectItem>
                  <SelectItem value="">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resolution */}
            {(status === "resolved" || status === "closed") && (
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Summary</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how this issue was resolved"
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </div>
            )}

            {/* Satisfaction Rating */}
            {status === "closed" && (
              <>
                <div className="space-y-2">
                  <Label>Satisfaction Rating (1-5)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setSatisfactionRating(rating)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          satisfactionRating >= rating
                            ? "bg-pink-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Customer Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Any additional feedback from the customer"
                    rows={2}
                    value={satisfactionFeedback}
                    onChange={(e) => setSatisfactionFeedback(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
