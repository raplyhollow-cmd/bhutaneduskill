/**
 * MONITORING SETUP
 *
 * Error tracking and analytics configuration
 */

// Error tracking interface
export interface ErrorContext {
  userId?: string;
  portal?: string;
  action?: string;
  route?: string;
  [key: string]: any;
}

export interface MonitoringEvent {
  type: "error" | "warning" | "info" | "metric";
  category: string;
  message: string;
  context?: ErrorContext;
  timestamp: Date;
  severity?: "low" | "medium" | "high" | "critical";
}

/**
 * Client-side error tracking
 */
export class ErrorTracker {
  private apiKey: string;
  private endpoint: string;
  private queue: MonitoringEvent[] = [];
  private flushInterval: number = 10000; // 10 seconds

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.startFlushInterval();
  }

  /**
   * Track an error
   */
  trackError(error: Error, context?: ErrorContext) {
    this.track({
      type: "error",
      category: "javascript_error",
      message: error.message,
      context: {
        ...context,
        stack: error.stack,
        name: error.name,
      },
      timestamp: new Date(),
      severity: "high",
    });
  }

  /**
   * Track a warning
   */
  trackWarning(message: string, context?: ErrorContext) {
    this.track({
      type: "warning",
      category: "warning",
      message,
      context,
      timestamp: new Date(),
      severity: "medium",
    });
  }

  /**
   * Track an info event
   */
  trackInfo(category: string, message: string, context?: ErrorContext) {
    this.track({
      type: "info",
      category,
      message,
      context,
      timestamp: new Date(),
      severity: "low",
    });
  }

  /**
   * Track a metric
   */
  trackMetric(name: string, value: number, context?: ErrorContext) {
    this.track({
      type: "metric",
      category: "performance",
      message: `${name}: ${value}ms`,
      context: { ...context, metricName: name, metricValue: value },
      timestamp: new Date(),
      severity: "low",
    });
  }

  /**
   * Add event to queue
   */
  private track(event: MonitoringEvent) {
    this.queue.push(event);

    // Flush immediately for critical errors
    if (event.severity === "critical") {
      this.flush();
    }
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval() {
    if (typeof window !== "undefined") {
      setInterval(() => this.flush(), this.flushInterval);

      // Flush on page unload
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  /**
   * Send queued events to monitoring service
   */
  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch (error) {
      // Re-queue failed events
      this.queue.unshift(...events);
      console.error("Failed to send monitoring events:", error);
    }
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private tracker: ErrorTracker;

  constructor(tracker: ErrorTracker) {
    this.tracker = tracker;
    this.initWebVitals();
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initWebVitals() {
    if (typeof window === "undefined") return;

    // Track page load time
    window.addEventListener("load", () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType("navigation")[0] as any;
        if (perfData) {
          this.tracker.trackMetric("page_load_time", perfData.loadEventEnd - perfData.fetchStart);
          this.tracker.trackMetric("dom_content_loaded", perfData.domContentLoadedEventEnd - perfData.fetchStart);
          this.tracker.trackMetric("first_paint", this.getMetric("first-paint"));
          this.tracker.trackMetric("first_contentful_paint", this.getMetric("first-contentful-paint"));
        }
      }, 0);
    });
  }

  /**
   * Get performance metric value
   */
  private getMetric(name: string): number {
    const entries = performance.getEntriesByName(name);
    if (entries.length > 0) {
      return Math.round(entries[0].startTime);
    }
    return 0;
  }

  /**
   * Track custom timing
   */
  trackTiming(name: string, start: number) {
    const duration = performance.now() - start;
    this.tracker.trackMetric(name, duration);
  }

  /**
   * Measure async operation
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.trackTiming(name, start);
    }
  }
}

/**
 * User behavior tracking
 */
export class BehaviorTracker {
  private tracker: ErrorTracker;

  constructor(tracker: ErrorTracker) {
    this.tracker = tracker;
    this.initClickTracking();
    this.initScrollTracking();
  }

  /**
   * Track button clicks
   */
  private initClickTracking() {
    if (typeof document === "undefined") return;

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button, a, [role=\"button\"]");

      if (button) {
        const text = button.textContent?.trim().substring(0, 50) || "unknown";
        this.tracker.trackInfo("click", text, {
          tagName: button.tagName,
          id: button.id,
          className: button.className,
        });
      }
    });
  }

  /**
   * Track scroll depth
   */
  private initScrollTracking() {
    if (typeof window === "undefined") return;

    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90, 100];

    window.addEventListener("scroll", () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        for (const threshold of thresholds) {
          if (scrollPercent >= threshold) {
            this.tracker.trackInfo("scroll_depth", `Reached ${threshold}%`, {
              depth: scrollPercent,
            });
          }
        }
      }
    });
  }
}

/**
 * Initialize monitoring
 */
export function initMonitoring() {
  const apiKey = process.env.NEXT_PUBLIC_MONITORING_API_KEY || "dev-key";
  const endpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT || "/api/monitoring";

  const tracker = new ErrorTracker(apiKey, endpoint);
  const perfMonitor = new PerformanceMonitor(tracker);
  const behaviorTracker = new BehaviorTracker(tracker);

  // Global error handler
  if (typeof window !== "undefined") {
    window.addEventListener("error", (e) => {
      tracker.trackError(e.error, {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    });

    window.addEventListener("unhandledrejection", (e) => {
      tracker.trackError(new Error(e.reason), {
        type: "unhandled_promise_rejection",
      });
    });
  }

  return { tracker, perfMonitor, behaviorTracker };
}

/**
 * Server-side logging (for API routes)
 */
export function serverLog(
  level: "info" | "warn" | "error",
  message: string,
  context?: Record<string, any>
) {
  const logEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }

  // In production, send to logging service
  if (process.env.NODE_ENV === "production") {
    // Send to your logging service (e.g., Datadog, CloudWatch, etc.)
    // await sendToLoggingService(logEntry);
  }

  return logEntry;
}

/**
 * API route error handler
 */
export function handleApiError(error: unknown, context?: ErrorContext) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  serverLog("error", errorMessage, {
    ...context,
    stack: errorStack,
  });

  return {
    success: false,
    error: errorMessage,
    code: "INTERNAL_ERROR",
  };
}
