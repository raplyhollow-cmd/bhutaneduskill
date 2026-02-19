/**
 * REPORT CARD PDF GENERATOR
 * Generate professional PDF report cards using jsPDF
 */

import jsPDF from "jspdf";
import type { ReportCardData } from "./aggregator";
import { getTemplate, getGradeRemarks, type ReportCardColors } from "./templates";

export interface GenerateReportCardOptions {
  showSignature: boolean;
  showWatermark: boolean;
  schoolLogoUrl?: string;
  studentPhotoUrl?: string;
}

// ============================================================================
// IMAGE LOADING HELPERS
// ============================================================================

/**
 * Load an image from URL and convert to data URL
 * Handles CORS and loading errors gracefully
 */
async function loadImageAsDataURL(url: string): Promise<string | null> {
  if (!url) return null;

  // If already a data URL, return as-is
  if (url.startsWith("data:")) {
    return url;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to load image: ${url}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Error loading image from ${url}:`, error);
    return null;
  }
}

/**
 * Load and draw school logo on the PDF
 */
async function loadAndDrawLogo(
  pdf: jsPDF,
  logoUrl: string | undefined,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): Promise<{ width: number; height: number }> {
  if (!logoUrl) {
    return { width: 0, height: 0 };
  }

  const dataUrl = await loadImageAsDataURL(logoUrl);
  if (!dataUrl) {
    return { width: 0, height: 0 };
  }

  try {
    // Get image dimensions to maintain aspect ratio
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

    const aspectRatio = img.width / img.height;
    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    pdf.addImage(dataUrl, "PNG", x, y, width, height);
    return { width, height };
  } catch (error) {
    console.warn("Failed to draw logo:", error);
    return { width: 0, height: 0 };
  }
}

/**
 * Load and draw student photo on the PDF
 */
async function loadAndDrawPhoto(
  pdf: jsPDF,
  photoUrl: string | undefined,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): Promise<{ width: number; height: number }> {
  if (!photoUrl) {
    return { width: 0, height: 0 };
  }

  const dataUrl = await loadImageAsDataURL(photoUrl);
  if (!dataUrl) {
    return { width: 0, height: 0 };
  }

  try {
    // Get image dimensions to maintain aspect ratio
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

    const aspectRatio = img.width / img.height;
    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    pdf.addImage(dataUrl, "JPEG", x, y, width, height);
    return { width, height };
  } catch (error) {
    console.warn("Failed to draw photo:", error);
    return { width: 0, height: 0 };
  }
}

/**
 * Generate a report card PDF as a Blob
 */
export async function generateReportCardPDF(
  data: ReportCardData,
  options: GenerateReportCardOptions = { showSignature: true, showWatermark: true }
): Promise<Blob> {
  const template = getTemplate(data.grade);
  const isLandscape = template.layout.orientation === "landscape";

  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Parse colors
  const colors = parseColors(template.colors);

  // Draw background
  if (colors.background) {
    pdf.setFillColor(colors.background[0] as any, colors.background[1] as any, colors.background[2] as any);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
  }

  // Draw header
  await drawHeader(pdf, data, pageWidth, colors, options);

  // Draw student information
  let yPos = await drawStudentInfo(pdf, data, 50, pageWidth, colors, options);

  // Draw attendance summary
  if (template.layout.showAttendance) {
    yPos = drawAttendance(pdf, data, yPos, pageWidth, colors);
  }

  // Draw subjects table
  yPos = drawSubjectsTable(pdf, data, yPos + 5, pageWidth, colors, template.layout.subjectsPerPage);

  // Draw performance summary
  yPos = drawPerformanceSummary(pdf, data, yPos, pageWidth, colors);

  // Draw remarks
  if (template.layout.showRemarks && (data.classTeacherRemarks || data.principalRemarks)) {
    yPos = drawRemarks(pdf, data, yPos, pageWidth, colors);
  }

  // Draw signatures
  if (options.showSignature) {
    drawSignatures(pdf, data, pageHeight - 30, pageWidth, template.signatures, colors);
  }

  // Draw watermark
  if (options.showWatermark) {
    drawWatermark(pdf, data, pageWidth, pageHeight);
  }

  return pdf.output("blob");
}

/**
 * Draw header section with school name and logo
 */
async function drawHeader(
  pdf: jsPDF,
  data: ReportCardData,
  pageWidth: number,
  colors: Record<string, number[]>,
  options: GenerateReportCardOptions
): Promise<number> {
  const template = getTemplate(data.grade);
  const yPos = 15;

  // School logo
  if (options.schoolLogoUrl && template.layout.showLogo) {
    await loadAndDrawLogo(pdf, options.schoolLogoUrl, 15, yPos, 25, 25);
  }

  // School name
  pdf.setFontSize(18);
  pdf.setTextColor(colors.primary[0] as any, colors.primary[1] as any, colors.primary[2] as any);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.schoolName, pageWidth / 2, 15, { align: "center" });

  // Report card title
  pdf.setFontSize(12);
  pdf.setTextColor(colors.secondary[0] as any, colors.secondary[1] as any, colors.secondary[2] as any);
  pdf.setFont("helvetica", "normal");
  pdf.text("PROGRESS REPORT", pageWidth / 2, 22, { align: "center" });

  // Term and academic year
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0] as any, colors.text[1] as any, colors.text[2] as any);
  pdf.text(`${data.term} - ${data.academicYear}`, pageWidth / 2, 28, { align: "center" });

  // Decorative line
  pdf.setDrawColor(colors.accent[0] as any, colors.accent[1] as any, colors.accent[2] as any);
  pdf.setLineWidth(1);
  pdf.line(15, 35, pageWidth - 15, 35);

  return 40;
}

/**
 * Draw student information section
 */
async function drawStudentInfo(
  pdf: jsPDF,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  colors: Record<string, number[]>,
  options: GenerateReportCardOptions
): Promise<number> {
  let yPos = startY;

  // Section background
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(15, yPos, pageWidth - 30, 25, 2, 2, "F");

  // Student photo
  const photoUrl = options.studentPhotoUrl || data.photo;
  if (photoUrl) {
    const photoDrawn = await loadAndDrawPhoto(pdf, photoUrl, 18, yPos + 3, 18, 18);
    if (photoDrawn.width === 0) {
      // Photo failed to load, show placeholder
      drawPhotoPlaceholder(pdf, 18, yPos + 3, 18);
    }
  } else {
    // Photo placeholder box
    drawPhotoPlaceholder(pdf, 18, yPos + 3, 18);
  }

  // Student details
  pdf.setTextColor(colors.text[0] as any, colors.text[1] as any, colors.text[2] as any);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.studentName, 42, yPos + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Class: ${data.grade}${data.section ? " - " + data.section : ""}`, 42, yPos + 12);
  pdf.text(`Roll No: ${data.rollNumber || "N/A"}`, 42, yPos + 17);

  // Exam name on right side
  pdf.text(`Exam: ${data.examName}`, pageWidth - 70, yPos + 12);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 70, yPos + 17);

  return yPos + 32;
}

