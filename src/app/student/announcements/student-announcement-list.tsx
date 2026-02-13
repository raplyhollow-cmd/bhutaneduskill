"use client";

import { useState } from "react";
import { AnnouncementCard } from "@/components/announcements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StudentAnnouncementData } from "@/app/student/_actions";
import { Button } from "@/components/ui/button";

interface StudentAnnouncementListProps {
  announcements: StudentAnnouncementData[];
}

export function StudentAnnouncementList({ announcements }: StudentAnnouncementListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const selectedAnnouncement = announcements.find((a) => a.id === selectedId);

  const handleView = (id: string) => {
    setSelectedId(id);
    setShowViewDialog(true);
  };

  // Filter out pinned from the main list since they're shown separately
  const regularAnnouncements = announcements.filter((a) => !a.isPinned);

  if (regularAnnouncements.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No announcements yet</h3>
        <p className="text-gray-500">
          Check back later for updates from your school
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {regularAnnouncements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onView={handleView}
          />
        ))}
      </div>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Announcement</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-2">{selectedAnnouncement.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>By {selectedAnnouncement.authorName}</span>
                  <span>•</span>
                  <span>{new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedAnnouncement.content}
                </div>
              </div>
              {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  <ul className="space-y-1">
                    {selectedAnnouncement.attachments.map((file, idx) => (
                      <li key={idx}>
                        <Button variant="link" className="p-0 h-auto" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            {file.name}
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Megaphone } from "lucide-react";
