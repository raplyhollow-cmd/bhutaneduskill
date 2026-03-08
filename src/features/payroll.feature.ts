/**
 * Payroll Feature Definition
 *
 * Comprehensive payroll management for schools with RMA payment integration.
 * Supports monthly payroll processing, payslip generation, and bank disbursements.
 */

import { defineFeature } from "@/lib/features/define-feature";

export const PayrollFeature = defineFeature({
  name: "payroll",
  tableName: "payroll_records",

  schema: {
    // Primary fields
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    employeeId: {
      type: "reference",
      reference: { table: "users", displayField: "fullName" },
      required: true,
      label: "Employee",
      sortable: true,
      filterable: true,
    },
    payrollMonth: {
      type: "integer",
      required: true,
      label: "Month",
      sortable: true,
      filterable: true,
    },
    payrollYear: {
      type: "integer",
      required: true,
      label: "Year",
      sortable: true,
      filterable: true,
    },

    // Employee details snapshot
    employeeName: {
      type: "text",
      required: true,
      label: "Employee Name",
      sortable: true,
    },
    employeeCode: {
      type: "text",
      label: "Employee Code",
      sortable: true,
    },
    designation: {
      type: "text",
      label: "Designation",
      sortable: true,
    },
    department: {
      type: "text",
      label: "Department",
      sortable: true,
    },

    // Earnings
    basicSalary: {
      type: "integer",
      required: true,
      label: "Basic Salary (cents)",
      sortable: true,
    },
    gradePay: {
      type: "integer",
      label: "Grade Pay (cents)",
      sortable: true,
    },
    grossEarnings: {
      type: "integer",
      required: true,
      label: "Gross Earnings (cents)",
      sortable: true,
    },
    totalAllowances: {
      type: "integer",
      label: "Total Allowances (cents)",
      sortable: true,
    },
    leaveEncashmentAmount: {
      type: "integer",
      label: "Leave Encashment (cents)",
      sortable: true,
    },
    bonus: {
      type: "integer",
      label: "Bonus (cents)",
      sortable: true,
    },
    arrears: {
      type: "integer",
      label: "Arrears (cents)",
      sortable: true,
    },
    totalEarnings: {
      type: "integer",
      required: true,
      label: "Total Earnings (cents)",
      sortable: true,
    },

    // Deductions
    totalDeductions: {
      type: "integer",
      label: "Total Deductions (cents)",
      sortable: true,
    },
    pfDeduction: {
      type: "integer",
      label: "PF Deduction (cents)",
      sortable: true,
    },
    taxDeduction: {
      type: "integer",
      label: "Tax Deduction (cents)",
      sortable: true,
    },
    insuranceDeduction: {
      type: "integer",
      label: "Insurance Deduction (cents)",
      sortable: true,
    },
    loanDeduction: {
      type: "integer",
      label: "Loan Deduction (cents)",
      sortable: true,
    },

    // Net Pay
    netPay: {
      type: "integer",
      required: true,
      label: "Net Pay (cents)",
      sortable: true,
    },

    // Payment details
    paymentMethod: {
      type: "select",
      label: "Payment Method",
      options: [
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "cash", label: "Cash" },
        { value: "cheque", label: "Cheque" },
        { value: "rma", label: "RMA Payment" },
      ],
      filterable: true,
    },
    paymentStatus: {
      type: "select",
      label: "Payment Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "paid", label: "Paid" },
        { value: "failed", label: "Failed" },
      ],
      filterable: true,
    },
    paidAt: {
      type: "timestamp",
      label: "Paid At",
      sortable: true,
    },
    transactionId: {
      type: "text",
      label: "Transaction ID",
    },

    // Payslip
    payslipGenerated: {
      type: "boolean",
      label: "Payslip Generated",
      filterable: true,
    },
    payslipUrl: {
      type: "text",
      label: "Payslip URL",
    },

    // Verification
    isLocked: {
      type: "boolean",
      label: "Locked",
      filterable: true,
    },
    notes: {
      type: "text",
      label: "Notes",
    },

    // Timestamps
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "teacher", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Payroll",
    titlePlural: "Payroll Records",
    basePath: "/school-admin/payroll",
    icon: "DollarSign",
    columns: [
      { key: "employeeName", label: "Employee", sortable: true },
      { key: "payrollMonth", label: "Month", sortable: true },
      { key: "payrollYear", label: "Year", sortable: true },
      { key: "netPay", label: "Net Pay", sortable: true },
      { key: "paymentStatus", label: "Status", sortable: true },
      { key: "paidAt", label: "Paid At", sortable: true },
    ],
  },
});

