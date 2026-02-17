"use client";

import { logger } from "@/lib/logger";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Key,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  permissionCount: number;
  userCount: number;
}

interface RolesClientProps {
  roles: Role[];
}

export function RolesClient({ roles: initialRoles }: RolesClientProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "" });

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setRoles([...roles, { ...result.data, permissionCount: 0, userCount: 0 }]);
        setIsCreateModalOpen(false);
        setFormData({ name: "", slug: "", description: "" });
        router.refresh();
      } else {
        alert(result.error || "Failed to create role");
      }
    } catch (error) {
      logger.error("Create role error:", error);
      alert("Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRole.id,
          name: formData.name,
          description: formData.description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRoles(roles.map((r) => (r.id === selectedRole.id ? { ...r, ...result.data } : r)));
        setIsEditModalOpen(false);
        setSelectedRole(null);
        setFormData({ name: "", slug: "", description: "" });
        router.refresh();
      } else {
        alert(result.error || "Failed to update role");
      }
    } catch (error) {
      logger.error("Update role error:", error);
      alert("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const response = await fetch(`/api/admin/roles?id=${roleId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setRoles(roles.filter((r) => r.id !== roleId));
        router.refresh();
      } else {
        alert(result.error || "Failed to delete role");
      }
    } catch (error) {
      logger.error("Delete role error:", error);
      alert("Failed to delete role");
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, slug: role.slug, description: role.description || "" });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Roles Management
          </h1>
          <p className="text-gray-600">
            Manage user roles and their access levels
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
          className="text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
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
            <p className="text-xs text-gray-500 mt-1">
              {roles.filter((r) => r.isSystemRole).length} system roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {roles.reduce((sum, r) => sum + r.permissionCount, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {roles.reduce((sum, r) => sum + r.userCount, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>System and custom roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Role Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Slug</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Permissions</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Users</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                        >
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-gray-500">{role.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {role.slug}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="inline-flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        {role.permissionCount}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {role.userCount}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {role.isSystemRole ? (
                        <Badge
                          variant="outline"
                          className="border-blue-200 text-blue-700 bg-blue-50"
                        >
                          System
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={role.isActive ? "border-green-200 text-green-700 bg-green-50" : "border-gray-200 text-gray-500 bg-gray-50"}
                        >
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(role)}
                          disabled={role.isSystemRole}
                          className={role.isSystemRole ? "opacity-50" : ""}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.isSystemRole}
                          className={role.isSystemRole ? "opacity-50" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No roles found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Role</CardTitle>
              <CardDescription>Define a new role for the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                    placeholder="e.g., Content Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                    placeholder="e.g., content-manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none"
                    rows={3}
                    placeholder="Brief description of this role..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormData({ name: "", slug: "", description: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                    className="text-white"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Role
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditModalOpen && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Role</CardTitle>
              <CardDescription>Update role details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedRole(null);
                      setFormData({ name: "", slug: "", description: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                    className="text-white"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
