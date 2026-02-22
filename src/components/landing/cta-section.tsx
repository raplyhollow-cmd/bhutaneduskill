"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Rocket, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// Magnetic button component
function MagneticCTAButton({
  children,
  href,
  primary = true,
}: {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
    setPosition({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn("inline-block relative overflow-hidden rounded-full", primary && "cursor-pointer")}
      >
        <Button
          size="lg"
          variant={primary ? "ceramic" : "ceramic-outline"}
          className={cn(
            "h-14 px-8 rounded-full font-semibold text-base transition-all",
            primary && "shadow-lg shadow-ceramic-brand/25 hover:shadow-xl hover:shadow-ceramic-brand/40"
          )}
          style={primary ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : undefined}
        >
          {/* Animated gradient background for primary button */}
          {primary && (
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              }}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
              }}
            />
          )}

          <span className="relative z-10 flex items-center gap-2">
            {children}
            {primary && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </span>
        </Button>
      </motion.div>
    </Link>
  );
}

export function CTASection() {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative py-24 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgb(255 247 237) 0%, rgb(254 215 170) 50%, rgb(251 146 60) 100%)`,
      }}
    >
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-ceramic-brand/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [180, 90, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-2xl"
          style={{ background: 'linear-gradient(to top right, rgb(249 115 22) 0%, transparent 100%)' }}
        />
      </div>

      {/* Spotlight effect following mouse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}% ${mousePosition.y}%, rgba(249, 115, 22, 0.08), transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ceramic-white/80 dark:bg-ceramic-gray-900/80 backdrop-blur-sm border border-ceramic-border text-ceramic-brand text-sm font-medium mb-8 shadow-lg"
          >
            <Rocket className="w-4 h-4" />
            Ready to transform your education?
          </motion.div>

          {/* Main heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ceramic-primary dark:text-white mb-6 leading-tight"
          >
            Join thousands of
            <span className="block mt-2">
              <span className="gradient-text-animated">students achieving more</span>
              <Sparkles className="inline-block w-10 h-10 ml-2 text-ceramic-brand" />
            </span>
          </motion.h2>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl text-ceramic-secondary dark:text-ceramic-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Start your journey today — free for students, with premium features for schools.
          </motion.p>

          {/* CTA Buttons - Single Row Sleek Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <MagneticCTAButton href="/sign-up" primary>
              <Rocket className="w-5 h-5" />
              Get Started Free
            </MagneticCTAButton>
            <MagneticCTAButton href="/portfolio" primary={false}>
              View Portfolio
            </MagneticCTAButton>
            <MagneticCTAButton href="/packages" primary={false}>
              <Mail className="w-5 h-5" />
              View Packages
            </MagneticCTAButton>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-ceramic-secondary dark:text-ceramic-gray-300"
          >
            {[
              { text: "No credit card required", icon: CheckCircle2 },
              { text: "Free for students forever", icon: CheckCircle2 },
              { text: "Cancel anytime", icon: CheckCircle2 },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <item.icon className="w-4 h-4 text-ceramic-positive" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-sm text-ceramic-dimmed"
          >
            Schools and institutions can request a demo for enterprise features.
          </motion.p>
        </motion.div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-ceramic-brand/30 rounded-full"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -100, -200],
                opacity: [0.5, 1, 0],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                delay: i * 1.5,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
