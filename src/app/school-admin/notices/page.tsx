/**
 * School Admin - Notices Page
 *
 * Manage school-wide notices and announcements with:
 * - Notice board preview
 * - Create/edit notices
 * - Target audience management
 * - Read receipts tracking
 * - Event calendar integration
 */

import { Suspense } from "react";
import { NoticeBoard } from "@/components/notice-board";
import { AnnouncementCreator } from "@/components/announcement-creator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Bell, Calendar, TrendingUp, Eye, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { notices, users, schoolEvents } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function SchoolAdminNoticesPage({
  searchParams,
}: PageProps) {
  const { userId } = await requireAuth(["school-admin"]);

  // Get user's school
  const [user] = await db
    .select({ schoolId: users.schoolId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.schoolId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">School information not found</p>
        </CardContent>
      </Card>
    );
  }

  // Fetch notices and events in parallel
  const [noticesList, eventsList] = await Promise.all([
    db.query.notices.findMany({
      where: and(
        eq(notices.schoolId, user.schoolId),
        eq(notices.isPublished, true)
      ),
      orderBy: [desc(notices.isPinned), desc(notices.createdAt)],
      limit: 20,
    }),
    db.query.schoolEvents.findMany({
      where: eq(schoolEvents.schoolId, user.schoolId),
      orderBy: [desc(schoolEvents.startDate)],
      limit: 10,
    }),
  ]);

  // Calculate stats
  const totalNotices = noticesList.length;
  const pinnedNotices = noticesList.filter((n) => n.isPinned).length;
  const totalViews = noticesList.reduce((sum, n) => sum + (n.viewCount || 0), 0);
  const upcomingEvents = eventsList.filter(
    (e) => e.status === "upcoming"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-gray-500">
            Create and manage school-wide announcements and notices
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Notices"
          value={totalNotices}
          icon={<Bell className="h-5 w-5" />}
          color="bg-gray-100"
        />
        <StatCard
          label="Pinned"
          value={pinnedNotices}
          icon={<Bell className="h-5 w-5" />}
          color="bg-purple-100"
        />
        <StatCard
          label="Total Views"
          value={totalViews}
          icon={<Eye className="h-5 w-5" />}
          color="bg-blue-100"
        />
        <StatCard
          label="Upcoming Events"
          value={upcomingEvents}
          icon={<Calendar className="h-5 w-5" />}
          color="bg-green-100"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Notice Board Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notice Board Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                }
              >
                <NoticeBoard
                  userType="school-admin"
                  initialNotices={noticesList.map((n) => ({
                    ...n,
                    createdAt: n.createdAt,
                  }))}
                  initialEvents={eventsList.map((e) => ({
                    ...e,
                    startDate: e.startDate,
                    endDate: e.endDate,
                  }))}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Right: Create Notice */}
        <div className="space-y-4">
          <div className="sticky top-4">
            <Suspense
              fallback={
                <Card>
                  <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </CardContent>
                </Card>
              }
            >
              <AnnouncementCreator
                schoolId={user.schoolId}
                userType="school-admin"
                onCreate={async (announcement) => {
                  "use server";
                  // Revalidation will happen via the action
                }}
              />
            </Suspense>

            {/* Quick Tips */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5 bg-purple-100 text-purple-800">
                    Pin
                  </Badge>
                  <p className="text-gray-600">
                    Pin important notices to show them at the top
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5 bg-red-100 text-red-800">
                    Urgent
                  </Badge>
                  <p className="text-gray-600">
                    Use urgent priority for critical announcements
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5 bg-blue-100 text-blue-800">
                    Target
                  </Badge>
                  <p className="text-gray-600">
                    Target specific audiences for relevant content
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-gray-600">{icon}</div>
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
