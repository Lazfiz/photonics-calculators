"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ChartPanelProps {
  data: any[];
  layout?: Record<string, any>;
  config?: Record<string, any>;
  title?: string;
  className?: string;
}

export default function ChartPanel({ data, layout = {}, config = {}, title, className = "" }: ChartPanelProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`.trim()}>
      {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
      <Plot
        data={data}
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
