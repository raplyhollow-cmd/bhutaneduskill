/**
 * PAYSLIP PDF GENERATOR API
 *
 * GET /api/teacher/payslips/[id]/pdf - Generate and download payslip PDF
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { payrollRecords } from "@/lib/db/payroll-schema";
import { eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/payroll/calculator";
import { createApiRoute } from "@/lib/api/route-handler";

interface PayslipPDFParams extends Record<string, unknown> {
  id: string;
}

interface PayslipRecord {
  id: string;
  teacherId: string;
  payrollId: string;
  basicSalary: number;
  allowances: Array<{ name: string; amount: number }>;
  deductions: Array<{ name: string; amount: number }>;
  netSalary: number;
  paymentDate?: Date | string;
  schoolId?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName?: string;
  payrollMonth?: number;
  payrollYear?: number;
  teacherName?: string;
  paymentStatus?: string;
  designation?: string;
  department?: string;
  bankName?: string;
  bankAccountNumber?: string;
  gradePay?: number;
  bonus?: number;
  arrears?: number;
  leaveEncashmentAmount?: number;
  leaveEncashmentDays?: number;
  totalEarnings?: number;
  totalDeductions?: number;
  netPay?: number;
  [key: string]: unknown;
}

// GET /api/teacher/payslips/[id]/pdf - Generate payslip PDF
export const GET = createApiRoute<PayslipPDFParams>(
  async (request: NextRequest, auth, context) => {
    const { user } = auth;
    const { id } = await context!.params!;

    // Get payroll record
    const [record] = await db
      .select()
      .from(payrollRecords)
      .where(eq(payrollRecords.id, id))
      .limit(1);

    if (!record) {
      return { error: "Payroll record not found", status: 404 };
    }

    // Ensure all required properties are present
    // Map allowances/deductions to simplified format
    const allowances = (record.allowances || []).map((a: { allowanceName?: string; name?: string; amount: number }) => ({
      name: a.allowanceName || a.name || "Allowance",
      amount: a.amount || 0,
    }));

    const deductions = (record.deductions || []).map((d: { deductionName?: string; name?: string; amount: number }) => ({
      name: d.deductionName || d.name || "Deduction",
      amount: d.amount || 0,
    }));

    const payrollRecord: PayslipRecord = {
      id: record.id,
      teacherId: record.employeeId,
      payrollId: record.payrollRunId,
      basicSalary: record.basicSalary,
      allowances,
      deductions,
      netSalary: record.netPay || 0,
      paymentDate: undefined,
      schoolId: record.schoolId,
      employeeId: record.employeeId,
      employeeCode: record.employeeCode,
      employeeName: record.employeeName,
      payrollMonth: record.payrollMonth,
      payrollYear: record.payrollYear,
      teacherName: record.employeeName,
      paymentStatus: record.paymentStatus,
      designation: record.designation,
      department: record.department,
      bankName: record.bankName,
      bankAccountNumber: record.bankAccountNumber,
      gradePay: record.gradePay,
      bonus: record.bonus,
      arrears: record.arrears,
      leaveEncashmentAmount: record.leaveEncashmentAmount,
      leaveEncashmentDays: record.leaveEncashmentDays,
      totalEarnings: record.totalEarnings,
      totalDeductions: record.totalDeductions,
      netPay: record.netPay,
    };

    // Check permission
    if (user.type === "teacher" && payrollRecord.employeeId !== user.id) {
      return { error: "Access denied", status: 403 };
    }

    // Get school details
    const [schoolRecord] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, payrollRecord.schoolId || ""))
      .limit(1);

    // Generate HTML content for PDF
    const html = generatePayslipHTML(
      {
        ...payrollRecord,
        id: payrollRecord.id,
        teacherId: payrollRecord.teacherId,
        payrollId: payrollRecord.payrollId,
        payrollMonth: payrollRecord.payrollMonth || 1,
        payrollYear: payrollRecord.payrollYear || new Date().getFullYear(),
        teacherName: payrollRecord.teacherName || payrollRecord.employeeName || "N/A",
        employeeId: payrollRecord.employeeId,
        designation: payrollRecord.designation,
        department: payrollRecord.department,
        basicSalary: payrollRecord.basicSalary,
        allowances: payrollRecord.allowances,
        deductions: payrollRecord.deductions,
        netSalary: payrollRecord.netSalary,
        paymentDate: typeof payrollRecord.paymentDate === "string"
          ? payrollRecord.paymentDate
          : payrollRecord.paymentDate?.toISOString(),
      },
      schoolRecord?.[0] || {
        name: "",
        code: "",
        address: "",
        logo: "",
        contactEmail: "",
        contactPhone: "",
      }
    );

    // For now, return HTML that can be printed to PDF
    // In production, you would use a PDF library like jsPDF, puppeteer, or react-pdf
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="payslip-${record.payrollMonth}-${record.payrollYear}-${record.employeeCode || record.employeeName.replace(/\s+/g, "-")}.html"`,
      },
    });
  },
  ["admin", "school-admin", "teacher"]
);

/**
 * Generate HTML payslip for printing/PDF conversion
 */
function generatePayslipHTML(record: PayslipRecord & {
  payrollMonth: number;
  payrollYear: number;
  teacherName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  basicSalary: number;
  allowances: Array<{ name: string; amount: number }>;
  deductions: Array<{ name: string; amount: number }>;
  netSalary: number;
  paymentDate?: string;
}, school: {
  name: string;
  code?: string;
  address?: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
}): string {
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
          ${(record.allowances || []).map((a: { name: string; amount: number }) => `
          <tr>
            <td>${a.name}</td>
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
          ${(record.deductions || []).map((d: { name: string; amount: number }) => `
          <tr>
            <td>${d.name}</td>
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
