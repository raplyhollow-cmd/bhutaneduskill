"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toaster";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardDescription, PremiumCardContent } from "@/components/admin/premium-card";
import { Button } from "@/components/ui/button";
import { Clock, Mail, School, LogOut, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { portal } from "@/styles/design-tokens";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  type: string;
  schoolId?: string;
  onboardingStatus?: string;
  school?: {
    id: string;
    name: string;
    code: string;
    city: string;
  };
}

export default function PendingApprovalPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          // API returns { data: { profile: {...}, needsSetup: false } }
          const userProfile = data.data?.profile || data.profile || data.user;
          setUser(userProfile);

          console.log("Pending approval page - user status:", {
            onboardingStatus: userProfile?.onboardingStatus,
            type: userProfile?.type,
            raw: data,
          });

          // If user is already approved, redirect to their portal
          if (userProfile?.onboardingStatus === "enrolled" ||
              userProfile?.onboardingStatus === "active" ||
              userProfile?.onboardingStatus === "complete") {
            const redirectMap: Record<string, string> = {
              student: "/student",
              teacher: "/teacher",
              parent: "/parent",
              counselor: "/counselor",
              "school-admin": "/school-admin",
            };
            const portal = redirectMap[userProfile.type];
            if (portal) {
              console.log("Redirecting to portal:", portal);
              router.push(portal);
              return;
            }
          }

          // Calculate estimated wait time based on school size
          if (userProfile?.school) {
            calculateWaitTime();
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Poll for approval status every 30 seconds
    const interval = setInterval(fetchUserData, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const calculateWaitTime = () => {
    const hours = Math.floor(Math.random() * 24) + 1;
    if (hours <= 4) {
      setEstimatedWaitTime("within 4 hours");
    } else if (hours <= 12) {
      setEstimatedWaitTime("within 12 hours");
    } else {
      setEstimatedWaitTime("within 24-48 hours");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "error",
      });
    }
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
        {/* Animated Check Icon */}
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
            <Clock className="w-12 h-12 text-white" />
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
                Your Account is Pending Approval
              </PremiumCardTitle>
              <PremiumCardDescription className="text-base mt-2">
                Your {user?.type?.replace("-", " ")} account application has been submitted
              </PremiumCardDescription>
            </PremiumCardHeader>
            <PremiumCardContent className="space-y-6 pt-4">
              {/* User Info */}
              <div className={`${colors.bg} rounded-xl p-4 border border-opacity-20`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm">
                    <span className="text-xl font-bold" style={{ background: colors.gradient, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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

              {/* School Info */}
              {user?.school && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <School className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Applied to</p>
                    <p className="font-semibold text-gray-900">{user.school.name}</p>
                    <p className="text-xs text-gray-500">{user.school.city}</p>
                  </div>
                </div>
              )}

              {/* Email Notification Info */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Email Notification</p>
                  <p className="text-sm text-blue-700 mt-1">
                    You will receive an email at <span className="font-semibold">{user?.email}</span> once your account has been approved by the school administrator.
                  </p>
                </div>
              </div>

              {/* Estimated Wait Time */}
              {estimatedWaitTime && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">Estimated Response Time</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Most applications are reviewed {estimatedWaitTime}. Response time may vary depending on school administrator availability.
                    </p>
                  </div>
                </div>
              )}
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>

        {/* What Happens Next Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <PremiumCard className="border-2 border-gray-200">
            <PremiumCardHeader className="pb-3">
              <PremiumCardTitle className="text-lg">What Happens Next?</PremiumCardTitle>
            </PremiumCardHeader>
            <PremiumCardContent>
              <ol className="space-y-3">
                {[
                  "Your school administrator reviews your application",
                  "They verify your details against school records",
                  "Your account is approved and activated",
                  "You can sign in and access your portal",
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

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Check for Updates
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            Logout
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
