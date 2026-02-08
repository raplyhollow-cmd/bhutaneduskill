import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/layout/public-nav";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <PublicNav />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
              🇧🇹 Built for Bhutanese Students
            </Badge>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Discover Skills. Find Your Path.
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Achieve Your Dreams.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered career guidance for students ages 11-18. Discover your natural talents,
              improve your skills, and unlock opportunities to study abroad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free for students • Schools welcome • Parent-approved
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Complete Skills Ecosystem
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From discovering your talents to studying abroad — we guide you every step of the way
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-blue-200 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <CardTitle>Discover Skills</CardTitle>
                <CardDescription>
                  AI-powered assessments identify your natural talents and personality type
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <CardTitle>Improve Skills</CardTitle>
                <CardDescription>
                  Curated courses from Khan Academy, Coursera, and local TTIs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <CardTitle>Monetize Skills</CardTitle>
                <CardDescription>
                  Learn how to earn through freelancing, content creation, and local opportunities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-orange-200 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">✈️</span>
                </div>
                <CardTitle>Study Abroad</CardTitle>
                <CardDescription>
                  Country-specific guidance for Australia, NZ, US, Singapore & Europe
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* For Different Stakeholders */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Everyone in Your Journey
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>👨‍🎓</span> For Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-blue-50">
                  <li>✓ Gamified career exploration</li>
                  <li>✓ AI-powered career matches</li>
                  <li>✓ Personalized learning paths</li>
                  <li>✓ Study abroad readiness score</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>👨‍🏫</span> For Teachers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-purple-50">
                  <li>✓ Class-level analytics</li>
                  <li>✓ Student progress tracking</li>
                  <li>✓ Career interest insights</li>
                  <li>✓ Quick observation tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>👨‍👩‍👧</span> For Parents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-green-50">
                  <li>✓ Child's progress dashboard</li>
                  <li>✓ Voice note observations</li>
                  <li>✓ Expectation vs interest analysis</li>
                  <li>✓ AI-powered insights</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>🏫</span> For Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-orange-50">
                  <li>✓ Multi-tenant platform</li>
                  <li>✓ School-wide analytics</li>
                  <li>✓ RUB college integration</li>
                  <li>✓ Labor market insights</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Study Abroad Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-purple-100 text-purple-800">Popular Destinations</Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Your Path to Study Abroad
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Get country-specific guidance for your dream destination. We'll help you understand
                requirements, find the right courses, and prepare your applications.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">🇦🇺</span>
                  <div>
                    <div className="font-semibold">Australia</div>
                    <div className="text-sm text-gray-500">IELTS 6.5+</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">🇳🇿</span>
                  <div>
                    <div className="font-semibold">New Zealand</div>
                    <div className="text-sm text-gray-500">IELTS 6.0+</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <div className="font-semibold">United States</div>
                    <div className="text-sm text-gray-500">SAT 1200+</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">🇸🇬</span>
                  <div>
                    <div className="font-semibold">Singapore</div>
                    <div className="text-sm text-gray-500">English Prof.</div>
                  </div>
                </div>
              </div>
            </div>
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2">
              <CardHeader>
                <CardTitle className="text-2xl">RUB College Integration</CardTitle>
                <CardDescription>
                  Explore all Royal University of Bhutan colleges and programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>College of Science and Technology (CEST)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>College of Education (Paro)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>College of Natural Resources (Lobesa)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Gaeddu College of Business Studies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Sherubtse College (Kanglung)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to discover your career path
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Take Assessment</h3>
              <p className="text-gray-600">
                Complete our RIASEC-based assessment to discover your personality type and natural talents
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Get Matched</h3>
              <p className="text-gray-600">
                AI matches your skills and interests with careers, RUB programs, and study abroad options
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Build Your Future</h3>
              <p className="text-gray-600">
                Follow personalized learning paths and track progress toward your goals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 p-12">
            <CardHeader className="pb-6">
              <CardTitle className="text-4xl mb-4">
                Ready to Discover Your Path?
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Join thousands of Bhutanese students already using Career Compass
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-up">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20">
                    Contact Us
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-blue-100 text-sm">
                No credit card required • Free tier available • Parental consent required for students under 18
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <span className="font-bold text-xl text-white">Career Compass</span>
              </div>
              <p className="text-sm">
                AI-powered career guidance for Bhutanese students ages 11-18.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard/careers" className="hover:text-white transition">Career Database</Link></li>
                <li><Link href="/dashboard/scholarships" className="hover:text-white transition">Scholarships</Link></li>
                <li><Link href="/dashboard/study-abroad" className="hover:text-white transition">Study Abroad</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="hover:text-white transition">Partner With Us</Link></li>
                <li><Link href="/about" className="hover:text-white transition">Our Team</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Get Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 Career Compass. Built with ❤️ for Bhutanese students.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
