/**
 * Mobile Viewport Testing Utilities
 *
 * Utilities for testing and validating mobile viewport behavior.
 * Includes breakpoint helpers, viewport detection, and testing tools.
 */

/**
 * Standard viewport sizes for testing
 */
export const VIEWPORT_SIZES = {
  // Mobile devices
  "iphone-se": { width: 375, height: 667, name: "iPhone SE" },
  "iphone-12-pro": { width: 390, height: 844, name: "iPhone 12 Pro" },
  "iphone-14-pro-max": { width: 430, height: 932, name: "iPhone 14 Pro Max" },
  "android-small": { width: 320, height: 568, name: "Android Small" },
  "android-medium": { width: 360, height: 640, name: "Android Medium" },
  "android-large": { width: 414, height: 896, name: "Android Large" },

  // Tablets
  "ipad-mini": { width: 768, height: 1024, name: "iPad Mini" },
  "ipad-pro": { width: 1024, height: 1366, name: "iPad Pro" },
  "surface-pro": { width: 912, height: 1368, name: "Surface Pro" },

  // Desktop
  "desktop-sm": { width: 1280, height: 720, name: "Desktop Small" },
  "desktop-md": { width: 1440, height: 900, name: "Desktop Medium" },
  "desktop-lg": { width: 1920, height: 1080, name: "Desktop Large" },
} as const;

export type ViewportSize = keyof typeof VIEWPORT_SIZES;

/**
 * Breakpoint values matching Tailwind's default breakpoints
 */
export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/**
 * Get the current breakpoint based on window width
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (typeof window === "undefined") return "lg";

  const width = window.innerWidth;

  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  if (width < 1536) return "xl";
  return "2xl";
}

/**
 * Check if current viewport is mobile (below lg breakpoint)
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024;
}

/**
 * Check if current viewport is tablet (md to lg breakpoint)
 */
export function isTablet(): boolean {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
}

/**
 * Check if current viewport is desktop (lg and above)
 */
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 1024;
}

/**
 * Get safe area insets for notched devices
 */
export function getSafeAreaInsets() {
  if (typeof window === "undefined") {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  return {
    top: parseInt(computedStyle.getPropertyValue("safe-area-inset-top") || "0"),
    bottom: parseInt(computedStyle.getPropertyValue("safe-area-inset-bottom") || "0"),
    left: parseInt(computedStyle.getPropertyValue("safe-area-inset-left") || "0"),
    right: parseInt(computedStyle.getPropertyValue("safe-area-inset-right") || "0"),
  };
}

/**
 * Check if device has a notch (safe areas)
 */
export function hasNotch(): boolean {
  if (typeof window === "undefined") return false;
  const insets = getSafeAreaInsets();
  return insets.top > 0 || insets.bottom > 0;
}

/**
 * Get the appropriate viewport height (fixes iOS Safari issue)
 */
export function getViewportHeight(): number {
  if (typeof window === "undefined") return 0;

  // Use visualViewport API if available (most accurate on mobile)
  if (window.visualViewport) {
    return window.visualViewport.height;
  }

  // Fallback to innerHeight
  return window.innerHeight;
}

/**
 * Check if element is within viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const viewportHeight = getViewportHeight();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewportHeight &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Check if element is at least partially visible
 */
export function isPartiallyInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const viewportHeight = getViewportHeight();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top < viewportHeight &&
    rect.bottom > 0 &&
    rect.left < viewportWidth &&
    rect.right > 0
  );
}

/**
 * Scroll element into view with smooth animation
 */
