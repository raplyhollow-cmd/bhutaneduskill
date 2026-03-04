/**
 * ACCESSIBILITY AUDIT
 *
 * WCAG compliance testing utilities
 */

export interface A11yTestResult {
  category: string;
  passed: boolean;
  issues: A11yIssue[];
}

export interface A11yIssue {
  severity: "critical" | "serious" | "moderate" | "minor";
  element: string;
  description: string;
  wcagCriterion: string;
}

/**
 * WCAG 2.1 AA compliance checklist
 */
export const WCAG_CHECKLIST = {
  perceivable: [
    "1.1.1 Non-text Content: All images have alt text",
    "1.3.1 Info and Relationships: Proper heading hierarchy",
    "1.3.2 Meaningful Sequence: DOM order matches visual order",
    "1.4.3 Contrast (Minimum): 4.5:1 for normal text, 3:1 for large",
    "1.4.4 Resize text: Text can be zoomed to 200%",
  ],
  operable: [
    "2.1.1 Keyboard: All functionality available via keyboard",
    "2.1.2 No Keyboard Trap: Focus can be moved away from all elements",
    "2.4.2 Page Titled: Each page has a descriptive title",
    "2.4.3 Focus Order: Logical focus order",
    "2.4.7 Focus Visible: Clear focus indicator",
  ],
  understandable: [
    "3.1.1 Language of Page: lang attribute set",
    "3.2.1 On Focus: No unexpected context changes on focus",
    "3.3.1 Error Identification: Clear error messages",
    "3.3.2 Labels or Instructions: Form fields have labels",
  ],
  robust: [
    "4.1.1 Parsing: Valid HTML (no duplicate IDs, proper nesting)",
    "4.1.2 Name, Role, Value: ARIA attributes used correctly",
  ],
} as const;

/**
 * Test for missing alt text
 */
