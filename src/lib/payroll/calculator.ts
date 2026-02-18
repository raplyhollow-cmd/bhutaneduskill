/**
 * Payroll Calculator
 *
 * Calculates salary components including:
 * - Basic salary + Grade pay
 * - Allowances (DA, HRA, TA, etc.)
 * - Deductions (PF, Tax, Insurance, etc.)
 * - Pro-rated salary for partial months
 * - Leave encashment
 *
 * All amounts are in cents (integer) to avoid floating point precision issues.
 * 100 cents = 1 BTN (Ngultrum)
 */

import {
  type EmployeeSalary,
  type AllowanceType,
  type DeductionType,
  type SalaryStructure,
  type PayrollAttendance,
} from "@/lib/db/payroll-schema";

// ============================================================================
// TYPES
// ============================================================================

export interface SalaryCalculationInput {
  employeeSalary: EmployeeSalary;
  attendance?: PayrollAttendance;
  salaryStructure?: SalaryStructure;
  allowanceTypes?: AllowanceType[];
  deductionTypes?: DeductionType[];
  workingDaysInMonth?: number;
}

export interface AllowanceCalculation {
  allowanceTypeId: string;
  allowanceCode: string;
  allowanceName: string;
  amount: number; // in cents
  isPercentage: boolean;
  percentage?: number;
}

export interface DeductionCalculation {
  deductionTypeId: string;
  deductionCode: string;
  deductionName: string;
  amount: number; // in cents
  isPercentage: boolean;
  percentage?: number;
  employeeShare: number;
  employerShare?: number;
}

export interface SalaryCalculationResult {
  // Earnings
  basicSalary: number; // in cents
  gradePay: number; // in cents
  grossEarnings: number; // in cents

  // Allowances
  allowances: AllowanceCalculation[];
  totalAllowances: number; // in cents

  // Leave encashment
  leaveEncashmentAmount: number; // in cents
  leaveEncashmentDays: number;

  // Total earnings
  totalEarnings: number; // in cents

  // Deductions
  deductions: DeductionCalculation[];
  totalDeductions: number; // in cents

  // Specific deductions
  pfDeduction: number; // in cents
  taxDeduction: number; // in cents
  insuranceDeduction: number; // in cents
  loanDeduction: number; // in cents
  otherDeductions: number; // in cents

  // Net pay
  netPay: number; // in cents

  // Breakdown for payslip
  lossOfPayDays: number;
  lossOfPayAmount: number; // in cents
  overtimeAmount: number; // in cents
}

export interface LeaveEncashmentInput {
  daysToEncash: number;
  basicSalary: number;
  gradePay: number;
  totalAllowances: number;
  workingDays: number;
  taxApplicable: boolean;
  taxRate?: number;
}

