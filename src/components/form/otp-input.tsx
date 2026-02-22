"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error,
  autoFocus = true,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, char: string) => {
    if (char.length > 1) {
      // Handle paste
      const pastedValue = char.slice(0, length - index);
      onChange(value.slice(0, index) + pastedValue);

      // Focus the last filled input
      const nextIndex = Math.min(index + pastedValue.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newValue = value.slice(0, index) + char + value.slice(index + 1);
    onChange(newValue);

    // Auto-focus next input
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    handleChange(index, pastedData);
  };

  const setRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={setRef(index)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={handleFocus}
          onPaste={(e) => handlePaste(index, e)}
          disabled={disabled}
          className={cn(
            "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold",
            "border-2 rounded-xl transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-slate-300 focus:border-slate-800 focus:ring-slate-800"
          )}
          style={{
            caretColor: "transparent",
          }}
        />
      ))}
    </div>
  );
}

interface OtpInputWithTimerProps extends Omit<OtpInputProps, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onResend?: () => void;
  timerDuration?: number;
  timerKey?: string;
}

export function OtpInputWithTimer({
  onResend,
  timerDuration = 60,
  timerKey = "otp",
  ...otpProps
}: OtpInputWithTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Reset timer when timerKey changes
    setTimeLeft(timerDuration);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerKey, timerDuration]);

  const handleResend = () => {
    setTimeLeft(timerDuration);
    setCanResend(false);
    onResend?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <OtpInput {...otpProps} />

      {/* Timer and Resend */}
      <div className="flex items-center justify-center gap-4 text-sm">
        {timeLeft > 0 ? (
          <span className="text-slate-500">
            Resend code in <span className="font-medium">{formatTime(timeLeft)}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || otpProps.disabled}
            className="font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "rgb(59 130 246)" }}
          >
            Resend code
          </button>
        )}
      </div>

      {otpProps.error && (
        <p className="text-center text-sm text-red-600">{otpProps.error}</p>
      )}
    </div>
  );
}
