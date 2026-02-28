/**
 * MINISTRY ANALYTICS EXPORT API
 * GET /api/ministry/analytics/export?format=csv|json|pdf
 *
 * Exports ministry analytics data in various formats
 *
 * Protected: Requires 'ministry' or 'admin' role
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";

// ============================================================================
// TYPES
// ============================================================================

type ExportFormat = "csv" | "json" | "pdf";

interface NationalStatistics {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCounselors: number;
  totalParents: number;
  totalDistricts: number;
  assessmentsCompleted: number;
  assessmentCompletionRate: number;
  activeSchools: number;
  newStudentsThisMonth: number;
  newSchoolsThisMonth: number;
}

interface DistrictMetrics {
  districtId: string;
  districtName: string;
  schoolCount: number;
  studentCount: number;
  teacherCount: number;
  assessmentCompletionRate: number;
  averagePerformance: number;
  growthRate: number;
}

interface SchoolPerformance {
  schoolId: string;
  schoolName: string;
  district: string;
  studentCount: number;
  averageGrade: number;
  passRate: number;
  assessmentCompletion: number;
  ranking: number;
}

interface TrendData {
  month: string;
  studentCount: number;
  teacherCount: number;
  schoolCount: number;
  assessmentsCompleted: number;
}

interface AssessmentByType {
  type: string;
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageScore?: number;
}

interface CareerInterestData {
  career: string;
  count: number;
  percentage: number;
}

interface RegionalAnalysis {
  district: DistrictMetrics[];
  topPerformingDistricts: Array<{
    districtName: string;
    averageScore: number;
    completionRate: number;
  }>;
  bottomPerformingDistricts: Array<{
    districtName: string;
    averageScore: number;
    completionRate: number;
  }>;
}

interface MinistryAnalyticsResponse {
  nationalStatistics: NationalStatistics;
  regionalAnalysis: RegionalAnalysis;
  schoolPerformance: SchoolPerformance[];
  trendAnalysis: TrendData[];
  assessmentsByType: AssessmentByType[];
  careerInterests: CareerInterestData[];
  generatedAt: string;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    // Parse query parameters
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv") as ExportFormat;

    logger.info("Exporting ministry analytics", { format });

    // Fetch analytics data from the main route
    const analyticsUrl = new URL("/api/ministry/analytics", req.url);
    const analyticsResponse = await fetch(analyticsUrl.toString(), {
      headers: req.headers,
    });

    if (!analyticsResponse.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const analyticsData = (await analyticsResponse.json()) as ApiSuccess<MinistryAnalyticsResponse>;
    const data = analyticsData.data;

    // Export based on format - return Response directly for file downloads
    switch (format) {
      case "csv":
        return exportAsCSV(data);

      case "json":
        return exportAsJSON(data);

      case "pdf":
        return exportAsPDF(data);

      default:
        return { error: "Invalid format. Use: csv, json, or pdf", status: 400 };
    }
  },
  ["ministry", "admin"]
);

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export data as JSON
 */
