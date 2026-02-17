"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type CrudItemValue = string | number | boolean | string[] | null | undefined;

export interface CrudItem {
  id: string;
  [key: string]: CrudItemValue;
}

export interface CrudColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "date" | "badge";
  options?: { value: string; label: string }[];
  editable?: boolean;
  render?: (value: CrudItemValue, item: CrudItem) => React.ReactNode;
}

export interface CrudCardProps {
  title: string;
  description?: string;
  items: CrudItem[];
  columns: CrudColumn[];
  onAdd?: (item: CrudItem) => Promise<void> | void;
  onEdit?: (id: string, item: CrudItem) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  addItemLabel?: string;
  showAddButton?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
}

export function CrudCard({
  title,
  description,
  items,
  columns,
  onAdd,
  onEdit,
  onDelete,
  addItemLabel = "Add Item",
  showAddButton = true,
  emptyMessage = "No items yet",
  maxHeight = "400px",
}: CrudCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CrudItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = () => {
    const newFormData: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.key !== "id") {
        newFormData[col.key] = col.type === "number" ? 0 : "";
      }
    });
    setFormData(newFormData);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: CrudItem) => {
    setSelectedItem(item);
    const editFormData: Record<string, any> = {};
    columns.forEach((col) => {
      editFormData[col.key] = item[col.key] || "";
    });
    setFormData(editFormData);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (item: CrudItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem && onDelete) {
      setIsSubmitting(true);
      try {
        await onDelete(selectedItem.id);
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (isAddDialogOpen && onAdd) {
        await onAdd({ ...formData, id: crypto.randomUUID?.() || `id_${Date.now()}` } as CrudItem);
      } else if (isEditDialogOpen && onEdit && selectedItem) {
        await onEdit(selectedItem.id, { ...formData, id: selectedItem.id } as CrudItem);
      }
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setFormData({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldValue = (column: CrudColumn, value: any, item: CrudItem) => {
    if (column.render) {
      return column.render(value, item);
    }

    switch (column.type) {
      case "badge":
        return (
          <Badge
            variant="outline"
            className={
              value === "completed"
                ? "bg-green-100 text-green-700 border-green-300"
                : value === "in_progress"
                ? "bg-blue-100 text-blue-700 border-blue-300"
                : ""
            }
          >
            {String(value)}
          </Badge>
        );
      default:
        return String(value || "-");
    }
  };

  const renderFormInput = (column: CrudColumn) => {
    const value = formData[column.key] || "";

    switch (column.type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [column.key]: e.target.value })}
            placeholder={column.label}
            rows={3}
          />
        );
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [column.key]: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            {column.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [column.key]: e.target.value })}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setFormData({ ...formData, [column.key]: parseInt(e.target.value) || 0 })}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => setFormData({ ...formData, [column.key]: e.target.value })}
            placeholder={column.label}
          />
        );
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                <Badge variant="secondary">{items.length}</Badge>
              </CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              {showAddButton && onAdd && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd();
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto" style={{ maxHeight }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                      {columns.map((column) => (
                        <div key={column.key} className="min-w-0">
                          {column.key === "id" ? (
                            <span className="text-xs text-gray-400">{item.id.slice(0, 8)}...</span>
                          ) : (
                            <div className="text-sm truncate" title={String(item[column.key])}>
                              {renderFieldValue(column, item[column.key], item)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(item)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns
              .filter((col) => col.key !== "id" && col.editable !== false)
              .map((column) => (
                <div key={column.key} className="grid gap-2">
                  <label className="text-sm font-medium">{column.label}</label>
                  {renderFormInput(column)}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>Update the details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns
              .filter((col) => col.key !== "id" && col.editable !== false)
              .map((column) => (
                <div key={column.key} className="grid gap-2">
                  <label className="text-sm font-medium">{column.label}</label>
                  {renderFormInput(column)}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {title.slice(0, -1)}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
