import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Lightweight runtime diagnostics for "Invalid hook call" issues.
// Safe in prod; logs only in DEV.
function logReactDiagnostics() {
  if (!import.meta.env.DEV) return;
  try {
    // React version and devtools renderer count help detect multiple React copies.
    // eslint-disable-next-line no-console
    console.log('[react-diag] React.version =', (React as any).version);

    const hook = (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const renderers = hook?.renderers;
    const rendererCount =
      typeof renderers?.size === 'number'
        ? renderers.size
        : renderers
          ? Object.keys(renderers).length
          : 0;
    // eslint-disable-next-line no-console
    console.log('[react-diag] DevTools renderers =', rendererCount);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[react-diag] failed', e);
  }
}

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
  logReactDiagnostics();
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
