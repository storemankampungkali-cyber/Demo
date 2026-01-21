
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastSystem.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

console.log("🚀 [System] NeonFlow Loading...");

const container = document.getElementById('root');

if (!container) {
  console.error("❌ [Fatal] Root element #root not found in DOM");
} else {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("✅ [System] NeonFlow Main Component Mounted");
  } catch (err) {
    console.error("❌ [Fatal] Render process failed:", err);
  }
}
