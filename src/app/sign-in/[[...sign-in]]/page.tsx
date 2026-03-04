"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50 px-4 py-6">

      {/* FOUR FRIENDS - Big decorative element - Left side */}
      <svg className="absolute top-1/2 left-8 -translate-y-1/2 w-40 h-80 opacity-15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 320">
        {/* Tree with fruit */}
        <path d="M80 0 L80 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="70" cy="35" r="8" fill="currentColor" opacity="0.7"/>
        <circle cx="90" cy="45" r="7" fill="currentColor" opacity="0.7"/>
        <circle cx="80" cy="55" r="6" fill="currentColor" opacity="0.7"/>
        <circle cx="95" cy="30" r="5" fill="currentColor" opacity="0.7"/>

        {/* Bird (Partridge) - Top */}
        <g transform="translate(80, 85)">
          <ellipse cx="0" cy="0" rx="12" ry="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8" cy="-3" r="4" fill="currentColor"/>
          <path d="M-8 -2 L-15 0 L-8 2" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 5 L-2 12 L4 12" fill="none" stroke="currentColor" strokeWidth="2"/>
        </g>

        {/* Monkey - Below bird */}
        <g transform="translate(80, 130)">
          <ellipse cx="0" cy="0" rx="18" ry="16" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="10" cy="-5" r="5" fill="currentColor"/>
          <ellipse cx="0" cy="0" rx="8" ry="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M-12 8 L-18 25 M12 8 L18 25" stroke="currentColor" strokeWidth="2"/>
          <path d="M-8 -12 L-8 -20 M8 -12 L8 -20" stroke="currentColor" strokeWidth="2"/>
        </g>

        {/* Rabbit - Below monkey */}
        <g transform="translate(80, 185)">
          <ellipse cx="0" cy="5" rx="16" ry="14" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8" cy="0" r="4" fill="currentColor"/>
          <ellipse cx="-3" cy="-12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <ellipse cx="3" cy="-12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M-10 15 L-10 30 M10 15 L10 30" stroke="currentColor" strokeWidth="2"/>
        </g>

        {/* Elephant - Bottom */}
        <g transform="translate(80, 260)">
          <ellipse cx="0" cy="0" rx="35" ry="30" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18" cy="-10" r="6" fill="currentColor"/>
          <path d="M30 -5 Q50 5, 45 25 Q40 35, 35 25" fill="none" stroke="currentColor" strokeWidth="2"/>
          <ellipse cx="-15" cy="0" rx="20" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M20 -20 L25 -35 M-15 -20 L-15 -35" stroke="currentColor" strokeWidth="2"/>
          <path d="M-10 28 L-10 50 M10 28 L10 50 M25 25 L25 45 M-25 20 L-25 38" stroke="currentColor" strokeWidth="2"/>
        </g>
      </svg>

      {/* FOUR FRIENDS - Right side (smaller) */}
      <svg className="absolute top-1/3 right-12 w-24 h-48 opacity-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 320">
        {/* Tree with fruit */}
        <path d="M80 0 L80 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="70" cy="35" r="8" fill="currentColor" opacity="0.7"/>
        <circle cx="90" cy="45" r="7" fill="currentColor" opacity="0.7"/>
        <circle cx="80" cy="55" r="6" fill="currentColor" opacity="0.7"/>

        {/* Bird */}
        <g transform="translate(80, 85)">
          <ellipse cx="0" cy="0" rx="12" ry="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8" cy="-3" r="4" fill="currentColor"/>
          <path d="M-8 -2 L-15 0 L-8 2" fill="none" stroke="currentColor" strokeWidth="2"/>
        </g>

        {/* Monkey */}
        <g transform="translate(80, 130)">
          <ellipse cx="0" cy="0" rx="18" ry="16" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="10" cy="-5" r="5" fill="currentColor"/>
          <path d="M-12 8 L-18 25 M12 8 L18 25" stroke="currentColor" strokeWidth="2"/>
        </g>

        {/* Rabbit */}
        <g transform="translate(80, 185)">
          <ellipse cx="0" cy="5" rx="16" ry="14" fill="none" stroke="currentColor" strokeWidth="2"/>
          <ellipse cx="-3" cy="-12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <ellipse cx="3" cy="-12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        </g>

        {/* Elephant */}
        <g transform="translate(80, 260)">
          <ellipse cx="0" cy="0" rx="35" ry="30" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M30 -5 Q50 5, 45 25 Q40 35, 35 25" fill="none" stroke="currentColor" strokeWidth="2"/>
        </g>
      </svg>

      {/* FOUR FRIENDS - Small bottom corner */}
      <svg className="absolute bottom-8 right-8 w-16 h-32 opacity-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 320">
        <path d="M80 0 L80 60" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <ellipse cx="80" cy="85" rx="12" ry="10" fill="none" stroke="currentColor" strokeWidth="3"/>
        <ellipse cx="80" cy="130" rx="18" ry="16" fill="none" stroke="currentColor" strokeWidth="3"/>
        <ellipse cx="80" cy="185" rx="16" ry="14" fill="none" stroke="currentColor" strokeWidth="3"/>
        <ellipse cx="80" cy="260" rx="35" ry="30" fill="none" stroke="currentColor" strokeWidth="3"/>
      </svg>

      {/* Cloud motifs - smaller now as accent */}
      <svg className="absolute top-12 right-1/4 w-20 h-20 opacity-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M15 50 Q30 35, 45 45 Q65 30, 85 45 Q70 60, 50 50 Q30 60, 15 50"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="40" cy="47" r="4" fill="currentColor"/>
        <circle cx="65" cy="47" r="4" fill="currentColor"/>
      </svg>

      <svg className="absolute bottom-16 left-1/4 w-18 h-18 opacity-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M10 50 Q25 38, 45 47 Q65 32, 85 47 Q70 62, 50 52 Q30 62, 10 50"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="38" cy="48" r="3.5" fill="currentColor"/>
        <circle cx="62" cy="48" r="3.5" fill="currentColor"/>
      </svg>

      {/* Subtle glow overlay */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[120vh] w-[120vh] max-w-none -translate-x-1/2 -translate-y-1/2 select-none mix-blend-overlay opacity-12">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-orange-300 via-transparent to-blue-300 blur-[80px]" />
      </div>

      {/* Form container */}
      <div className="relative flex w-full max-w-[25rem] flex-1 flex-col justify-center">
        <SignIn
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
