"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, MapPin, Users, BookOpen, ExternalLink } from "lucide-react";

interface CollegeCardProps {
  name: string;
  location: string;
  programs: string[];
  students: string;
  image: string;
  color: string;
  link: string;
  index: number;
}

export function CollegeCard3D({
  name,
  location,
  programs,
  students,
  color,
  link,
  index,
}: CollegeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
      }}
      className="relative h-full"
    >
      <Link href={link} className="block h-full">
        {/* Card with simple hover effect */}
        <div className="relative h-full bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          {/* College Logo/Image area */}
          <div
            className="relative h-32 rounded-2xl mb-4 flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${color}20, ${color}40)`,
            }}
          >
            {/* Static pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
            <GraduationCap className="w-16 h-16" style={{ color: color }} />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Location badge */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {name}
            </h3>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{students}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <BookOpen className="w-4 h-4" />
                <span>{programs.length}+ Programs</span>
              </div>
            </div>

            {/* Programs preview */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {programs.slice(0, 3).map((program) => (
                <span
                  key={program}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {program}
                </span>
              ))}
              {programs.length > 3 && (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                  +{programs.length - 3}
                </span>
              )}
            </div>

            {/* Explore link */}
            <div
              className="flex items-center gap-2 text-sm font-semibold transition-all group"
              style={{ color: color }}
            >
              Explore Programs
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// RUB Colleges Section
export function RUBCollegesSection() {
  const colleges = [
    {
      name: "College of Science and Technology",
      location: "Rinchending, Phuentsholing",
      programs: ["Engineering", "Architecture", "IT", "Electronics"],
      students: "1,200+",
      color: "#3b82f6",
      link: "/dashboard/rub",
    },
    {
      name: "College of Education",
      location: "Paro",
      programs: ["B.Ed Primary", "B.Ed Secondary", "M.Ed"],
      students: "800+",
      color: "#10b981",
      link: "/dashboard/rub",
    },
    {
      name: "College of Natural Resources",
      location: "Lobesa, Punakha",
      programs: ["Agriculture", "Forestry", "Animal Science"],
      students: "600+",
      color: "#22c55e",
      link: "/dashboard/rub",
    },
    {
      name: "Gaeddu College of Business Studies",
      location: "Gaeddu, Chukha",
      programs: ["BBA", "B.Com", "MBA"],
      students: "900+",
      color: "#f59e0b",
      link: "/dashboard/rub",
    },
    {
      name: "Sherubtse College",
      location: "Kanglung, Trashigang",
      programs: ["Arts", "Science", "Economics", "Dzongkha"],
      students: "1,500+",
      color: "#8b5cf6",
      link: "/dashboard/rub",
    },
    {
      name: "Royal Thimphu College",
      location: "Thimphu",
      programs: ["Business", "IT", "Social Work"],
      students: "700+",
      color: "#ec4899",
      link: "/dashboard/rub",
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-green-50/30 to-white dark:from-gray-950 dark:via-green-950/20 dark:to-gray-950 overflow-hidden">
      {/* Static background */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-green-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-900/50 mb-6">
            <span className="text-2xl">🎓</span>
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              Royal University of Bhutan
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your Path to
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}RUB Colleges
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Explore all 11 Royal University of Bhutan colleges. Find the perfect program that matches
            your career goals and interests.
          </p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">11</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Colleges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">60+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Programs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">6,000+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Students</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Colleges Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colleges.map((college, index) => (
            <div key={college.name} className="h-[360px]">
              <CollegeCard3D {...college} index={index} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link
            href="/dashboard/rub"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-semibold shadow-xl shadow-green-500/30 transition-all hover:scale-105"
          >
            <GraduationCap className="w-5 h-5" />
            View All RUB Colleges
            <ExternalLink className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Additional colleges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800"
        >
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4 font-medium">
            More RUB Colleges
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "College of Language and Culture Studies",
              "Samtse College of Education",
              "Paro College of Education",
              "Jigme Singye Wangchuck School of Law",
              "Yonphula Centenary College",
            ].map((college, i) => (
              <span
                key={college}
                className="px-4 py-2 bg-white dark:bg-gray-900 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {college}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
