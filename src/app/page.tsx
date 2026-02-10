"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EvolvedNavTransparent } from "@/components/layout";
import { TrustedBy } from "@/components/marketing/trusted-by";
import { Testimonials } from "@/components/marketing/testimonials";
import { Integrations } from "@/components/marketing/integrations";
import { AnimatedStat, AnimatedStatGrid } from "@/components/ui/animated-stat";
import { CircuitBackground } from "@/components/ui/circuit-background";
import { HeroGlow, HeroGlowSpot } from "@/components/ui/hero-glow";
import { CTASection } from "@/components/ui/cta-section";
import { Facebook, Instagram, Linkedin, Twitter, ArrowRight, Heart, GraduationCap, Users, Award } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <EvolvedNavTransparent />

      {/* Hero Section - Orange Gradient (Section 1 - Color A) */}
      <section className="section-orange py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Effects */}
        <CircuitBackground opacity={0.05} animated variant="light" />
        <HeroGlow colors="orange-red" intensity="medium" animated />
        <HeroGlowSpot color="bg-orange-500" size="xl" position="top-left" opacity={0.2} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30 transition-colors">
              🇧🇹 Built for Bhutanese Students
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Discover Skills. Find Your Path.
              <span className="block text-white/90">
                Achieve Your Dreams.
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              AI-powered career guidance for students ages 11-18. Discover your natural talents,
              improve your skills, and unlock opportunities to study abroad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white text-primary hover:bg-white/90">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/70">
              Free for students • Schools welcome • Parent-approved
            </p>
          </div>
        </div>
      </section>

      {/* Trusted By Section - New Marketing Component */}
      <TrustedBy className="bg-white" />

      {/* Features Section - Silver/White (Section 2 - Color B) */}
      <section className="section-silver-light py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary">Features</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Complete Skills Ecosystem
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              From discovering your talents to studying abroad — we guide you every step of the way
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="clerk-card-glow border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <CardTitle className="text-foreground">Discover Skills</CardTitle>
                <CardDescription className="text-muted-foreground">
                  AI-powered assessments identify your natural talents and personality type
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="clerk-card-glow border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <CardTitle className="text-foreground">Improve Skills</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Curated courses from Khan Academy, Coursera, and local TTIs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="clerk-card-glow border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <CardTitle className="text-foreground">Monetize Skills</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Learn how to earn through freelancing, content creation, and local opportunities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="clerk-card-glow border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">✈️</span>
                </div>
                <CardTitle className="text-foreground">Study Abroad</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Country-specific guidance for Australia, NZ, US, Singapore & Europe
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Animated Stats Section - New UI Component */}
          <div className="mt-20">
            <AnimatedStatGrid
              stats={[
                {
                  value: 10000,
                  suffix: "+",
                  label: "Students Served",
                  icon: <Users className="w-full h-full" />,
                  variant: "primary",
                },
                {
                  value: 50,
                  suffix: "+",
                  label: "Schools Partnered",
                  icon: <GraduationCap className="w-full h-full" />,
                  variant: "success",
                },
                {
                  value: 20,
                  suffix: "+",
                  label: "Districts Covered",
                  icon: <Award className="w-full h-full" />,
                  variant: "warning",
                },
                {
                  value: 95,
                  suffix: "%",
                  label: "Satisfaction Rate",
                  showProgress: true,
                  variant: "info",
                },
              ]}
              columns={4}
            />
          </div>
        </div>
      </section>

      {/* For Different Stakeholders - Orange Light (Section 3 - Color A) */}
      <section className="section-orange-light py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Everyone in Your Journey
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-orange">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>👨‍🎓</span> For Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-primary-foreground/90">
                  <li>✓ Gamified career exploration</li>
                  <li>✓ AI-powered career matches</li>
                  <li>✓ Personalized learning paths</li>
                  <li>✓ Study abroad readiness score</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border-0 shadow-silver">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>👨‍🏫</span> For Teachers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-secondary-foreground/90">
                  <li>✓ Class-level analytics</li>
                  <li>✓ Student progress tracking</li>
                  <li>✓ Career interest insights</li>
                  <li>✓ Quick observation tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground border-0 shadow-orange">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>👨‍👩‍👧</span> For Parents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-accent-foreground/90">
                  <li>✓ Child&apos;s progress dashboard</li>
                  <li>✓ Voice note observations</li>
                  <li>✓ Expectation vs interest analysis</li>
                  <li>✓ AI-powered insights</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/80 to-primary/60 text-primary-foreground border-0 shadow-orange">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>🏫</span> For Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-primary-foreground/90">
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

      {/* Study Abroad Section - White/Silver (Section 4 - Color B) */}
      <section className="section-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-secondary/10 text-secondary">Popular Destinations</Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6">
                Your Path to Study Abroad
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Get country-specific guidance for your dream destination. We&apos;ll help you understand
                requirements, find the right courses, and prepare your applications.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl">🇦🇺</span>
                  <div>
                    <div className="font-semibold">Australia</div>
                    <div className="text-sm text-muted-foreground">IELTS 6.5+</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl">🇳🇿</span>
                  <div>
                    <div className="font-semibold">New Zealand</div>
                    <div className="text-sm text-muted-foreground">IELTS 6.0+</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <div className="font-semibold">United States</div>
                    <div className="text-sm text-muted-foreground">SAT 1200+</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl">🇸🇬</span>
                  <div>
                    <div className="font-semibold">Singapore</div>
                    <div className="text-sm text-muted-foreground">English Prof.</div>
                  </div>
                </div>
              </div>
            </div>
            <Card className="bg-gradient-to-br from-secondary/10 to-primary/10 border-2">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">RUB College Integration</CardTitle>
                <CardDescription>
                  Explore all Royal University of Bhutan colleges and programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">✓</span>
                    <span>College of Science and Technology (CEST)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">✓</span>
                    <span>College of Education (Paro)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">✓</span>
                    <span>College of Natural Resources (Lobesa)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">✓</span>
                    <span>Gaeddu College of Business Studies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">✓</span>
                    <span>Sherubtse College (Kanglung)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Orange Subtle (Section 5 - Color A) */}
      <section className="section-orange-subtle py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Simple steps to discover your career path
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Take Assessment</h3>
              <p className="text-muted-foreground">
                Complete our RIASEC-based assessment to discover your personality type and natural talents
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Get Matched</h3>
              <p className="text-muted-foreground">
                AI matches your skills and interests with careers, RUB programs, and study abroad options
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Build Your Future</h3>
              <p className="text-muted-foreground">
                Follow personalized learning paths and track progress toward your goals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New Marketing Component */}
      <Testimonials />

      {/* Integrations Section - New Marketing Component */}
      <Integrations className="bg-gray-50" />

      {/* CTA Section - New CTASection Component */}
      <CTASection
        variant="orange"
        badge="Start Your Journey Today"
        features={[
          "Free career assessments",
          "Personalized learning paths",
          "Study abroad guidance",
          "RUB college integration"
        ]}
      />

      {/* Footer - Improved Design */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Main footer grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <span className="font-bold text-xl text-foreground">Career Compass</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                AI-powered career guidance and school management for Bhutanese students ages 11-18.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com/careercompassbt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors text-gray-600"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com/careercompassbt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors text-gray-600"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com/company/careercompassbt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors text-gray-600"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://twitter.com/careercompassbt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors text-gray-600"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/dashboard/careers" className="text-muted-foreground hover:text-foreground transition-colors">
                    Career Explorer
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/assessment" className="text-muted-foreground hover:text-foreground transition-colors">
                    Assessments
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/scholarships" className="text-muted-foreground hover:text-foreground transition-colors">
                    Scholarships
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/study-abroad" className="text-muted-foreground hover:text-foreground transition-colors">
                    Study Abroad
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/rub" className="text-muted-foreground hover:text-foreground transition-colors">
                    RUB Programs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Partner With Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter signup */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Get career tips, scholarship alerts, and education news.
              </p>
              <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-9 text-sm"
                  />
                  <button
                    type="submit"
                    className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Career Compass. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Built with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> for Bhutanese students
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
