/**
 * Analytics Export API
 * Exports analytics data in various formats (CSV, JSON, PDF)
 *
 * GET /api/admin/analytics-data/export?format=csv|json|pdf
 *
 * Protected: Requires 'admin' role
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// Import the analytics data types - defined locally since we can't import from route
interface SchoolEngagementMetrics {
  totalSchools: number;
  activeSchools: number;
  schoolsByType: Record<string, number>;
  schoolsByLevel: Record<string, number>;
  topSchoolsByStudentCount: Array<{
    schoolId: string;
    schoolName: string;
    studentCount: number;
  }>;
}

interface UserGrowthTrends {
  totalByType: Record<string, number>;
  newThisWeek: Record<string, number>;
  newThisMonth: Record<string, number>;
  newThisYear: Record<string, number>;
  activeLast7Days: number;
  activeLast30Days: number;
  growthOverTime: Array<{
    month: string;
    students: number;
    teachers: number;
    parents: number;
    total: number;
  }>;
}

interface CareerInterestsDistribution {
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  interestByGrade: Array<{
    grade: number;
    topCategory: string;
    count: number;
  }>;
  riasecDistribution: Record<string, number>;
}

interface AssessmentCompletionMetrics {
  totalAssessments: number;
  completedAssessments: number;
  completionRate: number;
  byType: Record<string, {
    total: number;
    completed: number;
    completionRate: number;
  }>;
}

interface AcademicPerformanceMetrics {
  averageGrade: number;
  passRate: number;
  topPerformingSchools: Array<{
    schoolId: string;
    schoolName: string;
    averagePercentage: number;
  }>;
}

interface RevenueMetrics {
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  paymentStatus: {
    pending: number;
    paid: number;
    overdue: number;
  };
}

interface AnalyticsData {
  schoolEngagement: SchoolEngagementMetrics;
  userGrowth: UserGrowthTrends;
  careerInterests: CareerInterestsDistribution;
  assessmentCompletion: AssessmentCompletionMetrics;
  academicPerformance: AcademicPerformanceMetrics;
  revenue: RevenueMetrics;
  generatedAt: string;
}

// ============================================================================
// Types
// ============================================================================

type ExportFormat = "csv" | "json" | "pdf";

interface ExportRequest {
  format: ExportFormat;
  includeSections?: Array<
    "schoolEngagement" |
    "userGrowth" |
    "careerInterests" |
    "assessmentCompletion" |
    "academicPerformance" |
    "revenue"
  >;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(req: Request) {
  const startTime = Date.now();

  try {
    // Authentication check
    const authResult = await requireAuth(['admin']);
    if ('error' in authResult) {
      logger.security("unauthorized_access_attempt", {
        route: "/api/admin/analytics-data/export",
        method: "GET",
      });
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Parse query parameters
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "json") as ExportFormat;
    const includeSections = url.searchParams.get("sections")?.split(",") as Array<
      "schoolEngagement" | "userGrowth" | "careerInterests" | "assessmentCompletion" | "academicPerformance" | "revenue"
    > | undefined;

    logger.info("Exporting analytics data", { userId, format, includeSections });

    // Fetch analytics data from the main route
    const analyticsUrl = new URL("/api/admin/analytics-data", req.url);
    const analyticsResponse = await fetch(analyticsUrl.toString());

    if (!analyticsResponse.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const analyticsData = (await analyticsResponse.json()) as ApiSuccess<AnalyticsData>;
    const data = analyticsData.data;

    // Filter sections if specified
    let filteredData: AnalyticsData;
    if (includeSections && includeSections.length > 0) {
      filteredData = {
        schoolEngagement: includeSections.includes("schoolEngagement") ? data.schoolEngagement : null as SchoolEngagementMetrics | null,
        userGrowth: includeSections.includes("userGrowth") ? data.userGrowth : null as UserGrowthTrends | null,
        careerInterests: includeSections.includes("careerInterests") ? data.careerInterests : null as CareerInterestsDistribution | null,
        assessmentCompletion: includeSections.includes("assessmentCompletion") ? data.assessmentCompletion : null as AssessmentCompletionMetrics | null,
        academicPerformance: includeSections.includes("academicPerformance") ? data.academicPerformance : null as AcademicPerformanceMetrics | null,
        revenue: includeSections.includes("revenue") ? data.revenue : null as RevenueMetrics | null,
        generatedAt: data.generatedAt,
      };
    } else {
      filteredData = data;
    }

    // Export based on format
    switch (format) {
      case "csv":
        return exportAsCSV(filteredData);

      case "json":
        return exportAsJSON(filteredData);

      case "pdf":
        return exportAsPDF(filteredData);

      default:
        return NextResponse.json(
          { error: "Invalid format. Use: csv, json, or pdf", status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    logger.apiError(error, { route: "/api/admin/analytics-data/export", method: "GET" });
    return NextResponse.json(
      { error: "Failed to export analytics data", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export data as JSON
 */
