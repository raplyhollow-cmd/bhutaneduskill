/**
 * UNIVERSAL FEATURE FORM
 *
 * A reusable form component that works with any unified feature.
 * Automatically generates form fields based on schema definition.
 *
 * @example
 * <FeatureForm
 *   feature={LessonFeature}
 *   onSubmit={handleSubmit}
 *   initialValues={lesson}
 *   mode="edit"
 * />
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export type FormMode = "create" | "edit" | "view";

export interface ColumnDefinition {
  type: "text" | "integer" | "boolean" | "timestamp" | "date" | "email" | "reference" | "json" | "enum";
  required?: boolean;
  label?: string;
  description?: string;
  options?: string[];
  multiline?: boolean;
  rows?: number;
  reference?: {
    table: string;
    displayField?: string;
    onDelete?: string;
  };
  isArray?: boolean;
}

export interface SchemaDefinition {
  [key: string]: ColumnDefinition;
}

export interface FeatureFormProps<T = any> {
  // Feature configuration
  schema: SchemaDefinition;
  mode?: FormMode;

  // Form data
  initialValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onCancel?: () => void;

  // Reference data for foreign key fields
  referenceData?: Record<string, any[]>;

  // UI
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;

  // Layout
  layout?: "vertical" | "horizontal" | "grid";
  columns?: 1 | 2 | 3;
  excludeFields?: string[];
  includeFields?: string[];

  // Custom field renderers
  fieldRenderers?: Record<string, (props: FieldRendererProps) => React.ReactNode>;

  // Validation
  validationSchema?: z.ZodSchema<any>;

  // Styling
  className?: string;
}

export interface FieldRendererProps {
  field: any;
  column: ColumnDefinition;
  name: string;
  disabled?: boolean;
  referenceData?: any[];
}

/**
 * Generate Zod schema from column definition
 */
