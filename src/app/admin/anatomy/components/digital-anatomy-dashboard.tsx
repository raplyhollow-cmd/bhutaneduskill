/**
 * DIGITAL ANATOMY DASHBOARD
 *
 * Main container bringing together all components.
 */

"use client";

import { useEffect, useState } from "react";
import { FeatureGraph } from "./feature-graph";
import { VitalSignsPanel } from "./vital-signs-panel";
import { LiveTerminalFeed } from "./live-terminal-feed";
import { RefreshCw } from "lucide-react";

interface VitalSignsData {
  overall: {
    health: number;
    status: "healthy" | "degraded" | "critical";
    avgLatency: number;
    errorCount: number;
  };
  resources: Array<{
    name: string;
    latency: number;
    status: string;
    color: string;
    score: number;
    errorCount: number;
  }>;
  system: {
    cpu: number;
    memory: number;
    heartbeatRate: number;
  };
  synapse: {
    healingSuggestions: number;
    needsAttention: boolean;
    criticalIssues: number;
  };
}

export function DigitalAnatomyDashboard() {
  const [vitalSigns, setVitalSigns] = useState<VitalSignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch vital signs
  async function fetchVitalSigns() {
    try {
      const response = await fetch("/api/admin/anatomy/vital-signs");
      const result = await response.json();
      // Extract data from successResponse wrapper
      const data = result.data || result;
      setVitalSigns(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch vital signs:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVitalSigns();
    const interval = setInterval(fetchVitalSigns, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  // Build vital signs map for graph coloring
  const vitalSignsMap = vitalSigns && vitalSigns.resources
    ? new Map(
        vitalSigns.resources.map((r) => [
          r.name,
          { status: r.status, color: r.color, latency: r.latency },
        ])
      )
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Digital Anatomy
            </h1>
            <p className="text-gray-400">
              Real-time visualization of system health
            </p>
          </div>

          <button
            onClick={fetchVitalSigns}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Vital Signs */}
        <div className="lg:col-span-1">
          <VitalSignsPanel vitalSigns={vitalSigns} loading={loading} />
        </div>

        {/* Center - Graph */}
        <div className="lg:col-span-2">
          <FeatureGraph
            vitalSigns={vitalSignsMap}
            onNodeClick={setSelectedNode}
            className="h-[600px]"
          />

          {/* Selected Node Info */}
          {selectedNode && vitalSigns && (
            <div className="mt-4 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium capitalize">
                    {selectedNode.replace(/_/g, " ")}
                  </h3>
                  {(() => {
                    const resource = vitalSigns?.resources?.find(
                      (r) => r.name === selectedNode
                    );
                    return resource ? (
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-gray-400">
                          Latency:{" "}
                          <span className={`ml-1 ${
                            resource.latency < 100 ? "text-green-400" :
                            resource.latency < 300 ? "text-blue-400" :
                            resource.latency < 1000 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {resource.latency}ms
                          </span>
                        </span>
                        <span className="text-gray-400">
                          Score:{" "}
                          <span className={`ml-1 ${
                            resource.score >= 80 ? "text-green-400" :
                            resource.score >= 50 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {resource.score}%
                          </span>
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Terminal Feed */}
        <div className="lg:col-span-1">
          <LiveTerminalFeed className="h-[600px]" />
        </div>
      </div>

      {/* Footer Stats */}
      {vitalSigns && vitalSigns.overall && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">Features Monitored</p>
            <p className="text-2xl font-bold text-white">
              {vitalSigns.overall.totalResources || 0}
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">Avg Latency</p>
            <p className="text-2xl font-bold text-white">
              {vitalSigns.overall.avgLatency || 0}ms
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">Active Resources</p>
            <p className="text-2xl font-bold text-white">
              {vitalSigns.system?.activeResources || 0}
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-xs">Heart Rate</p>
            <p className="text-2xl font-bold text-white">
              {vitalSigns.system?.heartbeatRate?.toFixed(0) || 0} BPM
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
