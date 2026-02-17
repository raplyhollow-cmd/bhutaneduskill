"use client";

import { logger } from "@/lib/logger";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function ContentActions() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/admin/content/sync", { method: "POST" });
    } catch (error) {
      logger.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
      Sync Data
    </Button>
  );
}
