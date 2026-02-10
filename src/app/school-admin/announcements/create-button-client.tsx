"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export function CreateButtonClient() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Button
      onClick={() => setIsOpen(true)}
      style={{
        background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
      }}
      className="text-white"
    >
      <Plus className="h-4 w-4 mr-2" />
      New Announcement
    </Button>
  );
}
