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

export function registerServiceWorker(handlers: UpdateHandlers) {
  const updateSW = registerSW({
    onNeedRefresh() {
      handlers.onNeedRefresh();
    },
    onOfflineReady() {
      handlers.onOfflineReady();
    },
  });
  triggerUpdate = async () => {
    await updateSW(true);
  };
}

export function applyUpdate() {
  if (triggerUpdate) triggerUpdate();
}
