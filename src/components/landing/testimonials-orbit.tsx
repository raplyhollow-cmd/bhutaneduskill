"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Quote, Star, Orbit } from "lucide-react";

interface TestimonialOrbitProps {
  name: string;
  role: string;
  school: string;
  quote: string;
  rating: number;
  avatar: string;
  color: string;
  delay: number;
}

function TestimonialCard({
  name,
  role,
  school,
  quote,
  rating,
  avatar,
  color,
  delay,
}: TestimonialOrbitProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        delay,
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      {/* Orbiting ring effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${color}, transparent, ${color})`,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      {/* Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Quote icon */}
        <motion.div
          className="absolute top-4 right-4 opacity-10"
          animate={isHovered ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Quote className="w-16 h-16" />
        </motion.div>

        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <motion.svg
              key={i}
              className={`w-5 h-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
              viewBox="0 0 20 20"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay + i * 0.1, type: "spring" }}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </motion.svg>
          ))}
        </div>

        {/* Quote */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          "{quote}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {avatar}
          </motion.div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {role} • {school}
            </div>
          </div>
        </div>

        {/* Hover glow */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
    </motion.div>
  );
}

export function TestimonialsOrbit() {
  const testimonials: TestimonialOrbitProps[] = [
    {
      name: "Tashi Wangmo",
      role: "Class 12 Student",
      school: "Yangchenphug HSS",
      quote: "Career Compass helped me discover my passion for environmental science. The assessment was spot-on!",
      rating: 5,
      avatar: "TW",
      color: "#f97316",
      delay: 0,
    },
    {
      name: "Karma Dorji",
      role: "Class 10 Student",
      school: "Motithang HSS",
      quote: "I was confused about what subjects to choose in Class 11. This platform made everything clear.",
      rating: 5,
      avatar: "KD",
      color: "#3b82f6",
      delay: 0.1,
    },
    {
      name: "Dechen Wangmo",
      role: "RUB Student",
      school: "CST Graduate",
      quote: "The RUB college search feature helped me find the perfect engineering program. Now pursuing my dreams!",
      rating: 5,
      avatar: "DW",
      color: "#10b981",
      delay: 0.2,
    },
    {
      name: "Sonam Tshering",
      role: "Class 11 Student",
      school: "Pelkhil HSS",
      quote: "The study abroad guidance is incredible. I now know exactly what I need to do to study in Australia.",
      rating: 5,
      avatar: "ST",
      color: "#8b5cf6",
      delay: 0.3,
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Animated orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.1), transparent 70%)",
          }}
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)",
          }}
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Orbital rings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full border border-orange-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full border border-purple-500"
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 border border-purple-200 dark:border-purple-900/50 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Orbit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </motion.div>
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
              Success Stories
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Students Like You
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {" "}Love Us
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of Bhutanese students who have found their path with Career Compass.
            Here's what they have to say.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: "4.9", label: "Average Rating" },
            { value: "2,500+", label: "Reviews" },
            { value: "95%", label: "Would Recommend" },
            { value: "50+", label: "Schools" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-900/50"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ready to write your own success story?
          </p>
          <a
            href="/dashboard/assessment"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-semibold shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
          >
            Start Your Journey
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
