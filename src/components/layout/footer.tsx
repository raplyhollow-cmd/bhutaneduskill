"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
  Heart,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

// Footer configuration - centralize all links here
const footerSections = {
  brand: {
    name: "Bhutan EduSkill",
    tagline: "Complete education management with career guidance",
    logo: "BE",
  },
  products: [
    { name: "Career Explorer", href: "/student/careers" },
    { name: "Assessments", href: "/student/assessment" },
    { name: "Scholarships", href: "/student/scholarships" },
    { name: "Study Abroad", href: "/student/study-abroad" },
  ],
  portals: [
    { name: "Student Portal", href: "/student" },
    { name: "Teacher Portal", href: "/teacher" },
    { name: "Parent Portal", href: "/parent" },
    { name: "School Admin", href: "/school-admin" },
    { name: "Counselor", href: "/counselor" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
  social: [
    { name: "Facebook", icon: Facebook, href: "#", followers: "12K+" },
    { name: "Instagram", icon: Instagram, href: "#", followers: "8.5K+" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
  ],
  contact: {
    email: "support@bhutaneduskill.bt",
    phone: "+975 2-34567",
    address: "Thimphu, Bhutan",
  },
  trustBadges: [
    { name: "SOC 2 Compliant", icon: Shield },
    { name: "GDPR Ready", icon: CheckCircle2 },
    { name: "SSL Secured", icon: Shield },
  ],
};

function FooterSection({ title, items, delay }: { title: string; items: Array<{ name: string; href: string }>; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <h4 className="font-semibold text-gray-950 dark:text-white mb-4">{title}</h4>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <motion.li
            key={item.name}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + index * 0.05, duration: 0.3 }}
          >
            <Link
              href={item.href}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-flex items-center gap-2 group"
            >
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-orange-500 transition-colors" />
              {item.name}
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // In production: send to newsletter API
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/30">
      <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Stay Updated</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Get education insights, career tips, and platform updates.
      </p>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold text-sm hover:from-orange-700 hover:to-red-700 hover:shadow-lg transition-all"
            >
              Subscribe
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            No spam, unsubscribe anytime. Read our{" "}
            <Link href="/privacy" className="text-orange-600 dark:text-orange-400 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30"
        >
          <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
          <span className="font-medium">Thanks for subscribing!</span>
        </motion.div>
      )}
    </div>
  );
}

function SocialLink({ social, index }: { social: typeof footerSections.social[0]; index: number }) {
  const Icon = social.icon;
  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.name}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all"
    >
      <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-red-500 transition-all">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-950 dark:text-white">{social.name}</div>
        {social.followers && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{social.followers}</div>
        )}
      </div>
    </motion.a>
  );
}

function ContactInfo() {
  return (
    <div className="space-y-4">
      <Link
        href={`mailto:${footerSections.contact.email}`}
        className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
      >
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 group-hover:bg-orange-500 group-hover:text-white transition-all">
          <Mail className="w-5 h-5 transition-colors" strokeWidth={1.5} />
        </div>
        <div>
          <div className="font-medium text-gray-950 dark:text-white">{footerSections.contact.email}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Email us</div>
        </div>
      </Link>

      <Link
        href={`tel:${footerSections.contact.phone.replace(/\s/g, "")}`}
        className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
      >
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 group-hover:bg-orange-500 group-hover:text-white transition-all">
          <Phone className="w-5 h-5 transition-colors" strokeWidth={1.5} />
        </div>
        <div>
          <div className="font-medium text-gray-950 dark:text-white">{footerSections.contact.phone}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Call us</div>
        </div>
      </Link>

      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
        </div>
        <div>
          <div className="font-medium text-gray-950 dark:text-white">{footerSections.contact.address}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Visit us</div>
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ badge, index }: { badge: typeof footerSections.trustBadges[0]; index: number }) {
  const Icon = badge.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      title={badge.name}
    >
      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{badge.name}</span>
    </motion.div>
  );
}

function BackToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4, duration: 0.3 }}
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 p-3 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg hover:from-orange-700 hover:to-red-700 hover:shadow-xl transition-all group"
      aria-label="Back to top"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
      >
        <ArrowUp className="w-5 h-5" strokeWidth={2} />
      </motion.div>
    </motion.button>
  );
}

export function Footer() {
  return (
    <>
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">BE</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-950 dark:text-white">
                    {footerSections.brand.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[150px]">
                    {footerSections.brand.tagline}
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="flex flex-wrap gap-2">
                {footerSections.social.map((social, index) => (
                  <SocialLink key={social.name} social={social} index={index} />
                ))}
              </div>
            </motion.div>

            {/* Products Column */}
            <FooterSection title="Product" items={footerSections.products} delay={0.05} />

            {/* Portals Column */}
            <FooterSection title="Portals" items={footerSections.portals} delay={0.1} />

            {/* Company Column */}
            <FooterSection title="Company" items={footerSections.company} delay={0.15} />

            {/* Newsletter Section - Full width on mobile, spans 2 columns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 lg:col-span-2"
            >
              <NewsletterForm />
            </motion.div>
          </div>

          {/* Contact Info Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div>
                <h4 className="font-semibold text-gray-950 dark:text-white mb-4">Contact Us</h4>
                <ContactInfo />
              </div>

              {/* Trust Badges */}
              <div>
                <h4 className="font-semibold text-gray-950 dark:text-white mb-4">Trust & Security</h4>
                <div className="flex flex-wrap gap-2">
                  {footerSections.trustBadges.map((badge, index) => (
                    <TrustBadge key={badge.name} badge={badge} index={index} />
                  ))}
                </div>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="font-semibold text-gray-950 dark:text-white mb-4">Legal</h4>
                <ul className="space-y-3">
                  {footerSections.legal.map((link, index) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-orange-500 transition-colors" />
                        {link.name}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>&copy; {new Date().getFullYear()} {footerSections.brand.name}. All rights reserved.</span>
              <span className="hidden sm:inline">• Made with</span>
              <Heart className="w-4 h-4 text-orange-500 inline-block" fill="currentColor" strokeWidth={2} />
              <span className="hidden sm:inline">in Bhutan</span>
            </div>

            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-red-700 hover:shadow-lg transition-all"
            >
              Get Started Free
              <ArrowUp className="w-4 h-4 rotate-45" strokeWidth={2} />
            </Link>
          </div>

          {/* Accent Line */}
          <div className="h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
        </div>
      </footer>

      {/* Back to Top Button */}
      <BackToTop />
    </>
  );
}
