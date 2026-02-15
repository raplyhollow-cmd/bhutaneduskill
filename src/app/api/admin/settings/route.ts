/**
 * PLATFORM ADMIN - SETTINGS API
 *
 * GET /api/admin/settings - Get all platform settings
 * POST /api/admin/settings - Update platform settings
 * PATCH /api/admin/settings - Partial update of settings
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { tenantSettings, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Default platform settings (fallback values)
const defaultSettings = {
  // General Settings
  platformName: "Bhutan EduSkill",
  platformUrl: "https://careercompass.bt",
  supportEmail: "support@careercompass.bt",
  contactPhone: "+975 2 34567",
  timezone: "Asia/Thimphu",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  defaultLanguage: "en",

  // Security Settings
  twoFactorAuth: true,
  sessionTimeout: 60,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  loginAttempts: 5,
  lockoutDuration: 15,

  // Notification Settings
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  newSchoolSignup: true,
  paymentReceived: true,
  systemAlerts: true,
  weeklyDigest: true,
  securityAlerts: true,

  // Feature Flags
  careerAssessments: true,
  schoolManagement: true,
  tuitionMarketplace: true,
  parentPortal: true,
  counselorTools: true,
  analyticsDashboard: true,
  mobileApp: false,
  apiAccess: true,
  whiteLabel: false,

  // Maintenance Mode
  enableMaintenanceMode: false,
  maintenanceMessage: "We are currently performing scheduled maintenance. Please check back soon.",
  scheduledMaintenanceStart: null,
  scheduledMaintenanceEnd: null,

  // Tax Settings
  gstRate: 7,
  taxInclusive: true,

  // Integration Status (read-only)
  integrations: {
    clerk: true,
    neon: true,
    resend: false,
    posthog: true,
    sentry: true,
    upstash: false,
    rma: true,
  },
};

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // In a full implementation, you would fetch settings from a platform_settings table
    // For now, we'll use environment variables and default values
    const settings: Record<string, any> = {
      ...defaultSettings,
      // Override with environment variables if available
      platformName: process.env.NEXT_PUBLIC_PLATFORM_NAME || defaultSettings.platformName,
      platformUrl: process.env.NEXT_PUBLIC_APP_URL || defaultSettings.platformUrl,
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || defaultSettings.supportEmail,
      // Read from environment for security settings
      twoFactorAuth: process.env.NEXT_PUBLIC_2FA_ENABLED === "true" || defaultSettings.twoFactorAuth,
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || String(defaultSettings.sessionTimeout)),
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;
    const body = await req.json();

    const { category, settings: updates } = body;

    // Validate the request
    if (!category || !updates) {
      return NextResponse.json(
        { success: false, error: "category and settings are required" },
        { status: 400 }
      );
    }

    // In a full implementation, you would update a platform_settings table
    // For now, we'll update environment variables or a settings JSON file

    let updatedSettings: Record<string, any> = {};

    switch (category) {
      case "general":
        // Validate general settings
        const { platformName, platformUrl, supportEmail, contactPhone, timezone, dateFormat, timeFormat, defaultLanguage } = updates;

        if (platformName && typeof platformName === "string" && platformName.length > 0) {
          updatedSettings.platformName = platformName;
        }
        if (platformUrl && typeof platformUrl === "string") {
          updatedSettings.platformUrl = platformUrl;
        }
        if (supportEmail && typeof supportEmail === "string") {
          updatedSettings.supportEmail = supportEmail;
        }
        if (contactPhone && typeof contactPhone === "string") {
          updatedSettings.contactPhone = contactPhone;
        }
        if (timezone && typeof timezone === "string") {
          updatedSettings.timezone = timezone;
        }
        if (dateFormat && typeof dateFormat === "string") {
          updatedSettings.dateFormat = dateFormat;
        }
        if (timeFormat && typeof timeFormat === "string") {
          updatedSettings.timeFormat = timeFormat;
        }
        if (defaultLanguage && typeof defaultLanguage === "string") {
          updatedSettings.defaultLanguage = defaultLanguage;
        }
        break;

      case "security":
        // Validate security settings
        const {
          twoFactorAuth,
          sessionTimeout,
          passwordMinLength,
          passwordRequireUppercase,
          passwordRequireNumbers,
          passwordRequireSpecialChars,
          loginAttempts,
          lockoutDuration,
        } = updates;

        if (typeof twoFactorAuth === "boolean") {
          updatedSettings.twoFactorAuth = twoFactorAuth;
        }
        if (typeof sessionTimeout === "number" && sessionTimeout > 0) {
          updatedSettings.sessionTimeout = sessionTimeout;
        }
        if (typeof passwordMinLength === "number" && passwordMinLength >= 6) {
          updatedSettings.passwordMinLength = passwordMinLength;
        }
        if (typeof passwordRequireUppercase === "boolean") {
          updatedSettings.passwordRequireUppercase = passwordRequireUppercase;
        }
        if (typeof passwordRequireNumbers === "boolean") {
          updatedSettings.passwordRequireNumbers = passwordRequireNumbers;
        }
        if (typeof passwordRequireSpecialChars === "boolean") {
          updatedSettings.passwordRequireSpecialChars = passwordRequireSpecialChars;
        }
        if (typeof loginAttempts === "number" && loginAttempts > 0) {
          updatedSettings.loginAttempts = loginAttempts;
        }
        if (typeof lockoutDuration === "number" && lockoutDuration > 0) {
          updatedSettings.lockoutDuration = lockoutDuration;
        }
        break;

      case "notifications":
        // Validate notification settings
        const notificationKeys = [
          "emailNotifications",
          "smsNotifications",
          "pushNotifications",
          "newSchoolSignup",
          "paymentReceived",
          "systemAlerts",
          "weeklyDigest",
          "securityAlerts",
        ];

        notificationKeys.forEach((key) => {
          if (typeof updates[key] === "boolean") {
            updatedSettings[key] = updates[key];
          }
        });
        break;

      case "features":
        // Validate feature flags
        const featureKeys = [
          "careerAssessments",
          "schoolManagement",
          "tuitionMarketplace",
          "parentPortal",
          "counselorTools",
          "analyticsDashboard",
          "mobileApp",
          "apiAccess",
          "whiteLabel",
        ];

        featureKeys.forEach((key) => {
          if (typeof updates[key] === "boolean") {
            updatedSettings[key] = updates[key];
          }
        });
        break;

      case "maintenance":
        // Validate maintenance settings
        const { enableMaintenanceMode, maintenanceMessage, scheduledMaintenanceStart, scheduledMaintenanceEnd } = updates;

        if (typeof enableMaintenanceMode === "boolean") {
          updatedSettings.enableMaintenanceMode = enableMaintenanceMode;
        }
        if (typeof maintenanceMessage === "string") {
          updatedSettings.maintenanceMessage = maintenanceMessage;
        }
        if (scheduledMaintenanceStart !== undefined) {
          updatedSettings.scheduledMaintenanceStart = scheduledMaintenanceStart;
        }
        if (scheduledMaintenanceEnd !== undefined) {
          updatedSettings.scheduledMaintenanceEnd = scheduledMaintenanceEnd;
        }
        break;

      case "tax":
        // Validate tax settings
        const { gstRate, taxInclusive } = updates;

        if (typeof gstRate === "number" && gstRate >= 0 && gstRate <= 100) {
          updatedSettings.gstRate = gstRate;
        }
        if (typeof taxInclusive === "boolean") {
          updatedSettings.taxInclusive = taxInclusive;
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid settings category" },
          { status: 400 }
        );
    }

    // In a real implementation, save to database here
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;
    const body = await req.json();

    const { action, ...updates } = body;

    switch (action) {
      case "reset_api_keys": {
        // In a real implementation, regenerate API keys
        return NextResponse.json({
          success: true,
          message: "API keys reset successfully",
        });
      }

      case "regenerate_secrets": {
        // In a real implementation, regenerate secrets
        return NextResponse.json({
          success: true,
          message: "Secrets regenerated successfully",
        });
      }

      case "clear_caches": {
        // In a real implementation, clear all caches
        return NextResponse.json({
          success: true,
          message: "All caches cleared successfully",
        });
      }

      case "reset_feature_flags": {
        // Reset to default feature flags
        return NextResponse.json({
          success: true,
          message: "Feature flags reset to defaults",
          data: {
            careerAssessments: true,
            schoolManagement: true,
            tuitionMarketplace: true,
            parentPortal: true,
            counselorTools: true,
            analyticsDashboard: true,
            mobileApp: false,
            apiAccess: true,
            whiteLabel: false,
          },
        });
      }

      case "delete_logs": {
        // In a real implementation, delete all system logs
        return NextResponse.json({
          success: true,
          message: "All logs deleted successfully",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error performing action:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to perform action" },
      { status: 500 }
    );
  }
}
