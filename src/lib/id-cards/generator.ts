/**
 * ID CARD GENERATOR
 * Generate PDF ID cards for students, teachers, and staff
 */

import jsPDF from "jspdf";
import type { User, School } from "@/lib/db/schema";
import { getIDTemplate, getDefaultValidThru, type IDCardColors } from "./templates";
import { generateIDVerificationQR, generateIDBarcode, generateCardNumber } from "./qr-generator";

export interface IDCardData {
  // User information
  userId: string;
  name: string;
  type: string;
  employeeId?: string;
  rollNumber?: string;
  grade?: string;
  section?: string;
  department?: string;
  designation?: string;
  role?: string;

  // Personal details
  photo?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  phone?: string;
  emergencyContact?: string;

  // School information
  schoolId: string;
  schoolName: string;
  schoolCode?: string;
  schoolAddress?: string;
  schoolLogo?: string;
  principalName?: string;

  // Validity
  validThru?: string;
}

export interface GenerateIDCardOptions {
  doubleSided?: boolean;
  includeTerms?: boolean;
  customLogo?: string;
}

/**
 * Generate ID card PDF as a Blob
 */
export async function generateIDCardPDF(
  data: IDCardData,
  options: GenerateIDCardOptions = {}
): Promise<Blob> {
  const template = getIDTemplate(data.type);
  const doubleSided = options.doubleSided !== false;
  const validThru = data.validThru || getDefaultValidThru();

  // Create PDF (single page, front side)
  const pdf = new jsPDF({
    orientation: template.layout.orientation,
    unit: "mm",
    format: [template.dimensions.width, template.dimensions.height],
  });

  const cardWidth = template.dimensions.width;
  const cardHeight = template.dimensions.height;

  // Parse colors
  const colors = parseColors(template.colors);

  // Draw background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, 0, cardWidth, cardHeight, "F");

  // Draw header strip
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, cardWidth, 8, "F");

  // Draw front of ID card
  await drawIDCardFront(pdf, data, template, cardWidth, cardHeight, colors, validThru, options);

  // Add back page if double-sided
  if (doubleSided) {
    pdf.addPage([cardWidth, cardHeight], template.layout.orientation);
    drawIDCardBack(pdf, data, template, cardWidth, cardHeight, colors);
  }

  return pdf.output("blob");
}

/**
 * Draw front side of ID card
 */
async function drawIDCardFront(
  pdf: jsPDF,
  data: IDCardData,
  template: any,
  cardWidth: number,
  cardHeight: number,
  colors: Record<string, number[]>,
  validThru: string,
  options: GenerateIDCardOptions
): Promise<void> {
  let yPos = 12;

  // School logo
  const logoUrl = options.customLogo || data.schoolLogo;
  if (logoUrl) {
    try {
      // TODO: Load and add logo image
      // pdf.addImage(logoUrl, "PNG", 5, yPos + 2, 10, 10);
    } catch (e) {
      // Fallback to text if logo fails
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(data.schoolCode || "SCHOOL", 10, yPos + 6);
    }
  } else {
    // Use school code as logo placeholder
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text(data.schoolCode || "SCHOOL", 10, yPos + 6);
  }

  // School name
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.schoolName, cardWidth / 2, yPos + 4, { align: "center" });

  yPos = 12;

  // Photo placeholder
  const photoX = template.layout.photoPosition === "left" ? 5 : cardWidth - 23;
  const photoY = yPos;
  const photoSize = 18;

  if (data.photo) {
    try {
      // TODO: Load and add photo
      // pdf.addImage(data.photo, "JPEG", photoX, photoY, photoSize, photoSize);
    } catch (e) {
      drawPhotoPlaceholder(pdf, photoX, photoY, photoSize);
    }
  } else {
    drawPhotoPlaceholder(pdf, photoX, photoY, photoSize);
  }

  // User details
  const textX = template.layout.photoPosition === "left" ? 26 : 5;
  let textY = yPos + 3;

  // Name
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  const displayName = data.name.length > 18 ? data.name.substring(0, 16) + "..." : data.name;
  pdf.text(displayName, textX, textY);

  // ID number
  textY += 4;
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  const idNumber = data.employeeId || data.rollNumber || generateCardNumber(data.userId);
  pdf.text(`ID: ${idNumber}`, textX, textY);

  // Role/Grade info
  textY += 4;
  const roleInfo = getRoleDisplayText(data);
  pdf.text(roleInfo, textX, textY);

  // Additional fields based on user type
  if (data.type === "student") {
    textY += 4;
    pdf.text(`Class: ${data.grade || "N/A"}${data.section ? "-" + data.section : ""}`, textX, textY);

    textY += 4;
    pdf.text(`DOB: ${formatDate(data.dateOfBirth) || "N/A"}`, textX, textY);

    textY += 4;
    if (data.bloodGroup) {
      pdf.text(`Blood: ${data.bloodGroup}`, textX, textY);
    }
  } else {
    // For teachers/staff
    if (data.department) {
      textY += 4;
      pdf.text(`Dept: ${data.department}`, textX, textY);
    }
    if (data.designation) {
      textY += 4;
      pdf.text(data.designation, textX, textY);
    }
  }

  // Valid Thru
  textY = cardHeight - 6;
  pdf.setFontSize(6);
  pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.text(`Valid Thru: ${validThru}`, textX, textY);

  // QR Code
  if (template.layout.showQRCode) {
    try {
      const qrDataUrl = await generateIDVerificationQR(data.userId, data.schoolId);
      const qrSize = 12;
      const qrX = cardWidth - qrSize - 3;
      const qrY = cardHeight - qrSize - 3;
      // TODO: Add QR code image
      // pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.error("Failed to add QR code:", e);
    }
  }

  // Barcode
  if (template.layout.showBarcode) {
    try {
      const barcodeDataUrl = generateIDBarcode(data.userId, idNumber);
      const barcodeWidth = 25;
      const barcodeHeight = 6;
      const barcodeX = cardWidth - barcodeWidth - 3;
      const barcodeY = cardHeight - barcodeHeight - 3;
      // TODO: Add barcode image
      // pdf.addImage(barcodeDataUrl, "PNG", barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    } catch (e) {
      console.error("Failed to add barcode:", e);
    }
  }
}

