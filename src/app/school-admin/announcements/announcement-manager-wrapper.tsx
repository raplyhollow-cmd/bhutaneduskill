"use client";

import dynamic from "next/dynamic";
import type { AnnouncementData } from "../_actions";
import type { AnnouncementFormData } from "@/components/announcements";

// Type alias for compatibility - use AnnouncementData from actions
type Announcement = AnnouncementData;

const ClientAnnouncementManager = dynamic(
  () => import("./announcement-manager").then((mod) => mod.ClientAnnouncementManager),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading announcements...</div>
      </div>
    ),
  }
);

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
