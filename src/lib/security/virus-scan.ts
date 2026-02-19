/**
 * Virus Scanning Module
 *
 * Provides file virus scanning capabilities for uploaded files.
 * Currently implements a mock scanner for development.
 *
 * Production integrations:
 * - ClamAV (local/on-premise)
 * - VirusTotal API (cloud)
 * - AWS GuardDuty (cloud)
 * - Azure Defender (cloud)
 */

import { logger } from "@/lib/logger";
import { readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Virus scan result
 */
export interface VirusScanResult {
  isClean: boolean;
  threats: string[];
  scanEngine: "mock" | "clamav" | "virustotal";
  scanTime: number;
  details?: string;
}

/**
 * Scan configuration options
 */
export interface ScanOptions {
  /**
   * Force use of specific scan engine
   */
  engine?: "mock" | "clamav" | "virustotal";

  /**
   * Maximum time in milliseconds to wait for scan
   */
  timeout?: number;
}

/**
 * Known malicious file signatures (mock database for development)
 * In production, this would be handled by ClamAV or similar
 */
const MOCK_MALICIOUS_SIGNATURES = [
  "EICAR-STANDARD-ANTIVIRUS-TEST-FILE",
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
  "susicious_executable",
  ".exe.exe",
  ".scr.scr",
];

/**
 * Known suspicious file extensions
 */
const SUSPICIOUS_EXTENSIONS = [
  ".exe",
  ".scr",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".vbs",
  ".js",
  ".jar",
  ".app",
  ".deb",
  ".rpm",
  ".dmg",
  ".pkg",
  ".sh",
];

/**
 * Scan a file for viruses
 *
 * @param filePath - Absolute path to the file to scan
 * @param options - Scan configuration options
 * @returns Promise<VirusScanResult>
 */
export async function scanFile(
  filePath: string,
  options: ScanOptions = {}
): Promise<VirusScanResult> {
  const startTime = Date.now();
  const { engine = "mock", timeout = 30000 } = options;

  logger.debug("[VirusScan] Starting scan", { filePath, engine });

  // Check if file exists
  if (!existsSync(filePath)) {
    logger.error("[VirusScan] File not found", { filePath });
    return {
      isClean: false,
      threats: ["File not found"],
      scanEngine: engine,
      scanTime: Date.now() - startTime,
      details: "The file to scan does not exist",
    };
  }

  try {
    // Route to appropriate scanner
    switch (engine) {
      case "clamav":
        return await scanWithClamAV(filePath, startTime);
      case "virustotal":
        return await scanWithVirusTotal(filePath, startTime);
      case "mock":
      default:
        return await mockScan(filePath, startTime);
    }
  } catch (error) {
    logger.error("[VirusScan] Scan failed", { filePath, error });
    return {
      isClean: false,
      threats: ["Scan failed"],
      scanEngine: engine,
      scanTime: Date.now() - startTime,
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mock virus scanner for development
 *
 * Checks against known malicious signatures and suspicious extensions.
 * In production, replace with real ClamAV or cloud service.
 *
 * @param filePath - Path to file
 * @param startTime - Scan start time
 * @returns Promise<VirusScanResult>
 */
async function mockScan(
  filePath: string,
  startTime: number
): Promise<VirusScanResult> {
  const threats: string[] = [];

  try {
    // Read file content for signature check
    const content = await readFile(filePath, "utf-8");

    // Check for known malicious signatures
    for (const signature of MOCK_MALICIOUS_SIGNATURES) {
      if (content.includes(signature)) {
        threats.push(`Malicious signature detected: ${signature.substring(0, 30)}...`);
      }
    }

    // Check for suspicious extensions
    const fileName = filePath.toLowerCase();
    for (const ext of SUSPICIOUS_EXTENSIONS) {
      if (fileName.endsWith(ext)) {
        threats.push(`Suspicious file extension: ${ext}`);
      }
    }

    // Check for double extensions (common malware tactic)
    const parts = filePath.split(".");
    if (parts.length > 2) {
      const lastTwo = parts.slice(-2).join(".");
      if (SUSPICIOUS_EXTENSIONS.some((ext) => lastTwo.endsWith(ext))) {
        threats.push("Double extension detected (possible malware)");
      }
    }

    const isClean = threats.length === 0;

    if (isClean) {
      logger.debug("[VirusScan] Mock scan passed", { filePath });
    } else {
      logger.security("[VirusScan] Mock scan detected threats", { filePath, threats });
    }

    return {
      isClean,
      threats,
      scanEngine: "mock",
      scanTime: Date.now() - startTime,
      details: isClean
        ? "No threats detected (mock scanner)"
        : `Threats detected: ${threats.join(", ")}`,
    };
  } catch (error) {
    // If we can't read as UTF-8, it might be a binary file
    // For mock purposes, check extension only
    const fileName = filePath.toLowerCase();

    for (const ext of SUSPICIOUS_EXTENSIONS) {
      if (fileName.endsWith(ext)) {
        threats.push(`Suspicious file extension: ${ext}`);
      }
    }

    const isClean = threats.length === 0;

    logger.debug("[VirusScan] Mock scan (binary file)", {
      filePath,
      isClean,
      threats,
    });

    return {
      isClean,
      threats,
      scanEngine: "mock",
      scanTime: Date.now() - startTime,
      details: isClean
        ? "No threats detected (mock scanner - binary file)"
        : `Threats detected: ${threats.join(", ")}`,
    };
  }
}

/**
 * Scan file using ClamAV (clamscan command)
 *
 * Requires ClamAV to be installed on the server.
 * Install: apt-get install clamav clamav-daemon
 *
 * @param filePath - Path to file
 * @param startTime - Scan start time
 * @returns Promise<VirusScanResult>
 */
async function scanWithClamAV(
  filePath: string,
  startTime: number
): Promise<VirusScanResult> {
  try {
    // Check if clamscan is available
    try {
      await execAsync("which clamscan");
    } catch {
      logger.warn("[VirusScan] ClamAV not found, falling back to mock");
      return mockScan(filePath, startTime);
    }

    // Run clamscan
    const { stdout } = await execAsync(`clamscan --no-summary "${filePath}"`);

    // ClamAV returns non-zero exit code if virus found
    // Output format: /path/to/file: Virus-Name FOUND
    const threats: string[] = [];
    const lines = stdout.split("\n");

    for (const line of lines) {
      if (line.includes("FOUND")) {
        const virusName = line.split(":").slice(1).join(":").trim().replace("FOUND", "").trim();
        threats.push(virusName || "Threat detected");
      }
    }

    const isClean = threats.length === 0;

    if (!isClean) {
      logger.security("[VirusScan] ClamAV detected threats", { filePath, threats });
    }

    return {
      isClean,
      threats,
      scanEngine: "clamav",
      scanTime: Date.now() - startTime,
      details: isClean ? "No threats detected (ClamAV)" : `Threats: ${threats.join(", ")}`,
    };
  } catch (error) {
    // If clamscan exits with error, check if virus was found
    const stderr = error instanceof Error && "stderr" in error ? (error as { stderr?: string }).stderr : "";

    if (typeof stderr === "string" && stderr.includes("FOUND")) {
      const threats: string[] = [];
      const lines = stderr.split("\n");

      for (const line of lines) {
        if (line.includes("FOUND")) {
          const virusName = line.split(":").slice(1).join(":").trim().replace("FOUND", "").trim();
          threats.push(virusName || "Threat detected");
        }
      }

      logger.security("[VirusScan] ClamAV detected threats", { filePath, threats });

      return {
        isClean: false,
        threats,
        scanEngine: "clamav",
        scanTime: Date.now() - startTime,
        details: `Threats: ${threats.join(", ")}`,
      };
    }

    // Other error, fall back to mock
    logger.warn("[VirusScan] ClamAV error, falling back to mock", { error });
    return mockScan(filePath, startTime);
  }
}

/**
 * Scan file using VirusTotal API
 *
 * Requires VIRUSTOTAL_API_KEY environment variable.
 *
 * @param filePath - Path to file
 * @param startTime - Scan start time
 * @returns Promise<VirusScanResult>
 */
async function scanWithVirusTotal(
  filePath: string,
  startTime: number
): Promise<VirusScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    logger.warn("[VirusScan] VirusTotal API key not found, falling back to mock");
    return mockScan(filePath, startTime);
  }

  try {
    // Read file
    const fileBuffer = await readFile(filePath);

    // For large files, we would need to upload and get analysis URL
    // For this implementation, we'll do a simple scan request

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([fileBuffer]),
      filePath.split("/").pop() || "file"
    );

    const response = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: {
        "x-apikey": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`VirusTotal API error: ${response.status}`);
    }

    const data = await response.json();

    // Get analysis ID and check results
    const analysisId = data.data?.id;

    if (!analysisId) {
      throw new Error("No analysis ID returned");
    }

    // Poll for results (simplified - in production, use webhook)
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const analysisResponse = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          headers: {
            "x-apikey": apiKey,
          },
        }
      );

      const analysisData = await analysisResponse.json();

      if (analysisData.data?.attributes?.status === "completed") {
        const stats = analysisData.data.attributes.stats;
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;

        const threats: string[] = [];
        if (malicious > 0) {
          threats.push(`${malicious} engines detected malware`);
        }
        if (suspicious > 0) {
          threats.push(`${suspicious} engines flagged as suspicious`);
        }

        const isClean = malicious === 0 && suspicious === 0;

        if (!isClean) {
          logger.security("[VirusScan] VirusTotal detected threats", {
            filePath,
            stats,
          });
        }

        return {
          isClean,
          threats,
          scanEngine: "virustotal",
          scanTime: Date.now() - startTime,
          details: isClean
            ? "No threats detected (VirusTotal)"
            : `VirusTotal: ${malicious} malicious, ${suspicious} suspicious`,
        };
      }

      attempts++;
    }

    // Timeout - fall back to mock
    logger.warn("[VirusScan] VirusTotal timeout, falling back to mock");
    return mockScan(filePath, startTime);
  } catch (error) {
    logger.error("[VirusScan] VirusTotal error", { error });
    return mockScan(filePath, startTime);
  }
}

/**
 * Check if virus scanning is available
 *
 * @returns true if any scanner is available
 */
export function isScannerAvailable(): boolean {
  // Mock is always available
  return true;
}

/**
 * Get the scan engine that will be used
 *
 * @returns The scan engine name
 */
export function getScanEngine(): "mock" | "clamav" | "virustotal" {
  if (process.env.VIRUSTOTAL_API_KEY) {
    return "virustotal";
  }

  // In production, check for ClamAV
  // For now, default to mock
  return "mock";
}
