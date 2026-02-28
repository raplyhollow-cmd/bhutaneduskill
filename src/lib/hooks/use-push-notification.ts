/**
 * USE PUSH NOTIFICATION HOOK
 *
 * React hook for managing Web Push API subscriptions and notifications.
 * Handles permission requests, subscription management, and VAPID key configuration.
 *
 * @example
 * ```tsx
 * import { usePushNotification } from "@/lib/hooks/use-push-notification";
 *
 * function MyComponent() {
 *   const { permission, subscription, requestPermission, unsubscribe } = usePushNotification();
 *
 *   return (
 *     <button onClick={requestPermission}>
 *       Enable Push Notifications
 *     </button>
 *   );
 * }
 * ```
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UsePushNotificationOptions {
  /**
   * Auto-request permission on mount
   * @default false
   */
  autoRequest?: boolean;

  /**
   * Callback when subscription changes
   */
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;

  /**
   * Callback when permission changes
   */
  onPermissionChange?: (permission: NotificationPermission) => void;
}

export interface UsePushNotificationReturn {
  /** Current notification permission state */
  permission: NotificationPermission;

  /** Current push subscription (null if not subscribed) */
  subscription: PushSubscription | null;

  /** Whether we're currently requesting permission/subscribing */
  isLoading: boolean;

  /** Error message if something went wrong */
  error: string | null;

  /** Request notification permission and subscribe to push */
  requestPermission: () => Promise<boolean>;

  /** Subscribe to push notifications (requires permission) */
  subscribe: () => Promise<boolean>;

  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;

  /** Check if push is supported in this browser */
  isSupported: boolean;

  /** Refresh subscription status */
  refresh: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert URL-safe base64 to Uint8Array
 * Needed for VAPID key conversion
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if push notifications are supported
 */
function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get service worker registration
 */
async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    logger.error("Failed to get service worker registration", { error });
    return null;
  }
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePushNotification(
  options: UsePushNotificationOptions = {}
): UsePushNotificationReturn {
  const { autoRequest = false, onSubscriptionChange, onPermissionChange } = options;

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = isPushNotificationSupported();
  const hasAutoRequested = useRef(false);

  /**
   * Get current push subscription from service worker
   */
  const getCurrentSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) {
      return null;
    }

    try {
      const registration = await getSWRegistration();
      if (!registration) {
        return null;
      }

      const pushSubscription = await registration.pushManager.getSubscription();

      if (!pushSubscription) {
        setSubscription(null);
        onSubscriptionChange?.(null);
        return null;
      }

      // Convert to our format
      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: "",
          auth: "",
        },
      };

      // Extract keys
      const keys = pushSubscription.getKey("p256dh");
      const auth = pushSubscription.getKey("auth");

      if (keys && auth) {
        subscriptionData.keys.p256dh = btoa(String.fromCharCode(...Array.from(new Uint8Array(keys))));
        subscriptionData.keys.auth = btoa(String.fromCharCode(...Array.from(new Uint8Array(auth))));
      }

      setSubscription(subscriptionData);
      onSubscriptionChange?.(subscriptionData);
      return subscriptionData;
    } catch (err) {
      logger.error("Failed to get push subscription", { error: err });
      return null;
    }
  }, [isSupported, onSubscriptionChange]);

  /**
   * Check current notification permission
   */
  const checkPermission = useCallback(async () => {
    if (!isSupported) {
      setPermission("denied" as NotificationPermission);
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    onPermissionChange?.(currentPermission);
  }, [isSupported, onPermissionChange]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      onPermissionChange?.(result);

      if (result === "granted") {
        logger.info("Notification permission granted");
        return true;
      }

      if (result === "denied") {
        setError("Notification permission denied");
        return false;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to request permission";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, onPermissionChange]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check permission first
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          setError("Notification permission required");
          return false;
        }
      }

      const registration = await getSWRegistration();
      if (!registration) {
        setError("Service worker not available");
        return false;
      }

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("Push notification not configured");
        return false;
      }

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Extract subscription data
      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: "",
          auth: "",
        },
      };

      const keys = pushSubscription.getKey("p256dh");
      const auth = pushSubscription.getKey("auth");

      if (keys && auth) {
        subscriptionData.keys.p256dh = btoa(String.fromCharCode(...Array.from(new Uint8Array(keys))));
        subscriptionData.keys.auth = btoa(String.fromCharCode(...Array.from(new Uint8Array(auth))));
      }

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subscriptionData,
          userAgent: navigator.userAgent,
          deviceType: /Mobile|Tablet/.test(navigator.userAgent) ? "mobile" : "desktop",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setSubscription(subscriptionData);
      onSubscriptionChange?.(subscriptionData);

      logger.info("Push subscription successful", {
        endpoint: subscriptionData.endpoint.substring(0, 50) + "...",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to subscribe";
      setError(errorMessage);
      logger.error("Push subscription failed", { error: err });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, onSubscriptionChange, requestPermission]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await getSWRegistration();
      if (!registration) {
        return false;
      }

      const pushSubscription = await registration.pushManager.getSubscription();

      if (!pushSubscription) {
        setSubscription(null);
        onSubscriptionChange?.(null);
        return true;
      }

      // Unsubscribe from push service
      await pushSubscription.unsubscribe();

      // Notify server
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
      });

      setSubscription(null);
      onSubscriptionChange?.(null);

      logger.info("Push unsubscribe successful");

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, onSubscriptionChange]);

  /**
   * Refresh subscription status
   */
  const refresh = useCallback(async () => {
    await checkPermission();
    await getCurrentSubscription();
  }, [checkPermission, getCurrentSubscription]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    // Initial check
    checkPermission();
    getCurrentSubscription();

    // Listen for permission changes
    const handlePermissionChange = () => {
      checkPermission();
    };

    // Some browsers fire this event when permission changes
    if ("onpermissionchange" in Notification) {
      (Notification as unknown as EventTarget).addEventListener("permissionchange", handlePermissionChange);
    }

    return () => {
      if ("onpermissionchange" in Notification) {
        (Notification as unknown as EventTarget).removeEventListener("permissionchange", handlePermissionChange);
      }
    };
  }, [isSupported, checkPermission, getCurrentSubscription]);

  // Auto-request permission on mount if enabled
  useEffect(() => {
    if (autoRequest && isSupported && !hasAutoRequested.current) {
      hasAutoRequested.current = true;

      // Small delay to avoid blocking initial render
      setTimeout(() => {
        if (permission === "default") {
          requestPermission();
        } else if (permission === "granted") {
          subscribe();
        }
      }, 1000);
    }
  }, [autoRequest, isSupported, permission, requestPermission, subscribe]);

  return {
    permission,
    subscription,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    isSupported,
    refresh,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook that only checks if push is supported and permission status
 * Lightweight alternative to usePushNotification
 */
export function usePushNotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsSupported(isPushNotificationSupported());
    setPermission(Notification.permission);

    // Check subscription
    if (isPushNotificationSupported()) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    canRequest: isSupported && permission === "default",
    isDenied: permission === "denied",
    isGranted: permission === "granted",
  };
}
