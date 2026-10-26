"use client";

import React, { useEffect, useState } from "react";
import type { PlotParams } from "react-plotly.js";
import { PlotlyChart } from "./plotly-chart";
import { PLOTLY_TRACE_TYPES } from "./plotly-traces";
import ChartPlaceholder from "./chart-placeholder";

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
            data={data as PlotParams["data"]}
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

function needsPlotly(data: Record<string, unknown>[]): boolean {
  if (!data || data.length === 0) return false;
  // Only route to Plotly for truly complex chart types that SVG can't handle
  return data.some(t => PLOTLY_TRACE_TYPES.includes(t.type as string));
}

type SimpleChartType = typeof import("./simple-chart").default;
let loadedSimpleChart: SimpleChartType | null = null;

// SimpleChart loads after hydration, out of the initial JS; until then a placeholder of the chart's size holds its
// place (no layout shift). The server and the hydration render both draw the placeholder; a page reached by client
// navigation, with the chunk already loaded, draws the chart at once. A failed load throws into ChartErrorBoundary.
function LazySimpleChart(props: ChartPanelProps) {
  const [SimpleChart, setSimpleChart] = useState<SimpleChartType | null>(loadedSimpleChart);
  useEffect(() => {
    if (SimpleChart) return;
    import("./simple-chart").then(
      (m) => { loadedSimpleChart = m.default; setSimpleChart(() => m.default); },
      (error: unknown) => setSimpleChart(() => { throw error; }),
    );
  }, [SimpleChart]);
  return SimpleChart ? <SimpleChart {...props} /> : <ChartPlaceholder layout={props.layout} title={props.title} className={props.className} />;
}

export default function ChartPanel({ data, layout = {}, config = {}, title, className = "" }: ChartPanelProps) {
  if (needsPlotly(data)) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
        {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
        <PlotlyChart
          data={data as PlotParams["data"]}
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
      <LazySimpleChart data={data} layout={layout} config={config} title={title} className={className} />
    </ChartErrorBoundary>
  );
}
