"use client";

import React, { useEffect, useState } from "react";
import PlotlyPanel from "./plotly-panel";
import { PLOTLY_TRACE_TYPES } from "./plotly-traces";
import ChartPlaceholder from "./chart-placeholder";

interface ChartPanelProps {
  data: Record<string, unknown>[];
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  title?: string;
  className?: string;
  /** The page draws its own card (border, padding) around the chart: leave out the chart's. */
  bare?: boolean;
}

// Error boundary to catch SimpleChart failures and fall back to Plotly
class ChartErrorBoundary extends React.Component<
  ChartPanelProps & { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (this.state.hasError) return <PlotlyPanel {...this.props} />; // PlotlyPanel draws no children
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
  // The initializer form: useState(component) would call the component as a lazy initializer.
  const [SimpleChart, setSimpleChart] = useState<SimpleChartType | null>(() => loadedSimpleChart);
  useEffect(() => {
    if (SimpleChart) return;
    import("./simple-chart").then(
      (m) => { loadedSimpleChart = m.default; setSimpleChart(() => m.default); },
      (error: unknown) => setSimpleChart(() => { throw error; }),
    );
  }, [SimpleChart]);
  return SimpleChart ? <SimpleChart {...props} /> : <ChartPlaceholder layout={props.layout} title={props.title} className={props.className} bare={props.bare} />;
}

export default function ChartPanel(props: ChartPanelProps) {
  if (needsPlotly(props.data)) return <PlotlyPanel {...props} />;
  return (
    <ChartErrorBoundary {...props}>
      <LazySimpleChart {...props} />
    </ChartErrorBoundary>
  );
}
