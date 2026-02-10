"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden clerk-circuit-bg">
      {/* Glow effects */}
      <div className="clerk-hero-glow clerk-hero-glow-left" />
      <div className="clerk-hero-glow clerk-hero-glow-right" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1A202C]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">
          🇧🇹 Built for Bhutanese Students
        </Badge>

        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
          Discover Skills.
          <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Find Your Path.
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          AI-powered career guidance for students ages 11-18. Discover your natural
          talents, improve your skills, and unlock opportunities to study abroad.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/sign-up">
            <Button size="lg" className="clerk-btn-magnetic text-lg px-8 py-6">
              Start Your Journey
            </Button>
          </Link>
          <Link href="/about">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white"
            >
              Learn More
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Free for students • Schools welcome • Parent-approved
        </p>
      </div>

      {/* Animated scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
