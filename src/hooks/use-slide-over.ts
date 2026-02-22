/**
 * useSlideOver Hook
 *
 * Hook for opening slide-over panels using URL search params.
 * This enables linkable panel states and browser back button support.
 */

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type SlideOverPanel = "profile" | "settings" | "notifications" | "details";

interface SlideOverOptions {
  panel: SlideOverPanel;
  id?: string;
}

/**
 * Open a slide-over panel by updating URL search params
 */
export function useSlideOver() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openSlideOver = ({ panel, id }: SlideOverOptions) => {
    const params = new URLSearchParams(searchParams);
    params.set("panel", panel);
    if (id) {
      params.set("id", id);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeSlideOver = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("panel");
    params.delete("id");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isOpen = searchParams.has("panel");
  const panel = (searchParams.get("panel") as SlideOverPanel) || null;
  const panelId = searchParams.get("id") || null;

  return {
    isOpen,
    panel,
    panelId,
    openSlideOver,
    closeSlideOver,
  };
}
