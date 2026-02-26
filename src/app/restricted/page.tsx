"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toaster";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardDescription, PremiumCardContent } from "@/components/admin/premium-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, School, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { portal } from "@/styles/design-tokens";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  type: string;
  onboardingStatus?: string;
}

export default function RestrictedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolCode, setSchoolCode] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setUser(data.profile);

          // If user is already approved/enrolled, redirect to their portal
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

          // If user is rejected, redirect to rejected page
          if (data.profile?.onboardingStatus === "rejected") {
            router.push("/rejected");
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

  const handleContinue = () => {
    if (!schoolCode.trim()) {
      toast({
        title: "School code required",
        description: "Please enter your school verification code to continue.",
        variant: "error",
      });
      return;
    }

    // Redirect to setup with school code pre-filled
    router.push(`/setup/unified?code=${encodeURIComponent(schoolCode.trim())}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Portal colors for consistent branding
  const portalColors: Record<string, { gradient: string; bg: string }> = {
    student: { gradient: portal.student.gradient, bg: "bg-orange-50" },
    teacher: { gradient: portal.teacher.gradient, bg: "bg-blue-50" },
    parent: { gradient: portal.parent.gradient, bg: "bg-gray-50" },
    counselor: { gradient: portal.counselor.gradient, bg: "bg-purple-50" },
    "school-admin": { gradient: portal.schoolAdmin.gradient, bg: "bg-violet-50" },
  };

  const colors = portalColors[user?.type || "student"] || portalColors.student;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.6, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: colors.gradient }}
          >
            <School className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Main Message Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <PremiumCard className="border-2 shadow-lg">
            <PremiumCardHeader className="text-center pb-4">
              <PremiumCardTitle className="text-2xl font-bold text-gray-900">
                Complete Your Profile
              </PremiumCardTitle>
              <PremiumCardDescription className="text-base mt-2">
                Welcome to Bhutan EduSkill! To access your portal, please verify your school.
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
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ background: colors.gradient }}
                  >
                    {user?.type?.replace("-", " ")}
                  </div>
                </div>
              </div>

              {/* Alert Info */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Account Verification Required</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your account needs to be linked to a school before you can access the platform.
                    Please enter your school verification code below.
                  </p>
                </div>
              </div>

              {/* School Code Input */}
              <div className="space-y-3">
                <Label htmlFor="schoolCode">School Verification Code</Label>
                <Input
                  id="schoolCode"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="Enter your school code (e.g., SCH-XXXX)"
                  className="text-center text-lg tracking-widest uppercase"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 text-center">
                  Contact your school administrator if you don't have your school code.
                </p>
              </div>
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>

        {/* Steps Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <PremiumCard className="border-2 border-gray-200">
            <PremiumCardHeader className="pb-3">
              <PremiumCardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                What Happens Next?
              </PremiumCardTitle>
            </PremiumCardHeader>
            <PremiumCardContent>
              <ol className="space-y-3">
                {[
                  "Enter your school verification code above",
                  "Complete your profile setup",
                  "Submit your application for approval",
                  "Access your portal once approved by school admin",
                ].map((step, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: colors.gradient }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{step}</span>
                  </motion.li>
                ))}
              </ol>
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Button
            onClick={handleContinue}
            disabled={isSubmitting}
            className="w-full gap-2 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ background: colors.gradient }}
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                Continue to Setup
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-sm text-gray-500"
        >
          Need help? Contact your school administrator or{" "}
          <a href="mailto:support@bhutaneduskill.bt" className="text-blue-600 hover:underline">
            support@bhutaneduskill.bt
          </a>
        </motion.div>
      </div>
    </div>
  );
}
