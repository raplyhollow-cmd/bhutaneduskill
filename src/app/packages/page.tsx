"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Sparkles,
  Crown,
  Gem,
  Rocket,
  Zap,
  Shield,
  HeadphonesIcon,
  Users,
  Infinity,
  Star,
  ChevronDown,
  HelpCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// FAQ Accordion Component
function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Can I switch plans anytime?",
      a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences automatically.",
      icon: Zap,
    },
    {
      q: "Is there a free trial?",
      a: "We offer a 14-day free trial on all plans. No credit card required. Experience all features before committing. Cancel anytime during the trial.",
      icon: Star,
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards, bank transfers, and mobile payments for Bhutan customers. Enterprise clients can also pay via invoice.",
      icon: Shield,
    },
    {
      q: "Do you offer discounts for multiple schools?",
      a: "Yes! We offer special pricing for school districts and institutions with multiple campuses. Contact our sales team for custom quotes.",
      icon: Users,
    },
    {
      q: "How long does onboarding take?",
      a: "Most schools are fully onboarded within 1-2 weeks. We provide dedicated support, training materials, and data migration assistance.",
      icon: Rocket,
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. We use enterprise-grade encryption, regular backups, and comply with Bhutan's data protection regulations. Your data is always yours.",
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const Icon = faq.icon;
        const isOpen = openIndex === index;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            {/* Glassmorphism card with gradient border */}
            <div
              className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
                isOpen
                  ? "bg-white dark:bg-ceramic-gray-900 shadow-2xl shadow-ceramic-brand/10 border-2 border-ceramic-brand/30"
                  : "bg-white/50 dark:bg-ceramic-gray-900/50 backdrop-blur-sm border border-ceramic-border/50 hover:border-ceramic-brand/20 hover:shadow-lg"
              }`}
            >
              {/* Animated gradient background on hover/open */}
              <div
                className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${
                  isOpen ? "opacity-100" : ""
                }`}
                style={{
                  background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
                  maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                }}
              />

              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left p-6 relative z-10"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? "bg-gradient-to-br from-ceramic-brand to-orange-600 text-white shadow-lg"
                        : "bg-ceramic-gray-100 dark:bg-ceramic-gray-800 text-ceramic-brand"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-ceramic-primary dark:text-white text-lg">
                      {faq.q}
                    </h3>
                  </div>

                  {/* Chevron */}
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isOpen ? "bg-ceramic-brand/10 text-ceramic-brand" : "text-ceramic-dimmed"
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </div>
              </button>

              {/* Expandable answer */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0 relative z-10">
                      <div className="pl-16 border-l-2 border-ceramic-brand/20">
                        <p className="text-ceramic-secondary dark:text-ceramic-gray-300 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const packages = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for individual educators and small classrooms",
    icon: Rocket,
    gradient: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    bgColor: "from-blue-500/10 to-blue-600/10",
    price: { monthly: 29, yearly: 290 },
    features: [
      "Up to 50 students",
      "Basic attendance tracking",
      "Homework assignment",
      "Grade management",
      "Parent notifications",
      "Mobile app access",
      "Email support",
    ],
    highlight: false,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Ideal for growing schools with multiple teachers",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    bgColor: "from-orange-500/10 to-orange-600/10",
    price: { monthly: 99, yearly: 990 },
    features: [
      "Up to 500 students",
      "Everything in Starter",
      "Unlimited teachers",
      "Advanced analytics",
      "AI-powered insights",
      "Timetable management",
      "Library management",
      "Transport tracking",
      "Fee management",
      "Custom reports",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Complete solution for large institutions",
    icon: Crown,
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bgColor: "from-purple-500/10 to-purple-600/10",
    price: { monthly: 299, yearly: 2990 },
    features: [
      "Unlimited students",
      "Everything in Professional",
      "Multi-campus support",
      "Custom integrations",
      "Dedicated account manager",
      "White-label options",
      "Advanced security",
      "API access",
      "SLA guarantee",
      "On-premise deployment",
      "24/7 phone support",
      "Training included",
    ],
    highlight: false,
  },
];

