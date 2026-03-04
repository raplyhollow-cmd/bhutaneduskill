/**
 * UNIVERSAL MODAL & DIALOG SYSTEM
 *
 * Reusable modal components that work with any feature.
 * Supports create, edit, view, and delete operations.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FeatureForm, FeatureView } from "@/components/unified";
import { cn } from "@/lib/utils";

// Types
export type ModalSize = "sm" | "md" | "lg" | "xl" | "full" | "content";
export type ModalMode = "create" | "edit" | "view" | "delete";

export interface UniversalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ModalMode;
  title?: string;
  description?: string;
  size?: ModalSize;
  schema: Record<string, any>;
  data?: any;
  referenceData?: Record<string, any[]>;
  onSubmit?: (data: any) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  useSheet?: boolean; // Use sheet instead of dialog for mobile
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full h-full",
  content: "max-w-none",
};

/**
 * Universal Modal Component
 */
export function UniversalModal({
  open,
  onOpenChange,
  mode,
  title,
  description,
  size = "md",
  schema,
  data,
  referenceData,
  onSubmit,
  onDelete,
  loading = false,
  submitLabel,
  cancelLabel = "Cancel",
  useSheet = false,
  className,
}: UniversalModalProps) {
  const [formData, setFormData] = useState(data || {});

  // Reset form data when modal opens or data changes
  useEffect(() => {
    if (open) {
      setFormData(data || {});
    }
  }, [open, data]);

  // Handle form submission
  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (onDelete && data?.id) {
      await onDelete(data.id);
      onOpenChange(false);
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    if (title) return title;
    switch (mode) {
      case "create":
        return "Create New";
      case "edit":
        return "Edit";
      case "view":
        return "View Details";
      case "delete":
        return "Confirm Delete";
    }
  };

  // Get submit button label based on mode
  const getSubmitLabel = () => {
    if (submitLabel) return submitLabel;
    switch (mode) {
      case "create":
        return "Create";
      case "edit":
        return "Save";
      case "delete":
        return "Delete";
      default:
        return "OK";
    }
  };

  const content = (
    <>
      {mode === "delete" ? (
        <DeleteContent data={data} />
      ) : mode === "view" ? (
        <ViewContent schema={schema} data={data} />
      ) : (
        <FormContent
          schema={schema}
          data={formData}
          setData={setFormData}
          referenceData={referenceData}
          mode={mode}
        />
      )}

      <DialogFooter className={mode === "view" ? "hidden" : ""}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        {mode !== "view" && (
          <Button type="button" onClick={mode === "delete" ? handleDelete : handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getSubmitLabel()}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  if (useSheet) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={cn("w-full sm:max-w-md", size === "lg" && "sm:max-w-lg", size === "xl" && "sm:max-w-xl", className)}>
          <SheetHeader>
            <SheetTitle>{getModalTitle()}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="py-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Form Content
 */
function FormContent({
  schema,
  data,
  setData,
  referenceData,
  mode,
}: {
  schema: Record<string, any>;
  data: any;
  setData: (data: any) => void;
  referenceData?: Record<string, any[]>;
  mode: ModalMode;
}) {
  // This would integrate with the FeatureForm component
  // For now, providing a simplified version
  return (
    <div className="space-y-4 py-4">
      <p className="text-sm text-muted-foreground">
        Form fields would be rendered here based on schema.
      </p>
      {/* In a full implementation, this would use FeatureForm with proper integration */}
    </div>
  );
}

/**
 * View Content
 */
function ViewContent({
  schema,
  data,
}: {
  schema: Record<string, any>;
  data: any;
}) {
  return (
    <div className="space-y-4 py-4">
      {Object.entries(schema).map(([key, config]) => {
        if (key === "id" || key === "createdAt" || key === "updatedAt") return null;

        return (
          <div key={key} className="flex items-start justify-between py-2 border-b">
            <span className="text-sm font-medium text-muted-foreground">
              {config.label || key}:
            </span>
            <span className="text-sm text-right">
              {data[key] === null || data[key] === undefined ? (
                <span className="text-muted-foreground">—</span>
              ) : config.type === "boolean" ? (
                data[key] ? "Yes" : "No"
              ) : (
                String(data[key])
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Delete Content
 */
function DeleteContent({ data }: { data: any }) {
  const displayName = data?.name || data?.title || data?.id || "this item";

  return (
    <div className="py-4">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <strong>{displayName}</strong>?
        This action cannot be undone.
      </p>
    </div>
  );
}

/**
 * Confirm Dialog - Simple confirmation
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground" : ""}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Bulk Action Modal
 */
export function BulkActionModal({
  open,
  onOpenChange,
  title,
  description,
  items,
  actionLabel,
  onAction,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  items: any[];
  actionLabel: string;
  onAction: () => Promise<void>;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            {items.length} item{items.length !== 1 ? "s" : ""} selected:
          </p>
          <div className="max-h-40 overflow-auto border rounded-md p-2">
            {items.slice(0, 10).map((item) => (
              <div key={item.id} className="text-sm py-1">
                {item.name || item.title || item.id}
                {items.length > 10 && items.indexOf(item) === 9 && (
                  <span className="text-muted-foreground">...and {items.length - 10} more</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onAction} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Drawer Modal - For wider content
 */
export function DrawerModal({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full sm:max-w-2xl overflow-y-auto", className)}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="py-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
