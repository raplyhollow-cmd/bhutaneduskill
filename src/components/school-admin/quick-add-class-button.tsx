/**
 * QUICK ADD CLASS BUTTON
 *
 * A client component that wraps the ExpressAddModal for quick class creation.
 * Can be dropped into any server component page.
 */

"use client";

import { useQuickAddClass } from "@/components/school-admin/quick-add-class-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickAddClassButtonProps {
  className?: string;
}

export function QuickAddClassButton({ className }: QuickAddClassButtonProps) {
  const router = useRouter();
  const quickAddClass = useQuickAddClass({
    onSuccess: () => {
      // Refresh the page to show new class
      router.refresh();
    },
  });

  return (
    <>
      <Button
        onClick={quickAddClass.open}
        variant="outline"
        className={`border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 ${className || ""}`}
      >
        <Plus className="w-4 h-4 mr-2" />
        Quick Add
      </Button>
      <quickAddClass.Modal />
    </>
  );
}
