export { FeeManager } from "./fee-manager";
export { ReceiptGenerator } from "./receipt-generator";

// Re-export types for type checking
export type {
  FeeStructure,
  StudentFee,
  Payment,
  FeeSummary,
} from "@/lib/db/schema";
