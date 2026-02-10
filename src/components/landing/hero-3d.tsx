"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Float, Stars, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import { ArrowRight, Compass, MountainSun, Sparkles as SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 3D Mountain Component
function Mountain({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <coneGeometry args={[1, 2, 4]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

// Snow Cap Component
function SnowCap({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
    </mesh>
  );
}

// Himalayan Mountain Range
function MountainRange() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.03) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main mountains */}
      <Mountain position={[0, 0, 0]} scale={2} color="#8B7355" />
      <SnowCap position={[0, 1.8, 0]} />

      <Mountain position={[-3, -0.5, -2]} scale={1.5} color="#9C8B7A" />
      <SnowCap position={[-3, 1, -2]} />

      <Mountain position={[3, -0.5, -2]} scale={1.5} color="#9C8B7A" />
      <SnowCap position={[3, 1, -2]} />

      <Mountain position={[-5, -1, -4]} scale={1.2} color="#8B7355" />
      <Mountain position={[5, -1, -4]} scale={1.2} color="#8B7355" />

      <Mountain position={[-2, -0.8, 1]} scale={0.8} color="#A8998A" />
      <Mountain position={[2, -0.8, 1]} scale={0.8} color="#A8998A" />
    </group>
  );
}

// Floating particles - reduced
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={200}
          array={Float32Array.from({ length: 600 }, () => (Math.random() - 0.5) * 20)}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#f97316" transparent opacity={0.4} />
    </points>
  );
}

// Sunrise glow - subtle
function SunriseGlow() {
  return (
    <mesh position={[0, -2, -5]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshBasicMaterial color="#f97316" transparent opacity={0.15} />
    </mesh>
  );
}

// 3D Scene
function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 3}
        autoRotate
        autoRotateSpeed={0.3}
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#fff7ed" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#f97316" />

      <MountainRange />
      <FloatingParticles />
      <Sparkles count={50} scale={10} size={2} speed={0.2} opacity={0.3} color="#f97316" />
      <SunriseGlow />

      <Environment preset="sunset" />
    </>
  );
}

// Text variants for animations - simplified
const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

export function Hero3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Static background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 via-transparent to-red-100/20 dark:from-orange-950/10 dark:via-transparent dark:to-red-950/10" />

      {/* Subtle floating circles - reduced motion */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-orange-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-400/5 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* 3D Canvas - Left Side */}
      <div className="absolute left-0 top-0 w-1/2 h-full hidden lg:block">
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          className="!w-full !h-full"
        >
          <Scene />
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Empty for 3D on desktop */}
          <div className="hidden lg:block" />

          {/* Right - Content */}
          <div className="text-center lg:text-left">
            {/* Badge - NO spinning animation */}
            <motion.div
              custom={0}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={textVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-900/50 mb-6"
            >
              <span className="text-lg">🇧🇹</span>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Built for Bhutanese Students
              </span>
            </motion.div>

            {/* Main Heading - NO bouncing animation */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={textVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6"
            >
              <span className="block">From Class 10</span>
              <span className="block bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
                Confusion
              </span>
              <span className="block">
                to Career Clarity
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              custom={2}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={textVariants}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl"
            >
              AI-powered career guidance that illuminates your path. Discover your natural talents,
              explore RUB colleges, and build your future with confidence.
            </motion.p>

            {/* Features */}
            <motion.div
              custom={3}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={textVariants}
              className="flex flex-wrap gap-3 mb-10 justify-center lg:justify-start"
            >
              {["Free Assessments", "RUB Integration", "Study Abroad", "AI Matching"].map(
                (feature, i) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                  >
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                )
              )}
            </motion.div>

            {/* CTA Buttons - subtle hover only */}
            <motion.div
              custom={4}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={textVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/dashboard/assessment">
                <Button
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold text-lg shadow-xl shadow-orange-500/30 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="w-5 h-5" />
                    Start Free Assessment
                  </span>
                </Button>
              </Link>

              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-lg group"
                >
                  <span className="flex items-center gap-2">
                    Learn More
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              custom={5}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={textVariants}
              className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    10,000+ Students
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Already discovering their path
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Simple scroll indicator - reduced motion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          Scroll to explore
        </span>
        <div className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-gray-700 flex justify-center pt-2">
          <div className="w-1 h-2 bg-orange-500 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
