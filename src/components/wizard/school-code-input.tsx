"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface School {
  id: string;
  name: string;
  code: string;
  district: string;
}

interface SchoolCodeInputProps {
  value: string;
  onChange: (value: string, school?: School) => void;
  onError?: (error: string) => void;
  placeholder?: string;
}

export function SchoolCodeInput({
  value,
  onChange,
  onError,
  placeholder = "Enter school code (e.g., RHS-THI-2026)",
}: SchoolCodeInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const [error, setError] = useState<string>("");

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length >= 4) {
        await validateSchoolCode(value);
      } else {
        setSchool(null);
        setError("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const validateSchoolCode = async (code: string) => {
    setIsValidating(true);
    setError("");

    try {
      const response = await fetch(`/api/schools/lookup?code=${encodeURIComponent(code)}`);

      if (response.ok) {
        const data = await response.json();
        if (data.school) {
          setSchool(data.school);
          onChange(code, data.school);
        } else {
          setSchool(null);
          setError("School not found. Check the code or contact your school.");
          onError?.(error);
        }
      } else {
        setSchool(null);
        setError("Invalid school code format");
        onError?.(error);
      }
    } catch (err) {
      setSchool(null);
      setError("Unable to verify school code. Please try again.");
      onError?.(error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="school-code">School Code</Label>
      <div className="relative">
        <Input
          id="school-code"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            school && "border-green-500 focus-visible:ring-green-500",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidating && (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          )}
          {school && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {error && !isValidating && (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {school && (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500">
            {school.name}
          </Badge>
          <span className="text-sm text-gray-500">
            {school.district}
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Don't know your school code? Ask your school administrator.
      </p>
    </div>
  );
}

import { cn } from "@/lib/utils";
