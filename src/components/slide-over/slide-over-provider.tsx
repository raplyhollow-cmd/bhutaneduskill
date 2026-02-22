/**
 * Slide Over Provider
 *
 * Global provider that renders slide-over panels based on URL state.
 * Supports profile, settings, notifications, and custom detail panels.
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { StudentProfileView } from "@/components/profile/student-profile-view";
import { TeacherProfileView } from "@/components/profile/teacher-profile-view";
import { SchoolProfileView } from "@/components/profile/school-profile-view";
import type { SlideOverPanel } from "@/hooks/use-slide-over";
import { ceramicDuration } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface SlideOverContentProps {
  panel: SlideOverPanel;
  id: string | null;
  onClose: () => void;
}

function SlideOverContent({ panel, id, onClose }: SlideOverContentProps) {
  switch (panel) {
    case "profile":
      if (!id) return null;
      // Determine profile type based on context or ID prefix
      if (id.startsWith("student-")) {
        return <StudentProfileView studentId={id} onClose={onClose} />;
      }
      if (id.startsWith("teacher-")) {
        return <TeacherProfileView teacherId={id} onClose={onClose} />;
      }
      if (id.startsWith("school-")) {
        return <SchoolProfileView schoolId={id} onClose={onClose} />;
      }
      // Default to student profile
      return <StudentProfileView studentId={id} onClose={onClose} />;

    case "settings":
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <p className="text-sm text-gray-500">Settings panel content</p>
        </div>
      );

    case "notifications":
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <p className="text-sm text-gray-500">Notifications panel content</p>
        </div>
      );

    case "details":
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <p className="text-sm text-gray-500">Details panel content</p>
        </div>
      );

    default:
      return null;
  }
}

export function SlideOverProvider() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [mounted, setMounted] = useState(false);

  const panel = (searchParams.get("panel") as SlideOverPanel) || null;
  const id = searchParams.get("id") || null;
  const isOpen = !!panel;

  // Handle client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const closePanel = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("panel");
    params.delete("id");
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Don't render on server
  if (!mounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closePanel()}>
      <AnimatePresence>
        {isOpen && (
          <SheetContent
            side="right"
            className={cn(
              "w-full sm:w-[400px] md:w-[500px] lg:w-[600px]",
              "bg-white border-l border-ceramic-border",
              "shadow-2xl"
            )}
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: parseFloat(ceramicDuration.default) }}
              className="h-full overflow-y-auto"
            >
              <SlideOverContent panel={panel} id={id} onClose={closePanel} />
            </motion.div>
          </SheetContent>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