// Payroll Runs Feature (for batch processing)
export const PayrollRunsFeature = defineFeature({
  name: "payrollRuns",
  tableName: "payroll_runs",

  schema: {
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    month: {
      type: "integer",
      required: true,
      label: "Month",
      sortable: true,
    },
    year: {
      type: "integer",
      required: true,
      label: "Year",
      sortable: true,
    },
    runType: {
      type: "select",
      label: "Run Type",
      options: [
        { value: "monthly", label: "Monthly" },
        { value: "supplementary", label: "Supplementary" },
        { value: "bonus", label: "Bonus" },
      ],
      filterable: true,
    },
    status: {
      type: "select",
      label: "Status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "processing", label: "Processing" },
        { value: "completed", label: "Completed" },
        { value: "failed", label: "Failed" },
      ],
      filterable: true,
    },
    totalEmployees: {
      type: "integer",
      label: "Total Employees",
      sortable: true,
    },
    processedEmployees: {
      type: "integer",
      label: "Processed Employees",
      sortable: true,
    },
    totalNetPay: {
      type: "integer",
      label: "Total Net Pay (cents)",
      sortable: true,
    },
    paymentStatus: {
      type: "select",
      label: "Payment Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "initiated", label: "Initiated" },
        { value: "completed", label: "Completed" },
        { value: "failed", label: "Failed" },
      ],
      filterable: true,
    },
    initiatedAt: {
      type: "timestamp",
      label: "Initiated At",
      sortable: true,
    },
    completedAt: {
      type: "timestamp",
      label: "Completed At",
      sortable: true,
    },
    notes: {
      type: "text",
      label: "Notes",
    },
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Payroll Runs",
    titlePlural: "Payroll Runs",
    basePath: "/school-admin/payroll/runs",
    icon: "PlayCircle",
    columns: [
      { key: "month", label: "Month", sortable: true },
      { key: "year", label: "Year", sortable: true },
      { key: "runType", label: "Type", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "totalNetPay", label: "Total Pay", sortable: true },
      { key: "initiatedAt", label: "Initiated", sortable: true },
    ],
  },
});

// Salary Structures Feature
export const SalaryStructuresFeature = defineFeature({
  name: "salaryStructures",
  tableName: "salary_structures",

  schema: {
    id: {
      type: "text",
      required: true,
      primary: true,
      label: "ID",
    },
    name: {
      type: "text",
      required: true,
      label: "Name",
      sortable: true,
    },
    code: {
      type: "text",
      required: true,
      label: "Code",
      sortable: true,
    },
    category: {
      type: "select",
      label: "Category",
      options: [
        { value: "teaching", label: "Teaching" },
        { value: "non-teaching", label: "Non-Teaching" },
        { value: "administrative", label: "Administrative" },
      ],
      filterable: true,
    },
    level: {
      type: "select",
      label: "Level",
      options: [
        { value: "primary", label: "Primary" },
        { value: "middle", label: "Middle" },
        { value: "secondary", label: "Secondary" },
        { value: "higher_secondary", label: "Higher Secondary" },
      ],
      filterable: true,
    },
    basicSalary: {
      type: "integer",
      required: true,
      label: "Basic Salary (cents)",
      sortable: true,
    },
    gradePay: {
      type: "integer",
      label: "Grade Pay (cents)",
      sortable: true,
    },
    annualIncrement: {
      type: "integer",
      label: "Annual Increment (cents)",
      sortable: true,
    },
    isActive: {
      type: "boolean",
      label: "Active",
      filterable: true,
    },
    isDefault: {
      type: "boolean",
      label: "Default",
      filterable: true,
    },
    createdAt: {
      type: "timestamp",
      label: "Created At",
      sortable: true,
    },
    updatedAt: {
      type: "timestamp",
      label: "Updated At",
      sortable: true,
    },
  },

  permissions: {
    read: ["school-admin", "admin"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Salary Structures",
    titlePlural: "Salary Structures",
    basePath: "/school-admin/payroll/structures",
    icon: "Layers",
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "code", label: "Code", sortable: true },
      { key: "category", label: "Category", sortable: true },
      { key: "basicSalary", label: "Basic Salary", sortable: true },
      { key: "isActive", label: "Active", sortable: true },
    ],
  },
});