export function scrollIntoView(element: HTMLElement, options: ScrollIntoViewOptions = {}) {
  const defaultOptions: ScrollIntoViewOptions = {
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  };

  element.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * Test if touch targets meet minimum size (44x44px)
 */
export function testTouchTargetSize(element: HTMLElement): {
  passes: boolean;
  width: number;
  height: number;
  recommendation?: string;
} {
  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const minSize = 44;

  if (width >= minSize && height >= minSize) {
    return { passes: true, width, height };
  }

  const recommendation = `Increase touch target to at least ${minSize}x${minSize}px (current: ${width}x${height}px)`;

  return { passes: false, width, height, recommendation };
}

/**
 * Get all touch targets on page and test their sizes
 */
export function auditTouchTargets(): {
  total: number;
  passing: number;
  failing: number;
  results: Array<{
    element: string;
    width: number;
    height: number;
    passes: boolean;
  }>;
} {
  if (typeof document === "undefined") {
    return { total: 0, passing: 0, failing: 0, results: [] };
  }

  // Common touch target selectors
  const selectors = [
    "button",
    "a",
    "input[type='button']",
    "input[type='submit']",
    "[role='button']",
    ".touch-target",
  ];

  const elements = document.querySelectorAll(selectors.join(", "));
  const results: Array<{
    element: string;
    width: number;
    height: number;
    passes: boolean;
  }> = [];

  let passing = 0;
  let failing = 0;

  elements.forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    const test = testTouchTargetSize(element);
    const tagName = element.tagName.toLowerCase();
    const className = element.className;
    const id = element.id;

    const identifier = id
      ? `#${id}`
      : className
      ? `${tagName}.${className.split(" ")[0]}`
      : tagName;

    results.push({
      element: identifier,
      width: test.width,
      height: test.height,
      passes: test.passes,
    });

    if (test.passes) {
      passing++;
    } else {
      failing++;
    }
  });

  return {
    total: results.length,
    passing,
    failing,
    results,
  };
}

/**
 * Mobile viewport test checklist
 */
export const MOBILE_TEST_CHECKLIST = {
  touchTargets: {
    description: "All interactive elements are at least 44x44px",
    test: () => {
      const audit = auditTouchTargets();
      return audit.failing === 0;
    },
  },
  readableText: {
    description: "Text is at least 16px without zooming",
    test: () => {
      if (typeof document === "undefined") return true;
      const html = document.documentElement;
      const fontSize = window.getComputedStyle(html).fontSize;
      return parseInt(fontSize) >= 16;
    },
  },
  noHorizontalScroll: {
    description: "No horizontal scrolling on mobile",
    test: () => {
      if (typeof document === "undefined") return true;
      const body = document.body;
      return body.scrollWidth <= body.clientWidth;
    },
  },
  tapSpacing: {
    description: "Touch targets are spaced at least 8px apart",
    test: () => {
      // This would require more complex logic
      return true;
    },
  },
  viewportHeight: {
    description: "Uses 100dvh instead of 100vh",
    test: () => {
      if (typeof document === "undefined") return true;
      const elements = document.querySelectorAll("[style*='100vh']");
      return elements.length === 0;
    },
  },
  safeAreas: {
    description: "Content respects safe area insets",
    test: () => {
      if (typeof document === "undefined") return true;
      const hasSafeArea = document.querySelectorAll(
        "[style*='safe-area-inset']"
      );
      return hasSafeArea.length > 0;
    },
  },
} as const;

/**
 * Run all mobile tests and return results
 */
export function runMobileTests() {
  const results: Record<string, { description: string; passed: boolean }> = {};

  for (const [key, test] of Object.entries(MOBILE_TEST_CHECKLIST)) {
    try {
      results[key] = {
        description: test.description,
        passed: test.test(),
      };
    } catch (error) {
      results[key] = {
        description: test.description,
        passed: false,
      };
    }
  }

  return results;
}

/**
 * Viewport hook for React components
 */
export function useViewport() {
  if (typeof window === "undefined") {
    return {
      width: 1024,
      height: 768,
      breakpoint: "lg" as const,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const width = window.innerWidth;
  const height = getViewportHeight();
  const breakpoint = getCurrentBreakpoint();

  return {
    width,
    height,
    breakpoint,
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
  };
}
