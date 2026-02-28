/**
 * COOKIE POLICY CONTENT COMPONENT
 *
 * Reusable component containing the cookie policy content.
 * Last Updated: February 25, 2026
 */

import { Cookie, Shield, Eye, Settings, AlertCircle } from "lucide-react";

interface PolicySectionProps {
  title: string;
  icon: React.ElementType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}

function PolicySection({ title, icon: Icon, children }: PolicySectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-semibold text-gray-950 dark:text-white">{title}</h2>
      </div>
      <div className="pl-11 text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

interface CookieType {
  name: string;
  purpose: string;
  duration: string;
  category: "Essential" | "Functional" | "Analytics";
}

const cookieTypes: CookieType[] = [
  {
    name: "Session Cookie",
    purpose: "Maintains user session during active use",
    duration: "Until browser closed",
    category: "Essential",
  },
  {
    name: "Authentication Token",
    purpose: "Keeps user securely logged in",
    duration: "30 days",
    category: "Essential",
  },
  {
    name: "CSRF Token",
    purpose: "Protects against cross-site request forgery",
    duration: "Session",
    category: "Essential",
  },
  {
    name: "Theme Preference",
    purpose: "Remembers light/dark mode selection",
    duration: "1 year",
    category: "Functional",
  },
  {
    name: "Language Preference",
    purpose: "Stores selected language",
    duration: "1 year",
    category: "Functional",
  },
  {
    name: "Portal Preference",
    purpose: "Remembers last accessed portal",
    duration: "30 days",
    category: "Functional",
  },
  {
    name: "Analytics Token",
    purpose: "Platform usage and performance monitoring",
    duration: "2 years",
    category: "Analytics",
  },
];

export function CookiePolicyContent() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-8 mb-8 border border-orange-100 dark:border-orange-900/30">
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-4">
          Cookie Policy
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This Cookie Policy explains how Bhutan EduSkill uses cookies and similar technologies on our platform.
          Please read this policy to understand what cookies we use, why we use them, and your choices regarding them.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Cookie className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Last Updated: February 25, 2026</span>
          </div>
        </div>
      </div>

      {/* What Are Cookies */}
      <PolicySection title="1. What Are Cookies?" icon={Cookie}>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when
            you visit a website. They help the website remember information about your visit, which can make it
            easier to visit the site again and make the site more useful to you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-2">Types of Cookies We Use</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Session cookies (temporary)</li>
                <li>• Persistent cookies (stored for longer)</li>
                <li>• First-party cookies (set by us)</li>
                <li>• No third-party advertising cookies</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-2">Why We Use Cookies</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Keep you logged in securely</li>
                <li>• Remember your preferences</li>
                <li>• Analyze platform performance</li>
                <li>• Protect against security threats</li>
              </ul>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Cookies We Use */}
      <PolicySection title="2. Cookies We Use" icon={Eye}>
        <p className="mb-4">The following table lists all cookies used by Bhutan EduSkill:</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 font-semibold text-gray-950 dark:text-white">Cookie Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-950 dark:text-white">Purpose</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-950 dark:text-white">Duration</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-950 dark:text-white">Category</th>
              </tr>
            </thead>
            <tbody>
              {cookieTypes.map((cookie, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-3 px-4 font-medium text-gray-950 dark:text-white">{cookie.name}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{cookie.purpose}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{cookie.duration}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      cookie.category === "Essential"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        : cookie.category === "Functional"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    }`}>
                      {cookie.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">No Advertising or Tracking Cookies</p>
              <p className="text-emerald-800 dark:text-emerald-200">
                We do NOT use cookies for behavioral advertising, cross-site tracking, or selling user data.
                Our analytics cookies are used solely to improve platform performance and user experience.
              </p>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Essential Cookies */}
      <PolicySection title="3. Essential Cookies" icon={Shield}>
        <p className="mb-4">
          Essential cookies are necessary for the platform to function properly. They enable core functionality
          such as user authentication, security, and navigation. Without these cookies, the platform cannot operate.
        </p>

        <div className="space-y-3">
          {[
            { feature: "User Authentication", desc: "Keeps you securely logged in during your session" },
            { feature: "CSRF Protection", desc: "Prevents cross-site request forgery attacks" },
            { feature: "Session Management", desc: "Maintains your active session state" },
            { feature: "Security Tokens", desc: "Protects against unauthorized access" },
          ].map((item) => (
            <div key={item.feature} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-950 dark:text-white">{item.feature}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> Essential cookies cannot be disabled as they are required for the platform to function.
          </p>
        </div>
      </PolicySection>

      {/* Functional Cookies */}
      <PolicySection title="4. Functional Cookies" icon={Settings}>
        <p className="mb-4">
          Functional cookies remember your preferences and settings to provide enhanced features and a more personalized experience.
        </p>

        <div className="space-y-3">
          {[
            { feature: "Theme Preference", desc: "Remembers if you chose light or dark mode" },
            { feature: "Language Selection", desc: "Stores your preferred language setting" },
            { feature: "Portal Remembering", desc: "Remembers the last portal you accessed" },
            { feature: "Display Settings", desc: "Saves your customized display preferences" },
          ].map((item) => (
            <div key={item.feature} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-950 dark:text-white">{item.feature}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Optional:</strong> You can disable functional cookies through your browser settings, but some features
            may not work as expected.
          </p>
        </div>
      </PolicySection>

      {/* Analytics Cookies */}
      <PolicySection title="5. Analytics Cookies" icon={Eye}>
        <p className="mb-4">
          Analytics cookies help us understand how users interact with our platform, allowing us to improve performance
          and user experience. We use aggregated, anonymized data for analysis.
        </p>

        <div className="space-y-3">
          {[
            { metric: "Page Views", desc: "Understanding which pages are most accessed" },
            { metric: "Performance Metrics", desc: "Measuring page load times and response speeds" },
            { metric: "Error Tracking", desc: "Identifying and fixing technical issues" },
            { metric: "Usage Patterns", desc: "Understanding how features are used" },
          ].map((item) => (
            <div key={item.metric} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-950 dark:text-white">{item.metric}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">Privacy Protection</p>
              <p className="text-emerald-800 dark:text-emerald-200">
                Analytics data is anonymized and aggregated. We never track individual students across sessions
                or use analytics for behavioral advertising.
              </p>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Third-Party Cookies */}
      <PolicySection title="6. Third-Party Cookies" icon={AlertCircle}>
        <p className="mb-4">
          Information about third-party services integrated with our platform:
        </p>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30 mb-4">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            <strong>Authentication Service:</strong> We use Clerk for user authentication. Clerk may set its own
            cookies for secure authentication purposes. Please review Clerk's privacy policy for details.
          </p>
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>No Third-Party Advertising:</strong> We do not allow third-party advertising networks to place
            cookies on our platform. We do not sell user data to advertisers.
          </p>
        </div>
      </PolicySection>

      {/* Managing Cookies */}
      <PolicySection title="7. How to Manage Cookies" icon={Settings}>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            You have several options for managing cookies:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-2">Browser Settings</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Most web browsers allow you to:
              </p>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• View what cookies are stored</li>
                <li>• Delete existing cookies</li>
                <li>• Block third-party cookies</li>
                <li>• Block all cookies from specific websites</li>
                <li>• Block cookies when closing the browser</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-2">Browser-Specific Instructions</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Chrome</p>
                  <p className="text-gray-600 dark:text-gray-400">Settings → Privacy and security → Cookies and other site data</p>
                </div>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Firefox</p>
                  <p className="text-gray-600 dark:text-gray-400">Options → Privacy & Security → Cookies and Site Data</p>
                </div>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Safari</p>
                  <p className="text-gray-600 dark:text-gray-400">Preferences → Privacy → Manage Website Data</p>
                </div>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Edge</p>
                  <p className="text-gray-600 dark:text-gray-400">Settings → Cookies and site permissions → Manage cookies</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Impact of Disabling Cookies</p>
                <p className="text-amber-800 dark:text-amber-200">
                  If you disable essential cookies, you may not be able to log in, use portal features, or access
                  certain functions of the platform. We recommend keeping essential cookies enabled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Updates to Cookie Policy */}
      <PolicySection title="8. Updates to This Policy" icon={AlertCircle}>
        <p className="text-gray-700 dark:text-gray-300">
          We may update this Cookie Policy from time to time to reflect changes in our use of cookies or for
          other operational, legal, or regulatory reasons. Changes will be posted on this page with an updated
          "Last Updated" date.
        </p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          We encourage you to review this policy periodically to stay informed about how we use cookies.
        </p>
      </PolicySection>

      {/* Contact */}
      <div className="mt-12 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
        <h3 className="text-lg font-semibold text-gray-950 dark:text-white mb-4">Questions About Cookies?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-950 dark:text-white mb-1">Cookie Inquiries</p>
            <p className="text-gray-600 dark:text-gray-400">privacy@bhutaneduskill.bt</p>
          </div>
          <div>
            <p className="font-medium text-gray-950 dark:text-white mb-1">General Support</p>
            <p className="text-gray-600 dark:text-gray-400">support@bhutaneduskill.bt</p>
          </div>
        </div>
      </div>
    </div>
  );
}
