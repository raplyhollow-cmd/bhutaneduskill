"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    quote: "The career assessment showed me paths I never knew existed. Now I'm confident about my future!",
    name: "Karma Y.",
    role: "Class 12, Motithang HSS",
    avatar: "KY",
    rating: 5,
    color: "from-orange-500 to-red-500",
  },
  {
    quote: "I can finally track homework and progress in one place. My students are more engaged than ever.",
    name: "Mrs. Tshering",
    role: "Math Teacher, Thimphu HSS",
    avatar: "MT",
    rating: 5,
    color: "from-blue-500 to-indigo-600",
  },
  {
    quote: "I can see my daughter's attendance and grades instantly. Communication with teachers is so easy now!",
    name: "Pema L.",
    role: "Parent, Thimphu",
    avatar: "PL",
    rating: 5,
    color: "from-purple-500 to-pink-500",
  },
];

// Testimonial card with avatar pulse
function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: typeof testimonials[0];
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: index * 0.15,
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div
        className={`relative h-full p-6 md:p-8 rounded-3xl transition-all duration-500 overflow-hidden ${
          isHovered
            ? "bg-white dark:bg-gray-900 shadow-2xl shadow-orange-500/10 border-2 border-orange-200 dark:border-orange-800"
            : "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 shadow-lg"
        }`}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmerBorder_2s_linear_infinite] bg-gradient-to-r from-transparent via-orange-500/10 to-transparent pointer-events-none" />

        {/* Quote icon with animation */}
        <motion.div
          animate={isHovered ? { rotate: [0, -5, 5, -5, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Quote className={`w-8 h-8 bg-gradient-to-br ${testimonial.color} bg-clip-text text-transparent opacity-30`} />
        </motion.div>

        {/* Quote text */}
        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6">
          "{testimonial.quote}"
        </p>

        {/* Rating stars */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 + i * 0.05, duration: 0.3 }}
            >
              <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
            </motion.span>
          ))}
        </div>

        {/* Author info with avatar */}
        <div className="flex items-center gap-4">
          {/* Avatar with pulse effect */}
          <motion.div
            className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold shadow-lg`}
            animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {/* Pulse ring on hover */}
            {isHovered && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${testimonial.color}`}
                style={{ filter: "blur(8px)", zIndex: -1 }}
              />
            )}
            <span className="relative z-10 text-sm">{testimonial.avatar}</span>
          </motion.div>

          {/* Name and role */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              {testimonial.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {testimonial.role}
            </p>
          </div>
        </div>

        {/* Decorative corner accent */}
        <div
          className={`absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl ${testimonial.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-tl-3xl`}
        />
      </div>
    </motion.div>
  );
}

export function TestimonialsOrbit() {
  return (
    <section className="relative py-24 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Background orbital effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-orange-500/5"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-blue-500/5"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-purple-500/5"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4"
          >
            <Star className="w-4 h-4 fill-current" />
            Trusted by thousands
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by
            <span className="block gradient-text-animated mt-2">Students & Teachers</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of happy students, teachers, and parents across Bhutan.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Stats bar with animated counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            {[
              { value: "500+", label: "Schools", icon: "🏫" },
              { value: "50K+", label: "Students", icon: "🎓" },
              { value: "10K+", label: "Teachers", icon: "👨‍🏫" },
              { value: "25K+", label: "Parents", icon: "👪" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg hover:shadow-orange-500/10 transition-all group"
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                  className="text-3xl"
                >
                  {stat.icon}
                </motion.span>
                <div className="text-left">
                  <div className="text-2xl md:text-3xl font-bold gradient-text-animated">
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

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-6"
        >
          {[
            { text: "SOC 2 Compliant", icon: "🔒" },
            { text: "GDPR Ready", icon: "🛡️" },
            { text: "99.9% Uptime", icon: "⚡" },
          ].map((badge, index) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
            >
              <span>{badge.icon}</span>
              <span>{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
