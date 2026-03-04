/**
 * SMART FIELD RENDERERS
 *
 * Intelligent form field components that automatically render
 * appropriate inputs based on field type and configuration.
 */

"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Check, ChevronsUpDown, Search, X, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Types
export interface SmartFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  reference?: {
    table: string;
    displayField?: string;
    searchEndpoint?: string;
  };
  multiline?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Smart Field - Automatically chooses the right input component
 */
export function SmartField({
  name,
  label,
  description,
  required,
  disabled = false,
  placeholder,
  options = [],
  reference,
  multiline = false,
  rows = 3,
  min,
  max,
  step,
  className,
}: SmartFieldProps) {
  const { control, setValue, watch, formState: { errors } } = useFormContext();
  const value = watch(name);
  const error = errors[name];

  // Determine field type based on configuration
  const getFieldType = (): "text" | "textarea" | "number" | "select" | "multiselect" | "boolean" | "date" | "reference" => {
    if (options.length > 0) {
      return "select";
    }
    if (reference) {
      return "reference";
    }
    if (multiline) {
      return "textarea";
    }
    if (typeof min === "number" || typeof max === "number" || step) {
      return "number";
    }
    return "text";
  };

  const fieldType = getFieldType();

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <FormLabel className={cn(required && "after:content-['*'] after:ml-1 after:text-destructive")}>
          {label}
        </FormLabel>
      )}

      {fieldType === "select" && (
        <SelectField
          name={name}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      {fieldType === "reference" && (
        <ReferenceField
          name={name}
          reference={reference}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      {fieldType === "textarea" && (
        <TextareaField
          name={name}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
        />
      )}

      {fieldType === "number" && (
        <NumberField
          name={name}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
      )}

      {fieldType === "boolean" && (
        <BooleanField name={name} disabled={disabled} label={label} />
      )}

      {fieldType === "text" && (
        <TextField name={name} placeholder={placeholder} disabled={disabled} />
      )}

      {fieldType === "date" && (
        <DateField name={name} placeholder={placeholder} disabled={disabled} />
      )}

      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </div>
  );
}

/**
 * Text Input Field
 */
function TextField({
  name,
  placeholder,
  disabled = false,
}: {
  name: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { register } = useFormContext();

  return (
    <Input
      {...register(name)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

/**
 * Textarea Field
 */
function TextareaField({
  name,
  placeholder,
  rows = 3,
  disabled = false,
}: {
  name: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const { register } = useFormContext();

  return (
    <Textarea
      {...register(name)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
    />
  );
}

/**
 * Number Input Field
 */
function NumberField({
  name,
  placeholder,
  min,
  max,
  step,
  disabled = false,
}: {
  name: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  const { register } = useFormContext();

  return (
    <Input
      {...register(name, { valueAsNumber: true })}
      type="number"
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    />
  );
}

/**
 * Select Dropdown Field
 */
function SelectField({
  name,
  options = [],
  placeholder,
  disabled = false,
}: {
  name: string;
  options?: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { control, setValue } = useFormContext();
  const value = useWatch({ name, control });

  return (
    <Select
      value={value || ""}
      onValueChange={(val) => setValue(name, val)}
      disabled={disabled}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select an option"} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Boolean Switch Field
 */
function BooleanField({
  name,
  disabled = false,
  label,
}: {
  name: string;
  disabled?: boolean;
  label?: string;
}) {
  const { register, setValue, watch } = useFormContext();
  const value = watch(name);

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
      <FormLabel className="cursor-pointer">{label || name}</FormLabel>
      <Switch
        checked={value || false}
        onCheckedChange={(checked) => setValue(name, checked)}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Date Picker Field
 */
function DateField({
  name,
  placeholder = "Pick a date",
  disabled = false,
}: {
  name: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { setValue, watch } = useFormContext();
  const value = watch(name);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            className={cn(
              "w-full pl-3 text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {value ? format(new Date(value), "PPP") : <span>{placeholder}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => {
            if (date) {
              setValue(name, date.toISOString());
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Reference Field with Search
 */
function ReferenceField({
  name,
  reference,
  placeholder = "Search...",
  disabled = false,
}: {
  name: string;
  reference?: {
    table: string;
    displayField?: string;
    searchEndpoint?: string;
  };
  placeholder?: string;
  disabled?: boolean;
}) {
  const { setValue, watch } = useFormContext();
  const value = watch(name);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Fetch options when search query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setOptions([]);
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const endpoint = reference?.searchEndpoint || `/api/resources/${reference.table}`;
        const response = await fetch(`${endpoint}?search=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const result = await response.json();
          const displayField = reference?.displayField || "name";
          const items = (result.data || []).map((item: any) => ({
            value: item.id,
            label: item[displayField] || item.name || item.id,
          }));
          setOptions(items);
        }
      } catch (err) {
        console.error("Error fetching options:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchOptions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, reference?.table, reference?.searchEndpoint, reference?.displayField]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            placeholder="Search..."
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="max-h-60 overflow-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="flex flex-col">
              {options.map((option) => (
                <button
                  key={option.value}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => {
                    setValue(name, option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Hook to use watch within the component
function useWatch(props: { name: string; control: any }) {
  return props.control?._watch?.(props.name) || undefined;
}

// Re-export components for direct use
export {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  BooleanField,
  DateField,
  ReferenceField,
};
