// Service worker registration + update detection.
// Pattern: registerType is 'prompt' in vite.config, so when a new build
// reaches the SW it goes to 'waiting' state and we fire onNeedRefresh.
// The user clicks the in-app banner → we tell the SW to skipWaiting → reload.

import { registerSW } from "virtual:pwa-register";

type UpdateHandlers = {
  onNeedRefresh: () => void;
  onOfflineReady: () => void;
};

let triggerUpdate: (() => Promise<void>) | null = null;
let swRegistration: ServiceWorkerRegistration | undefined;

export function registerServiceWorker(handlers: UpdateHandlers) {
  const updateSW = registerSW({
    onNeedRefresh() {
      handlers.onNeedRefresh();
    },
    onOfflineReady() {
      handlers.onOfflineReady();
    },
    onRegisteredSW(_swUrl, registration) {
      swRegistration = registration;
    },
  });
  triggerUpdate = async () => {
    await updateSW(true);
  };
}

export function applyUpdate() {
  if (triggerUpdate) triggerUpdate();
}

// Manually check the server for a newer service worker version.
// Returns: 'updated' if a new version was found (banner will appear),
//          'current' if already up to date,
//          'unavailable' if no service worker is registered (dev mode).
export async function checkForUpdate(): Promise<"updated" | "current" | "unavailable"> {
  if (!swRegistration) return "unavailable";
  const before = swRegistration.waiting;
  try {
    await swRegistration.update();
  } catch {
    return "current";
  }
  // Give the browser a moment to surface the new SW into 'waiting'.
  await new Promise((r) => setTimeout(r, 800));
  const after = swRegistration.waiting;
  if (after && after !== before) return "updated";
  return "current";
}
