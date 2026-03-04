/**
 * MOBILE TESTING UTILITIES
 *
 * Real device verification and mobile-specific testing
 */

export interface MobileTestResult {
  device: string;
  viewport: { width: number; height: number };
  userAgent: string;
  tests: {
    name: string;
    passed: boolean;
    issues?: string[];
  }[];
  overallPassed: boolean;
}

/**
 * Common mobile device viewports
 */
export const MOBILE_VIEWPORTS = {
  // Small phones
  "iPhone SE": { width: 375, height: 667 },
  "iPhone 12 Mini": { width: 375, height: 812 },
  "iPhone 13 Pro": { width: 390, height: 844 },
  "iPhone 14 Pro Max": { width: 430, height: 932 },

  // Android phones
  "Samsung Galaxy S21": { width: 360, height: 800 },
  "Samsung Galaxy S21+": { width: 384, height: 854 },
  "Google Pixel 5": { width: 393, height: 851 },

  // Tablets
  "iPad Mini": { width: 768, height: 1024 },
  "iPad Pro": { width: 1024, height: 1366 },
  "Samsung Galaxy Tab": { width: 800, height: 1280 },
} as const;

/**
 * Detect if device is mobile
 */
export function isMobile(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}

/**
 * Detect device type
 */
export function getDeviceType(userAgent: string): "phone" | "tablet" | "desktop" {
  if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) return "tablet";
  if (/iPhone|Android|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent))
    return "phone";
  return "desktop";
}

/**
 * Get device orientation
 */
export function getOrientation(): "portrait" | "landscape" {
  if (typeof window === "undefined") return "portrait";
  return window.innerWidth < window.innerHeight ? "portrait" : "landscape";
}

/**
 * Test if page has horizontal scroll (mobile issue)
 */
export function testHorizontalScroll(): boolean {
  if (typeof window === "undefined") return false;
  return document.body.scrollWidth > document.body.clientWidth;
}

/**
 * Test touch target sizes (WCAG: 44x44px minimum)
 */
export function testTouchTargetSizes(): {
  passed: boolean;
  elements: { element: string; size: number; passed: boolean }[];
} {
  if (typeof window === "undefined") {
    return { passed: true, elements: [] };
  }

  const interactiveElements = document.querySelectorAll(
    "button, a, input, select, textarea, [role=\"button\"]"
  );

  const results: {
    element: string;
    size: number;
    passed: boolean;
  }[] = [];

  interactiveElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const minDimension = Math.min(rect.width, rect.height);
    results.push({
      element: el.tagName + (el.className ? `.${el.className}` : ""),
      size: minDimension,
      passed: minDimension >= 44,
    });
  });

  return {
    passed: results.every((r) => r.passed),
    elements: results,
  };
}

/**
 * Test text readability on mobile
 */
export function testTextReadability(): {
  passed: boolean;
  issues: string[];
} {
  if (typeof window === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: string[] = [];

  // Check for text that's too small
  const smallText = document.querySelectorAll("*");
  smallText.forEach((el) => {
    const styles = window.getComputedStyle(el);
    const fontSize = parseFloat(styles.fontSize);
    if (fontSize < 14 && el.textContent && el.textContent.length > 50) {
      issues.push(`Text too small (${fontSize}px) on: ${el.tagName}`);
    }
  });

  // Check for low contrast
  const lowContrast = document.querySelectorAll("*");
  lowContrast.forEach((el) => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    // Basic check for gray colors that might be hard to read
    if (/rgb\(15[0-9],\s*15[0-9],\s*15[0-9]\)/.test(color)) {
      issues.push(`Low contrast text on: ${el.tagName}`);
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test mobile navigation
 */
export function testMobileNavigation(): {
  passed: boolean;
  issues: string[];
} {
  if (typeof window === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: string[] = [];

  // Check for hamburger menu on mobile
  if (window.innerWidth < 768) {
    const hamburger = document.querySelector(
      "[data-mobile-menu], .hamburger, .mobile-menu-button"
    );
    if (!hamburger) {
      issues.push("No mobile menu button found");
    }

    // Check if sidebar is hidden on mobile
    const sidebar = document.querySelector(".sidebar, [data-sidebar]");
    if (sidebar) {
      const styles = window.getComputedStyle(sidebar);
      if (styles.display !== "none") {
        issues.push("Sidebar visible on mobile (should be hidden)");
      }
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test viewport meta tag
 */
export function testViewportMeta(): {
  passed: boolean;
  content?: string;
} {
  if (typeof document === "undefined") {
    return { passed: true };
  }

  const viewport = document.querySelector("meta[name=\"viewport\"]");
  const content = viewport?.getAttribute("content") || "";

  return {
    passed:
      content.includes("width=device-width") &&
      content.includes("initial-scale=1"),
    content,
  };
}

/**
 * Run full mobile test suite
 */
export function runMobileTests(): MobileTestResult {
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const viewport =
    typeof window !== "undefined"
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 0, height: 0 };

  const horizontalScrollTest = {
    name: "No horizontal scroll",
    passed: !testHorizontalScroll(),
    issues: testHorizontalScroll() ? ["Page has horizontal scroll"] : [],
  };

  const touchTargetTest = {
    name: "Touch target sizes (min 44px)",
    passed: testTouchTargetSizes().passed,
    issues: testTouchTargetSizes()
      .elements.filter((e) => !e.passed)
      .map((e) => `${e.element} is only ${e.size}px`),
  };

  const textReadabilityTest = {
    name: "Text readability",
    passed: testTextReadability().passed,
    issues: testTextReadability().issues,
  };

  const mobileNavTest = {
    name: "Mobile navigation",
    passed: testMobileNavigation().passed,
    issues: testMobileNavigation().issues,
  };

  const viewportMetaTest = {
    name: "Viewport meta tag",
    passed: testViewportMeta().passed,
  };

  const tests = [
    horizontalScrollTest,
    touchTargetTest,
    textReadabilityTest,
    mobileNavTest,
    viewportMetaTest,
  ];

  return {
    device: getDeviceType(userAgent),
    viewport,
    userAgent,
    tests,
    overallPassed: tests.every((t) => t.passed),
  };
}

/**
 * Playwright mobile device configs
 */
export const PLAYWRIGHT_MOBILE_DEVICES = {
  iPhone12: {
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  iPhone12ProMax: {
    viewport: { width: 428, height: 926 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  GalaxyS21: {
    viewport: { width: 360, height: 800 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/88.0.4324.93 Mobile Safari/537.36",
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  iPadPro: {
    viewport: { width: 1024, height: 1366 },
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
} as const;