function exportAsJSON(data: MinistryAnalyticsResponse): Response {
  const filename = `ministry-analytics-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Export data as CSV
 */
function exportAsCSV(data: MinistryAnalyticsResponse): Response {
  const csvSections: string[] = [];

  // Add metadata header
  csvSections.push("# Ministry of Education - National Analytics Export");
  csvSections.push(`# Generated: ${data.generatedAt}`);
  csvSections.push("");

  // National Statistics Section
  csvSections.push("## National Statistics");
  csvSections.push("Metric,Value");
  csvSections.push(`Total Schools,${data.nationalStatistics.totalSchools}`);
  csvSections.push(`Total Students,${data.nationalStatistics.totalStudents}`);
  csvSections.push(`Total Teachers,${data.nationalStatistics.totalTeachers}`);
  csvSections.push(`Total Counselors,${data.nationalStatistics.totalCounselors}`);
  csvSections.push(`Total Districts,${data.nationalStatistics.totalDistricts}`);
  csvSections.push(`Assessments Completed,${data.nationalStatistics.assessmentsCompleted}`);
  csvSections.push(`Assessment Completion Rate,${data.nationalStatistics.assessmentCompletionRate}%`);
  csvSections.push(`Active Schools,${data.nationalStatistics.activeSchools}`);
  csvSections.push(`New Students This Month,${data.nationalStatistics.newStudentsThisMonth}`);
  csvSections.push(`New Schools This Month,${data.nationalStatistics.newSchoolsThisMonth}`);
  csvSections.push("");

  // District Analysis Section
  csvSections.push("## District Analysis");
  csvSections.push("District,Schools,Students,Teachers,Completion Rate,Average Performance,Growth Rate");
  for (const district of data.regionalAnalysis.district) {
    csvSections.push(
      `"${district.districtName}",${district.schoolCount},${district.studentCount},${district.teacherCount},${district.assessmentCompletionRate}%,${district.averagePerformance}%,${district.growthRate}%`
    );
  }
  csvSections.push("");

  // Top Performing Districts
  csvSections.push("## Top Performing Districts");
  csvSections.push("District,Average Score,Completion Rate");
  for (const district of data.regionalAnalysis.topPerformingDistricts) {
    csvSections.push(`"${district.districtName}",${district.averageScore}%,${district.completionRate}%`);
  }
  csvSections.push("");

  // Bottom Performing Districts
  csvSections.push("## Districts Needing Attention");
  csvSections.push("District,Average Score,Completion Rate");
  for (const district of data.regionalAnalysis.bottomPerformingDistricts) {
    csvSections.push(`"${district.districtName}",${district.averageScore}%,${district.completionRate}%`);
  }
  csvSections.push("");

  // School Performance Section
  csvSections.push("## Top Performing Schools");
  csvSections.push("Rank,School Name,District,Students,Average Grade,Pass Rate,Assessment Completion");
  for (const school of data.schoolPerformance.slice(0, 20)) {
    csvSections.push(
      `${school.ranking},"${school.schoolName}","${school.district}",${school.studentCount},${school.averageGrade}%,${school.passRate}%,${school.assessmentCompletion}%`
    );
  }
  csvSections.push("");

  // Trend Analysis Section
  csvSections.push("## Monthly Trends (Last 12 Months)");
  csvSections.push("Month,New Students,New Teachers,New Schools,Assessments Completed");
  for (const trend of data.trendAnalysis) {
    csvSections.push(`${trend.month},${trend.studentCount},${trend.teacherCount},${trend.schoolCount},${trend.assessmentsCompleted}`);
  }
  csvSections.push("");

  // Assessment Completion by Type
  csvSections.push("## Assessment Completion by Type");
  csvSections.push("Type,Started,Completed,Completion Rate");
  for (const assessment of data.assessmentsByType) {
    csvSections.push(`${assessment.type},${assessment.totalStarted},${assessment.totalCompleted},${assessment.completionRate}%`);
  }
  csvSections.push("");

  // Career Interests Section
  csvSections.push("## National Career Interests");
  csvSections.push("Career,Count,Percentage");
  for (const interest of data.careerInterests) {
    csvSections.push(`"${interest.career}",${interest.count},${interest.percentage}%`);
  }

  const csvContent = csvSections.join("\n");
  const filename = `ministry-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Export data as PDF (returns HTML for client-side PDF generation)
 */
function exportAsPDF(data: MinistryAnalyticsResponse): Response {
  const htmlContent = generatePDFHTML(data);

  const filename = `ministry-analytics-${new Date().toISOString().slice(0, 10)}.html`;

  return new Response(htmlContent, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-PDF-Ready": "true",
    },
  });
}

/**
 * Generate HTML for PDF export
 */
function generatePDFHTML(data: MinistryAnalyticsResponse): string {
  const ministryColors = {
    primary: "#a855f7",
    secondary: "#9333ea",
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ministry of Education - National Analytics Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid ${ministryColors.primary};
      padding-bottom: 20px;
    }
    .header h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .header .date {
      color: #9ca3af;
      font-size: 12px;
    }
    .section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: ${ministryColors.primary};
      font-size: 18px;
      margin-bottom: 15px;
      border-left: 4px solid ${ministryColors.primary};
      padding-left: 12px;
    }
    .section h3 {
      color: #374151;
      font-size: 14px;
      margin-bottom: 10px;
      margin-top: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: bold;
      color: ${ministryColors.primary};
    }
    .stat-card .label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 12px;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #faf5ff;
      font-weight: 600;
      color: #374151;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .number {
      text-align: right;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Ministry of Education - National Analytics Report</h1>
    <p class="subtitle">Bhutan EduSkill Platform</p>
    <p class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  </div>

  <div class="section">
    <h2>National Statistics</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${data.nationalStatistics.totalSchools}</div>
        <div class="label">Total Schools</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.nationalStatistics.totalStudents.toLocaleString()}</div>
        <div class="label">Total Students</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.nationalStatistics.totalTeachers}</div>
        <div class="label">Total Teachers</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.nationalStatistics.assessmentsCompleted.toLocaleString()}</div>
        <div class="label">Assessments Completed</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.nationalStatistics.assessmentCompletionRate}%</div>
        <div class="label">Completion Rate</div>
      </div>
    </div>
    <table>
      <tr>
        <th>Metric</th>
        <th class="number">Value</th>
      </tr>
      <tr><td>Total Counselors</td><td class="number">${data.nationalStatistics.totalCounselors}</td></tr>
      <tr><td>Total Districts</td><td class="number">${data.nationalStatistics.totalDistricts}</td></tr>
      <tr><td>Active Schools</td><td class="number">${data.nationalStatistics.activeSchools}</td></tr>
      <tr><td>New Students (This Month)</td><td class="number">${data.nationalStatistics.newStudentsThisMonth}</td></tr>
      <tr><td>New Schools (This Month)</td><td class="number">${data.nationalStatistics.newSchoolsThisMonth}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>District Analysis</h2>
    <table>
      <thead>
        <tr>
          <th>District</th>
          <th class="number">Schools</th>
          <th class="number">Students</th>
          <th class="number">Teachers</th>
          <th class="number">Completion Rate</th>
          <th class="number">Avg Performance</th>
        </tr>
      </thead>
      <tbody>
        ${data.regionalAnalysis.district.map(d => `
          <tr>
            <td>${d.districtName}</td>
            <td class="number">${d.schoolCount}</td>
            <td class="number">${d.studentCount}</td>
            <td class="number">${d.teacherCount}</td>
            <td class="number">${d.assessmentCompletionRate}%</td>
            <td class="number">${d.averagePerformance}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Top Performing Schools</h2>
    <table>
      <thead>
        <tr>
          <th class="number">Rank</th>
          <th>School Name</th>
          <th>District</th>
          <th class="number">Students</th>
          <th class="number">Avg Grade</th>
          <th class="number">Pass Rate</th>
        </tr>
      </thead>
      <tbody>
        ${data.schoolPerformance.slice(0, 15).map(s => `
          <tr>
            <td class="number">${s.ranking}</td>
            <td>${s.schoolName}</td>
            <td>${s.district}</td>
            <td class="number">${s.studentCount}</td>
            <td class="number">${s.averageGrade}%</td>
            <td class="number">${s.passRate}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Assessment Completion by Type</h2>
    <table>
      <thead>
        <tr>
          <th>Assessment Type</th>
          <th class="number">Started</th>
          <th class="number">Completed</th>
          <th class="number">Completion Rate</th>
        </tr>
      </thead>
      <tbody>
        ${data.assessmentsByType.map(a => `
          <tr>
            <td>${a.type}</td>
            <td class="number">${a.totalStarted}</td>
            <td class="number">${a.totalCompleted}</td>
            <td class="number">${a.completionRate}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>National Career Interests</h2>
    <table>
      <thead>
        <tr>
          <th>Career</th>
          <th class="number">Students</th>
          <th class="number">Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${data.careerInterests.slice(0, 15).map(c => `
          <tr>
            <td>${c.career}</td>
            <td class="number">${c.count}</td>
            <td class="number">${c.percentage}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Monthly Trends</h2>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th class="number">New Students</th>
          <th class="number">New Teachers</th>
          <th class="number">New Schools</th>
          <th class="number">Assessments</th>
        </tr>
      </thead>
      <tbody>
        ${data.trendAnalysis.map(t => `
          <tr>
            <td>${t.month}</td>
            <td class="number">${t.studentCount}</td>
            <td class="number">${t.teacherCount}</td>
            <td class="number">${t.schoolCount}</td>
            <td class="number">${t.assessmentsCompleted}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Ministry of Education - Bhutan EduSkill Platform Analytics Report</p>
    <p>This is an auto-generated report. For questions, contact the Ministry of Education.</p>
  </div>
</body>
</html>
  `.trim();
}
