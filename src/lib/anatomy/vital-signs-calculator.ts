/**
 * VITAL SIGNS CALCULATOR
 *
 * Converts latency and metrics into visual indicators (colors, animations, scores)
 * for the Digital Anatomy Dashboard.
 */

// ============================================================================
// TYPES
// ============================================================================

export type HealthStatus = "healthy" | "degraded" | "critical";

export interface VitalSigns {
  status: HealthStatus;
  color: string;
  score: number; // 0-100
  animationSpeed: number; // 0.5x to 2x
}

export interface ResourceHealth {
  name: string;
  latency: number;
  status: HealthStatus;
  color: string;
  score: number;
  errorCount: number;
}

export interface SystemMetrics {
  cpu: number; // 0-100
  memory: number; // 0-100
  requestsPerMinute: number;
  heartbeatRate: number; // 40-120 BPM metaphor
}

// ============================================================================
// PULSE (Latency) Calculations
// ============================================================================

/**
 * Get color based on latency threshold
 *
 * ATHLETIC (< 100ms): Green
 * NORMAL (100ms - 300ms): Blue
 * INFLAMED (300ms - 1000ms): Yellow/Orange
 * ARREST (> 1000ms or error): Red
 */
export function getLatencyColor(latency: number, hasError: boolean): string {
  if (hasError || latency > 1000) return "#ff0000"; // Red
  if (latency > 300) return "#ffff00"; // Yellow
  if (latency > 100) return "#00bfff"; // Blue
  return "#00ff00"; // Green
}

/**
 * Get health status from latency
 */
export function getLatencyStatus(latency: number, hasError: boolean): HealthStatus {
  if (hasError || latency > 1000) return "critical";
  if (latency > 300) return "degraded";
  return "healthy";
}

/**
 * Calculate animation speed multiplier based on latency
 * - Fast (healthy) = 2x speed
 * - Normal = 1x speed
 * - Slow (degraded) = 0.5x speed
 * - Stopped (critical) = 0x (static, shaking instead)
 */
export function getAnimationSpeed(latency: number, hasError: boolean): number {
  if (hasError || latency > 1000) return 0; // Critical - no particle flow
  if (latency > 300) return 0.5; // Degraded - sluggish
  if (latency > 100) return 1; // Normal
  return 2; // Athletic - fast flow
}

/**
 * Calculate health score (0-100) from latency
 */
export function getLatencyScore(latency: number, hasError: boolean): number {
  if (hasError) return 0;
  if (latency > 1000) return Math.max(0, 100 - (latency - 1000) / 10);
  if (latency > 300) return Math.max(20, 100 - (latency - 300) / 7);
  if (latency > 100) return Math.max(60, 100 - (latency - 100) / 5);
  return 100;
}

/**
 * Calculate complete vital signs for a resource
 */
export function calculateResourceVitalSigns(
  name: string,
  latency: number,
  errorCount: number
): ResourceHealth {
  const hasError = errorCount > 0 || latency === 0; // 0 means timeout
  const status = getLatencyStatus(latency, hasError);
  const color = getLatencyColor(latency, hasError);
  const score = getLatencyScore(latency, hasError);

  return {
    name,
    latency,
    status,
    color,
    score,
    errorCount,
  };
}

// ============================================================================
// BREATH (System Load) Calculations
// ============================================================================

/**
 * Calculate heartbeat rate based on request volume
 *
 * < 100 req/min = 40 BPM (resting)
 * 100-500 req/min = 60-80 BPM (normal)
 * 500-1000 req/min = 100-120 BPM (active)
 * > 1000 req/min = 140+ BPM (stressed)
 */
export function calculateHeartbeatRate(requestsPerMinute: number): number {
  if (requestsPerMinute < 100) return 40 + (requestsPerMinute / 100) * 20; // 40-60
  if (requestsPerMinute < 500) return 60 + ((requestsPerMinute - 100) / 400) * 20; // 60-80
  if (requestsPerMinute < 1000) return 80 + ((requestsPerMinute - 500) / 500) * 40; // 80-120
  return Math.min(180, 120 + (requestsPerMinute - 1000) / 50); // 120-180 max
}

/**
 * Calculate heartbeat animation duration (in seconds)
 * Higher BPM = faster cycle (lower duration)
 */
export function getHeartbeatDuration(heartbeatRate: number): number {
  return 60 / heartbeatRate; // Seconds per beat
}

/**
 * Simulate CPU usage based on request volume
 * (Real CPU monitoring not available in serverless)
 */
export function simulateCpuUsage(requestsPerMinute: number): number {
  // Base 10% + 1% per 10 requests/min, max 95%
  return Math.min(95, 10 + requestsPerMinute / 10);
}

/**
 * Simulate memory usage based on request volume
 * (Real memory monitoring not available in serverless)
 */
export function simulateMemoryUsage(requestsPerMinute: number): number {
  // Base 20% + 0.5% per 10 requests/min, max 90%
  return Math.min(90, 20 + requestsPerMinute / 20);
}

/**
 * Calculate complete system metrics
 */
export function calculateSystemMetrics(requestsPerMinute: number): SystemMetrics {
  const cpu = simulateCpuUsage(requestsPerMinute);
  const memory = simulateMemoryUsage(requestsPerMinute);
  const heartbeatRate = calculateHeartbeatRate(requestsPerMinute);

  return {
    cpu,
    memory,
    requestsPerMinute,
    heartbeatRate,
  };
}

// ============================================================================
// Overall Health Calculations
// ============================================================================

/**
 * Calculate overall system health score (0-100)
 * Weighted average of all resource scores
 */
export function calculateOverallHealth(resources: ResourceHealth[]): number {
  if (resources.length === 0) return 100;

  const totalScore = resources.reduce((sum, r) => sum + r.score, 0);
  return Math.round(totalScore / resources.length);
}

/**
 * Get overall system status
 */
export function getOverallStatus(score: number): HealthStatus {
  if (score >= 80) return "healthy";
  if (score >= 50) return "degraded";
  return "critical";
}

/**
 * Get overall system color
 */
export function getOverallColor(score: number): string {
  return getLatencyScoreColor(score);
}

/**
 * Convert health score to color
 */
export function getLatencyScoreColor(score: number): string {
  if (score >= 80) return "#00ff00"; // Green
  if (score >= 50) return "#ffff00"; // Yellow
  return "#ff0000"; // Red
}

// ============================================================================
// SYNAPSE (AI Healing) Calculations
// ============================================================================

/**
 * Determine if "Brain" node should emit synapse particles
 */
export function shouldEmitSynapse(degradedResources: ResourceHealth[]): boolean {
  return degradedResources.some(r => r.status === "degraded" || r.status === "critical");
}

/**
 * Get synapse target (the most critical resource)
 */
export function getSynapseTarget(resources: ResourceHealth[]): string | null {
  const critical = resources.filter(r => r.status === "critical");
  if (critical.length > 0) {
    // Return the one with lowest score
    return critical.sort((a, b) => a.score - b.score)[0]?.name || null;
  }

  const degraded = resources.filter(r => r.status === "degraded");
  if (degraded.length > 0) {
    return degraded.sort((a, b) => a.score - b.score)[0]?.name || null;
  }

  return null;
}
