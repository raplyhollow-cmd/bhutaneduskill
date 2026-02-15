"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Filter,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Role, Permission } from "@/lib/db/rbac-schema";

interface PermissionsClientProps {
  roles: Role[];
  permissions: Permission[];
  groupedPermissions: Record<string, Permission[]>;
  permissionMap: Map<string, Set<string>>;
}

export function PermissionsClient({
  roles,
  permissions,
  groupedPermissions,
  permissionMap,
}: PermissionsClientProps) {
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  const modules = ["all", ...Object.keys(groupedPermissions).sort()];
  const filteredModules = selectedModule === "all"
    ? Object.entries(groupedPermissions)
    : Object.entries(groupedPermissions).filter(([module]) => module === selectedModule);

  const hasPermission = (permissionId: string, roleId: string) => {
    return permissionMap.get(permissionId)?.has(roleId) || false;
  };

  const togglePermission = async (permissionId: string, roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || role.isSystemRole) return;

    setIsUpdating(true);

    try {
      const currentlyHas = hasPermission(permissionId, roleId);

      if (currentlyHas) {
        // Remove permission
        const response = await fetch(
          `/api/admin/roles/${roleId}/permissions?permissionId=${permissionId}`,
          { method: "DELETE" }
        );

        const result = await response.json();

        if (result.success) {
          permissionMap.get(permissionId)!.delete(roleId);
          router.refresh();
        } else {
          alert(result.error || "Failed to remove permission");
        }
      } else {
        // Add permission
        const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionId }),
        });

        const result = await response.json();

        if (result.success) {
          if (!permissionMap.has(permissionId)) {
            permissionMap.set(permissionId, new Set());
          }
          permissionMap.get(permissionId)!.add(roleId);
          router.refresh();
        } else {
          alert(result.error || "Failed to assign permission");
        }
      }
    } catch (error) {
      console.error("Toggle permission error:", error);
      alert("Failed to update permission");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleModuleCollapse = (module: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-700 border-green-200";
      case "read":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "update":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "delete":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Permissions Matrix
          </h1>
          <p className="text-gray-600">
            Manage which roles can access which resources and actions
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Total Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{roles.length}</div>
            <p className="text-xs text-gray-500 mt-1">Configurable roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Total Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{permissions.length}</div>
            <p className="text-xs text-gray-500 mt-1">{Object.keys(groupedPermissions).length} modules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Active Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {Array.from(permissionMap.values()).reduce((sum, set) => sum + set.size, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Role-permission links</p>
          </CardContent>
        </Card>
      </div>

      {/* Module Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
            >
              <option value="all">All Modules</option>
              {Object.keys(groupedPermissions).sort().map((module) => (
                <option key={module} value={module}>
                  {module.charAt(0).toUpperCase() + module.slice(1)} ({groupedPermissions[module].length})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      {filteredModules.map(([module, modulePermissions]) => {
        const isCollapsed = collapsedModules.has(module);

        return (
          <Card key={module}>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleModuleCollapse(module)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    {module.charAt(0).toUpperCase() + module.slice(1)}
                  </CardTitle>
                  <CardDescription>
                    {modulePermissions.length} permissions
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  {modulePermissions.reduce(
                    (sum, perm) => sum + Array.from(permissionMap.get(perm.id) || []).length,
                    0
                  )}{" "}
                  assignments
                </Badge>
              </div>
            </CardHeader>

            {!isCollapsed && (
              <CardContent>
                <div className="overflow-x-auto">
                  {/* Role Header Row */}
                  <div className="flex mb-4 pb-2 border-b border-gray-200 min-w-max">
                    <div className="w-64 flex-shrink-0" />
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="w-32 flex-shrink-0 px-2 text-center"
                        title={role.name}
                      >
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            role.isSystemRole
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {role.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Permission Rows */}
                  {modulePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center py-2 border-b border-gray-100 hover:bg-gray-50 min-w-max">
                      {/* Permission Label */}
                      <div className="w-64 flex-shrink-0 pr-4">
                        <div className="font-medium text-gray-900">{permission.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {permission.slug}
                          </code>
                          <Badge className={`text-xs ${getActionBadgeColor(permission.action)}`}>
                            {permission.action.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Role Checkboxes */}
                      {roles.map((role) => {
                        const hasIt = hasPermission(permission.id, role.id);
                        const isSystemRole = role.isSystemRole;

                        return (
                          <div key={role.id} className="w-32 flex-shrink-0 px-2">
                            <button
                              onClick={() => togglePermission(permission.id, role.id)}
                              disabled={isSystemRole || isUpdating}
                              className={`w-10 h-10 rounded-lg mx-auto flex items-center justify-center transition-all ${
                                hasIt
                                  ? "bg-pink-500 text-white shadow-md"
                                  : isSystemRole
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-white border-2 border-gray-300 hover:border-pink-300"
                              }`}
                              title={`${role.name}: ${hasIt ? "Has" : "No"} permission`}
                            >
                              {hasIt && <Check className="w-5 h-5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span>Permission Granted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border-2 border-gray-300" />
                    <span>Permission Not Granted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-200" />
                    <span>System Role (Cannot Modify)</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {filteredModules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No permissions found for the selected module
          </CardContent>
        </Card>
      )}
    </div>
  );
}
