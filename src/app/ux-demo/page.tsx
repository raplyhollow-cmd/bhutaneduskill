/**
 * CLERK-STYLE UX REVOLUTION - DEMO PAGE
 *
 * This page showcases all the new progressive UX components.
 *
 * Press Cmd+K / Ctrl+K to open the Command Palette
 */

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Sparkles,
  Users,
  FileText,
  Settings,
  Home,
  Plus,
  CheckCircle,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import all the new UX components
import {
  CommandPalette,
  useCommandPalette,
  createNavigationCommands,
  createQuickActionsCommands,
} from "@/components/ui/command-palette"
import {
  ExpressAddModal,
  useExpressAdd,
  ExpressAddButton,
} from "@/components/ui/express-add-modal"
import {
  InPlaceText,
  InPlaceTextarea,
  InPlaceField,
  InPlaceTextWithUndo,
} from "@/components/ui/in-place-editor"
import ProgressiveForm, {
  type FormStep,
  SelectOption,
} from "@/components/ui/progressive-form"
import { ToastProvider, useToast } from "@/components/ui/toaster"

// =============================================================================
// MOCK DATA
// =============================================================================

const students = [
  { id: "1", name: "Tashi Wangyel", class: "Class 8A", email: "tashi.w@school.bt" },
  { id: "2", name: "Karma Dorji", class: "Class 9B", email: "karma.d@school.bt" },
  { id: "3", name: "Deki Pemo", class: "Class 10A", email: "deki.p@school.bt" },
]

// =============================================================================
// DEMO SECTIONS
// =============================================================================

function CommandPaletteDemo() {
  const router = useRouter()
  const { isOpen, open, close } = useCommandPalette()
  const { success, info } = useToast()

  const commands = [
    ...createNavigationCommands(router),
    ...createQuickActionsCommands(router),
    {
      id: "show-toast",
      label: "Show Toast Notification",
      icon: CheckCircle,
      shortcut: "T",
      action: () => success({ title: "Toast from command palette!", duration: 2000 }),
    },
    {
      id: "demo-info",
      label: "About This Demo",
      icon: Sparkles,
      action: () =>
        info({
          title: "Clerk-Style UX Demo",
          description: "This demo showcases progressive UX components inspired by Linear, Clerk, and Notion.",
        }),
    },
  ]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Command Palette</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              Cmd+K
            </kbd> or click below
          </p>
        </div>
        <motion.button
          onClick={open}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium shadow-md"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap className="w-4 h-4" />
          Open Command Palette
        </motion.button>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Features:</strong> Searchable commands, keyboard navigation, quick actions,
          grouped items, shortcuts display.
        </p>
      </div>

      <CommandPalette isOpen={isOpen} onClose={close} commands={commands} />
    </section>
  )
}

function ExpressAddDemo() {
  const { isOpen: isStudentOpen, open: openStudent, close: closeStudent } = useExpressAdd()
  const { isOpen: isTeacherOpen, open: openTeacher, close: closeTeacher } = useExpressAdd()
  const { success } = useToast()

  const handleAddStudent = async (name: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Add to our local list (in real app, this would be an API call)
    return { success: true }
  }

  const handleAddTeacher = async (name: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return { success: true }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Express Add Modal</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Single-field quick-add with auto-save on blur. No save button needed.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <ExpressAddButton onClick={openStudent} icon={Users}>
          Add Student
        </ExpressAddButton>
        <ExpressAddButton onClick={openTeacher} icon={GraduationCap} variant="outline">
          Add Teacher
        </ExpressAddButton>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Features:</strong> Auto-submit on blur, Enter key support, toast confirmation,
          loading state, validation with character count.
        </p>
      </div>

      <ExpressAddModal
        isOpen={isStudentOpen}
        onClose={closeStudent}
        onSubmit={handleAddStudent}
        title="Add New Student"
        description="Enter the student's full name"
        placeholder="e.g. Tashi Wangyel"
        successMessage="Student added successfully!"
        minLength={2}
        maxLength={50}
        icon={Users}
      />

      <ExpressAddModal
        isOpen={isTeacherOpen}
        onClose={closeTeacher}
        onSubmit={handleAddTeacher}
        title="Add New Teacher"
        placeholder="e.g. Karma Dorji"
        successMessage="Teacher added successfully!"
        minLength={2}
        maxLength={50}
        icon={GraduationCap}
      />
    </section>
  )
}

