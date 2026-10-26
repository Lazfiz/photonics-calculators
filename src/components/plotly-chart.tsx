import dynamic from "next/dynamic";

export const PlotlyChart = dynamic(
  async () => {
    const [{ default: createPlotlyComponent }, { default: Plotly }] = await Promise.all([
      import("react-plotly.js/factory"),
      import("./plotly-bundle"),
    ]);
    return createPlotlyComponent(Plotly);
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-900 border border-gray-800 rounded-lg">
        <span className="text-gray-500 text-sm animate-pulse">Loading visualizer…</span>
      </div>
    ),
  },
);
