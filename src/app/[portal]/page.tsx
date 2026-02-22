import { PORTAL_CONFIG } from "@/config/portal-config";
import type { Metadata } from "next";

type PortalParams = { portal: keyof typeof PORTAL_CONFIG };

/**
 * Dynamic SEO metadata for each portal
 * Generates unique titles, descriptions based on portal type
 */
export async function generateMetadata({ params }: { params: Promise<PortalParams> }): Promise<Metadata> {
  const { portal } = await params;
  const config = PORTAL_CONFIG[portal];

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
}

export default function PortalPage() {
  return <div>Portal content coming soon...</div>;
}
