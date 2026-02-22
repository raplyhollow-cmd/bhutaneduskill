"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink, Github, Sparkles, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    id: 1,
    title: "Bhutan Digital Classroom",
    description: "Transforming education across 50+ schools with AI-powered learning paths and real-time student analytics.",
    category: "EdTech",
    year: "2025",
    image: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    tags: ["Next.js", "AI/ML", "PostgreSQL", "Clerk"],
    stats: { students: "15,000+", schools: "50+", impact: "95%" },
    link: "#",
    github: "#"
  },
  {
    id: 2,
    title: "Career Compass AI",
    description: "An intelligent career matching system using psychometric assessments and AI to guide students toward their ideal paths.",
    category: "AI/ML",
    year: "2025",
    image: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    tags: ["TypeScript", "OpenAI", "Drizzle", "Neon"],
    stats: { students: "8,500+", matches: "12,000+", accuracy: "89%" },
    link: "#",
    github: "#"
  },
  {
    id: 3,
    title: "School Management Portal",
    description: "Complete administrative ecosystem for Bhutan's Ministry of Education with multi-tenant architecture.",
    category: "SaaS",
    year: "2024",
    image: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    tags: ["React", "PostgreSQL", "Vercel", "Stripe"],
    stats: { users: "25,000+", requests: "1M+", uptime: "99.9%" },
    link: "#",
    github: "#"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ceramic-white to-ceramic-gray-50 dark:from-ceramic-gray-950 dark:to-ceramic-gray-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
            className="absolute top-20 right-20 w-96 h-96 bg-ceramic-brand/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [180, 90, 180],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
            className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-ceramic-brand/10 text-ceramic-brand border-ceramic-brand/20">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Our Work
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-ceramic-primary dark:text-white mb-6 leading-tight">
              Building the Future of
              <span className="block mt-2 bg-gradient-to-r from-ceramic-brand to-orange-600 bg-clip-text text-transparent">
                Education in Bhutan
              </span>
            </h1>

            <p className="text-xl text-ceramic-secondary dark:text-ceramic-gray-300 max-w-2xl mx-auto leading-relaxed">
              A showcase of innovative projects transforming how students learn, teachers teach, and schools operate across the kingdom.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-8"
          >
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                className="group"
              >
                <Link href={project.link}>
                  <div className="relative bg-white dark:bg-ceramic-gray-900 rounded-3xl overflow-hidden border border-ceramic-border hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    {/* Project Header with Gradient */}
                    <div
                      className="relative h-48 sm:h-64 overflow-hidden"
                      style={{ background: project.image }}
                    >
                      {/* Pattern overlay */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                          backgroundSize: '24px 24px'
                        }} />
                      </div>

                      {/* Category badge */}
                      <div className="absolute top-6 left-6">
                        <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-medium">
                          {project.category}
                        </Badge>
                      </div>

                      {/* Year badge */}
                      <div className="absolute top-6 right-6">
                        <Badge variant="outline" className="bg-white/10 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-medium">
                          {project.year}
                        </Badge>
                      </div>

                      {/* Floating title */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                          {project.title}
                        </h3>
                      </div>
                    </div>

                    {/* Project Content */}
                    <div className="p-8">
                      <p className="text-lg text-ceramic-secondary dark:text-ceramic-gray-300 mb-6 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-ceramic-gray-100 dark:bg-ceramic-gray-800 text-ceramic-secondary dark:text-ceramic-gray-300 px-3 py-1 text-xs font-medium"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {Object.entries(project.stats).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-2xl font-bold text-ceramic-primary dark:text-white">
                              {value}
                            </div>
                            <div className="text-xs text-ceramic-dimmed capitalize">
                              {key === 'impact' ? 'Success Rate' : key}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-ceramic-border">
                        <Button
                          variant="ceramic"
                          className="flex-1 gap-2 rounded-xl"
                          style={{ background: project.image }}
                        >
                          View Project
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl hover:bg-ceramic-gray-100 dark:hover:bg-ceramic-gray-800"
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Hover glow effect */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${project.image.replace('135deg', 'to right')}, transparent 40%)`,
                      }}
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden border border-ceramic-border bg-white dark:bg-ceramic-gray-900 p-12 text-center"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-br from-ceramic-brand to-orange-600" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-ceramic-primary dark:text-white mb-4">
                Let's Build Something Amazing Together
              </h2>
              <p className="text-lg text-ceramic-secondary dark:text-ceramic-gray-300 mb-8 max-w-xl mx-auto">
                Have a project in mind? We'd love to hear about it and explore how we can help bring your vision to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button
                    variant="ceramic"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                    style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
                  >
                    Start a Conversation
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/packages">
                  <Button variant="outline" size="lg" className="rounded-full px-8">
                    View Packages
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
