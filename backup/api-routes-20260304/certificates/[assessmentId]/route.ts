import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, assessments, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { jsPDF } from "jspdf";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported certificate formats
 */
type CertificateFormat = "html" | "pdf";

/**
 * Certificate data returned by the API
 */
export interface CertificateData {
  id: string;
  studentName: string;
  assessmentName: string;
  assessmentType: string;
  completedAt: string;
  issuedAt: string;
  results?: CertificateResults;
  certificateUrl?: string;
  schoolName?: string;
  certificateNumber: string;
}

/**
 * Certificate results based on assessment type
 */
export interface CertificateResults {
  riasecCode?: string;
  type?: string;
  primaryType?: string;
  score?: number;
  totalScore?: number;
  percentage?: number;
  grade?: string;
  [key: string]: string | number | undefined;
}

/**
 * PDF generation options
 */
interface PDFGenerationOptions {
  format: "a4" | "letter";
  orientation: "landscape" | "portrait";
  includeBorder: boolean;
  includeSeal: boolean;
  theme: "classic" | "modern" | "elegant";
}

/**
 * Dimensions and positioning for certificate elements
 */
interface CertificateLayout {
  width: number;
  height: number;
  margin: number;
  headerY: number;
  contentY: number;
  footerY: number;
  centerX: number;
}

/**
 * Assessment with proper typing from schema
 */
type AssessmentWithResults = {
  id: string;
  userId: string;
  type: string | null;
  title: string;
  status: string | null;
  completedAt: Date | null;
  results: unknown;
  startedAt: Date | null;
  schoolId?: string | null;
};

/**
 * Student data with school information
 */
type StudentWithSchool = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
};

// ============================================================================
// API ROUTE
// ============================================================================

/**
 * GET /api/certificates/[assessmentId] - Generate certificate for completed assessment
 *
 * Access Control:
 * - Students: Can only access their own certificates
 * - Admins: Can access any certificate
 *
 * Requirements:
 * - Assessment must be completed
 * - User must own the assessment (unless admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  // Authentication & authorization check
  const authResult = await requireAuth(["student", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  const { userId, user } = authResult;

  try {
    const { assessmentId } = await params;

    // Parse query parameters for format selection
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") as CertificateFormat) || "html";
    const theme = (searchParams.get("theme") as PDFGenerationOptions["theme"]) || "elegant";

    if (format !== "html" && format !== "pdf") {
      return NextResponse.json(
        { error: "Invalid format. Use 'html' or 'pdf'", status: 400 },
        { status: 400 }
      );
    }

    logger.info("Certificate generation requested", {
      assessmentId,
      userId,
      userType: user.type,
      format,
      theme,
    });

    // Fetch the assessment
    const assessmentRecords = await db
      .select({
        id: assessments.id,
        userId: assessments.userId,
        type: assessments.type,
        title: assessments.title,
        status: assessments.status,
        completedAt: assessments.completedAt,
        results: assessments.results,
        startedAt: assessments.startedAt,
      })
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (assessmentRecords.length === 0) {
      logger.warn("Assessment not found for certificate", { assessmentId });
      return NextResponse.json(
        { error: "Assessment not found", status: 404 },
        { status: 404 }
      );
    }

    const assessment = assessmentRecords[0] as AssessmentWithResults;

    // Check if assessment is completed
    if (assessment.status !== "completed") {
      logger.warn("Attempted certificate for incomplete assessment", {
        assessmentId,
        status: assessment.status,
      });
      return NextResponse.json(
        { error: "Assessment not completed yet", status: 400 },
        { status: 400 }
      );
    }

    // Check ownership - student can only get their own certificates, admin can get any
    if (user.type === "student" && assessment.userId !== userId) {
      logger.security("unauthorized_certificate_access", {
        assessmentId,
        userId,
        assessmentUserId: assessment.userId,
      });
      return NextResponse.json(
        { error: "You don't have permission to access this certificate", status: 403 },
        { status: 403 }
      );
    }

    // Fetch student info with school
    const studentRecords = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, assessment.userId))
      .limit(1);

    if (studentRecords.length === 0) {
      logger.warn("Student not found for certificate", { assessmentUserId: assessment.userId });
      return NextResponse.json(
        { error: "Student not found", status: 404 },
        { status: 404 }
      );
    }

    const student = studentRecords[0];
    const studentName = student.name || `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();

    // Fetch school name if student has a school
    let schoolName: string | undefined;
    if (student.schoolId) {
      const schoolRecords = await db
        .select({
          name: schools.name,
        })
        .from(schools)
        .where(eq(schools.id, student.schoolId))
        .limit(1);

      if (schoolRecords.length > 0) {
        schoolName = schoolRecords[0].name;
      }
    }

    // Parse results safely and calculate grade if percentage exists
    const results = parseAssessmentResults(assessment.results);
    if (results && typeof results.percentage === "number") {
      results.grade = calculateGrade(results.percentage);
    }

    // Generate unique certificate number
    const certificateNumber = generateCertificateNumber(assessmentId, assessment.userId);

    // Build certificate data
    const certificateData: CertificateData = {
      id: `cert-${assessmentId}`,
      studentName,
      assessmentName: assessment.title || `${assessment.type?.toUpperCase() ?? "ASSESSMENT"} Assessment`,
      assessmentType: assessment.type?.toUpperCase() ?? "ASSESSMENT",
      completedAt: assessment.completedAt
        ? new Date(assessment.completedAt).toISOString()
        : new Date().toISOString(),
      issuedAt: new Date().toISOString(),
      results: results ? { ...results } : undefined,
      schoolName,
      certificateNumber,
    };

    logger.info("Certificate generated successfully", {
      assessmentId,
      userId,
      certificateId: certificateData.id,
      format,
    });

    // Return based on requested format
    if (format === "pdf") {
      // Generate PDF certificate
      const pdfBuffer = await generateCertificatePDF(certificateData, { theme });

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="certificate-${assessmentId}.pdf"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Generate certificate HTML (default)
    const certificateHtml = generateCertificateHTML(certificateData);

    return new NextResponse(certificateHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/certificates/[assessmentId]",
      method: "GET",
    });
    return NextResponse.json(
      { error: "Failed to generate certificate", status: 500 },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse assessment results safely without using 'any' type
 */
