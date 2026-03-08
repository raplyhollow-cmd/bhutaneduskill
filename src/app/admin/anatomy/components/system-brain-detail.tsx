/**
 * SYSTEM BRAIN DETAIL COMPONENT
 *
 * Shows detailed system architecture with:
 * - All nodes and their connections
 * - Orphaned/degraded components
 * - Missing connections
 * - Actionable fix suggestions
 *
 * This is the "real" information view, not just animations.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link2,
  Server,
  FileCode,
  Users,
  ArrowRight,
  Wrench,
  Eye,
} from "lucide-react";

interface SystemNode {
  id: string;
  name: string;
  type: "table" | "feature" | "api" | "page" | "component";
  status: "healthy" | "degraded" | "orphaned" | "missing";
  connections: string[];
  dependencies: string[];
  incomingCount: number;
  outgoingCount: number;
  totalConnections: number;
}

interface ConnectionInfo {
  source: string;
  target: string;
  type: "fk" | "reference" | "import" | "api";
  strength: "strong" | "weak" | "missing";
}

interface Issue {
  type: "orphan" | "missing_connection" | "broken_import" | "deprecated";
  severity: "critical" | "warning" | "info";
  message: string;
  fix?: string;
}

interface BrainData {
  timestamp: string;
  scan: {
    nodes: SystemNode[];
    connections: ConnectionInfo[];
    health: {
      total: number;
      healthy: number;
      orphaned: number;
      missing: number;
      score: number;
    };
    issues: Issue[];
  };
  grouped: Record<string, SystemNode[]>;
  criticalIssues: Issue[];
  summary: {
    totalNodes: number;
    healthyNodes: number;
    orphanedNodes: number;
    missingNodes: number;
    totalConnections: number;
    healthScore: number;
    criticalIssueCount: number;
  };
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  table: Database,
  feature: GitBranch,
  api: Server,
  page: FileCode,
  component: Users,
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  healthy: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  degraded: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  orphaned: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  missing: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
};

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: CheckCircle2,
};

export function SystemBrainDetail() {
  const [brainData, setBrainData] = useState<BrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<SystemNode | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    async function fetchBrainData() {
      try {
        const response = await fetch("/api/admin/anatomy/system-brain");
        const result = await response.json();
        setBrainData(result.data || result);
      } catch (err) {
        console.error("Failed to fetch brain data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBrainData();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-4 text-gray-400">Scanning system brain...</span>
        </div>
      </div>
    );
  }

  if (!brainData) {
    return (
      <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-8 border border-red-500/30">
        <p className="text-red-400">Failed to load system brain data</p>
      </div>
    );
  }

  // Filter nodes
  const filteredNodes = brainData.scan.nodes.filter((node) => {
    if (filterStatus !== "all" && node.status !== filterStatus) return false;
    if (filterType !== "all" && node.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Health Score"
          value={`${brainData.summary.healthScore}%`}
          color={brainData.summary.healthScore >= 80 ? "green" : brainData.summary.healthScore >= 50 ? "yellow" : "red"}
          icon={CheckCircle2}
        />
        <SummaryCard
          title="Total Nodes"
          value={brainData.summary.totalNodes.toString()}
          color="blue"
          icon={Database}
        />
        <SummaryCard
          title="Connections"
          value={brainData.summary.totalConnections.toString()}
          color="purple"
          icon={Link2}
        />
        <SummaryCard
          title="Issues"
          value={brainData.summary.criticalIssueCount.toString()}
          color={brainData.summary.criticalIssueCount > 0 ? "red" : "green"}
          icon={AlertTriangle}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterButton
          active={filterStatus === "all"}
          onClick={() => setFilterStatus("all")}
        >
          All Status
        </FilterButton>
        <FilterButton
          active={filterStatus === "healthy"}
          onClick={() => setFilterStatus("healthy")}
          variant="green"
        >
          Healthy ({brainData.summary.healthyNodes})
        </FilterButton>
        <FilterButton
          active={filterStatus === "orphaned"}
          onClick={() => setFilterStatus("orphaned")}
          variant="orange"
        >
          Orphaned ({brainData.summary.orphanedNodes})
        </FilterButton>
        <FilterButton
          active={filterStatus === "missing"}
          onClick={() => setFilterStatus("missing")}
          variant="red"
        >
          Missing ({brainData.summary.missingNodes})
        </FilterButton>

        <div className="w-px bg-gray-700 h-8 mx-2" />

        <FilterButton
          active={filterType === "all"}
          onClick={() => setFilterType("all")}
        >
          All Types
        </FilterButton>
        <FilterButton
          active={filterType === "table"}
          onClick={() => setFilterType("table")}
        >
          Tables
        </FilterButton>
        <FilterButton
          active={filterType === "feature"}
          onClick={() => setFilterType("feature")}
        >
          Features
        </FilterButton>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nodes List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              System Nodes ({filteredNodes.length})
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-2 space-y-1">
            {filteredNodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                selected={selectedNode?.id === node.id}
                onClick={() => setSelectedNode(node)}
              />
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          {/* Selected Node Details */}
          {selectedNode ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                    {React.createElement(TYPE_ICONS[selectedNode.type] || Database, {
                      className: "w-5 h-5 text-blue-400",
                    })}
                    {selectedNode.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      selectedNode.type === "table" ? "bg-purple-500/20 text-purple-400" :
                      selectedNode.type === "feature" ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {selectedNode.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[selectedNode.status].bg} ${STATUS_COLORS[selectedNode.status].text}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              {/* Connection Stats */}
              <div className="grid grid-cols-3 gap-4 my-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{selectedNode.incomingCount}</p>
                  <p className="text-xs text-gray-400">Incoming</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{selectedNode.outgoingCount}</p>
                  <p className="text-xs text-gray-400">Outgoing</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{selectedNode.totalConnections}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>

              {/* Connections */}
              {selectedNode.connections.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Connected To:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.connections.map((conn) => (
                      <span
                        key={conn}
                        className="px-3 py-1 bg-gray-700/50 rounded-lg text-sm text-gray-300"
                      >
                        {conn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {selectedNode.dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Dependencies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 text-center">
              <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Select a node to view details</p>
            </div>
          )}

          {/* Critical Issues */}
          {brainData.criticalIssues.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">
                  Issues ({brainData.criticalIssues.length})
                </h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {brainData.criticalIssues.map((issue, idx) => (
                  <IssueCard key={idx} issue={issue} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  color: "green" | "yellow" | "red" | "blue" | "purple";
  icon: React.ElementType;
}) {
  const colorClasses = {
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <div className={`${colorClasses[color].bg} backdrop-blur-sm rounded-xl p-4 border ${colorClasses[color].border}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-8 h-8 ${colorClasses[color].text}`} />
        <div>
          <p className="text-xs text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color].text}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// Filter Button Component
function FilterButton({
  children,
  active,
  onClick,
  variant = "blue",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  variant?: "green" | "orange" | "red" | "blue" | "purple";
}) {
  const variantClasses = {
    green: active ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600",
    orange: active ? "bg-orange-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600",
    red: active ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600",
    blue: active ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600",
    purple: active ? "bg-purple-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}

// Node Card Component
function NodeCard({
  node,
  selected,
  onClick,
}: {
  node: SystemNode;
  selected: boolean;
  onClick: () => void;
}) {
  const NodeIcon = TYPE_ICONS[node.type] || Database;
  const statusColor = STATUS_COLORS[node.status];

  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        selected
          ? "bg-blue-500/20 border border-blue-500/50"
          : "bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${statusColor.bg} ${statusColor.border}`}>
          <NodeIcon className={`w-4 h-4 ${statusColor.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate capitalize">{node.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{node.type}</span>
            {node.totalConnections > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-gray-500">{node.totalConnections} connections</span>
              </>
            )}
          </div>
        </div>
        {node.status !== "healthy" && (
          <div className={`px-2 py-0.5 rounded text-xs ${statusColor.bg} ${statusColor.text}`}>
            {node.status}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// Issue Card Component
function IssueCard({ issue }: { issue: Issue }) {
  const IssueIcon = SEVERITY_ICONS[issue.severity];

  const severityColor = {
    critical: "text-red-400 bg-red-500/20",
    warning: "text-orange-400 bg-orange-500/20",
    info: "text-blue-400 bg-blue-500/20",
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColor[issue.severity].split(" ")[1]} border-${issue.severity === "critical" ? "red" : issue.severity === "warning" ? "orange" : "blue"}-500/30 mb-2`}>
      <div className="flex items-start gap-3">
        <IssueIcon className={`w-5 h-5 ${severityColor[issue.severity].split(" ")[0]} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs uppercase font-semibold ${severityColor[issue.severity].split(" ")[0]}`}>
              {issue.severity}
            </span>
            <span className="text-xs text-gray-500 uppercase">{issue.type}</span>
          </div>
          <p className="text-sm text-white">{issue.message}</p>
          {issue.fix && (
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-400">
              <Wrench className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{issue.fix}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