function generateZodSchema(schema: SchemaDefinition): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, column] of Object.entries(schema)) {
    let fieldSchema: z.ZodTypeAny;

    switch (column.type) {
      case "integer":
        fieldSchema = z.number();
        if (!column.required) fieldSchema = fieldSchema.nullable().optional();
        break;
      case "boolean":
        fieldSchema = z.boolean();
        if (!column.required) fieldSchema = fieldSchema.optional();
        break;
      case "timestamp":
      case "date":
        fieldSchema = z.string();
        if (!column.required) fieldSchema = fieldSchema.optional();
        break;
      case "json":
        fieldSchema = z.any();
        break;
      case "enum":
        fieldSchema = z.enum(column.options as [string, ...string[]]);
        if (!column.required) fieldSchema = fieldSchema.optional().nullable();
        break;
      case "reference":
      case "email":
      case "text":
      default:
        fieldSchema = z.string();
        if (!column.required) fieldSchema = fieldSchema.optional().nullable();
        break;
    }

    shape[key] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Custom field renderers for different column types
 */
function FieldRenderer({ field, column, name, disabled = false, referenceData = [] }: FieldRendererProps) {
  const isArray = column.isArray;

  // Handle array types (checkboxes)
  if (isArray && column.type === "text" && column.options) {
    return (
      <FormItem>
        <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {column.label || name}
        </FormLabel>
        <FormControl>
          <div className="space-y-2">
            {column.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${name}-${option}`}
                  checked={field.value?.includes(option)}
                  onCheckedChange={(checked) => {
                    const current = field.value || [];
                    const newValue = checked
                      ? [...current, option]
                      : current.filter((v: string) => v !== option);
                    field.onChange(newValue);
                  }}
                  disabled={disabled}
                />
                <Label htmlFor={`${name}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        </FormControl>
        {column.description && (
          <FormDescription>{column.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  // Boolean field - use switch
  if (column.type === "boolean") {
    return (
      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
            {column.label || name}
          </FormLabel>
          {column.description && (
            <FormDescription>{column.description}</FormDescription>
          )}
        </div>
        <FormControl>
          <Switch
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    );
  }

  // Enum field - use select
  if (column.type === "enum" && column.options) {
    return (
      <FormItem>
        <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {column.label || name}
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${column.label || name}`} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {column.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {column.description && (
          <FormDescription>{column.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  // Reference field - use select with reference data
  if (column.type === "reference" && referenceData.length > 0) {
    const displayField = column.reference?.displayField || "name";

    return (
      <FormItem>
        <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {column.label || name}
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${column.label || name}`} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {referenceData.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item[displayField] || item.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {column.description && (
          <FormDescription>{column.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  // Date field
  if (column.type === "date") {
    return (
      <FormItem>
        <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {column.label || name}
        </FormLabel>
        <FormControl>
          <Input type="date" {...field} disabled={disabled} />
        </FormControl>
        {column.description && (
          <FormDescription>{column.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  // Email field
  if (column.type === "email") {
    return (
      <FormItem>
        <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {column.label || name}
        </FormLabel>
        <FormControl>
          <Input type="email" placeholder={`Enter ${column.label || name}`} {...field} disabled={disabled} />
        </FormControl>
        {column.description && (
          <FormDescription>{column.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  // Integer field
  if (column.type === "integer") {
    return (
      <FormItem>
        <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {column.label || name}
        </FormLabel>
        <FormControl>
          <Input
            type="number"
            placeholder={`Enter ${column.label || name}`}
            {...field}
            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
            disabled={disabled}
          />
        </FormControl>
        {column.description && (
          <FormDescription>{column.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  // Multiline text field
  if (column.multiline || column.type === "json") {
    return (
      <FormItem>
        <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {column.label || name}
        </FormLabel>
        <FormControl>
          <Textarea
            placeholder={`Enter ${column.label || name}`}
            rows={column.rows || 3}
            {...field}
            disabled={disabled}
          />
        </FormControl>
        {column.description && (
          <FormDescription>{column.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  }

  // Default text input
  return (
    <FormItem>
      <FormLabel className={cn(column.required && "after:content-['*'] after:ml-1 after:text-destructive")}>
        {column.label || name}
      </FormLabel>
      <FormControl>
        <Input placeholder={`Enter ${column.label || name}`} {...field} disabled={disabled} />
      </FormControl>
      {column.description && (
        <FormDescription>{column.description}</FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );
}

/**
 * Main FeatureForm Component
 */
export function FeatureForm<T extends Record<string, any>>({
  schema,
  mode = "create",
  initialValues,
  onSubmit,
  onCancel,
  referenceData = {},
  title,
  description,
  submitLabel,
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
  layout = "vertical",
  columns = 1,
  excludeFields = ["id", "createdAt", "updatedAt"],
  includeFields,
  fieldRenderers = {},
  validationSchema,
  className,
}: FeatureFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate validation schema if not provided
  const finalValidationSchema = validationSchema || generateZodSchema(schema);

  const form = useForm<z.infer<typeof finalValidationSchema>>({
    resolver: zodResolver(finalValidationSchema),
    defaultValues: initialValues as any || {},
  });

  // Set initial values when they change
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  // Filter fields based on include/exclude
  const getFieldsToRender = (): string[] => {
    if (includeFields && includeFields.length > 0) {
      return includeFields;
    }
    return Object.keys(schema).filter((key) => !excludeFields.includes(key));
  };

  const fieldsToRender = getFieldsToRender();

  // Handle form submission
  const handleSubmit = async (data: T) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get submit button label based on mode
  const getSubmitLabel = () => {
    if (submitLabel) return submitLabel;
    switch (mode) {
      case "create":
        return "Create";
      case "edit":
        return "Save Changes";
      case "view":
        return "OK";
      default:
        return "Submit";
    }
  };

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div
              className={cn(
                "grid gap-4",
                layout === "horizontal" && "grid-cols-[180px_1fr] items-start",
                layout === "grid" && `grid-cols-${columns}`,
                layout === "vertical" && "grid-cols-1"
              )}
            >
              {fieldsToRender.map((fieldName) => {
                const column = schema[fieldName];
                if (!column) return null;

                // Skip fields in view mode that aren't meant to be displayed
                if (mode === "view" && column.type === "json") {
                  return null;
                }

                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as any}
                    render={(field) => {
                      // Use custom renderer if provided
                      if (fieldRenderers[fieldName]) {
                        return (
                          <div className="space-y-2">
                            {fieldRenderers[fieldName]({
                              field,
                              column,
                              name: fieldName,
                              disabled: disabled || mode === "view" || loading,
                              referenceData: referenceData[fieldName],
                            })}
                          </div>
                        );
                      }

                      return (
                        <FieldRenderer
                          field={field}
                          column={column}
                          name={fieldName}
                          disabled={disabled || mode === "view" || loading}
                          referenceData={referenceData[fieldName]}
                        />
                      );
                    }}
                  />
                );
              })}
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting || loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {cancelLabel}
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || loading || disabled || mode === "view"}
              >
                {(isSubmitting || loading) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {getSubmitLabel()}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/**
 * View mode component - displays data without form controls
 */
export function FeatureView<T extends Record<string, any>>({
  schema,
  data,
  title,
  description,
  excludeFields = ["id", "createdAt", "updatedAt"],
  className,
}: {
  schema: SchemaDefinition;
  data: T;
  title?: string;
  description?: string;
  excludeFields?: string[];
  className?: string;
}) {
  const fieldsToDisplay = Object.keys(schema).filter((key) => !excludeFields.includes(key));

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fieldsToDisplay.map((fieldName) => {
            const column = schema[fieldName];
            const value = data[fieldName];

            return (
              <div key={fieldName} className="border-b pb-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  {column.label || fieldName}
                </dt>
                <dd className="mt-1 text-sm">
                  {value === null || value === undefined ? (
                    <span className="text-muted-foreground">—</span>
                  ) : column.type === "boolean" ? (
                    value ? "Yes" : "No"
                  ) : column.type === "date" || column.type === "timestamp" ? (
                    new Date(value).toLocaleDateString()
                  ) : column.type === "json" ? (
                    <pre className="text-xs bg-muted p-2 rounded">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    String(value)
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
