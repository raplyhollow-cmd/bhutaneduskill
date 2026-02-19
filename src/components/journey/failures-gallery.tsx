"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileCode, Calendar, GitCommit } from "lucide-react";
import { useState } from "react";

interface ErrorEntry {
  id: string;
  title: string;
  date: string;
  files: number | string;
  error: string;
  solution: string;
  codeBefore: string;
  codeAfter: string;
  filePath: string;
  color: string;
}

const errors: ErrorEntry[] = [
  {
    id: "ts-errors",
    title: "173 TypeScript Schema Errors",
    date: "February 13, 2026",
    files: "26+ files",
    error: "Property 'X' does not exist on type",
    solution: "Added ~50 missing columns to schema.ts",
    codeBefore: "// Missing: firstName, lastName, clerkUserId, schoolId...",
    codeAfter: "firstName: text('first_name'),\nlastName: text('last_name'),\nclerkUserId: text('clerk_user_id'),\n// ... 47 more columns",
    filePath: "src/lib/db/schema.ts",
    color: "rgb(239 68 68)"
  },
  {
    id: "redirect-loops",
    title: "Portal Redirect Loops",
    date: "February 18, 2026",
    files: 17,
    error: "Users bounced between setup and portal pages",
    solution: "Reverted sign-in redirect, fixed routing logic",
    codeBefore: "// Sign-in redirected to /setup/unified",
    codeAfter: "// Sign-in redirects to / → routes to proper portal",
    filePath: "src/app/sign-in/[[...sign-in]]/page.tsx",
    color: "rgb(249 115 22)"
  },
  {
    id: "school-search",
    title: "School Search Empty Results",
    date: "February 18, 2026",
    files: "1 API + 1 script",
    error: "School data never seeded to database",
    solution: "Created seed script, inserted 41 schools",
    codeBefore: "SELECT * FROM schools WHERE name LIKE '%yang%' -- Returns 0 rows",
    codeAfter: "-- 41 schools seeded including:\n-- Yangchenphug HSS, Motithang HSS, etc.",
    filePath: "scripts/seed-bhutan-schools.ts",
    color: "rgb(234 179 8)"
  },
  {
    id: "json-parse",
    title: "JSON Parsing Errors",
    date: "February 18, 2026",
    files: "10 files, 12 locations",
    error: "SyntaxError: Unexpected token '<' (HTML not JSON)",
    solution: "Added content-type validation before parsing",
    codeBefore: "const data = await response.json(); // Throws on HTML error pages",
    codeAfter: "const contentType = response.headers.get('content-type');\nif (contentType?.includes('application/json')) {\n  return await response.json();\n}",
    filePath: "Multiple API call locations",
    color: "rgb(168 85 247)"
  },
  {
    id: "ai-timeout",
    title: "AI Insights Timeout",
    date: "February 18, 2026",
    files: 1,
    error: "Generic fallbacks instead of AI responses",
    solution: "Removed aggressive 10-second timeout wrapper",
    codeBefore: "const result = await withTimeout(aiCall(), 10000);",
    codeAfter: "const result = await aiCall(); // Let Gemini handle timeout",
    filePath: "src/app/api/ai/insights/route.ts",
    color: "rgb(59 130 246)"
  },
  {
    id: "assessment-save",
    title: "Assessment Saving Failed",
    date: "February 18, 2026",
    files: 3,
    error: "POST /api/assessments returned 500",
    solution: "Added required fields (title, description, etc.)",
    codeBefore: "await db.insert(assessments).values({ type, userId });",
    codeAfter: "await db.insert(assessments).values({\n  title: `${type} Assessment`,\n  description: 'Career assessment',\n  dueDate: new Date(),\n  totalPoints: 100,\n  passingScore: 60,\n  type,\n  userId\n});",
    filePath: "src/app/api/assessments/route.ts",
    color: "rgb(34 197 94)"
  }
];

function ErrorCard({ error, index }: { error: ErrorEntry; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="relative"
    >
      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
        {/* Status bar */}
        <div className="h-1 bg-gradient-to-r from-red-500 to-green-500" />

        {/* Header */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Status icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{error.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30">
                  FIXED
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {error.date}
                </span>
                <span className="flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5" />
                  {typeof error.files === 'number' ? `${error.files} files` : error.files}
                </span>
              </div>

              {/* Error/Solution */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-300 font-mono text-xs">{error.error}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{error.solution}</span>
                </div>
              </div>
            </div>

            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <GitCommit className="w-5 h-5 text-gray-400" />
              </motion.div>
            </button>
          </div>

          {/* Expanded code diff */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {/* File path */}
              <div className="text-xs font-mono text-gray-500 bg-black/30 rounded px-3 py-1.5">
                📄 {error.filePath}
              </div>

              {/* Before */}
              <div>
                <div className="text-xs text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Before
                </div>
                <pre className="bg-red-950/30 rounded-lg p-3 overflow-x-auto border border-red-500/20">
                  <code className="text-xs text-red-300 font-mono">{error.codeBefore}</code>
                </pre>
              </div>

              {/* After */}
              <div>
                <div className="text-xs text-green-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> After
                </div>
                <pre className="bg-green-950/30 rounded-lg p-3 overflow-x-auto border border-green-500/20">
                  <code className="text-xs text-green-300 font-mono whitespace-pre-wrap">{error.codeAfter}</code>
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function FailuresGallery() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-300">Errors Overcome</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            From <span className="text-red-400">Failure</span> to{" "}
            <span className="text-green-400">Success</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Every error was a learning opportunity. Click to see the before/after code that fixed
            these critical issues.
          </p>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { label: "Errors Fixed", value: "50+", color: "text-green-400" },
            { label: "Files Modified", value: "100+", color: "text-blue-400" },
            { label: "Batch Fixes", value: "5", color: "text-purple-400" },
            { label: "Current Status", value: "0 Errors", color: "text-cyan-400" }
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Error cards grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {errors.map((error, index) => (
            <ErrorCard key={error.id} error={error} index={index} />
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 font-mono">
            $ npm run build → ✓ 375 routes compiled • 0 errors
          </p>
        </motion.div>
      </div>
    </section>
  );
}
