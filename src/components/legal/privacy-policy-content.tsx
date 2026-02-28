/**
 * PRIVACY POLICY CONTENT COMPONENT
 *
 * Reusable component containing the privacy policy content.
 * Last Updated: February 25, 2026
 */

import { Shield, Eye, Lock, Database, UserX, Mail, Cookie, Globe, Users, AlertCircle } from "lucide-react";

interface PolicySectionProps {
  title: string;
  icon: React.ElementType<React.SVGProps<SVGSVGElement>>;
  id?: string;
  children: React.ReactNode;
}

function PolicySection({ title, icon: Icon, id, children }: PolicySectionProps) {
  return (
    <section className="mb-8" id={id}>
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

interface DataCategory {
  name: string;
  description: string;
  examples: string[];
  required: boolean;
}

const dataCategories: DataCategory[] = [
  {
    name: "Students",
    description: "Educational records and personal information for students in classes 6-12",
    examples: ["Full name, date of birth, CID number", "Academic records and grades", "Attendance records", "Assessment results", "Career interest profiles", "Special education needs (if applicable)"],
    required: true,
  },
  {
    name: "Teachers",
    description: "Professional and employment-related information",
    examples: ["Name, contact information, CID", "Employment history", "Qualifications and certifications", "Class assignments", "Performance evaluations"],
    required: true,
  },
  {
    name: "Parents/Guardians",
    description: "Contact and relationship information for student guardians",
    examples: ["Name, contact details", "Relationship to student", "Emergency contact information", "Access credentials"],
    required: true,
  },
  {
    name: "Counselors",
    description: "Professional credentials and student interaction data",
    examples: ["Professional qualifications", "Counseling session notes", "Student intervention records", "Career guidance interactions"],
    required: true,
  },
  {
    name: "School Administrators",
    description: "Management and operational access data",
    examples: ["Administrative credentials", "School management data", "Financial access records", "Operational permissions"],
    required: true,
  },
];

export function PrivacyPolicyContent() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-8 mb-8 border border-orange-100 dark:border-orange-900/30">
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Bhutan EduSkill ("we", "our", or "us") is committed to protecting the privacy and security of personal information
          collected through our educational management platform. This Privacy Policy explains how we collect, use, store,
          and protect your data in compliance with Bhutanese laws and international best practices.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Last Updated: February 25, 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Applicable Law: Bhutan Information, Communications and Technology Act</span>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-gray-950 dark:text-white mb-4">Table of Contents</h3>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {[
            "Information We Collect",
            "How We Use Your Information",
            "Data Storage & Security",
            "Data Sharing Policies",
            "Your Rights & Choices",
            "Cookie Policy",
            "Children's Privacy",
            "Data Retention",
            "International Transfers",
            "Policy Updates",
            "Contact Information",
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{index + 1}.</span>
              <a href={`#section-${index + 1}`} className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                {item}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Section 1: Information We Collect */}
      <PolicySection title="1. Information We Collect" id="section-1" icon={Database}>
        <p className="mb-4">
          We collect information necessary to provide educational management services to schools in Bhutan. The types of
          data we collect include:
        </p>

        <div className="space-y-6">
          {dataCategories.map((category) => (
            <div key={category.name} className="bg-white dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-950 dark:text-white">{category.name}</h4>
                {category.required && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
              <ul className="space-y-1">
                {category.examples.map((example, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Legal Basis for Collection</p>
              <p className="text-blue-800 dark:text-blue-200">
                Data collection is based on contractual necessity for service provision, legal obligations under
                Bhutanese education laws, and legitimate interests in educational quality improvement.
              </p>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Section 2: How We Use Your Information */}
      <PolicySection title="2. How We Use Your Information" icon={Eye}>
        <p className="mb-4">We use collected data for the following purposes:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { purpose: "Educational Management", desc: "Student records, grading, attendance tracking" },
            { purpose: "Communication", desc: "School announcements, parent notifications" },
            { purpose: "Career Guidance", desc: "Assessment delivery, career matching recommendations" },
            { purpose: "Administrative Operations", desc: "Staff management, resource allocation" },
            { purpose: "Platform Security", desc: "Authentication, access control, audit logging" },
            { purpose: "Service Improvement", desc: "Analytics, feature development, bug fixes" },
            { purpose: "Regulatory Compliance", desc: "Reporting to education authorities" },
            { purpose: "Billing Operations", desc: "Subscription management, invoicing" },
          ].map((item) => (
            <div key={item.purpose} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-1">{item.purpose}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </PolicySection>

      {/* Section 3: Data Storage & Security */}
      <PolicySection title="3. Data Storage & Security" icon={Lock}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Storage Location</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              All data is stored on <strong>Neon PostgreSQL</strong> databases hosted in secure cloud infrastructure.
              Primary data residency is in <strong>Asia-Pacific (APAC) regions</strong> to comply with local data sovereignty requirements.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Security Measures</h4>
            <ul className="space-y-2">
              {[
                "AES-256 encryption for data at rest",
                "TLS 1.3 encryption for data in transit",
                "Role-based access control (RBAC) for all users",
                "Regular security audits and penetration testing",
                "Multi-factor authentication (MFA) support",
                "Comprehensive audit logging",
                "ISO 27001-aligned security practices",
              ].map((measure) => (
                <li key={measure} className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{measure}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">SOC 2 Compliance</p>
                <p className="text-emerald-800 dark:text-emerald-200">
                  Our platform maintains SOC 2 Type II compliance, demonstrating our commitment to security,
                  availability, and confidentiality of your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Section 4: Data Sharing Policies */}
      <PolicySection title="4. Data Sharing Policies" icon={Users}>
        <p className="mb-4">We share your data only as described below:</p>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold text-gray-950 dark:text-white mb-3">Authorized Sharing</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">School Administrators</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access to student, teacher, and operational data within their assigned school
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Parents/Guardians</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access to their children's academic records, attendance, and progress reports
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Teachers</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access to data for students in their assigned classes and subjects
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Counselors</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access to student guidance records and counseling session data
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold text-gray-950 dark:text-white mb-3">Never Shared Without Consent</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">×</span>
                <span>We never sell personal data to third parties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">×</span>
                <span>We never share data with advertisers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">×</span>
                <span>We never use data for behavioral advertising targeting students</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Legal Requirements</p>
                <p className="text-amber-800 dark:text-amber-200">
                  We may disclose data if required by law, court order, or to protect our rights. Any such disclosure
                  will be limited to what is legally required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Section 5: Your Rights & Choices */}
      <PolicySection title="5. Your Rights & Choices" icon={UserX}>
        <p className="mb-4">Under Bhutanese law, you have the following rights regarding your personal data:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              right: "Right to Access",
              description: "Request a copy of all personal data we hold about you",
              action: "Submit a data access request via email or portal",
            },
            {
              right: "Right to Rectification",
              description: "Correct inaccurate or incomplete data",
              action: "Edit profile directly in portal or contact support",
            },
            {
              right: "Right to Erasure",
              description: "Request deletion of your personal data",
              action: "Submit deletion request (subject to retention requirements)",
            },
            {
              right: "Right to Portability",
              description: "Receive your data in a structured format",
              action: "Request data export via portal settings",
            },
            {
              right: "Right to Restrict Processing",
              description: "Limit how we use your data",
              action: "Contact our privacy team with specific restrictions",
            },
            {
              right: "Right to Object",
              description: "Object to certain processing activities",
              action: "Submit objection with reasoning to privacy team",
            },
          ].map((item) => (
            <div key={item.right} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-semibold text-gray-950 dark:text-white mb-1">{item.right}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">How to exercise: {item.action}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Student Data:</strong> For students under 18, parents/legal guardians must exercise these rights on their behalf.
            Upon reaching 18, students gain full rights over their data.
          </p>
        </div>
      </PolicySection>

      {/* Section 6: Cookie Policy */}
      <PolicySection title="6. Cookie Policy" icon={Cookie}>
        <p className="mb-4">We use cookies and similar technologies to enhance your experience:</p>

        <div className="space-y-3">
          {[
            {
              category: "Essential Cookies",
              purpose: "Authentication, security, basic functionality",
              optional: false,
            },
            {
              category: "Functional Cookies",
              purpose: "Remember preferences, language, portal settings",
              optional: true,
            },
            {
              category: "Analytics Cookies",
              purpose: "Platform usage analysis, performance monitoring",
              optional: true,
            },
            {
              category: "No Marketing Cookies",
              purpose: "We do not use cookies for advertising or tracking",
              optional: false,
            },
          ].map((cookie) => (
            <div key={cookie.category} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <div>
                <p className="font-medium text-gray-950 dark:text-white">{cookie.category}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{cookie.purpose}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                cookie.optional
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}>
                {cookie.optional ? "Optional" : "Required"}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          You can manage cookie preferences through your browser settings. Note that disabling essential cookies
          may prevent platform functionality.
        </p>
      </PolicySection>

      {/* Section 7: Children's Privacy */}
      <PolicySection title="7. Children's Privacy" icon={AlertCircle}>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
          <p className="text-amber-900 dark:text-amber-100 font-medium mb-2">
            Special Protection for Minors
          </p>
          <p className="text-amber-800 dark:text-amber-200 text-sm mb-3">
            Our platform is designed for students aged approximately 11-18 (classes 6-12). We implement additional
            safeguards for minors:
          </p>
          <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
            <li>• Parental/guardian consent required for account creation</li>
            <li>• Limited data collection to educational necessities</li>
            <li>• No behavioral profiling or targeted advertising to students</li>
            <li>• Restricted social features within school boundaries</li>
            <li>• Parents have full access to their children's data</li>
            <li>• Data cannot be sold or transferred to third parties</li>
          </ul>
        </div>
      </PolicySection>

      {/* Section 8: Data Retention */}
      <PolicySection title="8. Data Retention" icon={Database}>
        <p className="mb-4">We retain data according to the following schedules:</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 font-semibold text-gray-950 dark:text-white">Data Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-950 dark:text-white">Retention Period</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-950 dark:text-white">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Student Academic Records</td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">7 years after graduation</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Legal requirement</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Teacher Employment Data</td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">7 years after separation</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Tax/employment law</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Account Activity Logs</td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">1 year</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Security purposes</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Deleted Account Data</td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">30 days (backup), then purged</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Recovery window</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PolicySection>

      {/* Section 9: International Transfers */}
      <PolicySection title="9. International Data Transfers" icon={Globe}>
        <p className="mb-4">
          Our primary data storage is located in APAC regions. Data may be transferred internationally only under
          the following conditions:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>To countries with adequate data protection laws as recognized by Bhutan</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>With appropriate safeguards (encryption, contractual clauses)</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>With explicit user consent where required by law</span>
          </li>
        </ul>
      </PolicySection>

      {/* Section 10: Policy Updates */}
      <PolicySection title="10. Changes to This Policy" icon={AlertCircle}>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. Changes will be:
        </p>
        <ul className="space-y-2">
          <li>• Posted on this page with an updated "Last Updated" date</li>
          <li>• Communicated via email for significant changes</li>
          <li>• Effective 30 days after notification for non-emergency changes</li>
          <li>• Immediate for legal/compliance requirements</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Continued use of the platform after changes constitutes acceptance of the updated policy.
        </p>
      </PolicySection>

      {/* Section 11: Contact Information */}
      <PolicySection title="11. Contact Information" icon={Mail}>
        <p className="mb-4">For privacy-related inquiries, requests, or complaints:</p>

        <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-950 dark:text-white mb-3">Privacy Inquiries</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>privacy@bhutaneduskill.bt</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Data Access/Deletion Requests:</span>
                </li>
                <li className="pl-6 text-gray-700 dark:text-gray-300">Submit via portal: Settings → Privacy → Data Request</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-950 dark:text-white mb-3">Complaints</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If you believe your privacy rights have been violated:
              </p>
              <ol className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>1. Contact our privacy team (above)</li>
                <li>2. If unresolved, contact: Bhutan InfoComm & Media Authority</li>
              </ol>
            </div>
          </div>
        </div>
      </PolicySection>

      {/* Footer Note */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          This Privacy Policy is governed by the laws of the Kingdom of Bhutan. Any disputes arising from
          privacy practices shall be subject to the exclusive jurisdiction of Bhutanese courts.
        </p>
      </div>
    </div>
  );
}
