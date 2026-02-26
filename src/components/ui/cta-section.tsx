"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  badge?: string;
  className?: string;
  variant?: "orange" | "purple" | "blue" | "dark" | "gradient" | "ceramic";
  showGlow?: boolean;
  features?: string[];
}

const variants = {
  orange: {
    background: portal.student.gradient,
    textColor: "text-white",
    descriptionColor: "text-white/80",
    badgeBg: "bg-white/20",
    badgeText: "text-white",
  },
  purple: {
    background: portal.counselor.gradient,
    textColor: "text-white",
    descriptionColor: "text-white/80",
    badgeBg: "bg-white/20",
    badgeText: "text-white",
  },
  blue: {
    background: portal.teacher.gradient,
    textColor: "text-white",
    descriptionColor: "text-white/80",
    badgeBg: "bg-white/20",
    badgeText: "text-white",
  },
  dark: {
    background: "linear-gradient(135deg, rgb(17 24 39) 0%, rgb(0 0 0) 100%)",
    textColor: "text-white",
    descriptionColor: "text-gray-300",
    badgeBg: "bg-white/10",
    badgeText: "text-white",
  },
  gradient: {
    background: `linear-gradient(135deg, ${portal.student.primary} 0%, ${portal.counselor.primary} 50%, ${portal.teacher.primary} 100%)`,
    textColor: "text-white",
    descriptionColor: "text-white/80",
    badgeBg: "bg-white/20",
    badgeText: "text-white",
  },
  ceramic: {
    background: portal.student.gradient,
    textColor: "text-white",
    descriptionColor: "text-white/80",
    badgeBg: "bg-white/20",
    badgeText: "text-white",
  },
};

export function CTASection({
  title = "Ready to Discover Your Path?",
  description = "Join thousands of Bhutanese students already using Bhutan EduSkill to discover their skills and achieve their dreams.",
  primaryButtonText = "Start Your Journey",
  primaryButtonHref = "/sign-up",
  secondaryButtonText,
  secondaryButtonHref,
  badge,
  className,
  variant = "ceramic",
  showGlow = true,
  features,
}: CTASectionProps) {
  const style = variants[variant];

  return (
    <section className={cn("py-20 px-4 sm:px-6 lg:px-8", className)}>
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl p-12 sm:p-16 text-center border border-ceramic-border"
          style={{ background: style.background }}
        >
          {/* Glow effects */}
          {showGlow && (
            <>
              <div className="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/2 h-96 w-96 translate-x-1/2 bg-white/10 rounded-full blur-3xl" />
            </>
          )}

          {/* Content */}
          <div className="relative z-10">
            {badge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center justify-center"
              >
                <Badge className={cn(style.badgeBg, style.badgeText, "border-0 px-4 py-1.5 mb-4 rounded-full text-sm font-medium")}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {badge}
                </Badge>
              </motion.div>
            )}

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={cn("text-3xl font-bold sm:text-4xl md:text-5xl mb-6", style.textColor)}
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className={cn("text-lg mb-8 max-w-2xl mx-auto", style.descriptionColor)}
            >
              {description}
            </motion.p>

            {/* Features list */}
            {features && features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-4 mb-8"
              >
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-white/90"
                  >
                    <Check className="h-4 w-4 text-ceramic-positive" />
                    <span>{feature}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                asChild
                size="lg"
                variant="ceramic"
                className="bg-white text-ceramic-primary hover:bg-white/90 shadow-lg min-h-[44px] text-base font-semibold"
              >
                <Link href={primaryButtonHref} className="group">
                  {primaryButtonText}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              {secondaryButtonText && secondaryButtonHref && (
                <Button
                  asChild
                  size="lg"
                  variant="ceramic-outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 min-h-[44px] text-base font-semibold"
                >
                  <Link href={secondaryButtonHref}>
                    {secondaryButtonText}
                  </Link>
                </Button>
              )}
            </motion.div>

            {/* Trust indicators */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-sm text-white/70"
            >
              No credit card required • Free tier available • Get started in 2 minutes
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
