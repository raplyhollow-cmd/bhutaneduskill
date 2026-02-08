import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/layout/public-nav";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  Users,
  GraduationCap,
  Building,
  Crown,
  Target,
  Lightbulb,
  Megaphone,
  ArrowRight,
  Sparkles,
  Globe,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const teamContacts = [
    {
      name: "Dipan Pradhan",
      role: "Chief Executive Officer",
      phone: "+975 17397454",
      whatsapp: "97517397454",
      icon: Crown,
      color: "from-blue-500 to-indigo-600",
      bgPattern: "from-blue-50 to-indigo-50",
      education: "MBA",
      description: "Visionary leader with expertise in education technology and business strategy",
      expertise: ["Strategic Planning", "Partnerships", "EdTech Innovation"],
    },
    {
      name: "Namrata Pradhan",
      role: "Chief Operating Officer",
      phone: "+975 17670009",
      whatsapp: "97517670009",
      icon: Target,
      color: "from-purple-500 to-pink-600",
      bgPattern: "from-purple-50 to-pink-50",
      education: "MBA",
      description: "Operations specialist ensuring seamless platform delivery and user experience",
      expertise: ["Operations", "User Experience", "Quality Assurance"],
    },
    {
      name: "Rajiv Pradhan",
      role: "Chief Technology Officer",
      phone: "+975 17649720",
      whatsapp: "97517649720",
      icon: Lightbulb,
      color: "from-green-500 to-teal-600",
      bgPattern: "from-green-50 to-teal-50",
      education: "MBA",
      description: "Technology architect driving innovation and AI-powered solutions",
      expertise: ["AI & ML", "System Architecture", "Product Development"],
    },
    {
      name: "Tshering Lhamo",
      role: "Head of Marketing & Sales",
      phone: "+975 77773737",
      whatsapp: "97577773737",
      icon: Megaphone,
      color: "from-orange-500 to-red-600",
      bgPattern: "from-orange-50 to-red-50",
      education: "BBA",
      description: "Marketing expert connecting schools and students with Career Compass",
      expertise: ["Digital Marketing", "School Partnerships", "Brand Strategy"],
    },
  ];

  const contactReasons = [
    {
      icon: Building,
      title: "School Partnership",
      description: "Interested in bringing Career Compass to your school",
      recommendedContact: "Dipan Pradhan",
      recommendedRole: "(CEO)",
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: GraduationCap,
      title: "Student Inquiry",
      description: "Questions about features, scholarships, or career guidance",
      recommendedContact: "Tshering Lhamo",
      recommendedRole: "(Marketing)",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Users,
      title: "Parent Consultation",
      description: "Learn how Career Compass can help your child's future",
      recommendedContact: "Namrata Pradhan",
      recommendedRole: "(COO)",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Lightbulb,
      title: "Technical Support",
      description: "Platform issues, bugs, or feature requests",
      recommendedContact: "Rajiv Pradhan",
      recommendedRole: "(CTO)",
      color: "from-orange-500 to-red-500",
    },
  ];

  const officeLocations = [
    {
      city: "Thimphu",
      address: "Thimphu, Bhutan",
      isHQ: true,
      icon: MapPin,
    },
  ];

  const socialLinks = [
    {
      name: "Email",
      icon: Mail,
      value: "info@careercompass.bt",
      href: "mailto:info@careercompass.bt",
      color: "from-blue-500 to-indigo-500",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      value: "Quick responses",
      href: "https://wa.me/97517397454",
      color: "from-green-500 to-teal-500",
    },
    {
      name: "Office",
      icon: Building,
      value: "Thimphu, Bhutan",
      href: "#",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const getWhatsAppLink = (phone: string) => {
    return `https://wa.me/${phone}`;
  };

  const getWhatsAppMessageLink = (phone: string, message: string) => {
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
              <MessageCircle className="w-4 h-4 mr-2 inline" />
              Get in Touch
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Let's Start a
              <span className="block mt-2 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                Conversation
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              We're here to help students, parents, teachers, and schools discover their path to success
            </p>
          </div>
        </div>
      </section>

      {/* Contact Reason Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactReasons.map((reason, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-gray-200"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${reason.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <reason.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{reason.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{reason.description}</p>
                  <div className="flex items-center text-sm text-blue-600">
                    <span className="font-medium">{reason.recommendedContact}</span>
                    <span className="text-gray-500 ml-1">{reason.recommendedRole}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Contact Cards - FB Style */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg mb-6">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Connect With Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Reach out via WhatsApp for quick responses
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {teamContacts.map((member, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-transparent hover:border-gray-200 group"
              >
                {/* Cover Image */}
                <div className={`h-28 bg-gradient-to-r ${member.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                </div>

                <CardContent className="relative px-6 pb-6">
                  {/* Avatar - FB Style */}
                  <div className="absolute -top-14 left-6">
                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                      <div className={`w-full h-full bg-gradient-to-br ${member.bgPattern} flex items-center justify-center`}>
                        <member.icon className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full p-3 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-16">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <CardTitle className="text-xl mb-1">{member.name}</CardTitle>
                        <Badge className={`bg-gradient-to-r ${member.color} text-white border-0 text-xs`}>
                          {member.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                        {member.education}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{member.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {member.expertise.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Contact Actions */}
                    <div className="flex gap-3 pt-3 border-t">
                      <a
                        href={getWhatsAppMessageLink(member.whatsapp, `Hello ${member.name.split(' ')[0]}, I'm contacting you from Career Compass website.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 justify-center px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-all hover:shadow-lg"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${member.phone.replace('+', '').replace(/\s/g, '')}`}
                        className="flex items-center justify-center px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
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

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg mb-6">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Send Us a Message
            </h2>
            <p className="text-gray-600">
              Fill out the form below and we'll get back to you within 24 hours
            </p>
          </div>

          <Card className="shadow-xl border-2">
            <CardContent className="pt-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Tashi"
                      className="h-12 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Wangyel"
                      className="h-12 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tashi@example.com"
                    className="h-12 border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+975 17XXXXXX"
                    className="h-12 border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-gray-700 font-medium">Subject</Label>
                  <select
                    id="subject"
                    className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="school">School Partnership Inquiry</option>
                    <option value="student">Student Question</option>
                    <option value="parent">Parent Consultation</option>
                    <option value="technical">Technical Support</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-700 font-medium">Message</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us more about your inquiry..."
                    className="border-gray-200 focus:border-blue-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Office Information */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-6">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Visit Our Office
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {officeLocations.map((location, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-gray-200 group"
              >
                <CardHeader>
                  {location.isHQ && (
                    <Badge className="w-fit mx-auto mb-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                      Headquarters
                    </Badge>
                  )}
                  <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <location.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{location.city}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{location.address}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white border-0 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
            </div>
            <CardHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Business Hours</CardTitle>
                  <CardDescription className="text-blue-100">
                    We're available to help you during these hours
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Monday - Friday
                  </p>
                  <p className="text-blue-100">9:00 AM - 6:00 PM (BST)</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Saturday
                  </p>
                  <p className="text-blue-100">10:00 AM - 2:00 PM (BST)</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Sunday
                  </p>
                  <p className="text-blue-100">Closed</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Response Time
                  </p>
                  <p className="text-blue-100">Within 24 hours</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm text-blue-100 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    <strong>Note:</strong> WhatsApp messages received outside business hours will be
                    responded to on the next working day.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Other Ways to Reach Us
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="group"
              >
                <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-gray-200 h-full">
                  <CardHeader>
                    <div className={`w-16 h-16 bg-gradient-to-br ${link.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <link.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{link.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{link.value}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
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
                Start Free
                <Sparkles className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 px-10 py-6 text-lg backdrop-blur-sm transition-all hover:-translate-y-1"
              asChild
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
