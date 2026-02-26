# Workflow Innovation - Component Specifications
## Implementation Guide for Next-Gen UX Components

**Companion to:** [workflow-innovation-report.md](./workflow-innovation-report.md)
**Last Updated:** February 25, 2026

---

## Component Library

This document provides detailed specifications for each revolutionary component proposed in the innovation report.

---

## 1. Command Palette (`CommandPalette`)

### Purpose
The Command Palette is the central hub for all user actions. Inspired by Raycast, it provides keyboard-first access to everything in the application.

### API

```typescript
// src/components/workflow/command-palette.tsx

import { useEffect, useState, useCallback } from "react";

interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  keywords?: string[];
  category: CommandCategory;
}

type CommandCategory =
  | 'navigation'
  | 'create'
  | 'action'
  | 'settings'
  | 'search';

interface CommandPaletteProps {
  commands: Command[];
  open: boolean;
  onClose: () => void;
  placeholder?: string;
  recentCommands?: string[];
}

export function CommandPalette({
  commands,
  open,
  onClose,
  placeholder = "What do you need?",
  recentCommands = []
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [category, setCategory] = useState<CommandCategory | 'all'>('all');

  // Fuzzy search with scoring
  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    const fuse = new Fuse(commands, {
      keys: ['label', 'description', 'keywords'],
      threshold: 0.3,
      includeScore: true
    });

    return fuse.search(query).map(r => r.item);
  }, [commands, query]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Input */}
        <div className="flex items-center px-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-4 text-lg outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="px-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                    index === selectedIndex
                      ? "bg-violet-50 text-violet-900"
                      : "hover:bg-gray-50"
                  )}
                >
                  {cmd.icon && (
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      index === selectedIndex
                        ? "bg-violet-100 text-violet-600"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {cmd.icon}
                    </span>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium">{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-sm text-gray-500">{cmd.description}</p>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex gap-4">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>esc</kbd> Close</span>
          </div>
          {category !== 'all' && (
            <button
              onClick={() => setCategory('all')}
              className="hover:text-gray-700"
            >
              Show All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Usage Example

```typescript
// In your layout or root component
const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCmdPaletteOpen(v => !v);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

const commands: Command[] = [
  {
    id: 'add-student',
    label: 'Add Student',
    description: 'Create a new student record',
    shortcut: '⌘K S',
    icon: <UserPlus className="w-4 h-4" />,
    action: () => router.push('/school-admin/students/add'),
    keywords: ['create', 'new', 'student', 'register'],
    category: 'create'
  },
  {
    id: 'create-class-quick',
    label: 'Quick Create Class',
    description: 'Create a class with smart defaults',
    action: () => openExpressAdd('class'),
    category: 'create'
  },
  // ... more commands
];

return (
  <>
    {children}
    <CommandPalette
      commands={commands}
      open={cmdPaletteOpen}
      onClose={() => setCmdPaletteOpen(false)}
    />
  </>
);
```

---

## 2. Express Add Modal (`ExpressAddModal`)

### Purpose
A streamlined modal for quick entity creation. Captures only essential information, uses smart defaults, and provides a "Customize" option for detailed entry.

### API

```typescript
// src/components/workflow/express-add-modal.tsx

interface ExpressAddConfig<T> {
  entityType: string;
  title: string;
  icon: React.ReactNode;
  fields: ExpressField[];
  smartDefaults: Partial<T>;
  detector?: (input: string) => Partial<T> | null;
  onSubmit: (data: T) => Promise<void>;
  onCustomize?: () => void;
}

interface ExpressField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'autocomplete';
  placeholder: string;
  required: boolean;
  options?: { value: string; label: string }[];
  detect?: boolean; // Enable auto-detection for this field
}

interface ExpressAddModalProps<T> {
  open: boolean;
  onClose: () => void;
  config: ExpressAddConfig<T>;
  mode: 'single' | 'multi'; // single closes after add, multi allows continuous adding
}

