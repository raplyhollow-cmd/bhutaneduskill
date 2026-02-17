import { logger } from "@/lib/logger";
/**
 * BCSE (Bhutan Council for School Examinations) API Integration
 * Handles communication with BCSE systems for exam registrations and results
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BCSEApiConfig {
  apiKey: string;
  apiSecret: string;
  apiEndpoint: string;
  schoolCode: string;
}

export interface BCSEStudentRegistration {
  examType: "BCSE_10" | "BCSE_12";
  academicYear: string;
  examYear: number;
  cidNumber: string;
  indexNumber?: string;
  studentName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
  }>;
  fatherName: string;
  fatherCID: string;
  motherName: string;
  motherCID: string;
  dzongkhag: string;
  gewog: string;
  schoolCode: string;
}

export interface BCSERegistrationResponse {
  success: boolean;
  registrationNumber?: string;
  indexNumber?: string;
  status?: "pending" | "approved" | "rejected";
  error?: string;
  message?: string;
}

export interface BCSEExamResult {
  indexNumber: string;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  studentName: string;
  cidNumber: string;
  division: string;
  aggregateMarks: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    grade: string;
    remarks: string;
  }>;
}

export interface BCSESubjectInfo {
  subjectCode: string;
  subjectName: string;
  examType: "BCSE_10" | "BCSE_12";
  isCompulsory: boolean;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
}

// ============================================================================
// BCSE API CLIENT
// ============================================================================

export class BCSEApiClient {
  private config: BCSEApiConfig;

  constructor(config: BCSEApiConfig) {
    this.config = config;
  }

  /**
   * Generate HMAC signature for BCSE API requests
   */
  private generateSignature(payload: string, timestamp: string): string {
    const crypto = require("crypto");
    const signatureBase = `${timestamp}.${payload}`;
    return crypto
      .createHmac("sha256", this.config.apiSecret)
      .update(signatureBase)
      .digest("hex");
  }

  /**
   * Make authenticated request to BCSE API
   */
  private async apiRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT",
    body?: any
  ): Promise<any> {
    const timestamp = Date.now().toString();
    const payload = body ? JSON.stringify(body) : "";
    const signature = this.generateSignature(payload, timestamp);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
      "X-School-Code": this.config.schoolCode,
    };

    try {
      const url = `${this.config.apiEndpoint}${endpoint}`;
      const response = await fetch(url, {
        method,
        headers,
        body: method !== "GET" ? payload : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `BCSE API error: ${response.status}`);
      }

      return data;
    } catch (error) {
      logger.error("BCSE API request failed:", error);
      throw error;
    }
  }

  /**
   * Register student for BCSE examination
   */
  async registerStudent(
    registration: BCSEStudentRegistration
  ): Promise<BCSERegistrationResponse> {
    try {
      const response = await this.apiRequest("/registrations", "POST", {
        ...registration,
        schoolCode: registration.schoolCode || this.config.schoolCode,
      });

      return {
        success: true,
        registrationNumber: response.registrationNumber,
        indexNumber: response.indexNumber,
        status: response.status,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Submit bulk student registrations
   */
  async bulkRegisterStudents(
    registrations: BCSEStudentRegistration[]
  ): Promise<{
    success: boolean;
    submitted: number;
    failed: number;
    results: Array<{ index: number; success: boolean; error?: string }>;
  }> {
    try {
      const response = await this.apiRequest("/registrations/bulk", "POST", {
        schoolCode: this.config.schoolCode,
        registrations,
      });

      return {
        success: true,
        submitted: response.submitted || 0,
        failed: response.failed || 0,
        results: response.results || [],
      };
    } catch (error) {
      return {
        success: false,
        submitted: 0,
        failed: registrations.length,
        results: registrations.map((_, i) => ({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : "Bulk registration failed",
        })),
      };
    }
  }

  /**
   * Get exam results for a student
   */
  async getStudentResult(
    indexNumber: string,
    examType: "BCSE_10" | "BCSE_12",
    examYear: number
  ): Promise<{
    success: boolean;
    result?: BCSEExamResult;
    error?: string;
  }> {
    try {
      const response = await this.apiRequest(
        `/results/${examType}/${examYear}/${indexNumber}`,
        "GET"
      );

      return {
        success: true,
        result: response as BCSEExamResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch result",
      };
    }
  }

  /**
   * Get all results for school
   */
  async getSchoolResults(
    examType: "BCSE_10" | "BCSE_12",
    examYear: number
  ): Promise<{
    success: boolean;
    results?: BCSEExamResult[];
    error?: string;
  }> {
    try {
      const response = await this.apiRequest(
        `/results/school/${this.config.schoolCode}/${examType}/${examYear}`,
        "GET"
      );

      return {
        success: true,
        results: response.results || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch results",
      };
    }
  }

  /**
   * Get available subjects
   */
  async getSubjects(
    examType: "BCSE_10" | "BCSE_12"
  ): Promise<{
    success: boolean;
    subjects?: BCSESubjectInfo[];
    error?: string;
  }> {
    try {
      const response = await this.apiRequest(`/subjects/${examType}`, "GET");

      return {
        success: true,
        subjects: response.subjects || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch subjects",
      };
    }
  }

  /**
   * Get valid subject combinations
   */
  async getSubjectCombinations(
    examType: "BCSE_10" | "BCSE_12"
  ): Promise<{
    success: boolean;
    combinations?: any[];
    error?: string;
  }> {
    try {
      const response = await this.apiRequest(
        `/combinations/${examType}`,
        "GET"
      );

      return {
        success: true,
        combinations: response.combinations || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch combinations",
      };
    }
  }

  /**
   * Verify BCSE registration status
   */
  async verifyRegistration(
    registrationNumber: string
  ): Promise<{
    success: boolean;
    status?: string;
    indexNumber?: string;
    error?: string;
  }> {
    try {
      const response = await this.apiRequest(
        `/registrations/${registrationNumber}/verify`,
        "GET"
      );

      return {
        success: true,
        status: response.status,
        indexNumber: response.indexNumber,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Download marksheet
   */
  async downloadMarksheet(
    indexNumber: string,
    examType: "BCSE_10" | "BCSE_12",
    examYear: number
  ): Promise<{
    success: boolean;
    documentUrl?: string;
    error?: string;
  }> {
    try {
      const response = await this.apiRequest(
        `/documents/marksheet/${examType}/${examYear}/${indexNumber}`,
        "GET"
      );

      return {
        success: true,
        documentUrl: response.documentUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to download marksheet",
      };
    }
  }

  /**
   * Download pass certificate
   */
  async downloadCertificate(
    indexNumber: string,
    examType: "BCSE_10" | "BCSE_12",
    examYear: number
  ): Promise<{
    success: boolean;
    documentUrl?: string;
    error?: string;
  }> {
    try {
      const response = await this.apiRequest(
        `/documents/certificate/${examType}/${examYear}/${indexNumber}`,
        "GET"
      );

      return {
        success: true,
        documentUrl: response.documentUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to download certificate",
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createBCSEApiClient(config: BCSEApiConfig): BCSEApiClient {
  return new BCSEApiClient(config);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate division from percentage
 */
export function calculateDivision(percentage: number): string {
  if (percentage >= 80) return "First Division with Distinction";
  if (percentage >= 70) return "First Division";
  if (percentage >= 60) return "Second Division";
  if (percentage >= 40) return "Third Division";
  return "Failed";
}

/**
 * Calculate grade from marks
 */
export function calculateGrade(
  marksObtained: number,
  totalMarks: number
): string {
  const percentage = (marksObtained / totalMarks) * 100;

  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  return "F";
}

/**
 * Validate BCSE CID format
 */
export function validateCID(cid: string): boolean {
  // Bhutan CID is 11 digits
  const cidPattern = /^\d{11}$/;
  return cidPattern.test(cid);
}

/**
 * Format index number
 */
export function formatIndexNumber(
  schoolCode: string,
  sequenceNumber: number,
  examYear: number
): string {
  return `${schoolCode}-${sequenceNumber.toString().padStart(4, "0")}-${examYear}`;
}