function parseAssessmentResults(results: unknown): CertificateResults | null {
  if (!results || typeof results !== "object") {
    return null;
  }

  const parsed = results as Record<string, unknown>;
  const certificateResults: CertificateResults = {};

  // Extract common result fields
  if (typeof parsed.riasecCode === "string") {
    certificateResults.riasecCode = parsed.riasecCode;
  }
  if (typeof parsed.type === "string") {
    certificateResults.type = parsed.type;
  }
  if (typeof parsed.primaryType === "string") {
    certificateResults.primaryType = parsed.primaryType;
  }
  if (typeof parsed.score === "number") {
    certificateResults.score = parsed.score;
  }
  if (typeof parsed.totalScore === "number") {
    certificateResults.totalScore = parsed.totalScore;
  }
  if (typeof parsed.percentage === "number") {
    certificateResults.percentage = parsed.percentage;
  }

  return Object.keys(certificateResults).length > 0 ? certificateResults : null;
}

/**
 * Generate certificate HTML template
 */
function generateCertificateHTML(data: CertificateData): string {
  const completionDate = new Date(data.completedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const issueDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build result items HTML
  let resultItemsHtml = `
        <div class="result-item">
          <span>Completed:</span>
          <strong>${completionDate}</strong>
        </div>`;

  if (data.results) {
    if (data.results.riasecCode) {
      resultItemsHtml += `
        <div class="result-item">
          <span>RIASEC Code:</span>
          <strong>${escapeHtml(data.results.riasecCode)}</strong>
        </div>`;
    }
    if (data.results.type) {
      resultItemsHtml += `
        <div class="result-item">
          <span>Personality Type:</span>
          <strong>${escapeHtml(data.results.type)}</strong>
        </div>`;
    }
    if (data.results.primaryType) {
      resultItemsHtml += `
        <div class="result-item">
          <span>Primary Type:</span>
          <strong>${escapeHtml(data.results.primaryType)}</strong>
        </div>`;
    }
    if (typeof data.results.score === "number") {
      resultItemsHtml += `
        <div class="result-item">
          <span>Score:</span>
          <strong>${data.results.score}${typeof data.results.totalScore === "number" ? ` / ${data.results.totalScore}` : ""}</strong>
        </div>`;
    }
    if (typeof data.results.percentage === "number") {
      resultItemsHtml += `
        <div class="result-item">
          <span>Percentage:</span>
          <strong>${data.results.percentage}%</strong>
        </div>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate - ${escapeHtml(data.assessmentName)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Georgia', serif;
      background: #f0f0f0;
    }
    .certificate {
      width: 800px;
      min-height: 600px;
      padding: 40px;
      border: 10px solid #1e3a5f;
      margin: 0 auto;
      position: relative;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #d4af37;
      pointer-events: none;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-size: 36px;
      font-weight: bold;
      color: #1e3a5f;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-top: 10px;
    }
    .content {
      text-align: center;
      margin: 40px 0;
    }
    .presented-to {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    .student-name {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a5f;
      margin: 10px 0;
      font-style: italic;
    }
    .completion-text {
      font-size: 18px;
      color: #333;
      margin: 20px 0;
      line-height: 1.6;
    }
    .assessment-name {
      font-size: 24px;
      font-weight: bold;
      color: #d4af37;
      margin: 15px 0;
    }
    .results {
      background: white;
      padding: 20px;
      margin: 20px 40px;
      border-radius: 8px;
      border-left: 4px solid #1e3a5f;
    }
    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .result-item:last-child {
      border-bottom: none;
    }
    .result-item span {
      color: #666;
    }
    .result-item strong {
      color: #1e3a5f;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
    }
    .date {
      font-size: 14px;
      color: #666;
    }
    .seal {
      position: absolute;
      bottom: 40px;
      right: 40px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .badge {
      position: absolute;
      top: 40px;
      right: 40px;
      font-size: 64px;
    }
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .certificate {
        box-shadow: none;
        border: 10px solid #1e3a5f;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="badge">🏆</div>
    <div class="header">
      <h1 class="title">Certificate of Achievement</h1>
      <p class="subtitle">Career Guidance Platform - Bhutan</p>
    </div>
    <div class="content">
      <p class="presented-to">This is to certify that</p>
      <h2 class="student-name">${escapeHtml(data.studentName)}</h2>
      <p class="completion-text">
        has successfully completed the
      </p>
      <h3 class="assessment-name">${escapeHtml(data.assessmentName)}</h3>
      <div class="results">
        ${resultItemsHtml}
      </div>
    </div>
    <div class="footer">
      <p class="date">Issued on ${issueDate}</p>
    </div>
    <div class="seal">
      Official<br>Seal
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

// ============================================================================
// PDF GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate a unique certificate number
 */
function generateCertificateNumber(assessmentId: string, userId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = Buffer.from(`${assessmentId}-${userId}`).toString("base64").slice(0, 6).toUpperCase();
  return `CERT-${timestamp}-${hash}`;
}

/**
 * Calculate grade based on percentage
 */
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "D";
}

/**
 * Generate PDF certificate using jsPDF
 */
async function generateCertificatePDF(
  data: CertificateData,
  options: Partial<PDFGenerationOptions> = {}
): Promise<Uint8Array> {
  const opts: PDFGenerationOptions = {
    format: "a4",
    orientation: "landscape",
    includeBorder: true,
    includeSeal: true,
    theme: "elegant",
    ...options,
  };

  // Create PDF document with landscape orientation
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: "mm",
    format: opts.format,
  });

  // Get page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Define layout based on theme
  const layout = getCertificateLayout(opts.theme, pageWidth, pageHeight);

  // Generate certificate based on theme
  switch (opts.theme) {
    case "modern":
      generateModernCertificate(doc, data, layout);
      break;
    case "classic":
      generateClassicCertificate(doc, data, layout);
      break;
    case "elegant":
    default:
      generateElegantCertificate(doc, data, layout);
      break;
  }

  // Add certificate number and watermark
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate No: ${data.certificateNumber}`, layout.margin, pageHeight - layout.margin);
  doc.text(
    `Issued by ${data.schoolName || "Career Guidance Platform - Bhutan"}`,
    pageWidth - layout.margin,
    pageHeight - layout.margin,
    { align: "right" }
  );

  // Return PDF as buffer
  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

/**
 * Get certificate layout dimensions based on theme
 */
function getCertificateLayout(
  theme: PDFGenerationOptions["theme"],
  pageWidth: number,
  pageHeight: number
): CertificateLayout {
  const margin = 20;
  return {
    width: pageWidth - margin * 2,
    height: pageHeight - margin * 2,
    margin,
    headerY: margin + 15,
    contentY: pageHeight * 0.35,
    footerY: pageHeight - margin - 20,
    centerX: pageWidth / 2,
  };
}

/**
 * Generate elegant certificate theme
 */
function generateElegantCertificate(doc: jsPDF, data: CertificateData, layout: CertificateLayout): void {
  const { width, height, margin, headerY, contentY, footerY, centerX } = layout;

  // Background gradient effect (simulated with rectangles)
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

  // Outer border - deep blue
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(2);
  doc.rect(margin - 2, margin - 2, width + 4, height + 4);

  // Inner border - gold
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.rect(margin + 2, margin + 2, width - 4, height - 4);

  // Corner decorations
  const cornerSize = 15;
  const corners = [
    { x: margin, y: margin },
    { x: margin + width, y: margin },
    { x: margin, y: margin + height },
    { x: margin + width, y: margin + height },
  ];

  doc.setFillColor(212, 175, 55);
  corners.forEach((corner) => {
    const isRight = corner.x > centerX;
    const isBottom = corner.y > contentY;

    if (isRight && !isBottom) {
      // Top right
      doc.triangle(corner.x, corner.y, corner.x - cornerSize, corner.y, corner.x, corner.y + cornerSize, "F");
    } else if (!isRight && !isBottom) {
      // Top left
      doc.triangle(corner.x, corner.y, corner.x + cornerSize, corner.y, corner.x, corner.y + cornerSize, "F");
    } else if (isRight && isBottom) {
      // Bottom right
      doc.triangle(
        corner.x,
        corner.y,
        corner.x - cornerSize,
        corner.y,
        corner.x,
        corner.y - cornerSize,
        "F"
      );
    } else {
      // Bottom left
      doc.triangle(
        corner.x,
        corner.y,
        corner.x + cornerSize,
        corner.y,
        corner.x,
        corner.y - cornerSize,
        "F"
      );
    }
  });

  // Header section
  doc.setTextColor(30, 58, 95);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text("Certificate of Achievement", centerX, headerY, { align: "center" });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Career Guidance Platform - Bhutan", centerX, headerY + 12, { align: "center" });

  // School name if available
  if (data.schoolName) {
    doc.setFontSize(12);
    doc.text(data.schoolName, centerX, headerY + 22, { align: "center" });
  }

  // Content section
  let currentY = contentY;

  // "Presented to" text
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(14);
  doc.setFont("helvetica", "italic");
  doc.text("This is to certify that", centerX, currentY, { align: "center" });

  // Student name
  currentY += 15;
  doc.setTextColor(30, 58, 95);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(36);
  doc.text(data.studentName, centerX, currentY, { align: "center" });

  // "Has successfully completed" text
  currentY += 15;
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("has successfully completed the", centerX, currentY, { align: "center" });

  // Assessment name
  currentY += 15;
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(data.assessmentName, centerX, currentY, { align: "center" });

  // Results box
  if (data.results) {
    currentY += 20;
    const boxWidth = 120;
    const boxHeight = calculateResultsBoxHeight(data.results);
    const boxX = centerX - boxWidth / 2;

    // Results box background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 3, 3, "FD");

    // Results box border
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 3, 3, "D");

    // Results content
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    let resultY = currentY + 10;
    const leftColX = boxX + 10;
    const rightColX = boxX + boxWidth - 10;

    // Completion date
    const completionDate = new Date(data.completedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text("Completed:", leftColX, resultY);
    doc.text(completionDate, rightColX, resultY, { align: "right" });
    resultY += 10;

    // Add result items
    if (data.results.riasecCode) {
      doc.text("RIASEC Code:", leftColX, resultY);
      doc.text(data.results.riasecCode, rightColX, resultY, { align: "right" });
      resultY += 10;
    }

    if (data.results.type) {
      doc.text("Personality Type:", leftColX, resultY);
      doc.text(data.results.type, rightColX, resultY, { align: "right" });
      resultY += 10;
    }

    if (data.results.primaryType) {
      doc.text("Primary Type:", leftColX, resultY);
      doc.text(data.results.primaryType, rightColX, resultY, { align: "right" });
      resultY += 10;
    }

    if (typeof data.results.score === "number") {
      const scoreText =
        typeof data.results.totalScore === "number"
          ? `${data.results.score} / ${data.results.totalScore}`
          : `${data.results.score}`;
      doc.text("Score:", leftColX, resultY);
      doc.text(scoreText, rightColX, resultY, { align: "right" });
      resultY += 10;
    }

    if (typeof data.results.percentage === "number") {
      doc.text("Percentage:", leftColX, resultY);
      doc.text(`${data.results.percentage}%`, rightColX, resultY, { align: "right" });
      resultY += 10;
    }

    if (data.results.grade) {
      doc.text("Grade:", leftColX, resultY);
      doc.text(data.results.grade, rightColX, resultY, { align: "right" });
    }

    currentY += boxHeight + 10;
  }

  // Footer with date
  const issueDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Issued on ${issueDate}`, centerX, footerY, { align: "center" });

  // Add seal
  addOfficialSeal(doc, layout);
}

/**
 * Generate modern certificate theme
 */
function generateModernCertificate(doc: jsPDF, data: CertificateData, layout: CertificateLayout): void {
  const { width, height, margin, headerY, contentY, footerY, centerX } = layout;

  // Modern gradient background (simulated)
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

  // Accent bar at top
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, margin, width, 8, "F");

  // Clean border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, width, height);

  // Header
  doc.setTextColor(30, 58, 95);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Certificate of Completion", centerX, headerY + 10, { align: "center" });

  // Badge icon (text representation)
  doc.setFontSize(24);
  doc.setTextColor(251, 191, 36);
  doc.text("", centerX, headerY + 25, { align: "center" });

  // Content
  let currentY = contentY;

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("AWARDED TO", centerX, currentY, { align: "center" });

  currentY += 12;
  doc.setTextColor(30, 58, 95);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text(data.studentName, centerX, currentY, { align: "center" });

  currentY += 15;
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("FOR SUCCESSFULLY COMPLETING", centerX, currentY, { align: "center" });

  currentY += 12;
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(centerX - 60, currentY - 8, 120, 25, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.assessmentName, centerX, currentY + 8, { align: "center" });

  // Results
  if (data.results) {
    currentY += 35;
    const resultLabels: string[] = [];
    const resultValues: string[] = [];

    const completionDate = new Date(data.completedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    resultLabels.push("Completed");
    resultValues.push(completionDate);

    if (data.results.riasecCode) {
      resultLabels.push("RIASEC Code");
      resultValues.push(data.results.riasecCode);
    }

    if (typeof data.results.percentage === "number") {
      resultLabels.push("Score");
      resultValues.push(`${data.results.percentage}%`);
    }

    if (data.results.grade) {
      resultLabels.push("Grade");
      resultValues.push(data.results.grade);
    }

    // Results grid
    const colWidth = 80;
    const rowHeight = 12;
    const startX = centerX - (colWidth * resultLabels.length) / 2 + colWidth / 2;

    resultLabels.forEach((label, i) => {
      const x = startX + i * colWidth;
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(x - colWidth / 2 + 5, currentY, colWidth - 10, rowHeight * 2 + 4, 2, 2, "F");

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(label, x, currentY + 8, { align: "center" });

      doc.setTextColor(30, 58, 95);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(resultValues[i] || "-", x, currentY + 18, { align: "center" });
    });
  }

  // Footer
  const issueDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Issued on ${issueDate}`, centerX, footerY, { align: "center" });

  // Modern seal
  addModernSeal(doc, centerX, footerY - 25);
}

/**
 * Generate classic certificate theme
 */
function generateClassicCertificate(doc: jsPDF, data: CertificateData, layout: CertificateLayout): void {
  const { width, height, margin, headerY, contentY, footerY, centerX } = layout;

  // Parchment background
  doc.setFillColor(250, 248, 240);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

  // Ornate border
  const borderColors = [
    [139, 69, 19], // Saddle brown
    [218, 165, 32], // Golden rod
    [139, 69, 19],
  ];

  borderColors.forEach((color, i) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(i === 1 ? 2 : 1);
    doc.rect(margin - i - 1, margin - i - 1, width + (i + 1) * 2, height + (i + 1) * 2);
  });

  // Classic header with serif font
  doc.setTextColor(101, 67, 33);
  doc.setFont("times", "bold");
  doc.setFontSize(36);
  doc.text("Certificate of Achievement", centerX, headerY, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("times", "italic");
  doc.setTextColor(139, 90, 43);
  doc.text("Career Guidance Platform - Bhutan", centerX, headerY + 15, { align: "center" });

  if (data.schoolName) {
    doc.text(data.schoolName, centerX, headerY + 25, { align: "center" });
  }

  // Content
  let currentY = contentY;

  doc.setTextColor(105, 105, 105);
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("This parchment certifies that", centerX, currentY, { align: "center" });

  currentY += 18;
  doc.setTextColor(101, 67, 33);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(40);
  doc.text(data.studentName, centerX, currentY, { align: "center" });

  currentY += 18;
  doc.setTextColor(105, 105, 105);
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("having duly completed the assessment entitled", centerX, currentY, { align: "center" });

  currentY += 18;
  doc.setTextColor(184, 134, 11);
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text(`"${data.assessmentName}"`, centerX, currentY, { align: "center" });

  // Results
  if (data.results) {
    currentY += 25;

    doc.setFillColor(255, 253, 245);
    doc.roundedRect(centerX - 70, currentY, 140, 40, 5, 5, "FD");

    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(1);
    doc.roundedRect(centerX - 70, currentY, 140, 40, 5, 5, "D");

    doc.setTextColor(101, 67, 33);
    doc.setFont("times", "normal");
    doc.setFontSize(11);

    let y = currentY + 12;
    const leftX = centerX - 55;
    const rightX = centerX + 55;

    const completionDate = new Date(data.completedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Date: ${completionDate}`, centerX, y, { align: "center" });

    if (data.results.riasecCode) {
      doc.text(`RIASEC: ${data.results.riasecCode}`, leftX, y + 10);
    }

    if (typeof data.results.percentage === "number") {
      const gradeText = data.results.grade ? ` (${data.results.grade})` : "";
      doc.text(`Score: ${data.results.percentage}%${gradeText}`, rightX, y + 10, { align: "right" });
    }
  }

  // Footer with signatures
  const issueDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setTextColor(139, 90, 43);
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.text(`Given this ${issueDate}`, centerX, footerY, { align: "center" });

  addClassicSeal(doc, layout);
}

/**
 * Add official seal to certificate
 */
function addOfficialSeal(doc: jsPDF, layout: CertificateLayout): void {
  const { centerX, footerY } = layout;
  const sealX = centerX + 50;
  const sealY = footerY - 10;
  const sealRadius = 15;

  // Outer circle
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.5);
  doc.circle(sealX, sealY, sealRadius, "D");

  // Inner circle
  doc.setLineWidth(0.5);
  doc.circle(sealX, sealY, sealRadius - 3, "D");

  // Fill
  doc.setFillColor(212, 175, 55, 0.3);
  doc.circle(sealX, sealY, sealRadius - 1, "F");

  // Text
  doc.setTextColor(139, 90, 43);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL", sealX, sealY - 2, { align: "center" });
  doc.text("SEAL", sealX, sealY + 4, { align: "center" });
}

/**
 * Add modern seal to certificate
 */
function addModernSeal(doc: jsPDF, x: number, y: number): void {
  const radius = 12;

  // Gradient circle (simulated with concentric circles)
  doc.setFillColor(59, 130, 246);
  doc.circle(x, y, radius, "F");

  doc.setFillColor(96, 165, 250);
  doc.circle(x, y, radius - 3, "F");

  // Checkmark
  doc.setFillColor(255, 255, 255);
  doc.circle(x, y, radius - 6, "F");

  doc.setTextColor(59, 130, 246);
  doc.setFontSize(14);
  doc.text("", x, y + 2, { align: "center" });
}

/**
 * Add classic seal to certificate
 */
function addClassicSeal(doc: jsPDF, layout: CertificateLayout): void {
  const { centerX, footerY } = layout;
  const x = centerX - 60;
  const y = footerY + 5;

  // Ribbon effect
  doc.setFillColor(139, 69, 19);
  doc.triangle(x, y, x - 10, y + 20, x + 10, y + 20, "F");
  doc.triangle(x + 10, y, x, y + 20, x + 20, y + 20, "F");

  // Wax seal
  doc.setFillColor(184, 134, 11);
  doc.circle(x + 10, y + 12, 10, "F");

  doc.setFillColor(218, 165, 32);
  doc.circle(x + 10, y + 12, 7, "F");
}

/**
 * Calculate the height needed for the results box
 */
function calculateResultsBoxHeight(results: CertificateResults): number {
  let itemCount = 1; // Always has completion date

  if (results.riasecCode) itemCount++;
  if (results.type) itemCount++;
  if (results.primaryType) itemCount++;
  if (typeof results.score === "number") itemCount++;
  if (typeof results.percentage === "number") itemCount++;
  if (results.grade) itemCount++;

  return 15 + itemCount * 10;
}
