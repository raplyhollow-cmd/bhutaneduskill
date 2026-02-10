"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

interface TestimonialProps {
  name: string;
  role: string;
  school: string;
  quote: string;
  rating: number;
  avatar: string;
  color: string;
}

function TestimonialCard({ name, role, school, quote, rating, avatar, color }: TestimonialProps) {
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>

        {/* Quote */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          "{quote}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
          >
            {avatar}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {role} • {school}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialsOrbit() {
  const testimonials: TestimonialProps[] = [
    {
      name: "Tashi Wangmo",
      role: "Class 12 Student",
      school: "Yangchenphug HSS",
      quote: "Career Compass helped me discover my passion for environmental science. The assessment was spot-on!",
      rating: 5,
      avatar: "TW",
      color: "#f97316",
    },
    {
      name: "Karma Dorji",
      role: "Class 10 Student",
      school: "Motithang HSS",
      quote: "I was confused about what subjects to choose in Class 11. This platform made everything clear.",
      rating: 5,
      avatar: "KD",
      color: "#3b82f6",
    },
    {
      name: "Dechen Wangmo",
      role: "RUB Student",
      school: "CST Graduate",
      quote: "The RUB college search feature helped me find the perfect engineering program. Now pursuing my dreams!",
      rating: 5,
      avatar: "DW",
      color: "#10b981",
    },
    {
      name: "Sonam Tshering",
      role: "Class 11 Student",
      school: "Pelkhil HSS",
      quote: "The study abroad guidance is incredible. I now know exactly what I need to do to study in Australia.",
      rating: 5,
      avatar: "ST",
      color: "#8b5cf6",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 mb-6">
            <Quote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
              Success Stories
            </span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Students Like You Love Us
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of Bhutanese students who have found their path with Career Compass
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.name} variants={itemVariants}>
              <TestimonialCard {...testimonial} />
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { value: "4.9/5", label: "Average Rating" },
            { value: "2,500+", label: "Reviews" },
            { value: "95%", label: "Would Recommend" },
            { value: "50+", label: "Schools" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-900/50"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
