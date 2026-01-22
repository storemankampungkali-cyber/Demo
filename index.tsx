import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastSystem.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

console.log("🚀 [System] Pipeline Inbound: Initializing Application...");

const container = document.getElementById('root');

if (!container) {
  throw new Error("Target container #root not found in document.");
}

try {
  const root = createRoot(container);
  
  // Render App
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );

  // Success indicator
  console.log("✅ [System] Core Handshake Successful");

} catch (err: any) {
  console.error("❌ [Fatal] Bootstrap Sequencer Failed:", err);
  container.innerHTML = `
    <div style="padding: 40px; color: #ff0080; font-family: monospace; background: #05070a; height: 100vh;">
      <h1 style="color: #ff0080;">BOOTSTRAP_CRASH</h1>
      <pre style="background: #1a1f2e; padding: 20px; border: 1px solid #ff0080;">${err.message}</pre>
    </div>
  `;
}