/**
 * UNIVERSAL FEATURE FORM
 *
 * Auto-generated form for creating/editing any feature.
 *
 * Usage:
 * <FeatureForm
 *   feature={StudentFeature}
 *   mode="create" // or "edit"
 *   initialValues={...}
 *   onSubmit={...}
 *   onCancel={...}
 * />
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureFormProps {
  feature: any;
  mode: "create" | "edit";
  initialValues?: any;
  onSubmit?: (data: any) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function FeatureForm({
  feature,
  mode,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
}: FeatureFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Use feature's API
        if (mode === "create") {
          await feature.api.create(formData, { user: { schoolId: formData.schoolId } });
        } else {
          await feature.api.update(formData.id, formData, { user: { schoolId: formData.schoolId } });
        }
        // Navigate or refresh
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = feature.config.ui?.columns || [];
  const title = feature.config.ui?.title || feature.name;
  const schema = feature.config.schema || {};

  // Filter out auto-generated fields
  const formFields = Object.entries(schema).filter(([key, config]) =>
    !["id", "createdAt", "updatedAt", "isActive"].includes(key)
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{mode === "create" ? `Create ${title}` : `Edit ${title}`}</span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(([key, config]: [string, any]) => {
            const label = config.label || key;
            const required = config.required;
            const inputType = config.type === "email" ? "email" :
              config.type === "integer" ? "number" :
              config.type === "date" ? "date" : "text";

            return (
              <div key={key}>
                <Label htmlFor={key}>
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={key}
                  type={inputType}
                  value={formData[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={label}
                  required={required}
                />
              </div>
            );
          })}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {submitLabel || (mode === "create" ? "Create" : "Save Changes")}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * UNIVERSAL FEATURE LIST PAGE
 *
 * Complete page with DataGrid, filters, and actions.
 */
interface FeatureListPageProps {
  feature: any;
  basePath?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  onCreate?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
}

export function FeatureListPage({
  feature,
  basePath,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canView = true,
  onCreate,
  onEdit,
  onDelete,
  onView,
}: FeatureListPageProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    if (onCreate) {
      onCreate();
    } else {
      setShowCreateForm(true);
    }
  };

  const handleEdit = (item: any) => {
    if (onEdit) {
      onEdit(item);
    } else {
      setEditingItem(item);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete this ${feature.config.ui?.title || item}?`)) {
      return;
    }

    if (onDelete) {
      onDelete(item);
    } else {
      await feature.api.delete(item.id, { user: { schoolId: item.schoolId } });
      setRefreshKey((k) => k + 1);
    }
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingItem(null);
    setRefreshKey((k) => k + 1);
  };

  if (showCreateForm) {
    return (
      <div className="p-6">
        <FeatureForm
          feature={feature}
          mode="create"
          onCancel={handleFormClose}
        />
      </div>
    );
  }

  if (editingItem) {
    return (
      <div className="p-6">
        <FeatureForm
          feature={feature}
          mode="edit"
          initialValues={editingItem}
          onCancel={handleFormClose}
        />
      </div>
    );
  }

  const title = feature.config.ui?.titlePlural || feature.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600">
            Manage your {title.toLowerCase()}
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            Add New {feature.config.ui?.title}
          </Button>
        )}
      </div>

    </div>
  );
}
