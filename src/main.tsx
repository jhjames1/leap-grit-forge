import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// DEV/Preview safeguard: stale Service Worker caches can serve old Vite chunks,
// which often manifests as "Invalid hook call" / `useState` dispatcher null.
// We clear SW + caches BEFORE mounting React so LanguageProvider can render.
async function cleanupDevServiceWorker() {
  if (!import.meta.env.DEV) return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));

    // Clear only our app caches to avoid nuking unrelated origins' caches.
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith('leap-'))
        .map((n) => caches.delete(n))
    );
  } catch (e) {
    // Non-fatal
    console.warn('DEV SW cleanup failed', e);
  }
}

cleanupDevServiceWorker().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
