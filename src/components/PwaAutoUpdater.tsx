import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function PwaAutoUpdater() {
  useEffect(() => {
    // In local dev, stale service workers can break route loading with old assets.
    if (import.meta.env.DEV) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
          .catch(() => undefined);
      }
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;

    const updateServiceWorker = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, nextRegistration) {
        registration = nextRegistration;
      },
      onNeedRefresh() {
        updateServiceWorker(true);
      },
      onOfflineReady() {
        // Assets are cached; no user-facing toast needed for now.
      },
    });

    const checkForUpdate = () => {
      registration?.update().catch(() => undefined);
    };

    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    checkForUpdate();

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}