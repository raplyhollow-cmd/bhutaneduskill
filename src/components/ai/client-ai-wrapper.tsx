"use client";

import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant";

/**
 * Client-side wrapper for UnifiedAIAssistant
 *
 * This component exists solely to enable dynamic import with ssr: false
 * to prevent hydration mismatch errors.
 */
export function ClientAIWrapper() {
  return <UnifiedAIAssistant />;
}
