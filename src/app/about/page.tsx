import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/layout/public-nav";
import {
  Target,
  Users,
  Globe,
  Award,
  BookOpen,
  Heart,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  Crown,
  Lightbulb,
  Megaphone,
  Phone,
  MapPin,
  Mail,
  ArrowRight,
  Zap,
  Star,
  Shield,
  Rocket,
  Flame,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const team = [
    {
      name: "Dipan Pradhan",
      role: "Chief Executive Officer",
      phone: "+975 17397454",
      whatsapp: "97517397454",
      education: "MBA",
      icon: Crown,
      color: "from-blue-500 to-indigo-600",
      bgPattern: "from-blue-50 to-indigo-50",
      description: "Visionary leader with expertise in education technology and business strategy. Driving innovation in career guidance across Bhutan.",
      expertise: ["Strategic Planning", "EdTech Innovation", "Partnership Development"],
      avatar: "/avatars/dipan.jpg",
    },
    {
      name: "Namrata Pradhan",
      role: "Chief Operating Officer",
      phone: "+975 17670009",
      whatsapp: "97517670009",
      education: "MBA",
      icon: Target,
      color: "from-purple-500 to-pink-600",
      bgPattern: "from-purple-50 to-pink-50",
      description: "Operations specialist ensuring seamless platform delivery and exceptional user experience for all stakeholders.",
      expertise: ["Operations Management", "User Experience", "Quality Assurance"],
      avatar: "/avatars/namrata.jpg",
    },
    {
      name: "Rajiv Pradhan",
      role: "Chief Technology Officer",
      phone: "+975 17649720",
      whatsapp: "97517649720",
      education: "MBA",
      icon: Lightbulb,
      color: "from-green-500 to-teal-600",
      bgPattern: "from-green-50 to-teal-50",
      description: "Technology architect driving innovation and AI-powered solutions. Building the future of career guidance technology.",
      expertise: ["AI & Machine Learning", "System Architecture", "Product Development"],
      avatar: "/avatars/rajiv.jpg",
    },
    {
      name: "Tshering Lhamo",
      role: "Head of Marketing & Sales",
      phone: "+975 77773737",
      whatsapp: "97577773737",
      education: "BBA",
      icon: Megaphone,
      color: "from-orange-500 to-red-600",
      bgPattern: "from-orange-50 to-red-50",
      description: "Marketing expert connecting schools and students with Career Compass. Passionate about making career guidance accessible to all.",
      expertise: ["Digital Marketing", "School Partnerships", "Brand Strategy"],
      avatar: "/avatars/tshering.jpg",
    },
  ];

  const milestones = [
    {
      year: "2026",
      title: "Platform Launch",
      description: "Career Compass launches in Bhutan with 50+ career pathways and study abroad guidance",
      icon: Rocket,
      color: "text-blue-600",
    },
    {
      year: "2025",
      title: "Research & Development",
      description: "Extensive research into Bhutan's education system and youth unemployment challenges",
      icon: Lightbulb,
      color: "text-yellow-600",
    },
    {
      year: "Future",
      title: "Regional Expansion",
      description: "Planned expansion to India, Southeast Asia, and other developing markets",
      icon: Globe,
      color: "text-green-600",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Student-First Approach",
      description: "Every feature designed with the student's best interests at heart",
      color: "from-red-500 to-pink-500",
      bg: "bg-red-50",
    },
    {
      icon: Target,
      title: "Alignment with GNH",
      description: "Gross National Happiness values guide our platform development",
      color: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
    },
    {
      icon: BookOpen,
      title: "Education Excellence",
      description: "Curated resources from world-class learning platforms",
      color: "from-green-500 to-teal-500",
      bg: "bg-green-50",
    },
    {
      icon: Users,
      title: "Community Focus",
      description: "Building a supportive ecosystem for students, parents, and teachers",
      color: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
    },
  ];

  const stats = [
    { value: "50+", label: "Career Pathways", icon: TrendingUp },
    { value: "16+", label: "Scholarships", icon: Award },
    { value: "8+", label: "Countries", icon: Globe },
    { value: "100%", label: "Commitment", icon: Heart },
  ];

  const features = [
    { title: "AI-Powered Career Discovery", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { title: "Personalized Learning Paths", icon: Target, color: "from-blue-500 to-indigo-500" },
    { title: "Monetization Guidance", icon: Flame, color: "from-red-500 to-pink-500" },
    { title: "Study Abroad Support", icon: Globe, color: "from-green-500 to-teal-500" },
    { title: "Scholarship Database", icon: Award, color: "from-purple-500 to-pink-500" },
    { title: "Achievement System", icon: Star, color: "from-yellow-500 to-amber-500" },
    { title: "Progress Tracking", icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
    { title: "Parent & Teacher Portals", icon: Users, color: "from-indigo-500 to-purple-500" },
  ];

  const articles = [
    {
      title: "Why Career Guidance Matters in Middle School",
      excerpt: "Research shows that early career exploration leads to better academic outcomes and reduced college dropout rates.",
      category: "Research",
      icon: BookOpen,
      color: "from-blue-500 to-indigo-500",
      readTime: "5 min read",
    },
    {
      title: "Bridging the Skills Gap in Bhutan",
      excerpt: "How AI-powered matching can connect student skills with employer needs, reducing youth unemployment.",
      category: "Industry",
      icon: Target,
      color: "from-green-500 to-teal-500",
      readTime: "4 min read",
    },
    {
      title: "Study Abroad Opportunities for Bhutanese Students",
      excerpt: "Comprehensive guide to scholarships in Australia, New Zealand, USA, Singapore, and Europe.",
      category: "Guide",
      icon: Globe,
      color: "from-purple-500 to-pink-500",
      readTime: "8 min read",
    },
    {
      title: "The Future of Work in Bhutan",
      excerpt: "Preparing students for emerging careers in technology, creative industries, and global remote work.",
      category: "Trends",
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
      readTime: "6 min read",
    },
  ];

  const getWhatsAppLink = (phone: string) => {
    return `https://wa.me/${phone}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicNav />

      {/* Animated Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-sm px-4 py-2 hover:bg-white/30 transition-all cursor-default">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              About Career Compass
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Empowering Bhutan's
              <span className="block mt-2 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                Next Generation
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              AI-powered career guidance platform for students in Classes 6-12.
              <br />Discover skills, build your future, achieve your dreams.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all cursor-default group"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 justify-center mt-10">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                asChild
              >
                <Link href="/sign-up">
                  Get Started Free
                  <Sparkles className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 px-8 py-6 text-lg backdrop-blur-sm transition-all hover:-translate-y-1"
                asChild
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section - Premium Card Style */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              To transform career guidance in Bhutan by providing every student with personalized,
              AI-powered insights that help them discover their natural talents, build skills,
              and achieve their dreams.
            </p>
          </div>

          {/* Problem & Solution - Side by Side Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Challenge Card */}
            <Card className="border-2 border-red-100 hover:border-red-200 transition-all hover:shadow-xl group">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">The Challenge</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-lg">19%</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Youth Unemployment</p>
                    <p className="text-gray-600 text-sm">Youth unemployment is 5x the national rate</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-lg">61%</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Skills Gap</p>
                    <p className="text-gray-600 text-sm">Most job vacancies remain unfilled</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl group-hover:bg-yellow-100 transition-colors">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Scarce Guidance</p>
                    <p className="text-gray-600 text-sm">Limited structured career guidance in schools</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Solution Card */}
            <Card className="border-2 border-green-100 hover:border-green-200 transition-all hover:shadow-xl bg-gradient-to-br from-green-500 to-teal-600 text-white border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Our Solution</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Early career discovery starting from Class 6",
                  "AI-powered assessment matching natural talents to careers",
                  "Curated learning paths for skill development",
                  "Monetization guidance for earning opportunities",
                  "Study abroad support with scholarship matching",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all cursor-default"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-white/90">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Our Core Values
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card
                key={index}
                className={`text-center hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-${value.color.split('-')[1]}-200 group`}
              >
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team - Facebook Style Cards */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet Our Leadership
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experienced professionals dedicated to transforming education in Bhutan
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className={`overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-transparent hover:border-gray-200 group`}
              >
                {/* Cover Image */}
                <div className={`h-32 bg-gradient-to-r ${member.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                </div>

                <CardContent className="relative px-6 pb-6">
                  {/* Avatar - FB Style */}
                  <div className="absolute -top-16 left-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                      <div className={`w-full h-full bg-gradient-to-br ${member.bgPattern} flex items-center justify-center`}>
                        <member.icon className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full p-4 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <CardTitle className="text-2xl mb-1">{member.name}</CardTitle>
                        <Badge className={`bg-gradient-to-r ${member.color} text-white border-0`}>
                          {member.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                        {member.education}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 leading-relaxed">{member.description}</p>

                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {member.expertise.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Contact Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <a
                        href={getWhatsAppLink(member.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 justify-center px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all hover:shadow-lg"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${member.phone.replace('+', '').replace(/\s/g, '')}`}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - Premium Style */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-6">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything students need to discover, develop, and deploy their skills
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-gray-200"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Articles & Resources - Premium Cards */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl shadow-lg mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Insights & Resources
            </h2>
            <p className="text-xl text-gray-600">
              Articles, research, and guides for students, parents, and educators
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {articles.map((article, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-transparent hover:border-gray-200 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${article.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                      {article.category}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${article.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <article.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 leading-relaxed">{article.excerpt}</p>
                  <Button
                    variant="ghost"
                    className="px-0 text-blue-600 hover:text-blue-700 group-hover:translate-x-2 transition-all"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline - Premium */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              Building Bhutan's first AI-powered career guidance platform
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-8 group">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <milestone.icon className="w-8 h-8" />
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-1 h-full bg-gradient-to-b from-blue-200 to-transparent mt-2" />
                  )}
                </div>
                <Card className="flex-1 group-hover:shadow-xl transition-all border-2 border-transparent group-hover:border-blue-100">
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-blue-100 text-blue-700">
                      {milestone.year}
                    </Badge>
                    <CardTitle className="text-2xl">{milestone.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-8">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Shape Your Future?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of students discovering their path to success with Career Compass
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
              asChild
            >
              <Link href="/sign-up">
                Start Your Journey
                <Sparkles className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 px-10 py-6 text-lg backdrop-blur-sm transition-all hover:-translate-y-1"
              asChild
            >
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
