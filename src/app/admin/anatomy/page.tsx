/**
 * DIGITAL ANATOMY PAGE
 *
 * Entry point for the Digital Anatomy Dashboard.
 * Accessible at /admin/anatomy
 *
 * Now includes:
 * - Visual graph (force-directed)
 * - Detailed brain scan (actual information, not just animations)
 */

"use client";

import { DigitalAnatomyDashboard } from "./components/digital-anatomy-dashboard";
import { SystemBrainDetail } from "./components/system-brain-detail";
import { useState } from "react";

export default function AnatomyPage() {
  const [view, setView] = useState<"visual" | "detail">("visual");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header with View Toggle */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">System Brain</h1>
              <p className="text-gray-400 text-sm">
                {view === "visual"
                  ? "Visual graph of system connections"
                  : "Detailed system architecture analysis"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView("visual")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "visual"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Visual Graph
              </button>
              <button
                onClick={() => setView("detail")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "detail"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Detailed Brain
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === "visual" ? <DigitalAnatomyDashboard /> : <SystemBrainDetail />}
      </div>
    </div>
  );
}