function InPlaceEditorDemo() {
  const [studentName, setStudentName] = React.useState("Tashi Wangyel")
  const [studentEmail, setStudentEmail] = React.useState("tashi.w@school.bt")
  const [bio, setBio] = React.useState("Excellent student with a passion for mathematics.")

  const handleSave = async (value: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { success: true }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">In-Place Editor</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click to edit inline. Auto-saves on blur. Press Esc to cancel.
        </p>
      </div>

      {/* Student Card Demo */}
      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            TW
          </div>
          <div className="flex-1 space-y-4">
            <InPlaceField
              label="Student Name"
              value={studentName}
              onSave={handleSave}
              onChange={setStudentName}
              placeholder="Student name"
              minLength={2}
            />

            <InPlaceField
              label="Email"
              value={studentEmail}
              onSave={handleSave}
              onChange={setStudentEmail}
              type="email"
              placeholder="Email address"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <InPlaceTextarea
                value={bio}
                onSave={handleSave}
                onChange={setBio}
                placeholder="Student bio"
                rows={3}
                maxLength={200}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Undo Variant Demo */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Try the undo variant:</strong>{" "}
          <InPlaceTextWithUndo
            value="Click here to edit with undo"
            onSave={handleSave}
            placeholder="Editable text with undo"
          />
        </p>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Features:</strong> Click-to-edit, auto-save on blur, Escape to cancel, visual
          feedback, loading state, undo support, multi-line textarea.
        </p>
      </div>
    </section>
  )
}

function ProgressiveFormDemo() {
  const [showForm, setShowForm] = React.useState(false)
  const [completedData, setCompletedData] = React.useState<Record<string, string | string[]> | null>(null)
  const { success } = useToast()

  const subjectOptions: SelectOption[] = [
    { value: "math", label: "Mathematics", icon: BookOpen, description: "Algebra, Geometry, Calculus" },
    { value: "science", label: "Science", icon: Zap, description: "Physics, Chemistry, Biology" },
    { value: "english", label: "English", icon: FileText, description: "Literature, Writing, Grammar" },
    { value: "dzongkha", label: "Dzongkha", icon: BookOpen, description: "National language" },
  ]

  const steps: FormStep[] = [
    {
      id: "name",
      question: "What's the student's full name?",
      type: "text",
      placeholder: "Enter full name",
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    {
      id: "email",
      question: "What's their email address?",
      type: "email",
      placeholder: "student@school.bt",
      required: true,
    },
    {
      id: "grade",
      question: "What grade are they in?",
      type: "select",
      required: true,
      options: [
        { value: "6", label: "Class 6" },
        { value: "7", label: "Class 7" },
        { value: "8", label: "Class 8" },
        { value: "9", label: "Class 9" },
        { value: "10", label: "Class 10" },
        { value: "11", label: "Class 11" },
        { value: "12", label: "Class 12" },
      ],
    },
    {
      id: "subjects",
      question: "Select their primary subject",
      type: "select",
      required: true,
      options: subjectOptions,
    },
    {
      id: "notes",
      question: "Any additional notes?",
      type: "textarea",
      placeholder: "Special requirements, achievements, etc.",
      rows: 3,
      maxLength: 200,
    },
  ]

  const handleSubmit = async (values: Record<string, string | string[]>) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setCompletedData(values)
    setShowForm(false)
    success({ title: "Student enrolled successfully!", duration: 3000 })
    return { success: true }
  }

  if (completedData) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Progressive Form</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Form completed!</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Enrollment Complete
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {completedData.name} has been enrolled in Class {completedData.grade}
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => {
              setCompletedData(null)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Enroll Another Student
          </motion.button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Progressive Form</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            One question at a time. Auto-advance on valid input.
          </p>
        </div>
        {!showForm && (
          <motion.button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium shadow-md"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Start Enrollment
          </motion.button>
        )}
      </div>

      {showForm ? (
        <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <ProgressiveForm
            steps={steps}
            onSubmit={handleSubmit}
            title="Student Enrollment"
            subtitle="Let's get the student set up with just a few questions."
            submitLabel="Complete Enrollment"
            showProgress={true}
            showStepNumber={true}
            autoAdvance={true}
            onComplete={() => setShowForm(false)}
          />
          <button
            onClick={() => setShowForm(false)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Features:</strong> One question per screen, auto-advance, progress indicator,
            keyboard navigation, smooth slide transitions, validation feedback, skip optional
            questions.
          </p>
        </div>
      )}
    </section>
  )
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function UXDemoPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  UX Revolution Demo
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Clerk-Style Progressive Components
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <span>Cmd</span>
                <span>+</span>
                <span>K</span>
              </kbd>
              <span className="hidden sm:inline">to open command palette</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              No More Save, OK, Cancel Buttons
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience the future of form interactions. Progressive, in-place, and lightning-fast.
              Inspired by Linear, Clerk, and Notion.
            </p>
          </motion.div>

          {/* Component Demos */}
          <div className="space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CommandPaletteDemo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ExpressAddDemo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <InPlaceEditorDemo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ProgressiveFormDemo />
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Built with Framer Motion animations + Design tokens from{" "}
              <span className="font-medium">src/styles/design-tokens.ts</span>
            </p>
          </motion.div>
        </main>
      </div>
    </ToastProvider>
  )
}
