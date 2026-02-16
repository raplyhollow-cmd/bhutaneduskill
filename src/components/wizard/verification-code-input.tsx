"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationCodeInputProps {
  expectedCode: string;
  schoolName: string;
  onVerified: (isValid: boolean, code: string) => void;
}

export function VerificationCodeInput({
  expectedCode,
  schoolName,
  onVerified,
}: VerificationCodeInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Debounced verification
  useEffect(() => {
    // Clear validation if input is empty
    if (!inputValue.trim()) {
      setIsValid(null);
      onVerified(false, "");
      return;
    }

    const timer = setTimeout(() => {
      verifyCode(inputValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const verifyCode = (code: string) => {
    setIsVerifying(true);

    // Simulate a brief verification delay for UX
    setTimeout(() => {
      const normalizedInput = code.toUpperCase().trim();
      const normalizedExpected = expectedCode.toUpperCase().trim();
      const valid = normalizedInput === normalizedExpected;

      setIsValid(valid);
      onVerified(valid, normalizedInput);
      setIsVerifying(false);
    }, 200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase the input
    const uppercased = e.target.value.toUpperCase();
    setInputValue(uppercased);
  };

  const getStatusColor = () => {
    if (isVerifying) return "border-gray-400 focus-visible:ring-gray-400";
    if (isValid === true) return "border-green-500 focus-visible:ring-green-500";
    if (isValid === false) return "border-red-500 focus-visible:ring-red-500";
    return "";
  };

  const getStatusMessage = () => {
    if (isVerifying) return null;
    if (isValid === true) return "School code verified!";
    if (isValid === false) {
      return inputValue.length >= 4
        ? "This code doesn't match. Please check with your school administrator."
        : "Enter your school verification code";
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="verification-code">Verification Code</Label>

      <div className="relative">
        <Input
          id="verification-code"
          value={inputValue}
          onChange={handleChange}
          placeholder="Enter school code (e.g., YHS-THI-2026)"
          className={cn(
            "pr-10 font-mono tracking-wider",
            getStatusColor()
          )}
          autoComplete="off"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isVerifying && (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          )}
          {isValid === true && !isVerifying && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {isValid === false && !isVerifying && inputValue.length > 0 && (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Status message */}
      {getStatusMessage() && (
        <div
          className={cn(
            "flex items-center gap-2 text-sm",
            isValid === true && "text-green-600",
            isValid === false && "text-red-500"
          )}
        >
          {isValid === true && <CheckCircle2 className="w-4 h-4" />}
          {isValid === false && <AlertCircle className="w-4 h-4" />}
          <span>{getStatusMessage()}</span>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Ask your school administrator for your school's verification code.
      </p>
    </div>
  );
}
