"use client";

/**
 * Mobile Viewport Debug Component
 *
 * A development-only component that displays viewport information
 * and runs mobile tests to validate the implementation.
 *
 * Usage: Add <MobileViewportDebug /> to any page for debugging.
 */

import { useState, useEffect } from "react";
import { useViewport } from "@/lib/mobile-test-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Tablet,
  Monitor,
  Ruler,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function MobileViewportDebug() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const viewport = useViewport();
  const [showTests, setShowTests] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [safeAreas, setSafeAreas] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    // Get safe area insets
    if (typeof window !== "undefined") {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeAreas({
        top: parseInt(computedStyle.getPropertyValue("safe-area-inset-top") || "0"),
        bottom: parseInt(computedStyle.getPropertyValue("safe-area-inset-bottom") || "0"),
        left: parseInt(computedStyle.getPropertyValue("safe-area-inset-left") || "0"),
        right: parseInt(computedStyle.getPropertyValue("safe-area-inset-right") || "0"),
      });
    }
  }, []);

  const runTests = () => {
    if (typeof document === "undefined") return;

    const tests: Record<string, boolean> = {};

    // Test 1: Check for horizontal scroll
    const body = document.body;
    tests.noHorizontalScroll = body.scrollWidth <= body.clientWidth;

    // Test 2: Check base font size
    const html = document.documentElement;
    const fontSize = window.getComputedStyle(html).fontSize;
    tests.readableText = parseInt(fontSize) >= 16;

    // Test 3: Check for 100dvh usage
    const viewportElements = document.querySelectorAll("[style*='100dvh']");
    tests.usesDynamicVH = viewportElements.length > 0;

    // Test 4: Check touch target sizes
    const buttons = document.querySelectorAll("button, a, [role='button']");
    let allTouchTargetsValid = true;
    buttons.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        allTouchTargetsValid = false;
      }
    });
    tests.touchTargetsValid = allTouchTargetsValid;

    // Test 5: Check for safe area handling
    tests.hasSafeAreaSupport =
      safeAreas.top > 0 || safeAreas.bottom > 0 || document.querySelectorAll("[style*='safe-area']").length > 0;

    setTestResults(tests);
    setShowTests(true);
  };

  const deviceTypeIcon =
    viewport.isMobile && viewport.width < 768
      ? Smartphone
      : viewport.isTablet || (viewport.isMobile && viewport.width >= 768)
      ? Tablet
      : Monitor;

  const DeviceIcon = deviceTypeIcon;

  const testItems = [
    { key: "noHorizontalScroll", label: "No Horizontal Scroll" },
    { key: "readableText", label: "Readable Text (16px+)" },
    { key: "usesDynamicVH", label: "Uses Dynamic Viewport (dvh)" },
    { key: "touchTargetsValid", label: "Touch Targets Valid (44px+)" },
    { key: "hasSafeAreaSupport", label: "Safe Area Support" },
  ];

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;

  return (
    <Card className="fixed bottom-4 left-4 z-[9999] bg-gray-900/95 backdrop-blur-xl text-white border-gray-700 max-w-xs">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <DeviceIcon className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Viewport Debug</div>
            <div className="text-xs text-gray-400">
              {viewport.width} x {viewport.height} • {viewport.breakpoint}
            </div>
          </div>
          <Badge
            variant={viewport.isMobile ? "default" : "secondary"}
            className="text-xs"
          >
            {viewport.breakpoint}
          </Badge>
        </div>

        {/* Viewport Details */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3 p-2 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-1">
            <Ruler className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">Width:</span>
            <span className="font-mono">{viewport.width}px</span>
          </div>
          <div className="flex items-center gap-1">
            <Ruler className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">Height:</span>
            <span className="font-mono">{viewport.height}px</span>
          </div>
        </div>

        {/* Safe Areas */}
        {(safeAreas.top > 0 || safeAreas.bottom > 0) && (
          <div className="text-xs p-2 bg-green-900/30 rounded-lg mb-3">
            <div className="flex items-center gap-1 text-green-400 mb-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Safe Areas Detected</span>
            </div>
            <div className="text-gray-400 font-mono">
              T: {safeAreas.top}px • B: {safeAreas.bottom}px
            </div>
          </div>
        )}

        {/* Test Results */}
        {showTests && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            <div className="text-xs text-gray-400 flex items-center justify-between">
              <span>Test Results</span>
              <span className="font-mono">
                {passedTests}/{totalTests} passed
              </span>
            </div>
            {testItems.map((item) => {
              const passed = testResults[item.key];
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 text-xs p-2 rounded bg-gray-800/50"
                >
                  {passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className={passed ? "text-gray-300" : "text-gray-500"}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 text-xs h-8"
            onClick={() => setShowTests(!showTests)}
          >
            {showTests ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Tests
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={runTests}
          >
            Run Tests
          </Button>
        </div>
      </div>
    </Card>
  );
}
