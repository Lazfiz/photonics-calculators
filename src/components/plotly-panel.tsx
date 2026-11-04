"use client";

import type { PlotParams } from "react-plotly.js";
import { PlotlyChart } from "./plotly-chart";
import { chartBoxClass } from "./chart-placeholder";

interface PlotlyPanelProps {
  data: Record<string, unknown>[];
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  title?: string;
  className?: string;
  bare?: boolean;
}

type GraphDiv = HTMLElement & { data: Record<string, unknown>[]; layout: Record<string, unknown> };

const stem = async (title?: string) => {
  const { fileStem } = await import("./chart-axes");
  return fileStem(title || `${location.pathname.split("/").filter(Boolean).pop() ?? ""}-chart`);
};

// Modebar icons in a 1000-unit box, SVG y down; inner subpaths run the other way round to cut holes.
const IMAGE_ICON = { width: 1000, height: 1000, path: "M100 200h800v600H100zM180 280v440h640V280zM240 660l160-200 120 140 80-80 160 140z" };
const TABLE_ICON = {
  width: 1000, height: 1000,
  path: "M100 150h800v700H100zM180 230v140h260V230zm340 0v140h300V230zM180 450v140h260V450zm340 0v140h300V450zM180 670v100h260V670zm340 0v100h300V670z",
};

/** "PNG" and "CSV" modebar buttons, the Plotly counterpart of the SVG charts' ChartActions. The code loads on click. */
function exportButtons(title?: string) {
  return [
    {
      name: "png", title: "Download chart as PNG image", icon: IMAGE_ICON,
      click: async (gd: GraphDiv) => {
        const [{ default: Plotly }, { downloadDataUrl, BACKGROUND }, fileName] = await Promise.all([
          import("./plotly-bundle"), import("./chart-export"), stem(title),
        ]);
        // The card's background behind a transparent chart, so the axis text stays readable in the file.
        const paper = gd.layout.paper_bgcolor;
        const layout = { ...gd.layout, paper_bgcolor: !paper || paper === "transparent" ? BACKGROUND : paper };
        const url = await Plotly.toImage({ data: gd.data, layout }, { format: "png", scale: 2, width: gd.clientWidth, height: gd.clientHeight });
        downloadDataUrl(url, `${fileName}.png`);
      },
    },
    {
      name: "csv", title: "Download chart data as CSV", icon: TABLE_ICON,
      click: async (gd: GraphDiv) => {
        const [{ plotlyCsv }, { downloadCsv }, fileName] = await Promise.all([import("./chart-axes"), import("./chart-export"), stem(title)]);
        downloadCsv(plotlyCsv(gd.data), `${fileName}.csv`);
      },
    },
  ];
}

/** A Plotly chart (heatmap, 3-D, polar) in the chart card, with the site's dark defaults and the export buttons. */
export default function PlotlyPanel({ data, layout = {}, config = {}, title, className = "", bare = false }: PlotlyPanelProps) {
  return (
    <div className={chartBoxClass(className, bare)}>
      {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
      <PlotlyChart
        data={data as PlotParams["data"]}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          margin: { t: 30, r: 20, b: 50, l: 60 },
          height: 400,
          modebar: { bgcolor: "rgba(0,0,0,0)", color: "#9ca3af", activecolor: "#f3f4f6" },
          ...layout,
        }}
        config={{ responsive: true, displaylogo: false, modeBarButtons: [exportButtons(title)], ...config }}
        className="w-full"
      />
    </div>
  );
}