const addOns = [
  {
    name: "AI Career Counseling",
    price: 49,
    description: "Advanced AI-powered career guidance and psychometric assessments",
    icon: Sparkles,
  },
  {
    name: "Premium Analytics",
    price: 79,
    description: "Deep-dive analytics with custom dashboards and export",
    icon: Zap,
  },
  {
    name: "Priority Support",
    price: 99,
    description: "Dedicated support team with 1-hour response time",
    icon: HeadphonesIcon,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

export default function PackagesPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-gradient-to-b from-ceramic-white via-ceramic-gray-50/50 to-ceramic-gray-100 dark:from-ceramic-gray-950 dark:via-ceramic-gray-900 dark:to-ceramic-gray-950">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY as unknown as number,
              repeatType: "loop",
              ease: "linear",
            }}
            className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-ceramic-brand/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.3, 1, 1.3],
              rotate: [180, 0, 180],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY as unknown as number,
              repeatType: "loop",
              ease: "linear",
            }}
            className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-ceramic-brand to-orange-600 text-white border-0">
              <Gem className="w-4 h-4 mr-2 inline" />
              Pricing Plans
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-ceramic-primary dark:text-white mb-6 leading-tight">
              Simple, Transparent
              <span className="block mt-2 bg-gradient-to-r from-ceramic-brand to-orange-600 bg-clip-text text-transparent">
                Pricing for Every School
              </span>
            </h1>

            <p className="text-xl text-ceramic-secondary dark:text-ceramic-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Choose the perfect plan for your institution. All plans include our core features with no hidden fees.
            </p>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 p-1.5 bg-white dark:bg-ceramic-gray-900 rounded-2xl shadow-xl border border-ceramic-border"
            >
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-ceramic-primary text-white shadow-lg"
                    : "text-ceramic-secondary hover:text-ceramic-primary"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                  billingCycle === "yearly"
                    ? "bg-ceramic-primary text-white shadow-lg"
                    : "text-ceramic-secondary hover:text-ceramic-primary"
                }`}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 border-0">
                  -17%
                </Badge>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              const price = billingCycle === "yearly" ? pkg.price.yearly : pkg.price.monthly;
              const period = billingCycle === "yearly" ? "/year" : "/month";

              return (
                <motion.div
                  key={pkg.id}
                  variants={itemVariants}
                  className={`relative group ${
                    pkg.highlight
                      ? "lg:-mt-8 lg:mb-8"
                      : ""
                  }`}
                >
                  {/* Popular Badge */}
                  {pkg.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-ceramic-brand to-orange-600 text-white px-4 py-1.5 text-sm font-semibold shadow-lg border-0">
                        <Star className="w-4 h-4 mr-1 inline" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div
                    className={`relative h-full rounded-3xl p-8 transition-all duration-500 ${
                      pkg.highlight
                        ? "bg-gradient-to-b from-white to-orange-50/50 dark:from-ceramic-gray-900 dark:to-orange-950/20 border-2 border-ceramic-brand/30 shadow-2xl shadow-orange-500/10"
                        : "bg-white dark:bg-ceramic-gray-900 border border-ceramic-border hover:border-ceramic-border/50 shadow-lg"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="text-center mb-8">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg bg-gradient-to-br ${pkg.bgColor}`}
                      >
                        <Icon className="w-8 h-8" style={{ color: pkg.gradient.match(/rgb\((\d+)/)?.[1] || "rgb(249 115 22)" }} />
                      </div>
                      <h3 className="text-2xl font-bold text-ceramic-primary dark:text-white mb-2">
                        {pkg.name}
                      </h3>
                      <p className="text-ceramic-secondary dark:text-ceramic-gray-400 text-sm">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-8 pb-8 border-b border-ceramic-border">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-ceramic-primary dark:text-white">
                          Nu.{price}
                        </span>
                        <span className="text-ceramic-dimmed">{period}</span>
                      </div>
                      {billingCycle === "yearly" && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                          Save Nu.{pkg.price.monthly * 12 - pkg.price.yearly} per year
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {pkg.features.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                            style={{ background: pkg.gradient }}
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-ceramic-secondary dark:text-ceramic-gray-300">
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link href="/sign-up" className="block">
                      <Button
                        variant={pkg.highlight ? "ceramic" : "outline"}
                        size="lg"
                        className={`w-full rounded-xl font-semibold h-12 ${
                          pkg.highlight
                            ? "shadow-xl"
                            : "hover:border-ceramic-brand/50"
                        }`}
                        style={pkg.highlight ? { background: pkg.gradient } : undefined}
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-ceramic-gray-100 dark:bg-ceramic-gray-800 text-ceramic-secondary dark:text-ceramic-gray-300">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Enhance Your Plan
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-ceramic-primary dark:text-white mb-4">
              Powerful Add-ons
            </h2>
            <p className="text-ceramic-secondary dark:text-ceramic-gray-400">
              Supercharge your experience with these optional enhancements
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {addOns.map((addon, index) => {
              const Icon = addon.icon;
              return (
                <motion.div
                  key={addon.name}
                  variants={itemVariants}
                  className="group relative bg-white dark:bg-ceramic-gray-900 rounded-2xl p-6 border border-ceramic-border hover:border-ceramic-brand/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-ceramic-gray-100 to-ceramic-gray-200 dark:from-ceramic-gray-800 dark:to-ceramic-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-ceramic-brand" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ceramic-primary dark:text-white">
                        {addon.name}
                      </h3>
                      <p className="text-2xl font-bold text-ceramic-brand">
                        Nu.{addon.price}
                        <span className="text-sm font-normal text-ceramic-dimmed">/mo</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-ceramic-secondary dark:text-ceramic-gray-400">
                    {addon.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-12 sm:p-16 text-center border border-ceramic-border"
            style={{
              background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)"
            }}
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Need a Custom Solution?
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                For large institutions with unique requirements, we offer tailored solutions with dedicated support and custom integrations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="bg-white text-ceramic-brand hover:bg-white/90 rounded-full px-8 h-12 font-semibold shadow-xl"
                  >
                    Contact Sales
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 h-12 font-semibold"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section - Luxury Accordion Style */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-ceramic-brand/5 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-gradient-to-r from-ceramic-brand/10 to-purple-500/10 text-ceramic-brand border-ceramic-brand/20">
              <HelpCircle className="w-4 h-4 mr-2 inline" />
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-ceramic-primary dark:text-white mb-4">
              Everything You Need to Know
            </h2>
            <p className="text-ceramic-secondary dark:text-ceramic-gray-400">
              Quick answers to common questions about our platform
            </p>
          </motion.div>

          {/* Luxury Accordion FAQ */}
          <FAQAccordion />
        </div>
      </section>
    </div>
  );
}