export function testMissingAltText(): {
  passed: boolean;
  issues: A11yIssue[];
} {
  if (typeof document === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: A11yIssue[] = [];
  const images = document.querySelectorAll("img");

  images.forEach((img) => {
    const alt = img.getAttribute("alt");
    if (alt === null) {
      issues.push({
        severity: "serious",
        element: `<img src="${img.src}" />`,
        description: "Image missing alt text",
        wcagCriterion: "WCAG 2.1 1.1.1",
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test for form labels
 */
export function testFormLabels(): {
  passed: boolean;
  issues: A11yIssue[];
} {
  if (typeof document === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: A11yIssue[] = [];
  const inputs = document.querySelectorAll("input, select, textarea");

  inputs.forEach((input) => {
    const hasLabel =
      input.getAttribute("aria-label") ||
      input.getAttribute("aria-labelledby") ||
      document.querySelector(`label[for="${input.id}"]`);

    if (!hasLabel) {
      issues.push({
        severity: "critical",
        element: `<${input.tagName} ${input.className ? `class="${input.className}"` : ""} />`,
        description: "Form input missing label",
        wcagCriterion: "WCAG 2.1 3.3.2",
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test heading hierarchy
 */
export function testHeadingHierarchy(): {
  passed: boolean;
  issues: A11yIssue[];
} {
  if (typeof document === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: A11yIssue[] = [];
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let lastLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);

    // Check for skipped levels
    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push({
        severity: "moderate",
        element: `<${heading.tagName}>${heading.textContent?.substring(0, 20)}...</${heading.tagName}>`,
        description: `Heading level skipped (h${lastLevel} to h${level})`,
        wcagCriterion: "WCAG 2.1 1.3.1",
      });
    }

    // Check for multiple h1s
    if (level === 1) {
      const h1Count = document.querySelectorAll("h1").length;
      if (h1Count > 1) {
        issues.push({
          severity: "moderate",
          element: `<h1>${heading.textContent?.substring(0, 20)}...</h1>`,
          description: "Multiple h1 tags on page",
          wcagCriterion: "WCAG 2.1 1.3.1",
        });
      }
    }

    lastLevel = level;
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test color contrast (basic check)
 */
export function testColorContrast(): {
  passed: boolean;
  issues: A11yIssue[];
} {
  if (typeof document === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: A11yIssue[] = [];
  const textElements = document.querySelectorAll("p, span, div, a, button, label");

  textElements.forEach((el) => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const bgColor = styles.backgroundColor;

    // Check for light gray text on white (common issue)
    if (/rgb\(17[0-9],\s*17[0-9],\s*17[0-9]\)/.test(color)) {
      issues.push({
        severity: "serious",
        element: `<${el.tagName}>${el.textContent?.substring(0, 20)}...</${el.tagName}>`,
        description: "Low contrast text (light gray)",
        wcagCriterion: "WCAG 2.1 1.4.3",
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test keyboard accessibility
 */
export function testKeyboardAccessibility(): {
  passed: boolean;
  issues: A11yIssue[];
} {
  if (typeof document === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: A11yIssue[] = [];

  // Check for tabindex > 0 (can cause keyboard trap)
  const badTabIndexes = document.querySelectorAll("[tabindex]:not([tabindex=\"0\"]):not([tabindex=\"-1\"])");
  badTabIndexes.forEach((el) => {
    issues.push({
      severity: "moderate",
      element: `<${el.tagName.toLowerCase()} tabindex="${el.getAttribute("tabindex")}" />`,
      description: "Positive tabindex value can cause keyboard navigation issues",
      wcagCriterion: "WCAG 2.1 2.4.3",
    });
  });

  // Check for elements without focus indicator
  const interactiveElements = document.querySelectorAll("a, button, input, select, textarea");
  interactiveElements.forEach((el) => {
    const styles = window.getComputedStyle(el, ":focus");
    if (
      styles.outline === "none" &&
      !el.getAttribute("data-focus-visible") &&
      !el.className.includes("focus")
    ) {
      issues.push({
        severity: "serious",
        element: `<${el.tagName.toLowerCase()} />`,
        description: "No visible focus indicator",
        wcagCriterion: "WCAG 2.1 2.4.7",
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test ARIA attributes
 */
export function testAriaAttributes(): {
  passed: boolean;
  issues: A11yIssue[];
} {
  if (typeof document === "undefined") {
    return { passed: true, issues: [] };
  }

  const issues: A11yIssue[] = [];

  // Check for aria-hidden on focusable elements
  const hiddenFocusable = document.querySelectorAll(
    "[aria-hidden=\"true\"] a, [aria-hidden=\"true\"] button, [aria-hidden=\"true\"] input"
  );
  hiddenFocusable.forEach((el) => {
    issues.push({
      severity: "serious",
      element: `<${el.tagName.toLowerCase()} aria-hidden="true" />`,
      description: "Focusable element is aria-hidden (keyboard trap)",
      wcagCriterion: "WCAG 2.1 4.1.2",
    });
  });

  // Check for role without relevant states
  const withRole = document.querySelectorAll("[role]");
  withRole.forEach((el) => {
    const role = el.getAttribute("role");
    if (role === "button" && !el.getAttribute("aria-label") && !el.textContent) {
      issues.push({
        severity: "serious",
        element: `<div role="button" />`,
        description: "Button role without accessible name",
        wcagCriterion: "WCAG 2.1 4.1.2",
      });
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Run full accessibility audit
 */
export function runAccessibilityAudit(): {
  overallPassed: boolean;
  results: A11yTestResult[];
  totalIssues: number;
  bySeverity: Record<string, number>;
} {
  const results: A11yTestResult[] = [
    {
      category: "Images",
      passed: testMissingAltText().passed,
      issues: testMissingAltText().issues,
    },
    {
      category: "Forms",
      passed: testFormLabels().passed,
      issues: testFormLabels().issues,
    },
    {
      category: "Headings",
      passed: testHeadingHierarchy().passed,
      issues: testHeadingHierarchy().issues,
    },
    {
      category: "Color Contrast",
      passed: testColorContrast().passed,
      issues: testColorContrast().issues,
    },
    {
      category: "Keyboard",
      passed: testKeyboardAccessibility().passed,
      issues: testKeyboardAccessibility().issues,
    },
    {
      category: "ARIA",
      passed: testAriaAttributes().passed,
      issues: testAriaAttributes().issues,
    },
  ];

  const allIssues = results.flatMap((r) => r.issues);
  const bySeverity: Record<string, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  allIssues.forEach((issue) => {
    bySeverity[issue.severity]++;
  });

  return {
    overallPassed: results.every((r) => r.passed),
    results,
    totalIssues: allIssues.length,
    bySeverity,
  };
}

/**
 * Generate accessibility report
 */
export function generateA11yReport(audit: ReturnType<typeof runAccessibilityAudit>): string {
  let report = "# Accessibility Audit Report\n\n";

  report += `## Overall Status: ${audit.overallPassed ? "✅ PASSED" : "❌ FAILED"}\n\n`;
  report += `Total Issues: ${audit.totalIssues}\n\n`;
  report += "## Issues by Severity\n\n";
  report += `- Critical: ${audit.bySeverity.critical}\n`;
  report += `- Serious: ${audit.bySeverity.serious}\n`;
  report += `- Moderate: ${audit.bySeverity.moderate}\n`;
  report += `- Minor: ${audit.bySeverity.minor}\n\n`;

  for (const result of audit.results) {
    report += `## ${result.category}\n\n`;
    report += `Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}\n\n`;

    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        report += `### ${issue.severity.toUpperCase()}: ${issue.description}\n\n`;
        report += `- Element: \`${issue.element}\`\n`;
        report += `- Criterion: ${issue.wcagCriterion}\n\n`;
      }
    }
  }

  return report;
}
