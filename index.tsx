
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastSystem.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

console.log("🚀 NeonFlow Initializing...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ CRITICAL: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
            <App />
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("✅ NeonFlow Rendered Successfully");
} catch (error) {
  console.error("❌ NeonFlow Mounting Error:", error);
}
