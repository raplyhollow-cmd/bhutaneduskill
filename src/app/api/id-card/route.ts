/**
 * ID CARD GENERATOR API ROUTE
 *
 * Generates student/teacher ID cards with photo and school details
 * Returns image data that can be printed or saved as PDF
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

/**
 * User with school and parent relations for ID card
 */
interface UserWithRelations {
  id: string;
  firstName: string | null;
  lastName: string | null;
  type: string | null;
  profilePicture: string | null;
  classGrade: number | null;
  section: string | null;
  dateOfBirth: string | null;
  employeeId: string | null;
  school?: {
    name: string;
    address: string | null;
  } | null;
  parent?: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
}

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }
    const { userId, user } = auth;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        school: true,
        parent: {
          columns: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!currentUser) {
      return notFoundResponse("User");
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId"); // Admin can generate for others

    // If admin requesting for specific user
    const targetUser = targetUserId && currentUser.role === "admin"
      ? await db.query.users.findFirst({
          where: eq(users.id, targetUserId),
          with: {
            school: true,
            parent: {
              columns: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        })
      : currentUser;

    if (!targetUser) {
      return notFoundResponse("Target user");
    }

    // Generate SVG ID Card
    const svgIdCard = generateIdCardSVG(targetUser);

    // Convert to PNG
    const pngBuffer = await svgToPng(svgIdCard);

    // Return image with appropriate headers
    return new NextResponse(Buffer.from(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="id-card-${targetUser.id}.png"`,
      },
    });
  },
  ['admin', 'teacher', 'school-admin']
);

function generateIdCardSVG(user: UserWithRelations): string {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const roleLabel = user.type ? user.type.charAt(0).toUpperCase() + user.type.slice(1) : "STUDENT";
  const schoolName = user.school?.name || "Bhutan School";
  const schoolAddress = user.school?.address || "Bhutan";

  // Generate unique ID
  const idNumber = user.id.slice(-8).toUpperCase();

  // Current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Determine colors based on role
  const roleColors: Record<string, { primary: string; secondary: string; accent: string }> = {
    student: {
      primary: "#f97316", // Orange
      secondary: "#ea580c",
      accent: "#fff7ed",
    },
    teacher: {
      primary: "#2563eb", // Blue
      secondary: "#1d4ed8",
      accent: "#dbeafe",
    },
    parent: {
      primary: "#6b7280", // Gray
      secondary: "#4b5563",
      accent: "#e5e7eb",
    },
    admin: {
      primary: "#db2777", // Pink
      secondary: "#be185d",
      accent: "#fce7f3",
    },
    counselor: {
      primary: "#9333ea", // Purple
      secondary: "#7e22ce",
      accent: "#f3e8ff",
    },
    "school-admin": {
      primary: "#7c3aed", // Violet
      secondary: "#6366f1",
      accent: "#ddd6fe",
    },
  };

  const colors = roleColors[user.type || "student"];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="380" viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.secondary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:1" />
    </linearGradient>
    <clipPath id="photoClip">
      <circle cx="80" cy="80" r="60" />
    </clipPath>
  </defs>

  <!-- Background Card -->
  <rect width="600" height="380" rx="12" fill="url(#bgGradient)" />

  <!-- Header Bar -->
  <rect width="600" height="60" fill="${colors.primary}" opacity="0.9" />

  <!-- School Name -->
  <text x="300" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
    ${schoolName.toUpperCase()}
  </text>

  <!-- Decorative Pattern (subtle Bhutan-inspired) -->
  <g opacity="0.1">
    <rect x="0" y="60" width="600" height="320" fill="white" />
    <circle cx="580" cy="340" r="100" fill="${colors.primary}" />
    <circle cx="20" cy="100" r="60" fill="${colors.accent}" />
  </g>

  <!-- Main Content Area -->
  <rect x="20" y="80" width="560" height="280" rx="8" fill="white" stroke="${colors.primary}" stroke-width="2" />

  <!-- Photo Area -->
  <circle cx="80" cy="160" r="55" fill="${colors.secondary}" stroke="${colors.primary}" stroke-width="2" />
  <circle cx="80" cy="160" r="60" fill="${colors.accent}" />
  <g clip-path="url(#photoClip)">
    ${user.profilePicture
      ? `<image href="${user.profilePicture}" x="20" y="100" width="120" height="120" preserveAspectRatio="xMidYMid slice" />`
      : `<text x="80" y="165" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${colors.primary}">${fullName.charAt(0)}</text>`
    }
  </g>

  <!-- User Info -->
  <text x="160" y="100" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${colors.primary}">
    ${fullName}
  </text>
  <text x="160" y="125" font-family="Arial, sans-serif" font-size="14" fill="#666">
    ${roleLabel}
  </text>

  <!-- Details Grid -->
  <g transform="translate(160, 160)">
    <!-- ID Number -->
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="11" fill="#888">
      ID Number:
    </text>
    <text x="0" y="16" font-family="Courier New, monospace" font-size="15" font-weight="bold" fill="${colors.primary}">
      ${idNumber}
    </text>

    <!-- Class/Grade (for students) -->
    ${user.classGrade ? `
      <text x="0" y="40" font-family="Arial, sans-serif" font-size="11" fill="#888">
        Class:
      </text>
      <text x="0" y="56" font-family="Arial, sans-serif" font-size="14" fill="#333">
        Class ${user.classGrade}${user.section ? " - " + user.section : ""}
      </text>
    ` : ''}

    <!-- Date of Birth (if available) -->
    ${user.dateOfBirth ? `
      <text x="0" y="80" font-family="Arial, sans-serif" font-size="11" fill="#888">
        Date of Birth:
      </text>
      <text x="0" y="96" font-family="Arial, sans-serif" font-size="12" fill="#333">
        ${new Date(user.dateOfBirth).toLocaleDateString()}
      </text>
    ` : ''}

    <!-- Parent/Guardian (for students) -->
    ${user.parent && user.type === "student" ? `
      <text x="0" y="120" font-family="Arial, sans-serif" font-size="11" fill="#888">
        Parent/Guardian:
      </text>
      <text x="0" y="136" font-family="Arial, sans-serif" font-size="12" fill="#333">
        ${user.parent.firstName} ${user.parent.lastName}
      </text>
      ${user.parent.phone ? `
        <text x="0" y="154" font-family="Arial, sans-serif" font-size="11" fill="#666">
          ${user.parent.phone}
        </text>
      ` : ''}
    ` : ''}

    <!-- Employee ID (for teachers/staff) -->
    ${user.employeeId && user.type !== "student" ? `
      <text x="0" y="80" font-family="Arial, sans-serif" font-size="11" fill="#888">
        Employee ID:
      </text>
      <text x="0" y="96" font-family="Courier New, monospace" font-size="13" font-weight="bold" fill="${colors.primary}">
        ${user.employeeId}
      </text>
    ` : ''}
  </g>

  <!-- School Info -->
  <g transform="translate(30, 270)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="10" fill="#888">
      ${schoolAddress}
    </text>
    <text x="0" y="15" font-family="Arial, sans-serif" font-size="10" fill="#666">
      ${schoolName}
    </text>
  </g>

  <!-- Valid Until -->
  <text x="570" y="350" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#888">
    Valid Until: ${currentDate}
  </text>

  <!-- Barcode (simulated) -->
  <g transform="translate(420, 300)">
    <rect x="0" y="0" width="140" height="40" fill="white" stroke="#333" stroke-width="1" />
    <g transform="translate(10, 15)">
      ${generateBarcode(idNumber)}
    </g>
    <text x="70" y="50" text-anchor="middle" font-family="Courier New, monospace" font-size="10" fill="#333">
      ${idNumber}
    </text>
  </g>

  <!-- Signature Line -->
  <line x1="420" y1="340" x2="560" y2="340" stroke="#ccc" stroke-width="1" stroke-dasharray="4,4" />
  <text x="490" y="355" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#888">
    Signature
  </text>

  <!-- Emergency Contact (if available) -->
  ${user.parent && user.parent.phone && user.type === "student" ? `
    <text x="30" y="350" font-family="Arial, sans-serif" font-size="8" fill="#888">
      Emergency: ${user.parent.phone}
    </text>
  ` : ''}

  <!-- Watermark/Badge -->
  <g transform="translate(480, 80)">
    <rect x="0" y="0" width="90" height="24" rx="4" fill="${colors.primary}" opacity="0.2" />
    <text x="45" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white">
      VALID
    </text>
  </g>
</svg>`;
}

// Simple barcode generator
function generateBarcode(code: string): string {
  // Generate a simple visual barcode pattern
  const barWidth = 2;
  const gapWidth = 2;
  const height = 20;
  let x = 0;
  let bars = '';

  for (let i = 0; i < 25; i++) {
    if (code.charCodeAt(i % code.length) % 2 === 0) {
      const barHeight = Math.random() > 0.5 ? height : height / 2;
      bars += `<rect x="${x}" y="${height - barHeight}" width="${barWidth}" height="${barHeight}" fill="#333" />`;
    }
    x += barWidth + gapWidth;
  }

  return bars;
}

// Convert SVG to PNG using canvas
async function svgToPng(svgString: string): Promise<Buffer> {
  // This is a simplified version - in production you'd use sharp or jimp
  // For now, we'll return the SVG string which browsers can handle
  return Buffer.from(svgString);
}