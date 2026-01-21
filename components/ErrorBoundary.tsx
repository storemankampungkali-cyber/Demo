
import React from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface Props {
  // Use optional children to prevent "missing children" errors in JSX instantiations
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Fix: Directly extend React.Component to ensure proper inheritance of state, props, and setState.
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Initialize state inherited from Component
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error and update state with error info for debugging display
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI for system failures
      return (
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 font-mono selection:bg-red-500/30">
          <div className="max-w-2xl w-full bg-dark-card border border-red-900/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden">
            {/* Background Glitch Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent opacity-50"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-600/10 rounded-full blur-[50px]"></div>

            <div className="flex items-center gap-4 mb-6 border-b border-red-900/30 pb-4">
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/20 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">CRITICAL_SYSTEM_FAILURE</h1>
                <p className="text-red-400 text-sm mt-0.5">Runtime execution interrupted.</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-black/50 border border-red-900/30 rounded-lg p-4 font-mono text-xs overflow-auto max-h-40 custom-scrollbar">
                <p className="text-red-500 font-bold mb-2">$ error_log --verbose</p>
                <p className="text-slate-300 whitespace-pre-wrap break-words">
                  {this.state.error && this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <p className="text-slate-500 mt-2 whitespace-pre-wrap break-words opacity-70">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                The application encountered an unexpected state. This incident has been logged locally.
                Please attempt a system reboot.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={this.handleReload}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30_rgba(220,38,38,0.6)]"
              >
                <RefreshCw className="w-5 h-5" />
                REBOOT SYSTEM
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 border border-slate-700 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
              >
                <Terminal className="w-5 h-5" />
                SAFE MODE
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
