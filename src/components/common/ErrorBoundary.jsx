import React, { Component } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

const isChunkLoadError = (err) => {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("dynamically imported module")
  );
};

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled rendering error:", error, errorInfo);
    if (isChunkLoadError(error)) {
      const lastReload = parseInt(sessionStorage.getItem("last_chunk_reload") || "0", 10);
      const now = Date.now();
      if (now - lastReload > 10000) {
        sessionStorage.setItem("last_chunk_reload", now.toString());
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (isChunkLoadError(this.state.error)) {
        return (
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Updating to Latest Version</h2>
                <p className="text-xs text-slate-500 mt-1">
                  A newer version of this application was recently published. Refreshing components...
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reload Now
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Unable to load this section</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected interface error occurred while rendering this page. You can retry loading or return to the main dashboard.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <a
                href="/student/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
