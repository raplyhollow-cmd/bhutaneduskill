/**
 * ID CARD QR/BARCODE GENERATOR
 * Generate QR codes and barcodes for ID card verification
 */

import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

// ============================================================================
// TYPES
// ============================================================================

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface BarcodeOptions {
  format?: "CODE128" | "CODE39" | "EAN13" | "UPC";
  width?: number;
  height?: number;
  displayValue?: boolean;
}

// ============================================================================
// QR CODE GENERATION
// ============================================================================

/**
 * Generate QR code as data URL (base64 PNG)
 */
export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = {
    width: options.width || 200,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || "#000000",
      light: options.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "M" as const,
  };

  try {
    const dataUrl = await QRCode.toDataURL(data, opts);
    return dataUrl;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    // Return a 1x1 transparent pixel as fallback
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  }
}

/**
 * Generate QR code for ID verification
 * Contains user ID, school ID, and timestamp
 */
export async function generateIDVerificationQR(
  userId: string,
  schoolId: string
): Promise<string> {
  const verificationData = JSON.stringify({
    uid: userId,
    sid: schoolId,
    ts: Date.now(),
  });

  return generateQRCode(verificationData, {
    width: 150,
    margin: 1,
  });
}

/**
 * Generate QR code as raw buffer (for saving to file)
 */
export async function generateQRCodeBuffer(
  data: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const opts = {
    width: options.width || 200,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || "#000000",
      light: options.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "M" as const,
  };

  try {
    const buffer = await QRCode.toBuffer(data, opts);
    return buffer;
  } catch (error) {
    console.error("Failed to generate QR code buffer:", error);
    return Buffer.from("");
  }
}

// ============================================================================
// BARCODE GENERATION
// ============================================================================

/**
 * Generate barcode as data URL (base64 PNG)
 */
export function generateBarcode(
  data: string,
  options: BarcodeOptions = {}
): string {
  const opts = {
    format: (options.format || "CODE128") as any,
    width: options.width || 2,
    height: options.height || 50,
    displayValue: options.displayValue !== false,
    fontSize: 12,
    margin: 10,
  };

  try {
    // Create a canvas element for barcode generation
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, data, opts);
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to generate barcode:", error);
    return "";
  }
}

/**
 * Generate barcode for ID card
 * Combines user ID and card number
 */
export function generateIDBarcode(userId: string, cardNumber: string): string {
  const barcodeData = `${userId}-${cardNumber}`;
  return generateBarcode(barcodeData, {
    format: "CODE128",
    width: 1.5,
    height: 30,
    displayValue: false,
  });
}

/**
 * Generate barcode with custom text value displayed
 */
export function generateBarcodeWithText(
  data: string,
  displayText: string,
  options: BarcodeOptions = {}
): string {
  const canvas = document.createElement("canvas");
  const opts = {
    format: (options.format || "CODE128") as any,
    width: options.width || 2,
    height: options.height || 50,
    displayValue: true,
    text: displayText,
    fontSize: 12,
    margin: 10,
  };

  try {
    JsBarcode(canvas, data, opts);
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to generate barcode with text:", error);
    return "";
  }
}

// ============================================================================
// QR CODE VERIFICATION
// ============================================================================

/**
 * Verify QR code data
 * Checks if the QR code is valid and not expired
 */
export function verifyQRCode(qrData: string): {
  valid: boolean;
  userId?: string;
  schoolId?: string;
  timestamp?: number;
  age?: number;
} {
  try {
    const data = JSON.parse(qrData);

    if (!data.uid || !data.sid) {
      return { valid: false };
    }

    // Check if QR code is not too old (30 days)
    const qrAge = Date.now() - (data.ts || 0);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

    if (qrAge > maxAge) {
      return { valid: false, age: qrAge };
    }

    return {
      valid: true,
      userId: data.uid,
      schoolId: data.sid,
      timestamp: data.ts,
      age: qrAge,
    };
  } catch (error) {
    return { valid: false };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate card number from user ID
 * Creates a formatted card number for display
 */
export function generateCardNumber(userId: string): string {
  // Take last 8 characters of user ID and format
  const idPart = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  const checksum = userId.length % 10;
  return `${idPart}${checksum}`;
}

/**
 * Generate a unique ID card reference number
 */
export function generateCardReference(schoolCode: string, userType: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${schoolCode}-${userType.substring(0, 2).toUpperCase()}-${timestamp}-${random}`;
}

/**
 * Calculate QR code age in days
 */
export function getQRAgeDays(timestamp: number): number {
  const age = Date.now() - timestamp;
  return Math.floor(age / (24 * 60 * 60 * 1000));
}

/**
 * Check if QR code needs renewal (older than 25 days)
 */
export function needsQRRenewal(timestamp: number): boolean {
  return getQRAgeDays(timestamp) > 25;
}
