"use client";

import { logger } from "@/lib/logger";

import { motion, Variants } from "framer-motion";
import { GraduationCap, School, Building2, BookOpen, Users, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Fetch real schools from API instead of hardcoded data
interface School {
  id: string;
  name: string;
  students: number;
  color?: string;
}

interface TrustedByProps {
  className?: string;
}

export function TrustedByNew({ className }: TrustedByProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/marketing/schools");
      if (res.ok) {
        const data = await res.json();
        // Add colors to schools
        const schoolsWithColors = data.schools.map((school: {
          id: string;
          name: string;
          code: string;
          logo?: string;
        }, index: number) => ({
          ...school,
          // Assign colors from original palette
          color: index === 0 ? "rgb(249 115 22)" :
                 index === 1 ? "rgb(59 130 246)" :
                 index === 2 ? "rgb(139 92 246)" :
                 index === 3 ? "rgb(236 72 153)" :
                 index === 4 ? "rgb(34 197 94)" :
                 index === 5 ? "rgb(245 158 11)" :
                 index === 6 ? "rgb(139 92 246)" :
                 "rgb(239 68 68)",
        }));
        setSchools(schoolsWithColors);
      }
    } catch (error) {
      logger.error("Failed to fetch schools:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  if (isLoading) {
    return (
      <section className={cn("py-16 md:py-24", className)}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </section>
    );
  }

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Trusted by students from schools across Bhutan
          </h2>
          <p className="text-sm text-muted-foreground">
            Join thousands of students discovering their career path
          </p>
        </motion.div>

        {/* Logos Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
        >
          {schools.map((school) => {
            const Icon = school.students > 500 ? GraduationCap :
                         school.students > 300 ? School :
                         school.students > 200 ? Building2 :
                         BookOpen;
            return (
              <motion.div
                key={school.id}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Logo Container */}
                <div className="relative mb-3">
                  <Icon
                    className="h-10 w-10 transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: school.color,
                    }}
                  />
                </div>

                {/* School Name */}
                <span className="text-sm font-medium text-gray-600 transition-colors duration-300 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-200">
                  {school.name}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats Section - Show real totals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {[
            { value: `${schools.reduce((sum, s) => sum + s.students, 0).toLocaleString()}+`, label: "Students Served" },
            { value: `${schools.length}+`, label: "Schools Partnered" },
            { value: "20+", label: "Districts Covered" },
            { value: "95%", label: "Satisfaction Rate" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Export as default for backwards compatibility
export default TrustedByNew;
