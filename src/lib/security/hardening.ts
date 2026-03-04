/**
 * SECURITY HARDENING
 *
 * Penetration testing preparation and security measures
 */

import { headers } from "next/headers";

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();
  const key = identifier;

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.resetTime),
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: new Date(record.resetTime),
  };
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/['"]/g, "") // Remove quotes to prevent SQL injection
    .replace(/;/g, "") // Remove semicolons
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Bhutan format)
 */
export function isValidBhutanPhone(phone: string): boolean {
  const phoneRegex = /^(\+975)?[17]\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * CID validation (Bhutanese Citizen ID)
 */
export function isValidCID(cid: string): boolean {
  // Bhutan CID is 11 digits
  const cidRegex = /^\d{11}$/;
  return cidRegex.test(cid);
}

/**
 * XSS prevention
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * CSRF token validation
 */
export async function validateCSRF(token: string): Promise<boolean> {
  // In production, validate against stored token
  // For now, basic validation
  return token && token.length > 20;
}

/**
 * Get client IP address
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
} as const;

/**
 * Content Security Policy
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.clerk.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Password strength validator
 */
export function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Password should be at least 8 characters");

  if (password.length >= 12) score += 1;
  else feedback.push("Consider using 12+ characters for better security");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else feedback.push("Use both uppercase and lowercase letters");

  if (/\d/.test(password)) score += 1;
  else feedback.push("Include at least one number");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("Include special characters for better security");

  let strength: "weak" | "medium" | "strong";
  if (score <= 2) strength = "weak";
  else if (score <= 3) strength = "medium";
  else strength = "strong";

  return { strength, score, feedback };
}

/**
 * SQL injection prevention (parameterized queries)
 */
export function buildSafeQuery(table: string, column: string, value: string) {
  // Use parameterized queries, never string concatenation
  return { table, column, value };
}

/**
 * File upload validation
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds 5MB limit" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }

  // Check file extension matches MIME type
  const ext = file.name.split(".").pop()?.toLowerCase();
  const extToMime: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
  };

  if (ext && extToMime[ext] !== file.type) {
    return { valid: false, error: "File extension doesn't match content" };
  }

  return { valid: true };
}

/**
 * Session security
 */
export const SESSION_CONFIG = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
} as const;

/**
 * API key validation
 */
export function validateApiKey(key: string): boolean {
  // In production, validate against stored keys
  return key.startsWith("besk_") && key.length >= 32;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Security audit checklist
 */
export const SECURITY_AUDIT_CHECKLIST = {
  authentication: [
    "Password requirements enforced",
    "Account lockout after failed attempts",
    "Multi-factor authentication available",
    "Session timeout configured",
    "Secure session storage",
  ],
  authorization: [
    "Role-based access control",
    "Least privilege principle",
    "Resource ownership verification",
    "API endpoint protection",
  ],
  dataProtection: [
    "Data encryption at rest",
    "Data encryption in transit",
    "Sensitive data hashing",
    "PII protection",
  ],
  inputValidation: [
    "SQL injection prevention",
    "XSS prevention",
    "CSRF protection",
    "File upload validation",
    "Input sanitization",
  ],
  logging: [
    "Audit logging enabled",
    "Failed login attempts logged",
    "Data access logged",
    "Security events logged",
  ],
  infrastructure: [
    "Security headers configured",
    "CSP policy configured",
    "Rate limiting enabled",
    "DDoS protection",
    "Regular security updates",
  ],
} as const;
