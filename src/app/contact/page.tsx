"use client";

import { CompactNav } from "@/components/layout/compact-nav";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail as MailIcon, Phone, MapPin, MessageCircle, Clock, Send, Users, GraduationCap, Building, CheckCircle2, Zap, Heart, Sparkles, ArrowRight, School, Crown } from "lucide-react";
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

export default function ContactPage() {
  const teamContacts = [
    {
      name: "Dipan Pradhan",
      role: "Chief Executive Officer",
      phone: "+975 17397454",
      whatsapp: "97517397454",
      color: "from-blue-500 to-indigo-600",
      description: "For school partnerships and strategic inquiries",
    },
    {
      name: "Namrata Pradhan",
      role: "Chief Operating Officer",
      phone: "+975 17670009",
      whatsapp: "97517670009",
      color: "from-purple-500 to-pink-600",
      description: "For operations and user experience",
    },
    {
      name: "Rajiv Pradhan",
      role: "Chief Technology Officer",
      phone: "+975 17649720",
      whatsapp: "97517649720",
      color: "from-green-500 to-teal-600",
      description: "For technical support and platform issues",
    },
    {
      name: "Tshering Lhamo",
      role: "Head of Marketing & Sales",
      phone: "+975 77773737",
      whatsapp: "97577773737",
      color: "from-orange-500 to-red-600",
      description: "For student inquiries and partnerships",
    },
  ];

  const contactReasons = [
    { icon: Building, title: "School Partnership", description: "Bring the platform to your school" },
    { icon: GraduationCap, title: "Student Inquiry", description: "Questions about features and careers" },
    { icon: Users, title: "Parent Consultation", description: "Learn how we can help your child" },
    { icon: Zap, title: "Technical Support", description: "Platform issues and feature requests" },
  ];

  const ecosystemBadges = [
    { icon: School, label: "Schools" },
    { icon: GraduationCap, label: "Teachers" },
    { icon: Users, label: "Parents" },
    { icon: Crown, label: "Ministry" },
  ];

  const getWhatsAppLink = (phone: string) => `https://wa.me/${phone}`;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Compact Navigation - Desktop floating pill + Mobile bottom tab bar */}
      <CompactNav />

      {/* Hero Section - Premium */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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
              <span className="text-lg">💬</span>
              <span>Get in Touch</span>
            </span>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              Let's Start a
              <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Conversation
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              We're here to help schools, teachers, parents, students, and the ministry
            </p>

            {/* Ecosystem Badges */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {ecosystemBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <badge.icon className="w-4 h-4" />
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold text-lg shadow-xl shadow-orange-500/30 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Get Started Free
                  </span>
                </Button>
              </Link>

              <a href="https://wa.me/97517397454" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-lg"
                >
                  WhatsApp Us
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Reasons */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How Can We Help?</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the category that best describes your inquiry
            </p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {contactReasons.map((reason, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
              >
                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                      <reason.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{reason.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{reason.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Connect With Our Team</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Reach out via WhatsApp for quick responses
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {teamContacts.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                  <div className={`h-20 bg-gradient-to-r ${member.color} rounded-t-lg`} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4 -mt-10">
                      <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-4 border-white shadow-lg flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{member.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{member.description}</p>
                    <a
                      href={getWhatsAppLink(member.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Send Us a Message</h2>
            <p className="text-gray-600 dark:text-gray-400">
              We'll get back to you within 24 hours
            </p>
          </motion.div>
          <Card>
            <CardContent className="pt-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Tashi" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Wangyel" className="h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tashi@example.com" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <select id="subject" className="w-full h-11 px-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <option value="">Select a subject</option>
                    <option value="school">School Partnership</option>
                    <option value="student">Student Question</option>
                    <option value="parent">Parent Consultation</option>
                    <option value="technical">Technical Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={5} placeholder="Tell us more..." className="resize-none" />
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Other Ways to Reach Us
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            <a href="mailto:info@bhutaneduskill.com" className="block">
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MailIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">info@bhutaneduskill.com</p>
                </CardContent>
              </Card>
            </a>
            <a href="https://wa.me/97517397454" target="_blank" rel="noopener noreferrer" className="block">
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">WhatsApp</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quick responses</p>
                </CardContent>
              </Card>
            </a>
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Office</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Thimphu, Bhutan</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-orange-600 to-red-600 text-white border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <Clock className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">Business Hours</h3>
                    <p className="text-orange-100">We're available to help you during these hours</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Monday - Friday
                    </p>
                    <p className="text-orange-100">9:00 AM - 6:00 PM</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Saturday
                    </p>
                    <p className="text-orange-100">10:00 AM - 2:00 PM</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Sunday
                    </p>
                    <p className="text-orange-100">Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                  Join thousands of schools, teachers, parents, and students using our platform
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 px-10 py-6 rounded-full" asChild>
                    <Link href="/sign-up">Start Free</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-6 rounded-full" asChild>
                    <Link href="/about">
                      Learn More
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
                  Bhutan EduSkill
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
                  { name: "Career Explorer", href: "/student/careers" },
                  { name: "Assessments", href: "/dashboard/assessment" },
                  { name: "Scholarships", href: "/student/scholarships" },
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
