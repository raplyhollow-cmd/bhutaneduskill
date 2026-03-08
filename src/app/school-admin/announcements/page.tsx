import { Suspense } from "react";
import { fetchAnnouncements } from "../_actions";
import { AnnouncementManagerWrapper } from "./announcement-manager-wrapper";
import {
  handleCreateAction,
  handleUpdateAction,
  handleDeleteAction,
  handleTogglePinAction,
} from "./_actions-server";

interface PageProps {
  searchParams: Promise<{
    edit?: string;
  }>;
}

export default async function AnnouncementsPage({ searchParams }: PageProps) {
  const { announcements, total } = await fetchAnnouncements({ limit: 50 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-gray-500">
            Create and manage school-wide announcements and notices
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={total} color="bg-gray-100" />
        <StatCard
          label="Published"
          value={announcements.filter((a) => a.isPublished).length}
          color="bg-blue-50"
        />
        <StatCard
          label="Drafts"
          value={announcements.filter((a) => !a.isPublished).length}
          color="bg-amber-50"
        />
        <StatCard
          label="Pinned"
          value={announcements.filter((a) => a.isPinned).length}
          color="bg-purple-50"
        />
      </div>

      {/* Announcements Manager */}
      <Suspense fallback={<LoadingState />}>
        <AnnouncementManagerWrapper
          announcements={announcements}
          total={total}
          onCreate={handleCreateAction}
          onUpdate={handleUpdateAction}
          onDelete={handleDeleteAction}
          onTogglePin={handleTogglePinAction}
        />
      </Suspense>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-gray-500">Loading announcements...</div>
    </div>
  );
}