export function ExpressAddModal<T extends Record<string, any>>({
  open,
  onClose,
  config,
  mode = 'multi'
}: ExpressAddModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>(config.smartDefaults);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detected, setDetected] = useState<Partial<T> | null>(null);

  // Auto-detection from primary input
  const handlePrimaryInput = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, [config.fields[0].name]: value }));

    if (config.detector) {
      const detected = config.detector(value);
      if (detected) {
        setDetected(detected);
        setFormData(prev => ({ ...prev, ...detected }));
      }
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await config.onSubmit(formData as T);

      if (mode === 'multi') {
        // Reset for next entry, keep smart defaults
        setFormData(config.smartDefaults);
        setDetected(null);
      } else {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-100 text-violet-600">
            {config.icon}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{config.title}</h2>
            <p className="text-sm text-gray-500">
              Quick add • Press Enter to submit
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Detected Info */}
        {detected && (
          <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <Sparkles className="w-4 h-4 inline mr-1" />
            Auto-detected: {Object.values(detected).join(', ')}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {config.fields.map((field, index) => (
            <div key={field.name}>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => {
                  if (index === 0) {
                    handlePrimaryInput(e.target.value);
                  } else {
                    setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                  }
                }}
                placeholder={field.placeholder}
                required={field.required}
                className={cn(
                  "w-full px-3 py-2.5 border rounded-lg outline-none transition-all",
                  "focus:ring-2 focus:ring-violet-500 focus:border-violet-500",
                  index === 0 && "text-lg"
                )}
                autoFocus={index === 0}
              />
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {config.onCustomize && (
              <button
                type="button"
                onClick={config.onCustomize}
                className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Customize
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all",
                "bg-violet-600 hover:bg-violet-700 disabled:opacity-50",
                mode === 'multi' && "flex-2"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mx-auto animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 inline mr-1" />
                  Add{mode === 'multi' && ' & Continue'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Usage Example

```typescript
// In your students list page
const [expressAddOpen, setExpressAddOpen] = useState(false);

const studentConfig: ExpressAddConfig<Student> = {
  entityType: 'student',
  title: 'Add Student',
  icon: <UserPlus className="w-5 h-5" />,
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: "Student's name",
      required: true
    },
    {
      name: 'grade',
      label: 'Grade',
      type: 'select',
      options: gradeOptions.map(g => ({ value: g, label: `Grade ${g}` })),
      required: true
    }
  ],
  smartDefaults: {
    grade: lastUsedGrade || '8',
    section: 'A',
    schoolId: user.schoolId
  },
  detector: (input) => {
    // Parse "Karma Dorji, Grade 8" format
    const match = input.match(/(.+?),\s*grade\s*(\d+)/i);
    if (match) {
      return { name: match[1].trim(), grade: match[2] };
    }
  },
  onSubmit: async (data) => {
    await createStudent(data);
    mutateStudents(); // Refresh list
  },
  onCustomize: () => {
    setExpressAddOpen(false);
    router.push('/school-admin/students/create');
  }
};

return (
  <>
    <Button onClick={() => setExpressAddOpen(true)}>
      <Plus className="w-4 h-4 mr-1" />
      Quick Add
    </Button>
    <ExpressAddModal
      open={expressAddOpen}
      onClose={() => setExpressAddOpen(false)}
      config={studentConfig}
      mode="multi"
    />
  </>
);
```

---

## 3. Progressive Form (`ProgressiveForm`)

### Purpose
A conversational form that shows one field at a time, making complex data entry feel like a chat. Inspired by Clerk's signup flow.

### API

```typescript
// src/components/workflow/progressive-form.tsx

interface ProgressiveField<T> {
  id: keyof T;
  question: string;
  type: 'input' | 'select' | 'multiselect' | 'autocomplete' | 'date';
  placeholder?: string;
  options?: { value: string; label: string; icon?: React.ReactNode }[];
  required: boolean;
  detect?: (context: FormContext<T>) => any;
  conditional?: (data: Partial<T>) => boolean;
  helpText?: string;
  skipLabel?: string;
  autoFocus?: boolean;
}

interface FormContext<T> {
  data: Partial<T>;
  step: number;
  totalSteps: number;
}

interface ProgressiveFormProps<T> {
  fields: ProgressiveField<T>[];
  onComplete: (data: T) => void | Promise<void>;
  initialData?: Partial<T>;
  showProgress?: boolean;
  className?: string;
}

export function ProgressiveForm<T extends Record<string, any>>({
  fields,
  onComplete,
  initialData = {},
  showProgress = true,
  className
}: ProgressiveFormProps<T>) {
  const [data, setData] = useState<Partial<T>>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Filter visible fields based on conditionals
  const visibleFields = fields.filter(field =>
    !field.conditional || field.conditional(data)
  );

  const currentField = visibleFields[currentStep];
  const progress = ((currentStep + 1) / visibleFields.length) * 100;

  // Auto-detection for current field
  useEffect(() => {
    if (currentField?.detect) {
      const detected = currentField.detect({ data, step: currentStep, totalSteps: visibleFields.length });
      if (detected) {
        setData(prev => ({ ...prev, [currentField.id]: detected }));
      }
    }
  }, [currentStep, currentField]);

  const handleNext = async (value: any) => {
    const newData = { ...data, [currentField.id]: value };
    setData(newData);

    if (currentStep < visibleFields.length - 1) {
      setDirection('forward');
      setCurrentStep(s => s + 1);
    } else {
      // Complete
      setIsSubmitting(true);
      await onComplete(newData as T);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(s => s - 1);
    }
  };

  const handleSkip = () => {
    handleNext(null);
  };

  return (
    <div className={cn("max-w-lg mx-auto", className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep + 1} of {visibleFields.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-violet-600 rounded-full"
              initial={{ width: `${((currentStep) / visibleFields.length) * 100}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Current Question */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: direction === 'forward' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction === 'forward' ? -20 : 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-1">{currentField.question}</h2>
        {currentField.helpText && (
          <p className="text-gray-500 text-sm mb-4">{currentField.helpText}</p>
        )}

        {/* Input based on type */}
        <div className="min-h-[60px]">
          {currentField.type === 'input' && (
            <input
              type="text"
              placeholder={currentField.placeholder}
              defaultValue={data[currentField.id] || ''}
              autoFocus={currentField.autoFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleNext(e.currentTarget.value);
                }
              }}
              className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}

          {currentField.type === 'select' && currentField.options && (
            <div className="grid grid-cols-2 gap-2">
              {currentField.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleNext(option.value)}
                  className={cn(
                    "p-4 border rounded-lg text-left transition-all hover:border-violet-300 hover:bg-violet-50",
                    data[currentField.id] === option.value && "border-violet-500 bg-violet-50 ring-2 ring-violet-500"
                  )}
                >
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* More field types... */}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={cn(
              "text-gray-500 hover:text-gray-700 disabled:opacity-30",
              "flex items-center gap-1"
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {!currentField.required && (
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              {currentField.skipLabel || 'Skip'}
            </button>
          )}

          <div className="text-sm text-gray-400">
            Press Enter to continue
          </div>
        </div>
      </motion.div>
    </div>
  );
}
```

### Usage Example (Student Onboarding)

```typescript
const onboardingFields: ProgressiveField<StudentData>[] = [
  {
    id: 'name',
    question: "What's your name?",
    type: 'input',
    placeholder: "Type your full name",
    required: true,
    autoFocus: true
  },
  {
    id: 'school',
    question: "Which school do you attend?",
    type: 'select',
    required: true,
    options: [
      { value: 'school-1', label: 'Motlhare School' },
      { value: 'school-2', label: 'Yangchenphug HSS' }
    ],
    detect: ({ data }) => {
      // Auto-detect from IP or email domain
      return detectSchoolFromContext();
    }
  },
  {
    id: 'grade',
    question: "What grade are you in?",
    type: 'select',
    required: true,
    options: grades.map(g => ({ value: g, label: `Grade ${g}` })),
    conditional: (data) => {
      // Only show if age suggests middle/high school
      return calculateAge(data.dateOfBirth) >= 11;
    }
  },
  {
    id: 'parentPhone',
    question: "What's your parent's phone number?",
    type: 'input',
    placeholder: "+975 17 XX XX XX",
    required: false,
    helpText: "We'll only use this for emergencies",
    skipLabel: "I'll add this later"
  }
];

function StudentOnboarding() {
  const handleComplete = async (data: StudentData) => {
    await createStudent(data);
    router.push('/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <ProgressiveForm
        fields={onboardingFields}
        onComplete={handleComplete}
      />
    </div>
  );
}
```

---

## 4. In-Place Editor (`InPlaceEditor`)

### Purpose
Edit content directly where it appears, without navigating to a separate edit page. Inspired by Notion's inline editing.

### API

```typescript
// src/components/workflow/in-place-editor.tsx

interface InPlaceEditorProps<T, K extends keyof T> {
  value: T;
  field: K;
  display: (value: T) => React.ReactNode;
  edit: (value: T, onChange: (newValue: T) => void) => React.ReactNode;
  onSave: (value: T) => Promise<void>;
  editMode?: 'click' | 'doubleClick' | 'focus';
  disabled?: boolean;
  className?: string;
}

export function InPlaceEditor<T, K extends keyof T>({
  value,
  field,
  display,
  edit,
  onSave,
  editMode = 'click',
  disabled = false,
  className
}: InPlaceEditorProps<T, K>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = useCallback(() => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
    setError(null);
  }, [value, disabled]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleClick = () => {
    if (editMode === 'click') startEdit();
  };

  const handleDoubleClick = () => {
    if (editMode === 'doubleClick') startEdit();
  };

  return (
    <div
      className={cn(
        "relative group",
        isEditing && "ring-2 ring-violet-500 rounded",
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? undefined : 0}
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {edit(editValue, setEditValue)}
          </div>
          <div className="flex items-center gap-1">
            {error && (
              <span className="text-red-500 text-sm">{error}</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 hover:bg-green-100 text-green-600 rounded"
              title="Save (Enter)"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
              title="Cancel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {display(value)}
          {!disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); startEdit(); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
              title="Click to edit"
            >
              <Pencil className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Usage Example

```typescript
// In a table row
<InPlaceEditor
  value={student}
  field="name"
  display={(s) => <span className="font-medium">{s.name}</span>}
  edit={(s, onChange) => (
    <input
      type="text"
      value={s.name}
      onChange={(e) => onChange({ ...s, name: e.target.value })}
      className="px-2 py-1 border rounded"
      autoFocus
    />
  )}
  onSave={async (updated) => {
    await updateStudent(updated.id, { name: updated.name });
    mutateStudents();
  }}
/>

// For a select field
<InPlaceEditor
  value={student}
  field="grade"
  display={(s) => (
    <Badge variant="outline">Grade {s.grade}</Badge>
  )}
  edit={(s, onChange) => (
    <select
      value={s.grade}
      onChange={(e) => onChange({ ...s, grade: e.target.value })}
      className="px-2 py-1 border rounded"
    >
      {gradeOptions.map(g => (
        <option key={g} value={g}>Grade {g}</option>
      ))}
    </select>
  )}
  onSave={async (updated) => {
    await updateStudent(updated.id, { grade: updated.grade });
    mutateStudents();
  }}
/>
```

---

## 5. Smart Suggestions (`SmartSuggestions`)

### Purpose
Intelligently suggest actions or values based on context, user history, and patterns.

### API

```typescript
// src/components/workflow/smart-suggestions.tsx

interface Suggestion<T> {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  reason: string; // Why this is suggested
  action: () => void | Promise<void>;
  confidence: number; // 0-1
}

interface SmartSuggestionsProps<T> {
  suggestions: Suggestion<T>[];
  onSelect: (suggestion: Suggestion<T>) => void;
  maxDisplay?: number;
  showReason?: boolean;
  position?: 'top' | 'bottom' | 'inline';
}

export function SmartSuggestions<T>({
  suggestions,
  onSelect,
  maxDisplay = 3,
  showReason = true,
  position = 'bottom'
}: SmartSuggestionsProps<T>) {
  // Sort by confidence and limit
  const topSuggestions = suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxDisplay);

  if (topSuggestions.length === 0) return null;

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4",
        position === 'top' && "mb-4",
        position === 'bottom' && "mt-4"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-violet-700 mb-3">
        <Sparkles className="w-4 h-4" />
        Suggestions
      </div>
      <div className="space-y-2">
        {topSuggestions.map(suggestion => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            className="w-full flex items-start gap-3 p-3 bg-white rounded-lg hover:bg-violet-50 transition-colors text-left group"
          >
            {suggestion.icon && (
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                {suggestion.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 group-hover:text-violet-700">
                {suggestion.label}
              </p>
              {suggestion.description && (
                <p className="text-sm text-gray-500">{suggestion.description}</p>
              )}
              {showReason && (
                <p className="text-xs text-violet-600 mt-1">
                  💡 {suggestion.reason}
                </p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Usage Example

```typescript
// Suggesting class configurations
function ClassCreator() {
  const [suggestions, setSuggestions] = useState<Suggestion<ClassConfig>[]>([]);

  useEffect(() => {
    // Generate suggestions based on existing classes
    const generateSuggestions = async () => {
      const existingClasses = await fetchClasses();
      const teachers = await fetchTeachers();

      const suggestions: Suggestion<ClassConfig>[] = [
        {
          id: 'popular-combo',
          label: 'Grade 8, Section B',
          description: 'Similar to your Grade 8-A',
          icon: <TrendingUp className="w-4 h-4" />,
          reason: "Most schools create a second section for Grade 8",
          confidence: 0.9,
          action: () => createClass({ grade: 8, section: 'B' })
        },
        {
          id: 'clone-last',
          label: `Clone ${existingClasses[0]?.name}`,
          description: 'Copy teachers and settings',
          icon: <Copy className="w-4 h-4" />,
          reason: "You just created a similar class",
          confidence: 0.85,
          action: () => cloneClass(existingClasses[0].id)
        },
        {
          id: 'assign-teacher',
          label: 'Assign Ms. Karma to new class',
          description: 'She has the lowest load',
          icon: <User className="w-4 h-4" />,
          reason: "Ms. Karma has only 2 homerooms (avg is 3)",
          confidence: 0.8,
          action: () => assignTeacher('teacher-123')
        }
      ];

      setSuggestions(suggestions);
    };

    generateSuggestions();
  }, []);

  return (
    <div>
      <SmartSuggestions
        suggestions={suggestions}
        onSelect={(s) => s.action()}
      />
      {/* Rest of class creation UI */}
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `src/components/workflow/` directory
- [ ] Set up base styling (animations, transitions)
- [ ] Implement `CommandPalette` with basic commands
- [ ] Add keyboard shortcut listener (Cmd+K)
- [ ] Create `ExpressAddModal` component
- [ ] Add command registry pattern

### Phase 2: Core Components
- [ ] Implement `ProgressiveForm` with animation
- [ ] Create `InPlaceEditor` with edit modes
- [ ] Build `SmartSuggestions` engine
- [ ] Add detection utilities (email, phone, grade)
- [ ] Create smart defaults hook

### Phase 3: Integration
- [ ] Refactor Student onboarding to use `ProgressiveForm`
- [ ] Add `ExpressAddModal` to Students list
- [ ] Add `InPlaceEditor` to tables (name, grade, etc.)
- [ ] Implement smart class creator with suggestions
- [ ] Add command palette to all layouts

### Phase 4: Polish
- [ ] Add animations and transitions
- [ ] Implement keyboard navigation everywhere
- [ ] Add loading and error states
- [ ] Create accessibility audit
- [ ] Performance optimization

---

## Design Tokens

```typescript
// src/components/workflow/styles.ts

export const workflowAnimations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }
};

export const workflowDurations = {
  fast: 150,
  normal: 200,
  slow: 300
};

export const workflowEasing = {
  default: [0.4, 0, 0.2, 1], // ease-out
  in: [0.4, 0, 1, 1], // ease-in
  out: [0, 0, 0.2, 1], // ease-out
  bounce: [0.68, -0.55, 0.265, 1.55]
};
```
