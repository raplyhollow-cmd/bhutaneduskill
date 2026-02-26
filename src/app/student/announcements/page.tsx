import { Suspense } from "react";
import { fetchStudentAnnouncements } from "../_actions";
import { StudentAnnouncementList } from "./student-announcement-list";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default async function StudentAnnouncementsPage() {
  // Fetch announcements for this student
  const { announcements, pinned } = await fetchStudentAnnouncements();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Announcements
        </h1>
        <p className="text-gray-500">
          Important updates and notices from your school
        </p>
      </div>

      {/* Pinned Announcements */}
      {pinned.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pinned Announcements</h2>
          <div className="grid gap-4">
            {pinned.map((announcement) => (
              <PinnedAnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        </div>
      )}

      {/* All Announcements */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Announcements</h2>
        <Suspense fallback={<LoadingState />}>
          <StudentAnnouncementList announcements={announcements} />
        </Suspense>
      </div>
    </div>
  );
}

function PinnedAnnouncementCard({ announcement }: { announcement: {
  id: string;
  title: string;
  excerpt: string;
  priority?: string;
  authorName: string;
  createdAt: string;
} }) {
  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                PINNED
              </span>
              {announcement.priority === "urgent" && (
                <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                  URGENT
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-1">{announcement.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{announcement.excerpt}</p>
            <div className="text-xs text-gray-500">
              By {announcement.authorName} • {new Date(announcement.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading announcements...</div>
      </CardContent>
    </Card>
  );
}
