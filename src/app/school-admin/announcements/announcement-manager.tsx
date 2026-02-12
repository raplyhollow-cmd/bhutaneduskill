"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnnouncementList } from "@/components/announcements";
import type { AnnouncementData } from "@/app/school-admin/_actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";

interface ClientAnnouncementManagerProps {
  announcements: AnnouncementData[];
  total: number;
  onCreate: (data: AnnouncementFormData) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, data: Partial<AnnouncementFormData>) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onTogglePin: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function ClientAnnouncementManager({
  announcements: initialAnnouncements,
  total,
  onCreate,
  onUpdate,
  onDelete,
  onTogglePin,
}: ClientAnnouncementManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAnnouncement = announcements.find((a) => a.id === selectedId);

  const handleCreate = async (data: AnnouncementFormData) => {
    setIsSubmitting(true);
    const result = await onCreate(data);
    setIsSubmitting(false);

    if (result.success) {
      setShowCreateDialog(false);
      startTransition(() => {
        router.refresh();
      });
    }
    return result;
  };

  const handleUpdate = async (data: AnnouncementFormData) => {
    if (!selectedId) return { success: false, error: "No announcement selected" };

    setIsSubmitting(true);
    const result = await onUpdate(selectedId, data);
    setIsSubmitting(false);

    if (result.success) {
      setShowEditDialog(false);
      setSelectedId(null);
      startTransition(() => {
        router.refresh();
      });
    }
    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;

    setIsSubmitting(true);
    const result = await onDelete(selectedId);
    setIsSubmitting(false);

    if (result.success) {
      setShowDeleteDialog(false);
      setSelectedId(null);
      startTransition(() => {
        router.refresh();
      });
    }
  };

  const handleTogglePin = async (id: string) => {
    await onTogglePin(id);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setShowViewDialog(true);
  };

  const handleEdit = (id: string) => {
    setSelectedId(id);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setShowCreateDialog(true)}
          style={{
            background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
          }}
          className="text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <AnnouncementList
        announcements={announcements}
        total={total}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onTogglePin={handleTogglePin}
      />

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Create a new announcement for your school community
            </DialogDescription>
          </DialogHeader>
          <AnnouncementForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement details
            </DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <AnnouncementForm
              onSubmit={handleUpdate}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedId(null);
              }}
              initialData={{
                title: selectedAnnouncement.title,
                content: selectedAnnouncement.content,
                excerpt: selectedAnnouncement.excerpt ?? undefined,
                targetAudience: selectedAnnouncement.targetAudience as "all" | "students" | "teachers" | "parents" | "staff" | "counselor",
                priority: selectedAnnouncement.priority as "low" | "normal" | "high" | "urgent",
                category: selectedAnnouncement.category ?? undefined,
                isPublished: selectedAnnouncement.isPublished,
                isPinned: selectedAnnouncement.isPinned,
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Announcement Details</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">{selectedAnnouncement.title}</h3>
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedAnnouncement?.title}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
