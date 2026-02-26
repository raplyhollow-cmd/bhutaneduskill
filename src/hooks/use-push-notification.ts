/**
 * USE PUSH NOTIFICATION HOOK
 *
 * Manages Web Push API subscription and notification requests.
 * Handles the complete flow:
 * - Requesting notification permission
 * - Subscribing to push notifications
 * - Managing subscription state
 * - Sending subscription to server
 *
 * @example
 * ```tsx
 * import { usePushNotification } from "@/hooks/use-push-notification";
 *
 * function MyComponent() {
 *   const {
 *     isSupported,
 *     permission,
 *     subscription,
 *     requestPermission,
 *     subscribe,
 *     unsubscribe,
 *   } = usePushNotification();
 *
 *   return (
 *     <button onClick={requestPermission}>Enable Notifications</button>
 *   );
 * }
 * ```
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export type NotificationPermission = "default" | "granted" | "denied";

export interface PushSubscriptionState {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UsePushNotificationOptions {
  /**
   * Automatically subscribe after permission granted
   * @default true
   */
  autoSubscribe?: boolean;
  /**
   * Application server key (VAPID public key)
   * If not provided, will fetch from /api/push/vapid-public-key
   */
  applicationServerKey?: string;
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
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Current notification permission state */
  permission: NotificationPermission;
  /** Current push subscription (if subscribed) */
  subscription: PushSubscription | null;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Request notification permission from user */
  requestPermission: () => Promise<NotificationPermission>;
  /** Subscribe to push notifications */
  subscribe: () => Promise<PushSubscription | null>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Check if user has an active subscription on server */
  checkServerSubscription: () => Promise<boolean>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert base64 string to Uint8Array
 * Required by the Push API for applicationServerKey
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
 * Fetch VAPID public key from server if not in environment
 */
async function getVapidPublicKey(): Promise<string> {
  if (VAPID_PUBLIC_KEY) {
    return VAPID_PUBLIC_KEY;
  }

  try {
    const response = await fetch("/api/push/vapid-public-key");
    if (!response.ok) {
      throw new Error("Failed to fetch VAPID public key");
    }
    const data = await response.json();
    return data.data?.publicKey || "";
  } catch (error) {
    console.error("Failed to fetch VAPID public key:", error);
    return "";
  }
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePushNotification(
  options: UsePushNotificationOptions = {}
): UsePushNotificationReturn {
  const {
    autoSubscribe = true,
    applicationServerKey,
    onSubscriptionChange,
    onPermissionChange,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission as NotificationPermission);

      // Get existing subscription
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
          onSubscriptionChange?.(sub);
        });
      });
    }
  }, [onSubscriptionChange]);

  // Listen for permission changes
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const handlePermissionChange = () => {
      const newPermission = Notification.permission as NotificationPermission;
      setPermission(newPermission);
      onPermissionChange?.(newPermission);
    };

    // Notification.permission is static, but we check on focus
    const handleFocus = () => {
      handlePermissionChange();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [onPermissionChange]);

  /**
   * Request notification permission from user
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return "denied";
    }

    if (permission === "granted") {
      return permission;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      onPermissionChange?.(result as NotificationPermission);

      // Auto-subscribe if permission granted
      if (result === "granted" && autoSubscribe) {
        await subscribe();
      }

      return result as NotificationPermission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to request permission";
      setError(errorMessage);
      return "denied";
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, autoSubscribe, subscribe, onPermissionChange]);

  /**
   * Subscribe to push notifications
   */
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) {
      setError("Push notifications are not supported");
      return null;
    }

    if (permission !== "granted") {
      setError("Notification permission not granted");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidKey = applicationServerKey || await getVapidPublicKey();

      if (!vapidKey) {
        throw new Error("VAPID public key not available");
      }

      // Convert base64 key to Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      setSubscription(pushSubscription);

      // Send subscription to server
      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(pushSubscription.getKey("auth")!),
        },
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
      };

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register subscription");
      }

      onSubscriptionChange?.(pushSubscription);

      return pushSubscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to subscribe";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, applicationServerKey, onSubscriptionChange]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      let currentSubscription = subscription;

      // Get current subscription if not in state
      if (!currentSubscription) {
        const registration = await navigator.serviceWorker.ready;
        currentSubscription = await registration.pushManager.getSubscription();
      }

      if (!currentSubscription) {
        setError("No active subscription to remove");
        setIsLoading(false);
        return false;
      }

      // Unsubscribe from server
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: currentSubscription.endpoint }),
      });

      // Unsubscribe from push service
      await currentSubscription.unsubscribe();

      setSubscription(null);
      onSubscriptionChange?.(null);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, onSubscriptionChange]);

  /**
   * Check if user has an active subscription on server
   */
  const checkServerSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/push/subscribe");
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return Array.isArray(data.data) && data.data.length > 0;
    } catch (err) {
      console.error("Failed to check server subscription:", err);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    requestPermission,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    checkServerSubscription,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;

  if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }

  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook that only returns subscription status (lightweight)
 * Useful for showing notification prompts without managing subscription
 */
export function usePushNotificationStatus() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission as NotificationPermission);

      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setHasSubscription(!!sub);
        });
      });
    }
  }, []);

  return {
    isSupported,
    permission,
    hasSubscription,
    canRequest: isSupported && permission === "default",
    isSubscribed: isSupported && permission === "granted" && hasSubscription,
  };
}

/**
 * Hook for one-click subscribe button
 * Automatically requests permission and subscribes
 */
export function useOneClickSubscribe() {
  const { isSupported, permission, subscribe, isLoading, error } = usePushNotification({
    autoSubscribe: true,
  });

  const canShowPrompt = isSupported && permission === "default";
  const isSubscribed = permission === "granted";
  const isDenied = permission === "denied";

  const handleSubscribe = async () => {
    if (permission === "default") {
      await Notification.requestPermission();
      if (Notification.permission === "granted") {
        await subscribe();
      }
    }
  };

  return {
    canShowPrompt,
    isSubscribed,
    isDenied,
    isLoading,
    error,
    handleSubscribe,
  };
}
