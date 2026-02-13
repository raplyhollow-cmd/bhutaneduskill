/**
 * Reusable Error Display Component
 *
 * Used across error.tsx, global-error.tsx, not-found.tsx
 * Provides consistent error UI with optional retry action
 */

"use client";

import React from "react";

interface ErrorDisplayProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  errorCode?: number;
  icon?: React.ReactNode;
  homeLink?: boolean;
}

export function ErrorDisplay({
  title,
  message,
  onRetry,
  errorCode,
  icon,
  homeLink = true,
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Icon or Error Code */}
          <div className="mb-6">
            {icon || (
              <div className="text-6xl">
                {errorCode === 404 ? "🔍" :
                 errorCode === 500 ? "⚠️" :
                 errorCode === 403 ? "🔒" :
                 errorCode === 401 ? "🔐" :
                 "❌"}
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {title}
          </h2>

          {/* Message */}
          {message && (
            <p className="text-gray-600 mb-8 leading-relaxed">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Try Again
              </button>
            )}

            {homeLink && (
              <a
                href="/"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Go Home
              </a>
            )}
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-6 text-sm text-gray-500">
          Bhutan EduSkill • Career Compass & School Management
        </p>
      </div>
    </div>
  );
}

/**
 * Error Display with specific styles for different error types
 */
export function NotFoundError({
  message = "The page you're looking for doesn't exist or has been moved.",
}: {
  message?: string;
}) {
  return (
    <ErrorDisplay
      title="Page Not Found"
      message={message}
      errorCode={404}
    />
  );
}

export function UnauthorizedError({
  message = "You need to sign in to access this page.",
}: {
  message?: string;
}) {
  return (
    <ErrorDisplay
      title="Authentication Required"
      message={message}
      errorCode={401}
      icon={
        <div className="text-6xl">🔐</div>
      }
      homeLink={false}
    />
  );
}

export function ForbiddenError({
  message = "You don't have permission to access this resource.",
}: {
  message?: string;
}) {
  return (
    <ErrorDisplay
      title="Access Denied"
      message={message}
      errorCode={403}
      icon={
        <div className="text-6xl">🔒</div>
      }
    />
  );
}

export function ServerError({
  message = "Something went wrong on our end. Please try again later.",
}: {
  message?: string;
}) {
  return (
    <ErrorDisplay
      title="Server Error"
      message={message}
      errorCode={500}
    />
  );
}
