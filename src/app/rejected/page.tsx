"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardDescription, PremiumCardContent } from "@/components/admin/premium-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, School, RefreshCw, ArrowRight, Mail, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useClerk } from "@clerk/nextjs";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  type: string;
  onboardingStatus?: string;
  rejectionReason?: string;
  school?: {
    id: string;
    name: string;
    code: string;
  };
}

export default function RejectedPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolCode, setSchoolCode] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setUser(data.profile);

          // If user is no longer rejected, redirect appropriately
          if (data.profile?.onboardingStatus === "approved" || data.profile?.onboardingStatus === "active") {
            const redirectMap: Record<string, string> = {
              student: "/student",
              teacher: "/teacher",
              parent: "/parent",
              counselor: "/counselor",
              "school-admin": "/school-admin",
            };
            const portal = redirectMap[data.profile.type];
            if (portal) {
              router.push(portal);
              return;
            }
          }

          // If user is pending approval, redirect to pending page
          if (data.profile?.onboardingStatus === "pending_approval") {
            router.push("/pending-approval");
            return;
          }

          // If user is restricted, redirect to restricted page
          if (data.profile?.onboardingStatus === "restricted") {
            router.push("/restricted");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleRetryWithCode = () => {
    if (!schoolCode.trim()) {
      toast({
        title: "School code required",
        description: "Please enter a new school verification code to reapply.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to setup with new school code
    router.push(`/setup/unified?code=${encodeURIComponent(schoolCode.trim())}`);
  };

  const handleRetry = () => {
    // Redirect to setup to try again
    router.push("/setup/unified");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Portal colors for consistent branding
  const portalColors: Record<string, { from: string; to: string; bg: string }> = {
    student: { from: "rgb(249 115 22)", to: "rgb(194 65 12)", bg: "bg-orange-50" },
    teacher: { from: "rgb(59 130 246)", to: "rgb(37 99 235)", bg: "bg-blue-50" },
    parent: { from: "rgb(107 114 128)", to: "rgb(75 85 99)", bg: "bg-gray-50" },
    counselor: { from: "rgb(168 85 247)", to: "rgb(147 51 234)", bg: "bg-purple-50" },
    "school-admin": { from: "rgb(139 92 246)", to: "rgb(124 58 237)", bg: "bg-violet-50" },
  };

  const colors = portalColors[user?.type || "student"] || portalColors.student;

  // Common rejection reasons with user-friendly messages
  const rejectionMessages: Record<string, string> = {
    "invalid_credentials": "The information you provided does not match our school records.",
    "duplicate_application": "An application with this information already exists.",
    "school_capacity": "The school has reached maximum capacity for new applications.",
    "not_eligible": "You do not meet the eligibility requirements for this school.",
    "incomplete_profile": "Your application was incomplete. Please provide all required information.",
    "verification_failed": "We could not verify your details with the school records.",
  };

  const rejectionReason = user?.rejectionReason
    ? rejectionMessages[user.rejectionReason] || user.rejectionReason
    : "Your school application could not be approved at this time.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Animated Warning Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.6, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-red-500 shadow-lg">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Main Message Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <PremiumCard className="border-2 border-red-200 shadow-lg">
            <PremiumCardHeader className="text-center pb-4">
              <PremiumCardTitle className="text-2xl font-bold text-gray-900">
                Application Not Approved
              </PremiumCardTitle>
              <PremiumCardDescription className="text-base mt-2">
                We were unable to approve your application at this time.
              </PremiumCardDescription>
            </PremiumCardHeader>
            <PremiumCardContent className="space-y-6 pt-4">
              {/* User Info */}
              <div className={`${colors.bg} rounded-xl p-4 border border-opacity-20`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm">
                    <span className="text-xl font-bold" style={{ color: colors.from }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Rejected
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Reason for Rejection</p>
                  <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
                </div>
              </div>

              {/* School Info (if exists) */}
              {user?.school && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <School className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Applied to</p>
                    <p className="font-semibold text-gray-900">{user.school.name}</p>
                  </div>
                </div>
              )}

              {/* What You Can Do */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What You Can Do</Label>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">1.</span>
                    <span>Apply with a different school using their verification code below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">2.</span>
                    <span>Contact your school administrator to verify your information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">3.</span>
                    <span>Reach out to our support team for assistance</span>
                  </li>
                </ul>
              </div>

              {/* Try with Different School Code */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <Label htmlFor="schoolCode">Try with a Different School Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="schoolCode"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    placeholder="Enter new school code"
                    className="text-center tracking-widest uppercase"
                    maxLength={20}
                  />
                  <Button
                    onClick={handleRetryWithCode}
                    variant="outline"
                    className="gap-2 whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reapply
                  </Button>
                </div>
              </div>
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>

        {/* Contact Support Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <PremiumCard className="border-2 border-gray-200">
            <PremiumCardHeader className="pb-3">
              <PremiumCardTitle className="text-lg">Need Help?</PremiumCardTitle>
            </PremiumCardHeader>
            <PremiumCardContent>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Contact Support</p>
                  <p className="text-sm text-blue-700 mt-1">
                    If you believe this is an error, please contact{" "}
                    <a href="mailto:support@bhutaneduskill.bt" className="underline hover:text-blue-800">
                      support@bhutaneduskill.bt
                    </a>{" "}
                    with your details.
                  </p>
                </div>
              </div>
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={handleRetry}
            className="flex-1 gap-2"
            style={{ background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)` }}
          >
            <RefreshCw className="w-4 h-4" />
            Start New Application
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