function exportAsJSON(data: AnalyticsData): NextResponse {
  const filename = `analytics-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Export data as CSV
 */
function exportAsCSV(data: AnalyticsData): NextResponse {
  // Build CSV content with multiple sheets/sections
  const csvSections: string[] = [];

  // Add metadata header
  csvSections.push("# Analytics Export");
  csvSections.push(`# Generated: ${data.generatedAt}`);
  csvSections.push("");

  // School Engagement Section
  csvSections.push("## School Engagement");
  csvSections.push("Metric,Value");
  csvSections.push(`Total Schools,${data.schoolEngagement.totalSchools}`);
  csvSections.push(`Active Schools,${data.schoolEngagement.activeSchools}`);
  csvSections.push("");

  // Schools by type
  csvSections.push("Schools by Type");
  csvSections.push("Type,Count");
  for (const [type, count] of Object.entries(data.schoolEngagement.schoolsByType)) {
    csvSections.push(`${type},${count}`);
  }
  csvSections.push("");

  // Top schools
  csvSections.push("Top Schools by Student Count");
  csvSections.push("School Name,Student Count");
  for (const school of data.schoolEngagement.topSchoolsByStudentCount) {
    csvSections.push(`"${school.schoolName}",${school.studentCount}`);
  }
  csvSections.push("");

  // User Growth Section
  csvSections.push("## User Growth");
  csvSections.push("User Type,Total");
  for (const [type, count] of Object.entries(data.userGrowth.totalByType)) {
    csvSections.push(`${type},${count}`);
  }
  csvSections.push("");

  csvSections.push("New Users (This Month)");
  csvSections.push("User Type,Count");
  for (const [type, count] of Object.entries(data.userGrowth.newThisMonth)) {
    csvSections.push(`${type},${count}`);
  }
  csvSections.push("");

  // Growth over time
  csvSections.push("User Growth Over Time");
  csvSections.push("Month,Students,Teachers,Parents,Total");
  for (const month of data.userGrowth.growthOverTime) {
    csvSections.push(`${month.month},${month.students},${month.teachers},${month.parents},${month.total}`);
  }
  csvSections.push("");

  // Career Interests Section
  csvSections.push("## Career Interests");
  csvSections.push("Category,Count,Percentage");
  for (const category of data.careerInterests.topCategories) {
    csvSections.push(`"${category.category}",${category.count},${category.percentage}%`);
  }
  csvSections.push("");

  // RIASEC Distribution
  csvSections.push("RIASEC Distribution");
  csvSections.push("Code,Count");
  for (const [code, count] of Object.entries(data.careerInterests.riasecDistribution)) {
    csvSections.push(`${code},${count}`);
  }
  csvSections.push("");

  // Assessment Completion Section
  csvSections.push("## Assessment Completion");
  csvSections.push("Metric,Value");
  csvSections.push(`Total Assessments,${data.assessmentCompletion.totalAssessments}`);
  csvSections.push(`Completed Assessments,${data.assessmentCompletion.completedAssessments}`);
  csvSections.push(`Completion Rate,${data.assessmentCompletion.completionRate}%`);
  csvSections.push("");

  csvSections.push("Completion by Type");
  csvSections.push("Type,Total,Completed,Completion Rate");
  for (const [type, stats] of Object.entries(data.assessmentCompletion.byType)) {
    csvSections.push(`${type},${stats.total},${stats.completed},${stats.completionRate}%`);
  }
  csvSections.push("");

  // Academic Performance Section
  csvSections.push("## Academic Performance");
  csvSections.push("Metric,Value");
  csvSections.push(`Average Grade,${data.academicPerformance.averageGrade}%`);
  csvSections.push(`Pass Rate,${data.academicPerformance.passRate}%`);
  csvSections.push("");

  csvSections.push("Top Performing Schools");
  csvSections.push("School Name,Average Percentage");
  for (const school of data.academicPerformance.topPerformingSchools) {
    csvSections.push(`"${school.schoolName}",${school.averagePercentage}%`);
  }
  csvSections.push("");

  // Revenue Section
  csvSections.push("## Revenue Metrics");
  csvSections.push("Metric,Value (BTN)");
  csvSections.push(`Active Subscriptions,${data.revenue.activeSubscriptions}`);
  csvSections.push(`Monthly Recurring Revenue,${data.revenue.monthlyRecurringRevenue}`);
  csvSections.push(`Annual Recurring Revenue,${data.revenue.annualRecurringRevenue}`);
  csvSections.push("");

  csvSections.push("Payment Status");
  csvSections.push("Status,Count");
  csvSections.push(`Pending,${data.revenue.paymentStatus.pending}`);
  csvSections.push(`Paid,${data.revenue.paymentStatus.paid}`);
  csvSections.push(`Overdue,${data.revenue.paymentStatus.overdue}`);

  const csvContent = csvSections.join("\n");
  const filename = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Export data as PDF (returns HTML for client-side PDF generation)
 */
function exportAsPDF(data: AnalyticsData): NextResponse {
  // Generate HTML that can be converted to PDF
  const htmlContent = generatePDFHTML(data);

  const filename = `analytics-export-${new Date().toISOString().slice(0, 10)}.html`;

  return new NextResponse(htmlContent, {
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
function generatePDFHTML(data: AnalyticsData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Report - ${new Date().toLocaleDateString()}</title>
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
      border-bottom: 3px solid #f97316;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #f97316;
      font-size: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #f97316;
      padding-left: 12px;
    }
    .section h3 {
      color: #374151;
      font-size: 16px;
      margin-bottom: 10px;
      margin-top: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #f97316;
    }
    .stat-card .label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .bar-chart {
      margin-top: 10px;
    }
    .bar-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .bar-label {
      width: 150px;
      font-size: 13px;
    }
    .bar-track {
      flex: 1;
      background: #e5e7eb;
      height: 20px;
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #f97316, #ea580c);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      color: white;
      font-size: 11px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Platform Analytics Report</h1>
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  </div>

  <div class="section">
    <h2>School Engagement</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${data.schoolEngagement.totalSchools}</div>
        <div class="label">Total Schools</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.schoolEngagement.activeSchools}</div>
        <div class="label">Active Schools</div>
      </div>
      <div class="stat-card">
        <div class="value">${Object.values(data.schoolEngagement.schoolsByType).reduce((a, b) => a + b, 0)}</div>
        <div class="label">Schools by Type</div>
      </div>
      <div class="stat-card">
        <div class="value">${Object.values(data.schoolEngagement.schoolsByLevel).reduce((a, b) => a + b, 0)}</div>
        <div class="label">Schools by Level</div>
      </div>
    </div>
    <h3>Top Schools by Student Count</h3>
    <table>
      <thead>
        <tr>
          <th>School Name</th>
          <th>Student Count</th>
        </tr>
      </thead>
      <tbody>
        ${data.schoolEngagement.topSchoolsByStudentCount.map(s => `
          <tr>
            <td>${s.schoolName}</td>
            <td>${s.studentCount}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>User Growth</h2>
    <div class="stats-grid">
      ${Object.entries(data.userGrowth.totalByType).map(([type, count]) => `
        <div class="stat-card">
          <div class="value">${count}</div>
          <div class="label">${type.charAt(0).toUpperCase() + type.slice(1)}s</div>
        </div>
      `).join('')}
    </div>
    <h3>Active Users</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${data.userGrowth.activeLast7Days}</div>
        <div class="label">Last 7 Days</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.userGrowth.activeLast30Days}</div>
        <div class="label">Last 30 Days</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Career Interests</h2>
    <h3>Top Career Categories</h3>
    <div class="bar-chart">
      ${data.careerInterests.topCategories.map(cat => `
        <div class="bar-item">
          <div class="bar-label">${cat.category}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${cat.percentage}%">${cat.percentage}%</div>
          </div>
        </div>
      `).join('')}
    </div>
    <h3>RIASEC Distribution</h3>
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(data.careerInterests.riasecDistribution).map(([code, count]) => `
          <tr>
            <td>${code}</td>
            <td>${count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Assessment Completion</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${data.assessmentCompletion.totalAssessments}</div>
        <div class="label">Total Assessments</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.assessmentCompletion.completedAssessments}</div>
        <div class="label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.assessmentCompletion.completionRate}%</div>
        <div class="label">Completion Rate</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Academic Performance</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${data.academicPerformance.averageGrade}%</div>
        <div class="label">Average Grade</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.academicPerformance.passRate}%</div>
        <div class="label">Pass Rate</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Revenue Metrics</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${data.revenue.activeSubscriptions}</div>
        <div class="label">Active Subscriptions</div>
      </div>
      <div class="stat-card">
        <div class="value">BTN ${data.revenue.monthlyRecurringRevenue.toLocaleString()}</div>
        <div class="label">MRR</div>
      </div>
      <div class="stat-card">
        <div class="value">BTN ${data.revenue.annualRecurringRevenue.toLocaleString()}</div>
        <div class="label">ARR</div>
      </div>
    </div>
    <h3>Payment Status</h3>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Pending</td><td>${data.revenue.paymentStatus.pending}</td></tr>
        <tr><td>Paid</td><td>${data.revenue.paymentStatus.paid}</td></tr>
        <tr><td>Overdue</td><td>${data.revenue.paymentStatus.overdue}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Bhutan EduSkill Platform Analytics Report</p>
    <p>This is an auto-generated report. For questions, contact platform administrator.</p>
  </div>
</body>
</html>
  `.trim();
}
