"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  Code,
  Database,
  Shield,
  Zap,
  Globe,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Partner institution data
const partnerInstitutions = [
  {
    id: 1,
    name: "Royal University of Bhutan",
    shortName: "RUB",
    icon: GraduationCap,
    description: "All 11 constituent colleges",
    color: "rgb(249 115 22)",
    category: "Education",
  },
  {
    id: 2,
    name: "Khan Academy",
    shortName: "Khan",
    icon: BookOpen,
    description: "Free learning resources",
    color: "rgb(34 197 94)",
    category: "Content Partner",
  },
  {
    id: 3,
    name: "Sherubtse College",
    shortName: "Sherubtse",
    icon: GraduationCap,
    description: "Bhutan's premier college",
    color: "rgb(59 130 246)",
    category: "Education",
  },
  {
    id: 4,
    name: "CST",
    shortName: "CST",
    icon: Cpu,
    description: "College of Science & Technology",
    color: "rgb(168 85 247)",
    category: "Education",
  },
];

// Technology stack data
const technologies = [
  {
    id: 1,
    name: "Next.js",
    description: "React framework",
    color: "rgb(0 0 0)",
    darkColor: "rgb(255 255 255)",
  },
  {
    id: 2,
    name: "Clerk",
    description: "Authentication",
    color: "rgb(93, 41, 196)",
    darkColor: "rgb(139 92 246)",
  },
  {
    id: 3,
    name: "Drizzle",
    description: "Database ORM",
    color: "rgb(32, 178, 109)",
    darkColor: "rgb(52 211 153)",
  },
  {
    id: 4,
    name: "Neon",
    description: "PostgreSQL database",
    color: "rgb(16, 185, 129)",
    darkColor: "rgb(52 211 153)",
  },
  {
    id: 5,
    name: "Vercel",
    description: "Hosting platform",
    color: "rgb(0 0 0)",
    darkColor: "rgb(255 255 255)",
  },
  {
    id: 6,
    name: "Resend",
    description: "Email service",
    color: "rgb(0 0 0)",
    darkColor: "rgb(255 255 255)",
  },
];

// Icon components for technologies (using lucide icons)
const techIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Next.js": Code,
  "Clerk": Shield,
  "Drizzle": Database,
  "Neon": Database,
  "Vercel": Zap,
  "Resend": Globe,
};

interface IntegrationsProps {
  className?: string;
  showTechStack?: boolean;
  showPartners?: boolean;
}

export function Integrations({
  className,
  showTechStack = true,
  showPartners = true,
}: IntegrationsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
            Integrations & Technology
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Built with Modern Technology
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Powered by industry-leading tools and integrated with Bhutan's premier
            educational institutions.
          </p>
        </motion.div>

        {/* Partner Institutions */}
        {showPartners && (
          <div className="mb-20">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xl font-semibold text-center mb-8 text-gray-700 dark:text-gray-300"
            >
              Partner Institutions
            </motion.h3>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {partnerInstitutions.map((institution) => {
                const Icon = institution.icon;
                return (
                  <motion.div key={institution.id} variants={itemVariants}>
                    <PartnerInstitutionCard
                      name={institution.name}
                      shortName={institution.shortName}
                      icon={Icon}
                      description={institution.description}
                      color={institution.color}
                      category={institution.category}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Technology Stack */}
        {showTechStack && (
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xl font-semibold text-center mb-8 text-gray-700 dark:text-gray-300"
            >
              Powered By
            </motion.h3>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {technologies.map((tech) => {
                const TechIcon = techIcons[tech.name] || Code;
                return (
                  <motion.div key={tech.id} variants={itemVariants}>
                    <TechCard
                      name={tech.name}
                      description={tech.description}
                      icon={TechIcon}
                      color={tech.color}
                      darkColor={tech.darkColor}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}

// Partner Institution Card Component
interface PartnerInstitutionCardProps {
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  category: string;
  className?: string;
}

export function PartnerInstitutionCard({
  name,
  shortName,
  icon: Icon,
  description,
  color,
  category,
  className,
}: PartnerInstitutionCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
        "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
        className
      )}
    >
      <CardContent className="p-6">
        {/* Icon Container with outline-to-fill animation */}
        <div className="mb-4 flex items-center justify-center">
          <div className="relative h-16 w-16">
            {/* Outline version - visible by default */}
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:scale-90 group-hover:opacity-0">
              <Icon
                className="h-12 w-12"
                style={{ color: "rgb(156 163 175)" }}
              />
            </div>
            {/* Filled/Colored version - visible on hover */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-300 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {category}
          </span>
          <h4 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {name}
          </h4>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Hover glow effect */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)`,
          }}
        />
      </CardContent>
    </Card>
  );
}

// Technology Card Component (Clerk-style)
interface TechCardProps {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  darkColor: string;
  className?: string;
}

export function TechCard({
  name,
  description,
  icon: Icon,
  color,
  darkColor,
  className,
}: TechCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-2 transition-all duration-300",
        "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
        "hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          {/* Icon with outline-to-fill animation */}
          <div className="relative h-12 w-12 flex-shrink-0">
            {/* Outline version */}
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:scale-75 group-hover:opacity-0">
              <Icon className="h-8 w-8 text-gray-400" />
            </div>
            {/* Filled version */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-300 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 rounded-lg"
              style={{
                backgroundColor: color,
              }}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-300">
              {name}
            </h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Progress bar animation on hover */}
        <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full w-0 transition-all duration-500 group-hover:w-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Compact integration badge for smaller spaces
interface IntegrationBadgeProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  className?: string;
}

export function IntegrationBadge({
  name,
  icon: Icon,
  color,
  className,
}: IntegrationBadgeProps) {
  return (
    <div
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
        className
      )}
    >
      <Icon className="h-4 w-4 text-gray-500 transition-colors duration-300 group-hover:text-gray-700 dark:text-gray-400" />
      <span>{name}</span>
    </div>
  );
}

// Integration grid component for footer or smaller sections
interface IntegrationGridProps {
  integrations: Array<{
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>;
  className?: string;
}

export function IntegrationGrid({
  integrations,
  className,
}: IntegrationGridProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-center gap-4",
        className
      )}
    >
      {integrations.map((integration, index) => (
        <motion.div
          key={integration.name}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <IntegrationBadge
            name={integration.name}
            icon={integration.icon}
            color={integration.color}
          />
        </motion.div>
      ))}
    </div>
  );
}
