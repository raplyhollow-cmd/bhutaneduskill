/**
 * TERMS OF SERVICE CONTENT COMPONENT
 *
 * Reusable component containing the terms of service content.
 * Last Updated: February 25, 2026
 */

import {
  FileText,
  CreditCard,
  Shield,
  AlertTriangle,
  Scale,
  Clock,
  Users,
  Ban,
  CheckCircle2,
} from "lucide-react";

interface TermsSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function TermsSection({ title, icon: Icon, children }: TermsSectionProps) {
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

export function TermsOfServiceContent() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-8 mb-8 border border-orange-100 dark:border-orange-900/30">
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Welcome to Bhutan EduSkill. These Terms of Service ("Terms") govern your use of our educational management
          platform. By accessing or using our services, you agree to be bound by these Terms.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Last Updated: February 25, 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Governing Law: Kingdom of Bhutan</span>
          </div>
        </div>
      </div>

      {/* Agreement Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-6 mb-8 border border-amber-200 dark:border-amber-900/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Please Read Carefully</h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              By creating an account or using Bhutan EduSkill, you acknowledge that you have read, understood,
              and agree to be bound by these Terms. If you do not agree, please do not use our services.
              For schools and organizations, the authorized representative agrees on behalf of the institution.
            </p>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-gray-950 dark:text-white mb-4">Table of Contents</h3>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {[
            "Service Description",
            "Account Registration & Security",
            "Subscription & Billing",
            "User Responsibilities",
            "Acceptable Use Policy",
            "Data Accuracy Obligations",
            "Intellectual Property",
            "Termination",
            "Limitation of Liability",
            "Indemnification",
            "Dispute Resolution",
            "General Provisions",
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

      {/* Section 1: Service Description */}
      <TermsSection title="1. Service Description" icon={FileText}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Bhutan EduSkill Platform</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Bhutan EduSkill is a B2B SaaS platform providing comprehensive educational management services including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Student information management",
                "Teacher administration tools",
                "Attendance tracking",
                "Grade and assessment management",
                "Career guidance and counseling",
                "Parent communication portal",
                "School administrative functions",
                "Analytics and reporting",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900/30">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Service Availability:</strong> We strive for 99.5% uptime but do not guarantee uninterrupted service.
              Scheduled maintenance will be announced at least 48 hours in advance when possible.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">User Roles</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              The platform supports the following user roles, each with specific permissions:
            </p>
            <ul className="space-y-2">
              {[
                { role: "Students", desc: "Access grades, assignments, career resources, assessments" },
                { role: "Teachers", desc: "Manage classes, assignments, attendance, student records" },
                { role: "Parents/Guardians", desc: "Monitor child progress, communicate with school" },
                { role: "Counselors", desc: "Provide guidance, track interventions, manage sessions" },
                { role: "School Admins", desc: "Full school management, staff oversight, reports" },
                { role: "Platform Admins", desc: "Multi-school oversight, platform configuration" },
                { role: "Ministry Users", desc: "Aggregate analytics, compliance reporting" },
              ].map((item) => (
                <li key={item.role} className="flex items-start gap-2 text-sm">
                  <Users className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>{item.role}:</strong> {item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TermsSection>

      {/* Section 2: Account Registration */}
      <TermsSection title="2. Account Registration & Security" icon={Shield}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Registration Requirements</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              To create an account, you must:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Be at least 13 years old (or have parental/guardian consent)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Provide accurate, current, and complete information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Maintain and update your information to keep it accurate</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Accept these Terms and our Privacy Policy</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Account Security</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              You are responsible for:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Maintaining the confidentiality of your password and account</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>All activities that occur under your account</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Immediately notifying us of unauthorized access</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Using a secure, unique password (not shared across services)</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-100 mb-1">You Are Liable</p>
                <p className="text-red-800 dark:text-red-200">
                  You are liable for any damage caused by failure to secure your account. We are not responsible
                  for losses due to unauthorized account access caused by your negligence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TermsSection>

      {/* Section 3: Subscription & Billing */}
      <TermsSection title="3. Subscription & Billing" icon={CreditCard}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Subscription Model</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Bhutan EduSkill operates on a subscription basis:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { plan: "Per-User Pricing", desc: "Schools pay based on number of active users (students, teachers, staff)" },
                { plan: "Annual Billing", desc: "Subscriptions billed annually in advance" },
                { plan: "Tiered Features", desc: "Higher tiers include additional features and support" },
              ].map((item) => (
                <div key={item.plan} className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                  <p className="font-medium text-gray-950 dark:text-white mb-1">{item.plan}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Payment Terms</h4>
            <ul className="space-y-2">
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Payment Due:</strong> Invoices are due within 30 days of issuance
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Late Fees:</strong> Interest at 1.5% per month (18% annual) on overdue amounts
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Price Changes:</strong> 60-day notice for subscription price changes
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Taxes:</strong> All prices exclude applicable Bhutanese taxes
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Cancellation & Refunds</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <span><strong>Cancellation Notice:</strong> 30 days prior to subscription renewal</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <span><strong>Prorated Refunds:</strong> Not available except as required by law</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <span><strong>Service Continuation:</strong> Access continues through paid period</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Free Trial:</strong> Schools may qualify for a trial period. No payment required during trial.
              Trial converts to paid subscription unless cancelled before trial end.
            </p>
          </div>
        </div>
      </TermsSection>

      {/* Section 4: User Responsibilities */}
      <TermsSection title="4. User Responsibilities" icon={Users}>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            As a user of Bhutan EduSkill, you agree to:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Data Accuracy", desc: "Enter and maintain accurate student, teacher, and school data" },
              { title: "Timely Updates", desc: "Update grades, attendance, and records within reasonable time" },
              { title: "Professional Conduct", desc: "Use platform professionally in educational contexts" },
              { title: "Confidentiality", desc: "Protect sensitive student and staff information" },
              { title: "Report Issues", desc: "Promptly report bugs, security issues, or misuse" },
              { title: "Compliance", desc: "Follow all applicable education laws and regulations" },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                <h4 className="font-medium text-gray-950 dark:text-white mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Educational Use Only</p>
                <p className="text-amber-800 dark:text-amber-200">
                  The platform is intended solely for legitimate educational purposes. Misuse for commercial,
                  political, or personal non-educational purposes is prohibited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TermsSection>

      {/* Section 5: Acceptable Use Policy */}
      <TermsSection title="5. Acceptable Use Policy" icon={CheckCircle2}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-3">Permitted Use</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">You may use the platform to:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Manage educational records within your authorized scope</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Communicate with students, parents, and colleagues</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Access and use platform features as designed</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Provide feedback and feature requests</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-3">Prohibited Use</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">You must NOT:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Share account credentials with others",
                "Access data outside your authorization",
                "Attempt to circumvent security measures",
                "Upload malicious code or viruses",
                "Harass, bully, or intimidate other users",
                "Violate student privacy laws",
                "Use platform for commercial solicitation",
                "Reverse engineer or copy platform code",
                "Interfere with platform availability",
                "Create false or misleading records",
              ].map((prohibited) => (
                <div key={prohibited} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <Ban className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{prohibited}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TermsSection>

      {/* Section 6: Data Accuracy */}
      <TermsSection title="6. Data Accuracy Obligations" icon={FileText}>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Accurate educational records are essential for student success and regulatory compliance.
          </p>

          <div className="bg-white dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold text-gray-950 dark:text-white mb-3">Minimum Accuracy Standards</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">1</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Student Information</p>
                  <p className="text-gray-600 dark:text-gray-400">Name, CID, date of birth, and contact details must be current</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">2</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Academic Records</p>
                  <p className="text-gray-600 dark:text-gray-400">Grades must be entered within 14 days of assessment completion</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">3</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Attendance Records</p>
                  <p className="text-gray-600 dark:text-gray-400">Daily attendance must be recorded by end of each school day</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">4</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Staff Records</p>
                  <p className="text-gray-600 dark:text-gray-400">Qualifications, certifications, and employment status must be accurate</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-100 mb-1">Consequences of Inaccurate Data</p>
                <p className="text-red-800 dark:text-red-200">
                  Schools that repeatedly fail to maintain accurate records may receive notice to correct,
                  potential account suspension, or termination of services. Intentional falsification is grounds
                  for immediate termination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TermsSection>

      {/* Section 7: Intellectual Property */}
      <TermsSection title="7. Intellectual Property" icon={Scale}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Our Property</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Bhutan EduSkill and its licensors own all intellectual property in the platform, including:
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Software code and architecture</li>
              <li>• User interface design and visual elements</li>
              <li>• Documentation, guides, and training materials</li>
              <li>• Trademarks, logos, and service marks</li>
              <li>• Proprietary algorithms and processes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Your License</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              We grant you a limited, non-exclusive, non-transferable license to:
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Access and use the platform during your subscription</li>
              <li>• Use features according to your assigned role</li>
              <li>• View and download documentation</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              This license is revocable upon termination.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Your Data</h4>
            <p className="text-gray-700 dark:text-gray-300">
              You retain ownership of any data you input into the platform (student records, grades, etc.).
              We do not claim ownership of your educational data. See our Privacy Policy for data processing details.
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Prohibited:</strong> Copying, modifying, creating derivative works, reverse engineering,
              or attempting to extract source code from the platform.
            </p>
          </div>
        </div>
      </TermsSection>

      {/* Section 8: Termination */}
      <TermsSection title="8. Termination" icon={Ban}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Termination by You</h4>
            <p className="text-gray-700 dark:text-gray-300">
              You may terminate your account by providing 30 days written notice. Any prepaid fees will not be
              refunded except as required by law.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Termination by Us</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              We may suspend or terminate your account for:
            </p>
            <ul className="space-y-2">
              {[
                "Violation of these Terms",
                "Non-payment of fees",
                "Misuse of the platform",
                "Security concerns or suspicious activity",
                "Regulatory or legal requirements",
                "Discontinuation of service",
              ].map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-sm">
                  <Ban className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Effect of Termination</h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• Access to the platform will be immediately revoked</li>
              <li>• You may export your data within 30 days of notice</li>
              <li>• We may retain data as required by law or for legitimate business purposes</li>
              <li>• All unpaid fees remain due and payable</li>
            </ul>
          </div>
        </div>
      </TermsSection>

      {/* Section 9: Limitation of Liability */}
      <TermsSection title="9. Limitation of Liability" icon={AlertTriangle}>
        <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
          <p className="text-amber-900 dark:text-amber-100 font-semibold mb-3">
            PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS OUR LIABILITY.
          </p>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-950 dark:text-white mb-2">To the Maximum Extent Permitted by Law:</p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span><strong>Direct Damages:</strong> Our liability is limited to the amount you paid in the 12 months preceding the claim</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span><strong>Indirect Damages:</strong> We are not liable for lost profits, data loss, or consequential damages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span><strong>No Guarantee:</strong> We do not guarantee uninterrupted, error-free, or secure operation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span><strong>Third Party:</strong> We are not liable for third-party services integrated with the platform</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-amber-300 dark:border-amber-700">
              <p className="text-gray-700 dark:text-gray-300">
                Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.
              </p>
            </div>
          </div>
        </div>
      </TermsSection>

      {/* Section 10: Indemnification */}
      <TermsSection title="10. Indemnification" icon={Shield}>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            You agree to indemnify and hold harmless Bhutan EduSkill, its officers, directors, employees, and agents
            from any claims, damages, losses, and expenses arising from:
          </p>
          <ul className="space-y-2">
            {[
              "Your use or misuse of the platform",
              "Your violation of these Terms",
              "Your violation of any third-party rights",
              "Data you input or fail to maintain accurately",
              "Your violation of applicable laws or regulations",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Defense:</strong> We reserve the right to assume the exclusive defense and control of any matter
              for which you are required to indemnify us, and you agree to cooperate with our defense.
            </p>
          </div>
        </div>
      </TermsSection>

      {/* Section 11: Dispute Resolution */}
      <TermsSection title="11. Dispute Resolution" icon={Scale}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Governing Law</h4>
            <p className="text-gray-700 dark:text-gray-300">
              These Terms are governed by the laws of the <strong>Kingdom of Bhutan</strong>. Any disputes will be
              resolved in accordance with Bhutanese law, without regard to conflict of law principles.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-950 dark:text-white mb-2">Dispute Resolution Process</h4>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">1</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Informal Resolution</p>
                  <p className="text-gray-600 dark:text-gray-400">Contact our support team to resolve the issue informally</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">2</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Formal Notice</p>
                  <p className="text-gray-600 dark:text-gray-400">If unresolved, send a written description of the dispute to our legal department</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">3</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Mediation (Optional)</p>
                  <p className="text-gray-600 dark:text-gray-400">Both parties may agree to non-binding mediation</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold text-xs">4</span>
                <div>
                  <p className="font-medium text-gray-950 dark:text-white">Court Action</p>
                  <p className="text-gray-600 dark:text-gray-400">Courts of Thimphu, Bhutan have exclusive jurisdiction</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </TermsSection>

      {/* Section 12: General Provisions */}
      <TermsSection title="12. General Provisions" icon={FileText}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-1">Entire Agreement</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                These Terms constitute the entire agreement between you and Bhutan EduSkill
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-1">Severability</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                If any provision is found invalid, remaining provisions stay in effect
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-1">Waiver</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Failure to enforce any provision does not constitute waiver
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-1">Assignment</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                You may not assign rights without our written consent
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-1">Modifications</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                We may modify Terms with 30-day notice; continued use constitutes acceptance
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-950 dark:text-white mb-1">Force Majeure</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                We are not liable for delays due to events beyond our control
              </p>
            </div>
          </div>
        </div>
      </TermsSection>

      {/* Contact Section */}
      <div className="mt-12 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
        <h3 className="text-lg font-semibold text-gray-950 dark:text-white mb-4">Questions About These Terms?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-950 dark:text-white mb-1">Legal Inquiries</p>
            <p className="text-gray-600 dark:text-gray-400">legal@bhutaneduskill.bt</p>
          </div>
          <div>
            <p className="font-medium text-gray-950 dark:text-white mb-1">General Support</p>
            <p className="text-gray-600 dark:text-gray-400">support@bhutaneduskill.bt</p>
          </div>
          <div>
            <p className="font-medium text-gray-950 dark:text-white mb-1">Address</p>
            <p className="text-gray-600 dark:text-gray-400">Thimphu, Bhutan</p>
          </div>
          <div>
            <p className="font-medium text-gray-950 dark:text-white mb-1">Phone</p>
            <p className="text-gray-600 dark:text-gray-400">+975 2-34567</p>
          </div>
        </div>
      </div>
    </div>
  );
}
