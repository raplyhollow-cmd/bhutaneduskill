"use client";

import { ClientAnnouncementManager } from "./announcement-manager";
import type { AnnouncementFormData } from "@/components/announcements";

interface WrapperProps {
  announcements: Announcement[];
  total: number;
  onCreate: (data: AnnouncementFormData) => Promise<any>;
  onUpdate: (id: string, data: Partial<AnnouncementFormData>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onTogglePin: (id: string) => Promise<any>;
}

export function AnnouncementManagerWrapper({
  announcements,
  total,
  onCreate,
  onUpdate,
  onDelete,
  onTogglePin,
}: WrapperProps) {
  return (
    <ClientAnnouncementManager
      announcements={announcements}
      total={total}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onTogglePin={onTogglePin}
    />
  );
}
