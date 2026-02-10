"use client";

import { motion } from "framer-motion";
import { Star, Quote, GraduationCap, Briefcase, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock data for testimonials
const testimonials = [
  {
    id: 1,
    quote: "Career Compass helped me discover my passion for engineering. The RIASEC assessment showed me that my skills align perfectly with mechanical engineering. Now I'm studying at CST with a clear career path!",
    author: "Tashi Wangyel",
    role: "Class 12 Student",
    school: "Yangchenphug HSS",
    avatar: "TW",
    rating: 5,
    icon: GraduationCap,
    outcome: "Admitted to CST",
  },
  {
    id: 2,
    quote: "As a teacher, I've seen how this platform transforms my students' confidence. They come to career counseling sessions with real questions and clear goals. It's made my job so much more rewarding.",
    author: "Karma Choden",
    role: "Career Counselor",
    school: "Motithang HSS",
    avatar: "KC",
    rating: 5,
    icon: Briefcase,
    outcome: "200+ Students Guided",
  },
  {
    id: 3,
    quote: "The learning modules helped me improve my math scores significantly. I used to struggle with calculus, but the step-by-step videos and practice problems made everything clear. My grades went from 60% to 85%!",
    author: "Dechen Pema",
    role: "Class 10 Student",
    school: "Pelkhil HSS",
    avatar: "DP",
    rating: 5,
    icon: Users,
    outcome: "25% Grade Improvement",
  },
  {
    id: 4,
    quote: "What impressed me most was how personalized the recommendations were. It didn't just give generic advice - it understood my context as a Bhutanese student and suggested local scholarship opportunities I never knew existed.",
    author: "Sonam Dorji",
    role: "Class 12 Graduate",
    school: "Drukgyel HSS",
    avatar: "SD",
    rating: 5,
    icon: GraduationCap,
    outcome: "Scholarship Recipient",
  },
];

// Success metrics
const successMetrics = [
  {
    value: "10,000+",
    label: "Students Served",
    description: "Across all 20 districts of Bhutan",
    icon: Users,
  },
  {
    value: "92%",
    label: "Career Clarity",
    description: "Students report clearer career goals",
    icon: GraduationCap,
  },
  {
    value: "85%",
    label: "College Placement",
    description: "Of graduates placed in desired programs",
    icon: Briefcase,
  },
  {
    value: "4.8/5",
    label: "User Satisfaction",
    description: "Average rating from students and teachers",
    icon: Star,
  },
];

interface TestimonialsProps {
  className?: string;
  showMetrics?: boolean;
  limit?: number;
}

export function Testimonials({
  className,
  showMetrics = true,
  limit,
}: TestimonialsProps) {
  const displayedTestimonials = limit
    ? testimonials.slice(0, limit)
    : testimonials;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <section className={cn("py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Trusted by Students Across Bhutan
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Hear from students and teachers who have transformed their educational
            journey with Career Compass.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-2"
        >
          {displayedTestimonials.map((testimonial) => {
            const Icon = testimonial.icon;
            return (
              <motion.div key={testimonial.id} variants={itemVariants}>
                <Card className="h-full clerk-card-glow group relative overflow-hidden">
                  <CardContent className="p-8">
                    {/* Quote Icon */}
                    <div className="mb-4 flex items-start justify-between">
                      <Quote className="h-8 w-8 text-orange-500/20 group-hover:text-orange-500/40 transition-colors" />
                      <div className="flex gap-1">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Quote */}
                    <blockquote className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Outcome Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <Icon className="h-4 w-4" />
                      {testimonial.outcome}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold text-sm shadow-lg">
                        {testimonial.avatar}
                      </div>

                      {/* Author Info */}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {testimonial.author}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {testimonial.role}
                          {testimonial.school && ` · ${testimonial.school}`}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Success Metrics */}
        {showMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {successMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                    {metric.value}
                  </div>
                  <div className="mt-2 font-semibold text-gray-700 dark:text-gray-300">
                    {metric.label}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {metric.description}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Individual Testimonial Card Component for reuse
interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  school?: string;
  avatar: string;
  rating: number;
  outcome?: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  school,
  avatar,
  rating,
  outcome,
  className,
}: TestimonialCardProps) {
  return (
    <Card className={cn("h-full clerk-card-glow group relative overflow-hidden", className)}>
      <CardContent className="p-8">
        {/* Quote Icon */}
        <div className="mb-4 flex items-start justify-between">
          <Quote className="h-8 w-8 text-orange-500/20 group-hover:text-orange-500/40 transition-colors" />
          <div className="flex gap-1">
            {Array.from({ length: rating }).map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
        </div>

        {/* Quote */}
        <blockquote className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          "{quote}"
        </blockquote>

        {/* Outcome Badge */}
        {outcome && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <GraduationCap className="h-4 w-4" />
            {outcome}
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold text-sm shadow-lg">
            {avatar}
          </div>

          {/* Author Info */}
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {author}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {role}
              {school && ` · ${school}`}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
    </Card>
  );
}

// Compact testimonial for smaller spaces
interface CompactTestimonialProps {
  quote: string;
  author: string;
  role: string;
  avatar: string;
  className?: string;
}

export function CompactTestimonial({
  quote,
  author,
  role,
  avatar,
  className,
}: CompactTestimonialProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <Quote className="mb-3 h-6 w-6 text-orange-500/30" />
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
          {avatar}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {author}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{role}</div>
        </div>
      </div>
    </div>
  );
}
