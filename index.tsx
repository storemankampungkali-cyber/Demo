import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastSystem.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

console.log("🚀 [System] NeonFlow Initializing Modules...");

const container = document.getElementById('root');

if (!container) {
  console.error("❌ [Fatal] Root element #root not found in DOM");
} else {
  try {
    // Hapus fallback loading statis jika ada
    const fallback = document.getElementById('js-check');
    if (fallback) fallback.remove();

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("✅ [System] NeonFlow Pipeline Active");
  } catch (err) {
    console.error("❌ [Fatal] Application failed to bootstrap:", err);
    // Tampilkan error ke layar jika gagal bootstrap
    container.innerHTML = `<div style="padding: 20px; color: #ff0080; font-family: monospace;">BOOTSTRAP_ERROR: ${err.message}</div>`;
  }
}