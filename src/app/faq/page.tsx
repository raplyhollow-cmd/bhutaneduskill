"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  GraduationCap,
  Users,
  DollarSign,
  Globe,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import Link from "next/link";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", name: "All Questions", icon: HelpCircle, color: "from-gray-500 to-gray-600" },
    { id: "general", name: "General", icon: Sparkles, color: "from-blue-500 to-indigo-500" },
    { id: "students", name: "For Students", icon: GraduationCap, color: "from-green-500 to-teal-500" },
    { id: "parents", name: "For Parents", icon: Users, color: "from-purple-500 to-pink-500" },
    { id: "schools", name: "For Schools", icon: BookOpen, color: "from-orange-500 to-red-500" },
    { id: "pricing", name: "Pricing", icon: DollarSign, color: "from-yellow-500 to-amber-500" },
    { id: "study-abroad", name: "Study Abroad", icon: Globe, color: "from-cyan-500 to-blue-500" },
  ];

  const faqs = [
    // General
    {
      id: 1,
      category: "general",
      question: "What is Bhutan EduSkill?",
      answer: "Bhutan EduSkill is Bhutan's first AI-powered career guidance platform designed for students in Classes 6-12 (ages 11-18). We help students discover their natural talents, build skills, explore career paths, and find opportunities for further education including study abroad options.",
      icon: Sparkles,
    },
    {
      id: 2,
      category: "general",
      question: "How does the AI career assessment work?",
      answer: "Our AI-powered assessment uses the proven RIASEC (Holland Code) model combined with aptitude testing and interest profiling. Students answer a series of questions, and our system analyzes their responses to identify natural strengths, personality traits, and suitable career paths. The assessment takes about 20-30 minutes to complete.",
      icon: Sparkles,
    },
    {
      id: 3,
      category: "general",
      question: "Is Bhutan EduSkill available in Dzongkha?",
      answer: "Currently, our platform is available in English with Dzongkha language support in development. We're working closely with local educators to ensure our content is culturally relevant and accessible to all Bhutanese students.",
      icon: Sparkles,
    },

    // Students
    {
      id: 4,
      category: "students",
      question: "What can I do on Bhutan EduSkill?",
      answer: "As a student, you can: Take career assessments to discover your strengths, explore 50+ career pathways with detailed information, find learning resources to improve your skills, learn how to monetize your skills through freelancing, discover scholarships for studying abroad, track your progress with achievements and badges, and get personalized career roadmaps.",
      icon: GraduationCap,
    },
    {
      id: 5,
      category: "students",
      question: "Is Bhutan EduSkill free for students?",
      answer: "Yes! Bhutan EduSkill offers a free tier that includes basic career assessments, career exploration, and access to some learning resources. Premium features include detailed career reports, personalized learning paths, scholarship matching, and study abroad guidance.",
      icon: GraduationCap,
    },
    {
      id: 6,
      category: "students",
      question: "How can I start earning money through Bhutan EduSkill?",
      answer: "Our Monetize section shows age-appropriate ways to earn money based on your skills. For students aged 15-16, we suggest local gigs and content creation. For students aged 17-18, we guide you through freelancing platforms like Fiverr and Upwork, where you can offer services such as graphic design, writing, coding, and more.",
      icon: GraduationCap,
    },
    {
      id: 7,
      category: "students",
      question: "Can Bhutan EduSkill help me study abroad?",
      answer: "Absolutely! We provide comprehensive information about study opportunities in Australia, New Zealand, USA, Singapore, UK, Germany, and Europe. Our platform includes scholarship databases, application guidance, IELTS preparation resources, and country-specific requirements to help you achieve your study abroad dreams.",
      icon: GraduationCap,
    },

    // Parents
    {
      id: 8,
      category: "parents",
      question: "How can Bhutan EduSkill help my child?",
      answer: "Bhutan EduSkill helps your child discover their natural talents early, make informed subject choices, explore suitable career paths, and develop skills that are in demand. Parents get their own portal to track their child's progress, receive AI-powered insights, and access resources to support their child's career journey.",
      icon: Users,
    },
    {
      id: 9,
      category: "parents",
      question: "Is my child's data safe and private?",
      answer: "Yes, we take data privacy very seriously. Our platform is designed with child protection in mind, complying with Bhutan's Child Care and Protection Act. We collect minimal data necessary for personalization, and all information is stored securely. Parents can control what data is collected and can request data deletion at any time.",
      icon: Users,
    },
    {
      id: 10,
      category: "parents",
      question: "How can I support my child's career exploration?",
      answer: "Through our Parent Portal, you can view your child's assessment results, track their progress on learning paths, receive recommendations for activities, and even record quick voice observations about your child's interests and achievements. The AI analyzes these inputs to provide better insights over time.",
      icon: Users,
    },

    // Schools
    {
      id: 11,
      category: "schools",
      question: "How can schools partner with Bhutan EduSkill?",
      answer: "Schools can partner with us through our B2B subscription model. We offer special pricing for government schools and competitive rates for private schools. Partner schools get full access for all students, teacher portals for class-level analytics, career education resources, and priority support.",
      icon: BookOpen,
    },
    {
      id: 12,
      category: "schools",
      question: "What resources do teachers get?",
      answer: "Teachers receive a comprehensive portal with class-level analytics, student progress tracking, career interest distribution reports, curriculum-aligned activity suggestions, and quick observation tools. This helps teachers provide better career guidance without adding significant workload.",
      icon: BookOpen,
    },
    {
      id: 13,
      category: "schools",
      question: "Does Bhutan EduSkill align with BCSEA curriculum?",
      answer: "Yes! Our content is aligned with the Bhutan Council for School Examinations and Assessment (BCSEA) curriculum. We incorporate local career pathways, TVET options, and GNH values into our career recommendations and resources.",
      icon: BookOpen,
    },

    // Pricing
    {
      id: 14,
      category: "pricing",
      question: "What are the pricing plans?",
      answer: "We offer flexible pricing: Free tier for individual students includes basic assessments and career exploration. Premium tier (Nu. 500-1,000/year) includes detailed reports, learning paths, and study abroad guidance. School subscriptions range from Nu. 300-1,000 per student annually depending on school type and size.",
      icon: DollarSign,
    },
    {
      id: 15,
      category: "pricing",
      question: "Are there any hidden fees?",
      answer: "No hidden fees! All pricing is transparent. The free tier is genuinely free with no credit card required. Premium subscriptions are clearly priced with annual billing. Some third-party courses we recommend may have their own fees, but these are always optional and clearly marked.",
      icon: DollarSign,
    },
    {
      id: 16,
      category: "pricing",
      question: "Do you offer discounts?",
      answer: "Yes! We offer special discounted rates for government schools, multi-year subscriptions, and bulk enrollments. We also have a sponsorship program where corporate sponsors help provide free access to underprivileged students. Contact us for custom pricing.",
      icon: DollarSign,
    },

    // Study Abroad
    {
      id: 17,
      category: "study-abroad",
      question: "Which countries does Bhutan EduSkill cover for study abroad?",
      answer: "We currently cover Australia, New Zealand, United States, United Kingdom, Singapore, Germany, and various European countries. For each country, we provide information on universities, application requirements, visa processes, scholarship opportunities, and cost of living.",
      icon: Globe,
    },
    {
      id: 18,
      category: "study-abroad",
      question: "What scholarships are available?",
      answer: "Our scholarship database includes 16+ major scholarships available to Bhutanese students, including Australia Awards, New Zealand Excellence Awards, Fulbright (USA), Commonwealth Scholarships (UK), DAAD (Germany), Singapore Scholarship, and many more. Each scholarship listing includes eligibility requirements, deadlines, and application links.",
      icon: Globe,
    },
    {
      id: 19,
      category: "study-abroad",
      question: "How do I prepare for IELTS/TOEFL?",
      answer: "Our Skills Hub includes curated resources for IELTS and TOEFL preparation, including free practice tests, recommended study timelines, tips from successful test-takers, and links to quality preparation courses. We also track your target scores and remind you of test dates.",
      icon: Globe,
    },
    {
      id: 20,
      category: "study-abroad",
      question: "Can you help with university applications?",
      answer: "While we don't directly submit applications, we provide comprehensive guidance on the application process for each country, including required documents, personal statement tips, recommendation letter guidelines, and timeline management. We can also connect you with trusted study abroad consultants for hands-on assistance.",
      icon: Globe,
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-sm px-4 py-2">
              <HelpCircle className="w-4 h-4 mr-2 inline" />
              Frequently Asked Questions
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              How Can We
              <span className="block mt-2 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                Help You?
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              Find answers to common questions about Bhutan EduSkill
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl border-2">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFaqs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No questions found
                </h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredFaqs.map((faq, index) => (
              <Card
                key={faq.id}
                className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <faq.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <Badge className="mb-2 bg-gray-100 text-gray-700 hover:bg-gray-200">
                            {categories.find((c) => c.id === faq.category)?.name}
                          </Badge>
                          <CardTitle className="text-lg md:text-xl text-left">
                            {faq.question}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {openIndex === index ? (
                          <ChevronUp className="w-6 h-6 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {openIndex === index && (
                  <CardContent className="pt-0 pb-6 px-6">
                    <div className="pl-16">
                      <p className="text-gray-600 leading-relaxed text-lg">{faq.answer}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: "50+", label: "Career Pathways" },
              { value: "16+", label: "Scholarships" },
              { value: "8+", label: "Countries" },
              { value: "1000+", label: "Resources" },
            ].map((stat, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-gray-200"
              >
                <CardContent className="pt-6">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-gray-600 mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white border-0 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
            </div>
            <CardContent className="relative py-12 px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Still Have Questions?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Our team is here to help you with any questions about Bhutan EduSkill
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                  asChild
                >
                  <Link href="/contact">
                    Contact Us
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-2 border-white/30 hover:bg-white/10 px-8 py-6 backdrop-blur-sm transition-all hover:-translate-y-1"
                  asChild
                >
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore More
            </h2>
            <p className="text-gray-600">
              Discover what Bhutan EduSkill has to offer
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "For Students",
                description: "Discover your strengths and explore career paths",
                icon: GraduationCap,
                color: "from-green-500 to-teal-500",
                href: "/dashboard",
              },
              {
                title: "For Schools",
                description: "Bring career guidance to your entire school",
                icon: BookOpen,
                color: "from-blue-500 to-indigo-500",
                href: "/contact",
              },
              {
                title: "Study Abroad",
                description: "Find scholarships and universities worldwide",
                icon: Globe,
                color: "from-purple-500 to-pink-500",
                href: "/contact",
              },
            ].map((link, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-gray-200"
              >
                <CardHeader>
                  <div className={`w-14 h-14 bg-gradient-to-br ${link.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <link.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{link.title}</CardTitle>
                  <p className="text-gray-600">{link.description}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    className="px-0 text-blue-600 hover:text-blue-700 group-hover:translate-x-2 transition-all"
                    asChild
                  >
                    <Link href={link.href}>
                      Explore
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
