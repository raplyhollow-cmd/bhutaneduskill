export { FeeManager } from "./fee-manager";
export { ReceiptGenerator } from "./receipt-generator";

// Re-export types for type checking
export type {
  FeeStructure,
  StudentFee,
} from "@/lib/db/schema";

// Payment and FeeSummary types are from fee-manager component
export type { Payment, FeeSummary } from "./fee-manager";
