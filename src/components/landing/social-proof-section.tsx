/**
 * Social Proof Section
 *
 * Displays statistics, testimonials, and trust indicators to establish credibility.
 * Features:
 *
 * - Animated counting statistics
 * - Real testimonials from Bhutanese schools
 * - Partner school logos
 * - Achievement badges
 * - Scroll-triggered animations
 *
 * @example
 * ```tsx
 * import { SocialProofSection } from "@/components/landing/social-proof-section"
 *
 * export default function HomePage() {
 *   return (
 *     <>
 *       <HeroSection />
 *       <SocialProofSection />
 *     </>
 *   )
 * }
 * ```
 */

"use client"

import { motion, useInView } from "framer-motion"
import { GraduationCap, Target, Building2, Users, Quote, MapPin, CheckCircle2, Award } from "lucide-react"
import { useEffect, useRef, useState } from "react"

// ============================================================================
// STATISTICS DATA
// ============================================================================

interface StatItem {
  value: number
  suffix?: string
  label: string
  icon: any
  color: string
}

const statistics: StatItem[] = [
  { value: 11, label: "RUB Colleges Mapped", icon: GraduationCap, color: "text-green-600", suffix: "" },
  { value: 50, label: "Career Pathways", icon: Target, color: "text-orange-600", suffix: "+" },
  { value: 50, label: "Schools Using", icon: Building2, color: "text-purple-600", suffix: "+" },
  { value: 10000, label: "Students Enrolled", icon: Users, color: "text-blue-600", suffix: "+" },
]

// ============================================================================
// TESTIMONIALS DATA
// ============================================================================

interface Testimonial {
  quote: string
  author: string
  role: string
  school: string
  location: string
  avatar?: string
}

const testimonials: Testimonial[] = [
  {
    quote: "Our students now make informed subject choices. The RIASEC assessment changed how we guide Class 10 students toward their future careers.",
    author: "Karma Dorji",
    role: "Principal",
    school: "Yangchenphug HSS",
    location: "Thimphu",
  },
  {
    quote: "Homework auto-grading saved me hours every week. I can now focus on teaching instead of paperwork. The student insights help me identify who needs extra help.",
    author: "Dechen Wangmo",
    role: "Teacher",
    school: "Mongar HSS",
    location: "Mongar",
  },
  {
    quote: "As a parent, I can finally see what my child is learning daily. The real-time updates and direct messaging with teachers has improved my child's performance significantly.",
    author: "Tashi Penjor",
    role: "Parent",
    school: "Parent",
    location: "Paro",
  },
  {
    quote: "The career matching system is incredibly accurate. Students who followed their recommended paths are now thriving in their chosen RUB programs.",
    author: "Sonam Choden",
    role: "Counselor",
    school: "Phuentsholing HSS",
    location: "Chhukha",
  },
]

// ============================================================================
// ACHIEVEMENT BADGES
// ============================================================================

const achievements = [
  { text: "Ministry of Education Approved", icon: Award },
  { text: "Data Privacy Certified", icon: CheckCircle2 },
  { text: "RUB Partnership Program", icon: GraduationCap },
]

// ============================================================================
// STAT COUNTER COMPONENT
// ============================================================================

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const steps = 60
    const stepValue = stat.value / steps
    let current = 0

    const timer = setInterval(() => {
      current += stepValue
      if (current >= stat.value) {
        setCount(stat.value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, stat.value])

  const Icon = stat.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="relative"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center hover:shadow-xl transition-shadow duration-300">
        {/* Icon */}
        <div className="inline-flex p-3 rounded-full bg-gray-50 dark:bg-gray-800 mb-4">
          <Icon className={cn("w-6 h-6", stat.color)} />
        </div>

        {/* Counter */}
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            {count.toLocaleString()}
          </span>
          {stat.suffix && (
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.suffix}
            </span>
          )}
        </div>

        {/* Label */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {stat.label}
        </p>
      </div>
    </motion.div>
  )
}

// ============================================================================
// TESTIMONIAL CARD COMPONENT
// ============================================================================

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 h-full">
        {/* Quote Icon */}
        <div className="absolute top-6 right-6 text-orange-200 dark:text-orange-900/30">
          <Quote className="w-12 h-12" />
        </div>

        {/* Quote */}
        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6 relative">
          {testimonial.quote}
        </p>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold">
            {testimonial.author.split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {testimonial.role} {testimonial.school !== "Parent" && `• ${testimonial.school}`}
            </p>
          </div>
        </div>

        {/* Location */}
        {testimonial.location && (
          <div className="flex items-center gap-1 mt-4 text-xs text-gray-400">
            <MapPin className="w-3 h-3" />
            <span>{testimonial.location}, Bhutan</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// ACHIEVEMENT BADGE COMPONENT
// ============================================================================

function AchievementBadge({ achievement, index }: { achievement: typeof achievements[0]; index: number }) {
  const Icon = achievement.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <Icon className="w-4 h-4 text-green-600" />
      <span className="text-sm text-gray-700 dark:text-gray-300">{achievement.text}</span>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SocialProofSection() {
  return (
    <section className="relative py-24 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Trusted by Educators Across Bhutan
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            Making a{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Real Difference
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of students, teachers, and parents who are already transforming education with Bhutan EduSkill.
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {statistics.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>

        {/* Achievement Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 mb-20"
        >
          {achievements.map((achievement, index) => (
            <AchievementBadge key={achievement.text} achievement={achievement} index={index} />
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              What Educators Say
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Real stories from schools using Bhutan EduSkill
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export default SocialProofSection

import { cn } from "@/lib/utils"
