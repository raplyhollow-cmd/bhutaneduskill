import type { Metadata } from "next";
import { PORTAL_CONFIG } from "@/config/portal-config";
import { UnifiedPortalLayoutClient } from "./layout-client";

/**
 * Dynamic metadata generation for each portal
 * Generates unique titles and descriptions based on portal type
 *
 * This must be a Server Component to export metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ portal: string }> }): Promise<Metadata> {
  try {
    const { portal } = await params;
    const config = PORTAL_CONFIG[portal as keyof typeof PORTAL_CONFIG];

    if (!config) {
      return {
        title: "Portal | Bhutan EduSkill",
        description: "Access your Bhutan EduSkill dashboard.",
      };
    }

    return {
      title: `${config.name} | Bhutan EduSkill`,
      description: `Access your ${config.name.toLowerCase()} dashboard - manage classes, view progress, and connect with teachers.`,
      openGraph: {
        title: config.name,
        description: `Bhutan EduSkill ${config.name}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: config.name,
      },
    };
  } catch {
    return {
      title: "Bhutan EduSkill",
      description: "Bhutan's National Career Guidance & School Management Platform",
    };
  }
}

/**
 * Unified Portal Layout (Server Component Wrapper)
 *
 * This file is a Server Component that:
 * 1. Exports metadata for SEO
 * 2. Delegates rendering to the client component
 */
export default function UnifiedPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ portal: string }>;
}) {
  return <UnifiedPortalLayoutClient params={params}>{children}</UnifiedPortalLayoutClient>;
}
