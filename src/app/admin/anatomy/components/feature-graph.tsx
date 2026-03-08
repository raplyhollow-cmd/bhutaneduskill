/**
 * FEATURE GRAPH COMPONENT
 *
 * Force-directed graph visualization of all features.
 * Uses react-force-graph-2d for rendering.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { GraphData } from "react-force-graph-2d";

interface FeatureGraphProps {
  vitalSigns?: Map<string, { status: string; color: string; latency: number }>;
  onNodeClick?: (node: string) => void;
  className?: string;
}

export function FeatureGraph({
  vitalSigns,
  onNodeClick,
  className = "",
}: FeatureGraphProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  // @ts-ignore
  const fgRef = useRef<any>();

  // Fetch graph data
  useEffect(() => {
    async function fetchGraph() {
      try {
        const response = await fetch("/api/admin/anatomy/feature-graph");
        const result = await response.json();

        // Extract the actual data from successResponse wrapper
        const data = result.data || result;

        // Ensure nodes and links exist
        const nodes = data.nodes || [];
        const links = data.links || [];

        // Apply vital signs colors if available
        if (vitalSigns && vitalSigns.size > 0) {
          const coloredNodes = nodes.map((node: any) => {
            if (node.id !== "api-center") {
              const health = vitalSigns.get(node.id);
              if (health) {
                return { ...node, color: health.color };
              }
            }
            return node;
          });
          setGraphData({ nodes: coloredNodes, links });
        } else {
          setGraphData({ nodes, links });
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch graph data:", err);
        // Create simple mock data on error
        setGraphData({
          nodes: [
            { id: "api-center", name: "Universal API", group: "System", color: "#8b5cf6" },
            { id: "students", name: "Students", group: "Core", color: "#3b82f6" },
            { id: "teachers", name: "Teachers", group: "Core", color: "#3b82f6" },
          ],
          links: [
            { source: "students", target: "api-center" },
            { source: "teachers", target: "api-center" },
          ],
        });
        setLoading(false);
      }
    }

    fetchGraph();
  }, [vitalSigns]);

  // Handle node click
  const handleNodeClick = (node: any) => {
    if (node.id !== "api-center" && onNodeClick) {
      onNodeClick(node.id);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading neural graph...</p>
        </div>
      </div>
    );
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <p className="text-red-400">Failed to load graph data</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node: any) => node.name || node.id}
        nodeColor={(node: any) => node.color || "#64748b"}
        linkColor="rgba(100, 116, 139, 0.3)"
        onNodeClick={handleNodeClick}
        width={800}
        height={600}
        cooldownTicks={100}
        enableNodeDrag={true}
        // @ts-ignore
        enableZoomPanInteraction={true}
        backgroundColor="#0f172a"
      />
    </div>
  );
}
