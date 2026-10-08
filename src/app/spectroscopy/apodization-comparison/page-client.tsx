"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { WINDOWS, lineShapeDb, windowSamples, type WindowName } from "../../../physics/spectroscopy/apodization-comparison";

const colors: Record<WindowName, string> = {
  boxcar: "#60a5fa",
  hanning: "#34d399",
  hamming: "#fbbf24",
  blackman: "#f87171",
  "blackman-harris": "#c084fc",
  nuttall: "#fb923c",
  gaussian: "#38bdf8",
  triangular: "#a78bfa",
  kaiser: "#f472b6",
};

export default function ApodizationComparisonPage() {
  const [selected, setSelected] = useState<Set<WindowName>>(new Set(["boxcar", "hanning", "blackman", "blackman-harris", "gaussian"]));
  const [nPoints, setNPoints] = useURLState("nPoints", 512);
  const [viewDb, setViewDb] = useState(-120);

  const toggle = (w: WindowName) => {
    const s = new Set(selected);
    if (s.has(w)) s.delete(w);
    else s.add(w);
    if (s.size > 0) setSelected(s);
  };

  const chartData = useMemo(() => {
    const N = Math.round(nPoints);
    const x = Array.from({ length: N }, (_, i) => i - (N - 1) / 2);
    const traces: Record<string, unknown>[] = [];
    for (const name of selected) {
      const win = windowSamples(name, N);
      // 8× zero padding resolves the sidelobes (unpadded bins fall on the zeros of most windows).
      const ils = lineShapeDb(win, 8);
      const { label } = WINDOWS[name];
      traces.push(
        { x, y: win, type: "scatter", mode: "lines", name: `${label} (window)`, line: { color: colors[name], width: 1.5 } },
        { x: ils.bins, y: ils.db, type: "scatter", mode: "lines", name: `${label} (ILS)`, line: { color: colors[name], dash: "dash" }, xaxis: "x2", yaxis: "y2" },
      );
    }
    return traces;
  }, [selected, nPoints]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="N Points" value={nPoints} onChange={setNPoints} min={16} max={2048} step="1" />
        <ValidatedNumberInput label="View Range (dB)" value={viewDb} onChange={setViewDb} min={-200} max={-10} />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.keys(WINDOWS) as WindowName[]).map(w => (
          <button key={w} onClick={() => toggle(w)} aria-pressed={selected.has(w)}
            className={`px-3 py-1.5 rounded text-sm font-mono border ${selected.has(w) ? "border-blue-500 bg-blue-500/20 text-white" : "border-gray-700 bg-gray-900 text-gray-400"}`}>
            {WINDOWS[w].label} ({WINDOWS[w].sidelobeDb} dB, ENBW {WINDOWS[w].enbw.toFixed(2)})
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">ILS(f) = |FT&#123;w(t)&#125;|</span> — the instrument line shape determines peak shape.</p>
        <p>Lower sidelobe level → less ringing, but wider main lobe → lower resolution.</p>
        <p className="text-gray-500">On the buttons: the highest sidelobe (dB) and the equivalent noise bandwidth N·Σw²/(Σw)² in bins (boxcar = 1), measured from these windows at N = 512. Window definitions: Harris, Proc. IEEE 66, 51 (1978); Nuttall, IEEE Trans. ASSP 29, 84 (1981).</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 1, columns: 2, pattern: "independent" },
        xaxis: { title: "Sample Point", gridcolor: "#374151", domain: [0, 0.47] },
        yaxis: { title: "Amplitude", gridcolor: "#374151", range: [-0.1, 1.1] },
        xaxis2: { title: "Frequency Bin", gridcolor: "#374151", domain: [0.53, 1] },
        yaxis2: { title: "Magnitude (dB)", gridcolor: "#374151", range: [viewDb, 5] },
        height: 500, margin: { t: 30, b: 40 }, legend: { font: { size: 11 } },
      }} />
    </>
  );
}