export interface LeaveEncashmentResult {
  daysEncashed: number;
  dailyRate: number; // in cents
  amount: number; // in cents
  taxDeducted: number; // in cents
  netAmount: number; // in cents
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Standard working days in a month for salary calculation
 * Can be overridden per school or per month
 */
const STANDARD_WORKING_DAYS = 30;

/**
 * Default tax slabs for Bhutan (example - should be configurable)
 */
const DEFAULT_TAX_SLABS = [
  { minIncome: 0, maxIncome: 30000000, rate: 0 }, // 0 - 300,000 BTN: 0%
  { minIncome: 30000001, maxIncome: 50000000, rate: 10 }, // 300,001 - 500,000 BTN: 10%
  { minIncome: 50000001, maxIncome: 100000000, rate: 15 }, // 500,001 - 1,000,000 BTN: 15%
  { minIncome: 100000001, maxIncome: Infinity, rate: 25 }, // Above 1,000,000 BTN: 25%
];

/**
 * Default allowance codes for Bhutan
 */
export const DEFAULT_ALLOWANCES = {
  DA: { code: "DA", name: "Dearness Allowance", defaultPercentage: 50 }, // 50% of basic
  HRA: { code: "HRA", name: "House Rent Allowance", defaultPercentage: 40 }, // 40% of basic
  TA: { code: "TA", name: "Transport Allowance", defaultAmount: 500000 }, // Fixed BTN 5,000
  MA: { code: "MA", name: "Medical Allowance", defaultAmount: 250000 }, // Fixed BTN 2,500
  OA: { code: "OA", name: "Other Allowances", defaultAmount: 100000 }, // Fixed BTN 1,000
};

/**
 * Default deduction codes for Bhutan
 */
export const DEFAULT_DEDUCTIONS = {
  PF: { code: "PF", name: "Provident Fund", defaultPercentage: 12, employerMatch: true },
  TAX: { code: "TAX", name: "Income Tax", defaultPercentage: 0, useSlabs: true }, // Slab-based
  INS: { code: "INS", name: "Insurance", defaultAmount: 100000 }, // Fixed BTN 1,000
  LOAN: { code: "LOAN", name: "Loan Recovery", defaultAmount: 0 }, // Employee-specific
};

// ============================================================================
// CALCULATOR FUNCTIONS
// ============================================================================

/**
 * Main salary calculation function
 * Takes employee salary configuration and attendance, returns complete breakdown
 */
export function calculateSalary(input: SalaryCalculationInput): SalaryCalculationResult {
  const {
    employeeSalary,
    attendance,
    salaryStructure,
    allowanceTypes = [],
    deductionTypes = [],
    workingDaysInMonth = STANDARD_WORKING_DAYS,
  } = input;

  // 1. Calculate pro-rated basic salary based on attendance
  const { basicSalary, lossOfPayDays, lossOfPayAmount } = calculateBasicSalary(
    employeeSalary.basicSalary,
    attendance,
    workingDaysInMonth
  );

  const gradePay = employeeSalary.gradePay || 0;

  // 2. Calculate allowances
  const { allowances, totalAllowances } = calculateAllowances({
    basicSalary,
    gradePay,
    customAllowances: employeeSalary.customAllowances,
    additionalAllowances: employeeSalary.additionalAllowances,
    salaryStructure,
    allowanceTypes,
  });

  // 3. Calculate gross earnings
  const grossEarnings = basicSalary + gradePay + totalAllowances;

  // 4. Calculate deductions
  const { deductions, totalDeductions, pfDeduction, taxDeduction, insuranceDeduction, loanDeduction, otherDeductions } =
    calculateDeductions({
      basicSalary,
      grossEarnings,
      totalAllowances,
      customDeductions: employeeSalary.customDeductions,
      additionalDeductions: employeeSalary.additionalDeductions,
      salaryStructure,
      deductionTypes,
    });

  // 5. Calculate overtime
  const overtimeAmount = attendance?.overtimeAmount || 0;

  // 6. Calculate total earnings
  const totalEarnings = grossEarnings + overtimeAmount;

  // 7. Calculate net pay
  const netPay = totalEarnings - totalDeductions;

  return {
    // Earnings
    basicSalary,
    gradePay,
    grossEarnings,
    allowances,
    totalAllowances,
    leaveEncashmentAmount: 0,
    leaveEncashmentDays: 0,
    totalEarnings,
    deductions,
    totalDeductions,
    pfDeduction,
    taxDeduction,
    insuranceDeduction,
    loanDeduction,
    otherDeductions,
    netPay,
    lossOfPayDays,
    lossOfPayAmount,
    overtimeAmount,
  };
}

/**
 * Calculate basic salary with loss of pay consideration
 */
export function calculateBasicSalary(
  fullBasicSalary: number,
  attendance?: PayrollAttendance,
  workingDays: number = STANDARD_WORKING_DAYS
): {
  basicSalary: number;
  lossOfPayDays: number;
  lossOfPayAmount: number;
} {
  if (!attendance) {
    return {
      basicSalary: fullBasicSalary,
      lossOfPayDays: 0,
      lossOfPayAmount: 0,
    };
  }

  // Calculate payable days
  const payableDays = attendance.daysPresent + attendance.daysPaidLeave + attendance.daysHoliday;
  const unpaidDays = attendance.daysUnpaidLeave || attendance.daysAbsent;

  // Calculate loss of pay
  const lossOfPayDays = Math.min(unpaidDays, workingDays);
  const dailyRate = Math.floor(fullBasicSalary / workingDays);
  const lossOfPayAmount = dailyRate * lossOfPayDays;

  // Calculate pro-rated salary
  const basicSalary = fullBasicSalary - lossOfPayAmount;

  return {
    basicSalary,
    lossOfPayDays,
    lossOfPayAmount,
  };
}

/**
 * Calculate all allowances for an employee
 */
export function calculateAllowances(input: {
  basicSalary: number;
  gradePay: number;
  customAllowances?: EmployeeSalary["customAllowances"];
  additionalAllowances?: EmployeeSalary["additionalAllowances"];
  salaryStructure?: SalaryStructure;
  allowanceTypes?: AllowanceType[];
}): {
  allowances: AllowanceCalculation[];
  totalAllowances: number;
} {
  const { basicSalary, gradePay, customAllowances, additionalAllowances, salaryStructure, allowanceTypes } = input;

  const allowances: AllowanceCalculation[] = [];
  let total = 0;

  // Use custom allowances if provided, otherwise use structure defaults
  const applicableAllowances = customAllowances || salaryStructure?.allowances || [];

  for (const allowance of applicableAllowances) {
    // Check if isApplicable property exists and is false
    if ("isApplicable" in allowance && allowance.isApplicable === false) continue;

    const allowanceType = allowanceTypes?.find((at) => at.id === allowance.allowanceTypeId);

    let amount = allowance.amount;
    let isPercentage = allowance.isPercentage;
    let percentage = "percentage" in allowance ? allowance.percentage : undefined;

    // If using percentage and no explicit percentage, calculate from allowance type
    if (isPercentage && percentage === undefined && allowanceType?.percentage) {
      percentage = allowanceType.percentage;
      amount = Math.floor((basicSalary * percentage) / 100);
    }

    // If fixed amount from type
    if (!isPercentage && amount === 0 && allowanceType?.fixedAmount) {
      amount = allowanceType.fixedAmount;
    }

    // Default allowances if no configuration
    if (amount === 0 && !allowanceType) {
      const defaultAllowance = Object.values(DEFAULT_ALLOWANCES).find((da) => da.code === allowance.allowanceTypeId);
      if (defaultAllowance && "defaultPercentage" in defaultAllowance && defaultAllowance.defaultPercentage) {
        amount = Math.floor((basicSalary * defaultAllowance.defaultPercentage) / 100);
        isPercentage = true;
        percentage = defaultAllowance.defaultPercentage;
      } else if (defaultAllowance && "defaultAmount" in defaultAllowance && defaultAllowance.defaultAmount) {
        amount = defaultAllowance.defaultAmount;
        isPercentage = false;
      }
    }

    allowances.push({
      allowanceTypeId: allowance.allowanceTypeId,
      allowanceCode: allowanceType?.code || "",
      allowanceName: allowanceType?.name || "Custom Allowance",
      amount,
      isPercentage,
      percentage,
    });

    total += amount;
  }

  // Add additional allowances
  for (const additional of additionalAllowances || []) {
    allowances.push({
      allowanceTypeId: "additional",
      allowanceCode: "ADDL",
      allowanceName: additional.name,
      amount: additional.amount,
      isPercentage: false,
    });
    total += additional.amount;
  }

  return {
    allowances,
    totalAllowances: total,
  };
}

/**
 * Calculate all deductions for an employee
 */
export function calculateDeductions(input: {
  basicSalary: number;
  grossEarnings: number;
  totalAllowances: number;
  customDeductions?: EmployeeSalary["customDeductions"];
  additionalDeductions?: EmployeeSalary["additionalDeductions"];
  salaryStructure?: SalaryStructure;
  deductionTypes?: DeductionType[];
}): {
  deductions: DeductionCalculation[];
  totalDeductions: number;
  pfDeduction: number;
  taxDeduction: number;
  insuranceDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
} {
  const { basicSalary, grossEarnings, customDeductions, additionalDeductions, salaryStructure, deductionTypes } = input;

  const deductions: DeductionCalculation[] = [];
  let total = 0;
  let pfDeduction = 0;
  let taxDeduction = 0;
  let insuranceDeduction = 0;
  let loanDeduction = 0;
  let otherDeductions = 0;

  // Use custom deductions if provided, otherwise use structure defaults
  const applicableDeductions = customDeductions || salaryStructure?.deductions || [];

  for (const deduction of applicableDeductions) {
    // Check if isApplicable property exists and is false
    if ("isApplicable" in deduction && deduction.isApplicable === false) continue;

    const deductionType = deductionTypes?.find((dt) => dt.id === deduction.deductionTypeId);

    let amount = deduction.amount;
    let isPercentage = deduction.isPercentage;
    let percentage = "percentage" in deduction ? deduction.percentage : undefined;
    let employeeShare = amount;
    let employerShare = 0;

    // If using percentage and no explicit percentage
    if (isPercentage && percentage === undefined && deductionType?.percentage) {
      percentage = deductionType.percentage;
      amount = Math.floor((basicSalary * percentage) / 100);
      employeeShare = amount;

      // Calculate employer contribution
      if (deductionType.employerContributionType === "same_as_employee" && deductionType.employerContributionPercentage) {
        employerShare = Math.floor((basicSalary * deductionType.employerContributionPercentage) / 100);
      } else if (deductionType.employerContributionType === "percentage" && deductionType.employerContributionPercentage) {
        employerShare = Math.floor((basicSalary * deductionType.employerContributionPercentage) / 100);
      } else if (deductionType.employerContributionFixedAmount) {
        employerShare = deductionType.employerContributionFixedAmount;
      }
    }

    // If fixed amount from type
    if (!isPercentage && amount === 0 && deductionType?.fixedAmount) {
      amount = deductionType.fixedAmount;
      employeeShare = amount;
    }

    // Special handling for tax (slab-based)
    if (deductionType?.code === "TAX" || deduction.deductionTypeId === "TAX") {
      amount = calculateIncomeTax(grossEarnings);
      employeeShare = amount;
      isPercentage = false;
    }

    const deductionCode = deductionType?.code || "OTHER";

    // Categorize deductions
    if (deductionCode === "PF") pfDeduction += employeeShare;
    else if (deductionCode === "TAX") taxDeduction += employeeShare;
    else if (deductionCode === "INS") insuranceDeduction += employeeShare;
    else if (deductionCode === "LOAN") loanDeduction += employeeShare;
    else otherDeductions += employeeShare;

    deductions.push({
      deductionTypeId: deduction.deductionTypeId,
      deductionCode,
      deductionName: deductionType?.name || "Custom Deduction",
      amount: employeeShare,
      isPercentage,
      percentage,
      employeeShare,
      employerShare,
    });

    total += employeeShare;
  }

  // Add additional deductions
  for (const additional of additionalDeductions || []) {
    const amount = additional.amount;
    otherDeductions += amount;

    deductions.push({
      deductionTypeId: "additional",
      deductionCode: "ADDL",
      deductionName: additional.name,
      amount,
      isPercentage: false,
      employeeShare: amount,
    });

    total += amount;
  }

  return {
    deductions,
    totalDeductions: total,
    pfDeduction,
    taxDeduction,
    insuranceDeduction,
    loanDeduction,
    otherDeductions,
  };
}

/**
 * Calculate income tax based on annual income (slab-based)
 * Note: Monthly income is annualized for tax calculation
 */
export function calculateIncomeTax(monthlyTaxableIncome: number, taxSlabs = DEFAULT_TAX_SLABS): number {
  // Annualize the monthly income
  const annualIncome = monthlyTaxableIncome * 12;

  let totalTax = 0;
  let remainingIncome = annualIncome;

  for (const slab of taxSlabs) {
    if (remainingIncome <= 0) break;

    const taxableInSlab = Math.min(
      remainingIncome,
      slab.maxIncome === Infinity ? remainingIncome : slab.maxIncome - slab.minIncome + 1
    );

    if (taxableInSlab > 0 && annualIncome > slab.minIncome) {
      const actualTaxable = Math.max(0, Math.min(taxableInSlab, annualIncome - slab.minIncome + 1));
      totalTax += Math.floor((actualTaxable * slab.rate) / 100);
      remainingIncome -= actualTaxable;
    }
  }

  // Return monthly tax
  return Math.floor(totalTax / 12);
}

/**
 * Calculate leave encashment amount
 */
export function calculateLeaveEncashment(input: LeaveEncashmentInput): LeaveEncashmentResult {
  const {
    daysToEncash,
    basicSalary,
    gradePay,
    totalAllowances,
    workingDays = STANDARD_WORKING_DAYS,
    taxApplicable,
    taxRate = 10,
  } = input;

  // Calculate daily rate (basic + grade + allowances) / working days
  const totalMonthlySalary = basicSalary + gradePay + totalAllowances;
  const dailyRate = Math.floor(totalMonthlySalary / workingDays);

  // Calculate gross encashment amount
  const amount = dailyRate * daysToEncash;

  // Calculate tax (if applicable)
  // Leave encashment is usually taxed as "Income from Other Sources"
  const taxDeducted = taxApplicable ? Math.floor((amount * taxRate) / 100) : 0;

  // Calculate net amount
  const netAmount = amount - taxDeducted;

  return {
    daysEncashed: daysToEncash,
    dailyRate,
    amount,
    taxDeducted,
    netAmount,
  };
}

/**
 * Calculate pro-rated salary for joined or resigned employees
 */
export function calculateProRatedSalary(
  fullSalary: number,
  daysWorked: number,
  workingDays: number = STANDARD_WORKING_DAYS
): number {
  return Math.floor((fullSalary * daysWorked) / workingDays);
}

/**
 * Format amount in cents to currency string (BTN)
 */
export function formatCurrency(amountInCents: number, currency: string = "BTN"): string {
  const amountInCurrency = amountInCents / 100;
  return new Intl.NumberFormat("en-BT", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCurrency);
}

/**
 * Convert currency string to cents
 */
export function currencyToCents(amount: string | number): number {
  if (typeof amount === "number") {
    return Math.round(amount * 100);
  }
  // Remove currency symbols and spaces, then parse
  const numericValue = parseFloat(amount.replace(/[^\d.-]/g, ""));
  return Math.round(numericValue * 100);
}

/**
 * Validate payroll calculation
 */
export function validatePayrollCalculation(result: SalaryCalculationResult): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for negative values
  if (result.basicSalary < 0) errors.push("Basic salary cannot be negative");
  if (result.totalAllowances < 0) errors.push("Total allowances cannot be negative");
  if (result.totalDeductions < 0) errors.push("Total deductions cannot be negative");
  if (result.netPay < 0) errors.push("Net pay cannot be negative");

  // Check if deductions exceed earnings (except for loan recovery scenarios)
  if (result.totalDeductions > result.totalEarnings && result.loanDeduction === 0) {
    errors.push("Total deductions cannot exceed total earnings");
  }

  // Check net pay calculation
  const calculatedNetPay = result.totalEarnings - result.totalDeductions;
  if (result.netPay !== calculatedNetPay) {
    errors.push(`Net pay mismatch: expected ${calculatedNetPay}, got ${result.netPay}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
