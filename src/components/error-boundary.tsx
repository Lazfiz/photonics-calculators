"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-xl border border-red-800 bg-red-950/30 p-6 text-center">
          <p className="text-lg font-semibold text-red-300">Something went wrong</p>
          <p className="mt-2 text-sm text-red-200/70">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-lg border border-red-700 bg-red-900/40 px-4 py-2 text-sm text-red-200 transition hover:bg-red-900/60"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
