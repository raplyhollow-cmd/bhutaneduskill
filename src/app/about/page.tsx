"use client";

import { FloatingNav } from "@/components/layout/floating-nav";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, Target, Globe, Award, BookOpen, Heart, CheckCircle2, Phone, Mail as MailIcon, School, Crown, TrendingUp, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

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
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export default function AboutPage() {
  const team = [
    {
      name: "Dipan Pradhan",
      role: "Chief Executive Officer",
      phone: "+975 17397454",
      whatsapp: "97517397454",
      icon: Target,
      color: "from-blue-500 to-indigo-600",
      description: "Visionary leader with expertise in education technology and business strategy",
    },
    {
      name: "Namrata Pradhan",
      role: "Chief Operating Officer",
      phone: "+975 17670009",
      whatsapp: "97517670009",
      icon: Target,
      color: "from-purple-500 to-pink-600",
      description: "Operations specialist ensuring seamless platform delivery",
    },
    {
      name: "Rajiv Pradhan",
      role: "Chief Technology Officer",
      phone: "+975 17649720",
      whatsapp: "97517649720",
      icon: Target,
      color: "from-green-500 to-teal-600",
      description: "Technology architect driving AI-powered solutions",
    },
    {
      name: "Tshering Lhamo",
      role: "Head of Marketing & Sales",
      phone: "+975 77773737",
      whatsapp: "97577773737",
      icon: Target,
      color: "from-orange-500 to-red-600",
      description: "Marketing expert connecting schools with Career Compass",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Student-First Approach",
      description: "Every feature designed with students in mind",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Target,
      title: "GNH Aligned",
      description: "Gross National Happiness guides our platform",
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: BookOpen,
      title: "Education Excellence",
      description: "Curated world-class learning resources",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Users,
      title: "Community Focus",
      description: "Building a supportive ecosystem",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const ecosystemFeatures = [
    { icon: School, title: "School Management", desc: "Daily operations made easy" },
    { icon: GraduationCap, title: "Teacher Tools", desc: "Empower educators" },
    { icon: Users, title: "Parent Portal", desc: "Stay connected" },
    { icon: Sparkles, title: "Career AI", desc: "Discover your path" },
    { icon: BarChart3, title: "Data Insights", desc: "Informed decisions" },
    { icon: Crown, title: "Ministry View", desc: "Nationwide impact" },
  ];

  const getWhatsAppLink = (phone: string) => `https://wa.me/${phone}`;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <FloatingNav />

      {/* Hero Section - Premium */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Premium Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full top-[-100px] right-[-100px] bg-gradient-to-br from-orange-400/20 to-red-400/20 blur-[100px]" />
          <div className="absolute w-80 h-80 rounded-full bottom-[-50px] left-[-50px] bg-gradient-to-br from-purple-400/15 to-pink-400/15 blur-[80px]" />
          <div className="absolute inset-0 opacity-20 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50 text-sm font-medium text-orange-700 dark:text-orange-400 mb-6">
              <span className="text-lg">🇧🇹</span>
              <span>Made in Bhutan</span>
            </span>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              About <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Bhutan Edu Skill</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              An entire <strong>education management system</strong> seamlessly linked with <strong>AI-powered career guidance</strong> —
              empowering schools, teachers, parents, students, and the ministry with data-driven insights for every decision.
            </p>

            {/* Ecosystem Pills */}
            <div className="flex flex-wrap gap-3 justify-center">
              {ecosystemFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.title}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              To transform education in Bhutan by providing a unified platform where <strong className="text-orange-600 dark:text-orange-400">daily school operations</strong> connect seamlessly with <strong className="text-orange-600 dark:text-orange-400">life-changing career decisions</strong> —
              all powered by AI insights personalized to each student's journey.
            </p>
          </motion.div>
        </div>

        {/* Solution Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-orange-600 to-red-600 text-white border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6" />
                What We've Built
              </h3>
              <ul className="grid md:grid-cols-2 gap-3">
                {[
                  "Complete school management system",
                  "AI-powered career assessments",
                  "Teacher homework & grading tools",
                  "Parent progress monitoring",
                  "Ministry analytics dashboard",
                  "Personalized learning paths",
                  "Attendance & fee management",
                  "RUB college integration",
                  "Data-driven policy insights",
                  "Study abroad guidance",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Core Values</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
              >
                <Card className="text-center h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Meet Our Team</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experienced professionals dedicated to transforming education in Bhutan
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                  <div className={`h-24 bg-gradient-to-r ${member.color} rounded-t-lg`} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4 -mt-12">
                      <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 border-4 border-white shadow-lg flex items-center justify-center">
                        <member.icon className="w-10 h-10 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
                        <Badge className={`bg-gradient-to-r ${member.color} text-white border-0`}>
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{member.description}</p>
                    <a
                      href={getWhatsAppLink(member.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-orange-600 to-red-600 text-white border-0">
              <CardContent className="p-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Education?</h2>
                <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                  Join thousands of schools, teachers, parents, and students already using our platform
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 px-10 py-6 rounded-full" asChild>
                    <Link href="/sign-up">Start Your Journey</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-6 rounded-full" asChild>
                    <Link href="/contact">
                      Contact Us
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer - Matching homepage style */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CC</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  Career Compass
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Complete education management system with AI-powered career guidance.
              </p>
              <div className="flex gap-2">
                {[
                  { icon: Facebook, href: "https://facebook.com/careercompassbt" },
                  { icon: Instagram, href: "https://instagram.com/careercompassbt" },
                  { icon: Linkedin, href: "https://linkedin.com/company/careercompassbt" },
                  { icon: Twitter, href: "https://twitter.com/careercompassbt" },
                ].map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400"
                    aria-label="Social"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "Career Explorer", href: "/dashboard/careers" },
                  { name: "Assessments", href: "/dashboard/assessment" },
                  { name: "Scholarships", href: "/dashboard/scholarships" },
                  { name: "Study Abroad", href: "/dashboard/study-abroad" },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Portals</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "Student Portal", href: "/student", color: "text-orange-500" },
                  { name: "Teacher Portal", href: "/teacher", color: "text-blue-500" },
                  { name: "Parent Portal", href: "/parent", color: "text-gray-500" },
                  { name: "Counselor Portal", href: "/counselor", color: "text-purple-500" },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className={`text-gray-600 dark:text-gray-400 hover:${link.color} transition-colors flex items-center gap-2`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "About Us", href: "/about" },
                  { name: "Contact", href: "/contact" },
                  { name: "FAQ", href: "/faq" },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Bhutan Edu Skill. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for Bhutan
            </div>
          </div>
        </div>

        {/* Accent */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
      </footer>
    </main>
  );
}
