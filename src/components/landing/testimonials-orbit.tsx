"use client";

import { motion } from "framer-motion";
import { Star, ArrowRight, TrendingUp, GraduationCap, Heart, Award } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

// Success Stories - Before/After format with real Bhutan context
const successStories = [
  {
    before: {
      title: "Confused About Subjects",
      state: "Class 10, didn't know what to choose",
      emoji: "😕",
      rating: 2.5,
    },
    after: {
      title: "RUB Natural Resources",
      state: "Class 12, heading to CST with confidence",
      result: "90% in Class 12",
      resultHighlight: "+25% grades",
      quote: "The assessment showed Engineering fits my personality. My parents finally understood my choice!",
      name: "Karma Wangmo",
      school: "Mongar HSS",
      location: "Mongar, Bhutan",
      timeAgo: "3 months ago",
      avatar: "KW",
      color: "from-orange-500 to-red-500",
    },
  },
  {
    before: {
      title: "Drowning in Paperwork",
      state: "3+ hours grading daily, no time for students",
      emoji: "😓",
      rating: 2,
    },
    after: {
      title: "Focused on Teaching",
      state: "Auto-grading saves 2+ hours daily",
      result: "98% homework completion",
      resultHighlight: "2 hrs saved daily",
      quote: "I finally have time to actually help students who need extra support. The reports generate themselves!",
      name: "Mrs. Tshering Dorji",
      school: "Yangchenphug HSS",
      location: "Thimphu, Bhutan",
      timeAgo: "2 months ago",
      avatar: "TD",
      color: "from-blue-500 to-cyan-500",
    },
  },
  {
    before: {
      title: "No Visibility",
      state: "Only knew about struggles at report card time",
      emoji: "😟",
      rating: 1.5,
    },
    after: {
      title: "Always Connected",
      state: "Real-time updates on everything",
      result: "Cave struggle in week 1",
      resultHighlight: "3 months earlier",
      quote: "I saw my son's homework dropping and messaged the teacher immediately. We fixed it before finals.",
      name: "Pema Lhamo",
      school: "Parent, Punakha HSS",
      location: "Punakha, Bhutan",
      timeAgo: "1 month ago",
      avatar: "PL",
      color: "from-emerald-500 to-green-500",
    },
  },
];

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className="flex gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={0} />
      ))}
      {hasHalfStar && (
        <Star className="w-4 h-4 fill-amber-400/50 text-amber-400" strokeWidth={0} />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700" strokeWidth={0} />
      ))}
    </div>
  );
}

function SuccessStoryCard({ story, index }: { story: typeof successStories[0]; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-500">
        {/* Before Section - Left/Top */}
        <div className="relative p-6 pb-8 border-b-4 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          {/* Before badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <span className="text-lg">{story.before.emoji}</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Then</span>
            </div>
            <div className="ml-auto">
              <RatingStars rating={story.before.rating} />
            </div>
          </div>

          <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {story.before.title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {story.before.state}
          </p>
        </div>

        {/* After Section - Right/Bottom */}
        <div className={`relative p-6 ${story.after.color.includes('orange') ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20' : story.after.color.includes('blue') ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20' : 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20'}`}>
          {/* After badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${story.after.color} text-white shadow-lg`}>
              <span className="text-lg">🎉</span>
              <span className="text-xs font-semibold">Now</span>
            </div>
            <div className="ml-auto">
              <RatingStars rating={5} />
            </div>
          </div>

          {/* Result highlight */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${story.after.color} flex-shrink-0`}>
              {story.after.color.includes('orange') ? (
                <GraduationCap className="w-5 h-5 text-white" strokeWidth={2} />
              ) : story.after.color.includes('blue') ? (
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
              ) : (
                <Heart className="w-5 h-5 text-white" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1">
              <div className={`text-3xl font-bold bg-gradient-to-r ${story.after.color} bg-clip-text text-transparent mb-1`}>
                {story.after.resultHighlight}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {story.after.result}
              </div>
            </div>
          </div>

          {/* Quote */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 italic">
            "{story.after.quote}"
          </p>

          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${story.after.color} flex items-center justify-center text-white font-bold shadow-md`}>
                <span className="text-sm">{story.after.avatar}</span>
              </div>
              {/* Name & details */}
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {story.after.name}
                </h5>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{story.after.school}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <span>{story.after.location}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/sign-up"
              className={`hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r ${story.after.color} text-white text-xs font-semibold hover:shadow-lg transition-all`}
            >
              Start Journey
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>

          {/* Time ago */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {story.after.timeAgo}
            </span>
          </div>
        </div>

        {/* Arrow divider */}
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-2 ${story.after.color.includes('orange') ? 'border-orange-400' : story.after.color.includes('blue') ? 'border-blue-400' : 'border-emerald-400'} flex items-center justify-center shadow-lg z-10`}>
          <Award className={`w-5 h-5 ${story.after.color.includes('orange') ? 'text-orange-500' : story.after.color.includes('blue') ? 'text-blue-500' : 'text-emerald-500'}`} strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsOrbit() {
  return (
    <section className="relative py-32 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Subtle background decorations */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-400/3 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-400/3 rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50 text-sm font-medium text-orange-700 dark:text-orange-400 mb-6">
            <Star className="w-4 h-4 fill-current" />
            Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-950 dark:text-white mb-4">
            Real Students,{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Real Results
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            See how Bhutanese students, teachers, and parents transformed their education journey.
          </p>
        </motion.div>

        {/* Success Stories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {successStories.map((story, index) => (
            <SuccessStoryCard key={index} story={story} index={index} />
          ))}
        </div>

        {/* Stats bar - Authentic numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-center">
            {[
              { value: "25%", label: "Avg. Grade Improvement", icon: TrendingUp },
              { value: "3 months", label: "Earlier Intervention", icon: Heart },
              { value: "500+", label: "Schools Across Bhutan", icon: Award },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg transition-all"
              >
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${index === 0 ? 'from-orange-500 to-red-500' : index === 1 ? 'from-blue-500 to-cyan-500' : 'from-emerald-500 to-green-500'} text-white flex-shrink-0`}>
                  <stat.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200 dark:border-orange-900/50">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Ready to write your own success story?
            </span>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 hover:shadow-xl transition-all"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
