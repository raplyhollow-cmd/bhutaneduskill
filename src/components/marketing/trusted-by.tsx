"use client";

import { motion, Variants } from "framer-motion";
import { GraduationCap, School, Building2, BookOpen, Users, Award } from "lucide-react";
import { cn } from "@/lib/utils";

// NOTE: In production, this data should come from a CMS or database
// Schools/partners featured on landing page
const schools = [
  {
    id: 1,
    name: "Yangchenphug HSS",
    icon: GraduationCap,
    color: "rgb(249 115 22)",
  },
  {
    id: 2,
    name: "Motithang HSS",
    icon: School,
    color: "rgb(59 130 246)",
  },
  {
    id: 3,
    name: "Drukgyel HSS",
    icon: Building2,
    color: "rgb(168 85 247)",
  },
  {
    id: 4,
    name: "Pelkhil HSS",
    icon: BookOpen,
    color: "rgb(236 72 153)",
  },
  {
    id: 5,
    name: "Utpal Academy",
    icon: Users,
    color: "rgb(34 197 94)",
  },
  {
    id: 6,
    name: "Royal Academy",
    icon: Award,
    color: "rgb(245 158 11)",
  },
  {
    id: 7,
    name: "Changangkha MSS",
    icon: GraduationCap,
    color: "rgb(139 92 246)",
  },
  {
    id: 8,
    name: "Dechencholing HSS",
    icon: School,
    color: "rgb(239 68 68)",
  },
];

interface TrustedByProps {
  className?: string;
}

export function TrustedBy({ className }: TrustedByProps) {
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
            const Icon = school.icon;
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

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {[
            { value: "10,000+", label: "Students Served" },
            { value: "50+", label: "Schools Partnered" },
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

// Individual Logo Component for reuse
interface SchoolLogoProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  className?: string;
}

export function SchoolLogo({ name, icon: Icon, color, className }: SchoolLogoProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="relative mb-3" style={{ color }}>
        <Icon
          className="h-10 w-10 transition-all duration-300 group-hover:scale-110"
        />
      </div>
      <span className="text-sm font-medium text-gray-600 transition-colors duration-300 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-200">
        {name}
      </span>
    </div>
  );
}
