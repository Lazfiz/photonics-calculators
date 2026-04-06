"use client";

import React from "react";
import dynamic from "next/dynamic";
import { PlotlyChart } from "./plotly-chart";

interface ChartPanelProps {
  data: Record<string, unknown>[];
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  title?: string;
  className?: string;
}

// Error boundary to catch SimpleChart failures and fall back to Plotly
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; data: Record<string, unknown>[]; layout: Record<string, unknown>; config: Record<string, unknown>; title?: string; className?: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      const { data, layout, config, title, className } = this.props;
      return (
        <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className ?? ""}`.trim()}>
          {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
          <PlotlyChart
            data={data as any[]}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              margin: { t: 30, r: 20, b: 50, l: 60 },
              height: 400,
              ...layout,
            }}
            config={{ responsive: true, displayModeBar: false, ...config }}
            className="w-full"
          />
        </div>
      );
    }
    return this.props.children;
  }
}

function needsPlotly(data: Record<string, unknown>[], layout: Record<string, unknown>): boolean {
  if (!data || data.length === 0) return false;
  // Check layout for dual Y-axis
  if (layout.yaxis2) return true;
  return data.some(t => {
    const type = t.type as string | undefined;
    return type === "scatter3d" || type === "surface" || type === "heatmap" ||
           type === "contour" || type === "scatterpolar" || type === "scattergl" || type === "pie";
  });
}

// Lazy import SimpleChart so Plotly fallback can work
const SimpleChart = dynamic(() => import("./simple-chart").then(m => ({ default: m.default })), { ssr: false });

export default function ChartPanel({ data, layout = {}, config = {}, title, className = "" }: ChartPanelProps) {
  if (needsPlotly(data, layout)) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
        {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
        <PlotlyChart
          data={data as any[]}
          layout={{
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            margin: { t: 30, r: 20, b: 50, l: 60 },
            height: 400,
            ...layout,
          }}
          config={{ responsive: true, displayModeBar: false, ...config }}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <ChartErrorBoundary data={data} layout={layout} config={config} title={title} className={className}>
      <SimpleChart data={data} layout={layout} config={config} title={title} className={className} />
    </ChartErrorBoundary>
  );
}
