"use client";

import { motion } from "framer-motion";
import { Terminal, GitBranch, Zap, Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const buildOutput = [
  { text: "$ npm run build", class: "text-purple-400", delay: 0 },
  { text: "", class: "", delay: 100 },
  { text: "• Building...", class: "text-gray-400", delay: 200 },
  { text: "• Compiling...", class: "text-gray-400", delay: 300 },
  { text: "", class: "", delay: 400 },
  { text: "✓ Created 375 routes", class: "text-green-400", delay: 500 },
  { text: "✓ Generated 231 pages", class: "text-green-400", delay: 600 },
  { text: "✓ Compiled 200+ API routes", class: "text-green-400", delay: 700 },
  { text: "", class: "", delay: 800 },
  { text: "Build completed in 42.3s", class: "text-cyan-400", delay: 900 },
  { text: "", class: "", delay: 1000 },
  { text: "✓ Build successful", class: "text-green-400 font-bold", delay: 1100 },
];

const gitLog = [
  { hash: "a2f2281", msg: "fix: API errors, school search seeding", time: "2 hours ago" },
  { hash: "a2020a9", msg: "feat: add AI journal features", time: "5 hours ago" },
  { hash: "22c0af0", msg: "docs: update changelog", time: "8 hours ago" },
  { hash: "de89bed", msg: "fix: resolve portal access issues", time: "1 day ago" },
  { hash: "74b7d91", msg: "fix: restore login routing", time: "1 day ago" },
];

function TerminalWindow() {
  const [lines, setLines] = useState<typeof buildOutput>([]);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    buildOutput.forEach((line, index) => {
      const timeout = setTimeout(() => {
        setLines((prev) => [...prev, line]);
      }, line.delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="ml-4 text-sm text-gray-500 font-mono">npm run build</span>
      </div>

      {/* Terminal content */}
      <div className="p-6 font-mono text-sm min-h-[320px]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={line.class}
          >
            {line.text}
          </motion.div>
        ))}

        {/* Cursor */}
        {lines.length >= buildOutput.length && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
            className="text-purple-400"
          >
            ▊
          </motion.span>
        )}
      </div>
    </div>
  );
}

function GitGraph() {
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="ml-4 text-sm text-gray-500 font-mono">git log --oneline -5</span>
      </div>

      {/* Git log */}
      <div className="p-4 font-mono text-sm space-y-2">
        {gitLog.map((commit, i) => (
          <motion.div
            key={commit.hash}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-start gap-3"
          >
            {/* Commit node */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              {i < gitLog.length - 1 && <div className="w-0.5 h-6 bg-gray-700" />}
            </div>

            {/* Commit info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-purple-400">{commit.hash}</span>
                <span className="text-gray-300 truncate">{commit.msg}</span>
              </div>
              <span className="text-xs text-gray-600">{commit.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function BuildProcessSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-300">Development Process</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            How We <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Build</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Multi-agent parallel development, batch-fix strategies, and disciplined version control.
            Here's our development methodology in action.
          </p>
        </motion.div>

        {/* Methodology cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {[
            {
              icon: <Users className="w-5 h-5" />,
              title: "Parallel Agents",
              description: "Multiple agents working simultaneously on different features",
              color: "text-purple-400",
              bg: "bg-purple-500/10"
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: "Batch-Fix Approach",
              description: "173 errors fixed in 30min vs 2+ hours iteratively",
              color: "text-orange-400",
              bg: "bg-orange-500/10"
            },
            {
              icon: <GitBranch className="w-5 h-5" />,
              title: "Version Control",
              description: "Disciplined commits with descriptive messages",
              color: "text-cyan-400",
              bg: "bg-cyan-500/10"
            }
          ].map((method, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className={`inline-flex p-2 rounded-lg ${method.bg} ${method.color} mb-4`}>
                {method.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{method.title}</h3>
              <p className="text-sm text-gray-400">{method.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Terminal and Git grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Build output terminal */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Build Output</h3>
              <p className="text-sm text-gray-500">Real compilation output from our latest build</p>
            </div>
            <TerminalWindow />
          </motion.div>

          {/* Git graph */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Commit History</h3>
              <p className="text-sm text-gray-500">Recent commits showing development progress</p>
            </div>
            <GitGraph />
          </motion.div>
        </div>

        {/* Session stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-orange-500/10 border border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-purple-400" />
              <div>
                <h4 className="text-lg font-semibold text-white">Feb 18 Mega-Session</h4>
                <p className="text-sm text-gray-400">94 files created across 9 parallel batches</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">94</div>
                <div className="text-xs text-gray-500">Files</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">9</div>
                <div className="text-xs text-gray-500">Batches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">8</div>
                <div className="text-xs text-gray-500">Hours</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
