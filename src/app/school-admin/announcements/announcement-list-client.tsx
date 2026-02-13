"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnnouncementList,
  AnnouncementForm,
  type AnnouncementFormData,
} from "@/components/announcements";
import type { AnnouncementData } from "@/app/school-admin/_actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";

interface ClientAnnouncementListProps {
  announcements: AnnouncementData[];
  total: number;
  onCreate: (data: AnnouncementFormData) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, data: Partial<AnnouncementFormData>) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onTogglePin: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function ClientAnnouncementList({
  announcements: initialAnnouncements,
  total,
  onCreate,
  onUpdate,
  onDelete,
  onTogglePin,
}: ClientAnnouncementListProps) {
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
              <AnnouncementCard announcement={selectedAnnouncement} />
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Content</h3>
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedAnnouncement?.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
