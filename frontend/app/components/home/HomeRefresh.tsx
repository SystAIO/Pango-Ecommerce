"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps other open storefront tabs in sync with the admin editor.
 *
 * When Admin → Customize Homepage saves successfully it writes a timestamp to
 * localStorage. `storage` events fire in every other tab of the same origin,
 * so those tabs re-fetch the server-rendered sections instead of showing the
 * old layout until somebody manually reloads.
 */
export default function HomeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "homepage-updated") router.refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  return null;
}