/**
 * Draw back side of ID card
 */
function drawIDCardBack(
  pdf: jsPDF,
  data: IDCardData,
  template: any,
  cardWidth: number,
  cardHeight: number,
  colors: Record<string, number[]>
): void {
  // Background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, 0, cardWidth, cardHeight, "F");

  // Header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, cardWidth, 6, "F");

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.text("TERMS & CONDITIONS", cardWidth / 2, 4, { align: "center" });

  // Terms text
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.setFontSize(5);
  pdf.setFont("helvetica", "normal");

  const terms = [
    "1. This card is property of " + data.schoolName,
    "2. If found, please return to the school office",
    "3. This card is non-transferable",
    "4. Loss of card should be reported immediately",
    "5. Card must be carried at all times on campus",
  ];

  let yPos = 12;
  terms.forEach((term) => {
    pdf.text(term, 5, yPos);
    yPos += 5;
  });

  // Emergency contact
  yPos += 3;
  pdf.setFont("helvetica", "bold");
  pdf.text("Emergency Contact:", 5, yPos);
  yPos += 4;
  pdf.setFont("helvetica", "normal");
  pdf.text(data.emergencyContact || "Contact school office", 5, yPos);

  // School address
  yPos += 6;
  pdf.setFont("helvetica", "bold");
  pdf.text("School Address:", 5, yPos);
  yPos += 4;
  pdf.setFont("helvetica", "normal");
  const addressLines = pdf.splitTextToSize(data.schoolAddress || "School Address", cardWidth - 10);
  pdf.text(addressLines, 5, yPos);

  // Contact info
  yPos = cardHeight - 8;
  pdf.setFontSize(5);
  pdf.text(`Phone: ${data.phone || "Contact School"}`, 5, yPos);
  if (data.schoolCode) {
    pdf.text(`Website: www.${data.schoolCode.toLowerCase().replace(/\s/g, "")}.edu.bt`, 5, yPos + 4);
  }
}

/**
 * Draw photo placeholder
 */
function drawPhotoPlaceholder(pdf: jsPDF, x: number, y: number, size: number): void {
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.rect(x, y, size, size);

  pdf.setTextColor(180, 180, 180);
  pdf.setFontSize(6);
  pdf.text("PHOTO", x + size / 2, y + size / 2, { align: "center" });
}

/**
 * Get role display text
 */
function getRoleDisplayText(data: IDCardData): string {
  switch (data.type) {
    case "student":
      return "STUDENT";
    case "teacher":
      return data.designation || "TEACHER";
    case "school_admin":
      return "SCHOOL ADMIN";
    case "admin":
      return "ADMINISTRATOR";
    case "counselor":
      return "COUNSELOR";
    case "parent":
      return "PARENT";
    default:
      return data.role || data.type.toUpperCase();
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

/**
 * Parse color string to RGB array
 */
function parseColors(colors: IDCardColors): Record<string, [number, number, number]> {
  const result: Record<string, [number, number, number]> = {} as Record<string, [number, number, number]>;

  for (const [key, value] of Object.entries(colors)) {
    const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      result[key] = [
        parseInt(rgbMatch[1]),
        parseInt(rgbMatch[2]),
        parseInt(rgbMatch[3]),
      ];
      continue;
    }

    const hexMatch = value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      result[key] = [
        parseInt(hexMatch[1], 16),
        parseInt(hexMatch[2], 16),
        parseInt(hexMatch[3], 16),
      ];
      continue;
    }

    result[key] = [51, 51, 51];
  }

  return result;
}

/**
 * Generate bulk ID cards for multiple users
 */
export async function generateBulkIDCards(
  usersData: IDCardData[],
  options: GenerateIDCardOptions = {}
): Promise<Blob> {
  // For bulk, create a single PDF with multiple pages (2 per user = front + back)
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const cardsPerPage = 8; // 4x2 grid on A4
  let cardIndex = 0;

  for (const userData of usersData) {
    const template = getIDTemplate(userData.type);
    const cardWidth = template.dimensions.width;
    const cardHeight = template.dimensions.height;

    // Calculate position on page
    const col = cardIndex % 4;
    const row = Math.floor(cardIndex / 4) % 2;
    const x = 10 + col * (cardWidth + 5);
    const y = 10 + row * (cardHeight + 5);

    // Start new page after 8 cards
    if (cardIndex > 0 && cardIndex % cardsPerPage === 0) {
      pdf.addPage();
    }

    // Note: In production, use proper PDF merging library
    // This is a simplified approach
    cardIndex++;
  }

  return pdf.output("blob");
}