/**
 * Draw photo placeholder box
 */
function drawPhotoPlaceholder(pdf: jsPDF, x: number, y: number, size: number): void {
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.rect(x, y, size, size);
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Photo", x + size / 2, y + size / 2, { align: "center" });
}

/**
 * Draw attendance summary
 */
function drawAttendance(
  pdf: jsPDF,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  colors: Record<string, number[]>
): number {
  const yPos = startY;

  // Attendance box
  pdf.setFillColor(colors.primary[0] as any, colors.primary[1] as any, colors.primary[2] as any);
  pdf.roundedRect(15, yPos, pageWidth - 30, 12, 2, 2, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Attendance Summary", 20, yPos + 6);

  // Stats
  pdf.setFont("helvetica", "normal");
  const statsX = pageWidth - 80;
  pdf.text(`Total: ${data.totalDays}`, statsX, yPos + 6);
  pdf.text(`Present: ${data.presentDays}`, statsX + 30, yPos + 6);

  // Attendance percentage badge
  const attPercent = data.attendancePercentage;
  const attColor = attPercent >= 75 ? [34, 139, 34] as [number, number, number] : attPercent >= 60 ? [255, 165, 0] as [number, number, number] : [220, 20, 60] as [number, number, number];
  pdf.setFillColor(attColor[0], attColor[1], attColor[2]);
  pdf.roundedRect(pageWidth - 45, yPos + 2, 30, 8, 1, 1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${attPercent}%`, pageWidth - 30, yPos + 7, { align: "center" });

  return yPos + 18;
}

/**
 * Draw subjects table
 */
function drawSubjectsTable(
  pdf: jsPDF,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  colors: Record<string, number[]>,
  subjectsPerPage: number
): number {
  const tableWidth = pageWidth - 30;
  const tableX = 15;
  let yPos = startY;
  const colWidths = [tableWidth * 0.35, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.2];
  const headers = ["Subject", "Marks", "Max", "Grade", "Remarks"];

  // Table header
  pdf.setFillColor(colors.primary[0] as any, colors.primary[1] as any, colors.primary[2] as any);
  pdf.rect(tableX, yPos, tableWidth, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");

  headers.forEach((header, i) => {
    const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    pdf.text(header, x + 2, yPos + 5);
  });

  yPos += 8;

  // Table rows
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(colors.text[0] as any, colors.text[1] as any, colors.text[2] as any);

  data.subjects.forEach((subject, index) => {
    // Alternate row color
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(tableX, yPos, tableWidth, 7, "F");
    }

    const row = [
      subject.subjectName,
      String(subject.marksObtained),
      String(subject.maxMarks),
      subject.grade,
      subject.remarks,
    ];

    row.forEach((text, i) => {
      const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      pdf.setFontSize(8);
      // Truncate long text
      const displayText = text.length > 20 ? text.substring(0, 18) + "..." : text;
      pdf.text(displayText, x + 2, yPos + 5);
    });

    yPos += 7;
  });

  // Table border
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.rect(tableX, startY, tableWidth, yPos - startY);

  return yPos + 5;
}

/**
 * Draw performance summary
 */
function drawPerformanceSummary(
  pdf: jsPDF,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  colors: Record<string, number[]>
): number {
  const yPos = startY;

  // Summary box
  pdf.setFillColor(colors.secondary[0] as any, colors.secondary[1] as any, colors.secondary[2] as any);
  pdf.roundedRect(15, yPos, pageWidth - 30, 20, 2, 2, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Performance Summary", 20, yPos + 6);

  // Summary stats
  const stats = [
    { label: "Total Marks", value: `${data.totalMarks}/${data.maxTotalMarks}` },
    { label: "Percentage", value: `${data.overallPercentage}%` },
    { label: "Overall Grade", value: data.overallGrade },
  ];

  if (data.classRank) {
    stats.push({ label: "Class Rank", value: `${data.classRank}/${data.totalStudents || "-"}` });
  }

  let xPos = 20;
  const boxWidth = (pageWidth - 40) / stats.length;

  stats.forEach((stat) => {
    // Stat box
    pdf.setFillColor(255, 255, 255, 0.2);
    pdf.roundedRect(xPos, yPos + 10, boxWidth - 4, 8, 1, 1, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(stat.label, xPos + (boxWidth - 4) / 2, yPos + 14, { align: "center" });

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(stat.value, xPos + (boxWidth - 4) / 2, yPos + 17, { align: "center" });

    xPos += boxWidth;
  });

  return yPos + 25;
}

/**
 * Draw remarks section
 */
function drawRemarks(
  pdf: jsPDF,
  data: ReportCardData,
  startY: number,
  pageWidth: number,
  colors: Record<string, number[]>
): number {
  const yPos = startY;

  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(15, yPos, pageWidth - 30, 18, 2, 2, "F");

  pdf.setTextColor(colors.text[0] as any, colors.text[1] as any, colors.text[2] as any);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Remarks", 20, yPos + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  // Class teacher remarks
  if (data.classTeacherRemarks) {
    const maxWidth = pageWidth / 2 - 15;
    const lines = pdf.splitTextToSize(`Class Teacher: ${data.classTeacherRemarks}`, maxWidth);
    pdf.text(lines, 20, yPos + 11);
  }

  // Principal remarks (right side)
  if (data.principalRemarks) {
    const maxWidth = pageWidth / 2 - 15;
    const lines = pdf.splitTextToSize(`Principal: ${data.principalRemarks}`, maxWidth);
    pdf.text(lines, pageWidth / 2, yPos + 11);
  }

  return yPos + 22;
}

/**
 * Draw signatures section
 */
function drawSignatures(
  pdf: jsPDF,
  data: ReportCardData,
  yPos: number,
  pageWidth: number,
  signatures: any,
  colors: Record<string, number[]>
): void {
  const signaturesList = [];

  if (signatures.showClassTeacher && data.classTeacherName) {
    signaturesList.push({ title: "Class Teacher", name: data.classTeacherName });
  }

  if (signatures.showPrincipal && data.principalName) {
    signaturesList.push({ title: "Principal", name: data.principalName });
  }

  if (signatures.showParent) {
    signaturesList.push({ title: "Parent", name: "" });
  }

  // Add custom signatures
  signatures.customSignatures?.forEach((sig: any) => {
    signaturesList.push({ title: sig.title, name: sig.name });
  });

  const sigWidth = (pageWidth - 30) / signaturesList.length;

  signaturesList.forEach((sig, index) => {
    const xPos = 15 + index * sigWidth + sigWidth / 2;

    // Signature line
    pdf.setDrawColor(colors.text[0] as any, colors.text[1] as any, colors.text[2] as any);
    pdf.setLineWidth(0.5);
    pdf.line(xPos - 25, yPos + 15, xPos + 25, yPos + 15);

    // Title
    pdf.setTextColor(colors.text[0] as any, colors.text[1] as any, colors.text[2] as any);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(sig.title, xPos, yPos + 10, { align: "center" });

    // Name
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(sig.name || "_________________", xPos, yPos + 20, { align: "center" });
  });
}

/**
 * Draw watermark
 */
function drawWatermark(
  pdf: jsPDF,
  data: ReportCardData,
  pageWidth: number,
  pageHeight: number
): void {
  pdf.setFontSize(7);
  pdf.setTextColor(180, 180, 180);
  pdf.setFont("helvetica", "normal");

  const watermark = `Generated by ${data.schoolName} | ${new Date().toLocaleDateString()}`;
  pdf.text(watermark, pageWidth / 2, pageHeight - 5, { align: "center" });
}

/**
 * Parse color string to RGB array
 */
function parseColors(colors: ReportCardColors): Record<string, [number, number, number]> {
  const result: Record<string, [number, number, number]> = {} as Record<string, [number, number, number]>;

  for (const [key, value] of Object.entries(colors)) {
    // Handle rgb(r, g, b) format
    const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      result[key] = [
        parseInt(rgbMatch[1]),
        parseInt(rgbMatch[2]),
        parseInt(rgbMatch[3]),
      ];
      continue;
    }

    // Handle hex format
    const hexMatch = value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      result[key] = [
        parseInt(hexMatch[1], 16),
        parseInt(hexMatch[2], 16),
        parseInt(hexMatch[3], 16),
      ];
      continue;
    }

    // Default to black
    result[key] = [0, 0, 0];
  }

  return result;
}

/**
 * Generate bulk report cards for a class
 */
export async function generateBulkReportCards(
  reportCardsData: ReportCardData[],
  options: GenerateReportCardOptions = { showSignature: true, showWatermark: true }
): Promise<Blob> {
  // For bulk, we'll create a single PDF with multiple pages
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  for (let i = 0; i < reportCardsData.length; i++) {
    const data = reportCardsData[i];
    const pagePdf = await generateReportCardPDF(data, options);

    // Merge pages (simplified - in production, use proper PDF merge library)
    if (i > 0) {
      pdf.addPage();
    }

    // Note: In real implementation, use PDF-lib or similar to properly merge
    // For now, this is a placeholder for the concept
  }

  return pdf.output("blob");
}
