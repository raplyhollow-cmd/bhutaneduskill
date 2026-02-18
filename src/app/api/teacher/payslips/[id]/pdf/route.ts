/**
 * PAYSLIP PDF GENERATOR API
 *
 * GET /api/teacher/payslips/[id]/pdf - Generate and download payslip PDF
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { payrollRecords } from "@/lib/db/payroll-schema";
import { eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/payroll/calculator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/payslips/[id]/pdf - Generate payslip PDF
export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const authResult = await requireAuth(["admin", "school-admin", "teacher"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { id } = params;

    // Get payroll record
    const record = await db.query.payrollRecords.findFirst({
      where: eq(payrollRecords.id, id),
    });

    if (!record) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // Check permission
    if (user.type === "teacher" && record.employeeId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get school details
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, record.schoolId),
    });

    // Generate HTML content for PDF
    const html = generatePayslipHTML(record, school);

    // For now, return HTML that can be printed to PDF
    // In production, you would use a PDF library like jsPDF, puppeteer, or react-pdf
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="payslip-${record.payrollMonth}-${record.payrollYear}-${record.employeeCode || record.employeeName.replace(/\s+/g, "-")}.html"`,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: `/api/teacher/payslips/${params.id}/pdf`, method: "GET" });
    return NextResponse.json({ error: "Failed to generate payslip" }, { status: 500 });
  }
}

/**
 * Generate HTML payslip for printing/PDF conversion
 */
function generatePayslipHTML(record: any, school: any): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[record.payrollMonth - 1] || "Unknown";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${monthName} ${record.payrollYear}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .payslip {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%);
      color: white;
      padding: 20px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
    }
    .header .period {
      font-size: 16px;
      opacity: 0.9;
    }
    .school-info {
      padding: 20px 30px;
      border-bottom: 1px solid #e5e5e5;
      display: flex;
      justify-content: space-between;
    }
    .school-name {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    .school-code {
      color: #6b7280;
      font-size: 13px;
    }
    .employee-info {
      padding: 20px 30px;
      background: #f9fafb;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      border-bottom: 1px solid #e5e5e5;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }
    .section {
      padding: 20px 30px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #8b5cf6;
      padding-bottom: 5px;
      display: inline-block;
    }
    .earnings-table, .deductions-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    .earnings-table th, .deductions-table th {
      background: #f3f4f6;
      padding: 10px 15px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    .earnings-table td, .deductions-table td {
      padding: 10px 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .earnings-table tr:last-child td, .deductions-table tr:last-child td {
      border-bottom: none;
    }
    .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 500;
    }
    .amount.positive {
      color: #059669;
    }
    .amount.negative {
      color: #dc2626;
    }
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    .summary-box {
      background: #f9fafb;
      padding: 15px 20px;
      border-radius: 8px;
    }
    .summary-box .title {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .summary-box .value {
      font-size: 20px;
      font-weight: 600;
    }
    .summary-box.earnings .value {
      color: #059669;
    }
    .summary-box.deductions .value {
      color: #dc2626;
    }
    .net-pay-section {
      background: linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%);
      color: white;
      padding: 25px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .net-pay-section .label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
    }
    .net-pay-section .amount {
      font-size: 32px;
      font-weight: 700;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .payslip {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="payslip">
    <!-- Header -->
    <div class="header">
      <div>
        <h1>Payslip</h1>
        <div class="period">For the month of ${monthName} ${record.payrollYear}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; opacity: 0.8;">Generated on</div>
        <div>${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
      </div>
    </div>

    <!-- School Info -->
    <div class="school-info">
      <div>
        <div class="school-name">${school?.name || "School"}</div>
        <div class="school-code">${school?.code || ""}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: #6b7280;">Payment Status</div>
        <div style="font-weight: 600; color: ${record.paymentStatus === "paid" ? "#059669" : "#f59e0b"};">
          ${record.paymentStatus?.toUpperCase() || "PENDING"}
        </div>
      </div>
    </div>

    <!-- Employee Info -->
    <div class="employee-info">
      <div class="info-item">
        <span class="info-label">Employee Name</span>
        <span class="info-value">${record.employeeName || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Employee Code</span>
        <span class="info-value">${record.employeeCode || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Designation</span>
        <span class="info-value">${record.designation || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Department</span>
        <span class="info-value">${record.department || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Bank</span>
        <span class="info-value">${record.bankName || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Account Number</span>
        <span class="info-value">${record.bankAccountNumber?.replace(/.(?=.{4})/g, "X") || "N/A"}</span>
      </div>
    </div>

    <!-- Earnings Section -->
    <div class="section">
      <div class="section-title">Earnings & Allowances</div>
      <table class="earnings-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Amount (Nu.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td class="amount positive">${formatCurrency(record.basicSalary || 0, "BTN")}</td>
          </tr>
          ${record.gradePay ? `
          <tr>
            <td>Grade Pay</td>
            <td class="amount positive">${formatCurrency(record.gradePay || 0, "BTN")}</td>
          </tr>
          ` : ""}
          ${(record.allowances || []).map((a: any) => `
          <tr>
            <td>${a.allowanceName}</td>
            <td class="amount positive">${formatCurrency(a.amount || 0, "BTN")}</td>
          </tr>
          `).join("")}
          ${record.bonus ? `
          <tr>
            <td>Bonus</td>
            <td class="amount positive">${formatCurrency(record.bonus, "BTN")}</td>
          </tr>
          ` : ""}
          ${record.arrears ? `
          <tr>
            <td>Arrears</td>
            <td class="amount positive">${formatCurrency(record.arrears, "BTN")}</td>
          </tr>
          ` : ""}
          ${record.leaveEncashmentAmount ? `
          <tr>
            <td>Leave Encashment (${record.leaveEncashmentDays} days)</td>
            <td class="amount positive">${formatCurrency(record.leaveEncashmentAmount, "BTN")}</td>
          </tr>
          ` : ""}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-box earnings">
          <div class="title">Total Earnings</div>
          <div class="value">${formatCurrency(record.totalEarnings || 0, "BTN")}</div>
        </div>
      </div>
    </div>

    <!-- Deductions Section -->
    <div class="section" style="background: #fafafa;">
      <div class="section-title">Deductions</div>
      <table class="deductions-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Amount (Nu.)</th>
          </tr>
        </thead>
        <tbody>
          ${(record.deductions || []).map((d: any) => `
          <tr>
            <td>${d.deductionName}</td>
            <td class="amount negative">${formatCurrency(d.amount || 0, "BTN")}</td>
          </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-box deductions">
          <div class="title">Total Deductions</div>
          <div class="value">${formatCurrency(record.totalDeductions || 0, "BTN")}</div>
        </div>
      </div>
    </div>

    <!-- Net Pay -->
    <div class="net-pay-section">
      <div class="label">Net Payable Amount</div>
      <div class="amount">${formatCurrency(record.netPay || 0, "BTN")}</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>This is a computer-generated payslip and does not require signature.</div>
      <div>For queries, contact the school administration office.</div>
    </div>
  </div>

  <script>
    // Auto-print when loaded (optional)
    // window.print();
  </script>
</body>
</html>
  `;
}
