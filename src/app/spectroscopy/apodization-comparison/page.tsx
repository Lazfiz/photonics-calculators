"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


type WindowFn = "boxcar" | "hanning" | "hamming" | "blackman" | "blackman-harris" | "nuttall" | "gaussian" | "triangular" | "kaiser";

const windowDefs: Record<WindowFn, { label: string; color: string; sidelobeDb: number; bw: number }> = {
  boxcar: { label: "Boxcar", color: "#60a5fa", sidelobeDb: -13, bw: 1.0 },
  hanning: { label: "Hanning", color: "#34d399", sidelobeDb: -31, bw: 1.5 },
  hamming: { label: "Hamming", color: "#fbbf24", sidelobeDb: -42, bw: 1.36 },
  blackman: { label: "Blackman", color: "#f87171", sidelobeDb: -58, bw: 1.73 },
  "blackman-harris": { label: "Blackman-Harris", color: "#c084fc", sidelobeDb: -92, bw: 2.0 },
  nuttall: { label: "Nuttall", color: "#fb923c", sidelobeDb: -93, bw: 2.02 },
  gaussian: { label: "Gaussian", color: "#38bdf8", sidelobeDb: -55, bw: 1.64 },
  triangular: { label: "Triangular", color: "#a78bfa", sidelobeDb: -26, bw: 1.33 },
  kaiser: { label: "Kaiser (β=8)", color: "#f472b6", sidelobeDb: -58, bw: 1.77 },
};

function computeWindow(name: WindowFn, N: number): number[] {
  const x = Array.from({ length: N }, (_, i) => i - N / 2);
  switch (name) {
    case "boxcar": return x.map(() => 1);
    case "hanning": return x.map(xi => 0.5 * (1 + Math.cos(2 * Math.PI * xi / N)));
    case "hamming": return x.map(xi => 0.54 + 0.46 * Math.cos(2 * Math.PI * xi / N));
    case "blackman": return x.map(xi => 0.42 + 0.5 * Math.cos(2 * Math.PI * xi / N) + 0.08 * Math.cos(4 * Math.PI * xi / N));
    case "blackman-harris": return x.map(xi => 0.35875 + 0.48829 * Math.cos(2 * Math.PI * xi / N) + 0.14128 * Math.cos(4 * Math.PI * xi / N) + 0.01168 * Math.cos(6 * Math.PI * xi / N));
    case "nuttall": return x.map(xi => 0.355768 + 0.487396 * Math.cos(2 * Math.PI * xi / N) + 0.144232 * Math.cos(4 * Math.PI * xi / N) + 0.012604 * Math.cos(6 * Math.PI * xi / N));
    case "gaussian": return x.map(xi => Math.exp(-0.5 * Math.pow((2.5 * xi) / (N / 2), 2)));
    case "triangular": return x.map(xi => 1 - Math.abs(xi) / (N / 2));
    case "kaiser": {
      const beta = 8;
      const i0 = (x: number) => { let s = 1; for (let k = 1; k < 20; k++) s += Math.pow(x / 2, 2 * k) / (factorial(k) * factorial(k)); return s; };
      const a = i0(beta);
      return x.map(xi => i0(beta * Math.sqrt(1 - Math.pow(2 * xi / N, 2))) / a);
    }
  }
}

function factorial(n: number): number { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }

export default function ApodizationComparisonPage() {
  const [selected, setSelected] = useState<Set<WindowFn>>(new Set(["boxcar", "hanning", "blackman", "blackman-harris", "gaussian"]));
  const [nPoints, setNPoints] = useState(512);
  const [viewDb, setViewDb] = useState(-80);

  const toggle = (w: WindowFn) => {
    const s = new Set(selected);
    s.has(w) ? s.delete(w) : s.add(w);
    if (s.size > 0) setSelected(s);
  };

  const chartData = useMemo(() => {
    const N = nPoints;
    const x = Array.from({ length: N }, (_, i) => i - N / 2);

    // Compute ILS (|FT(window)|) in dB for each selected window
    const traces: any[] = [];
    for (const name of selected) {
      const win = computeWindow(name, N);
      // DFT of window
      const spectrum = Array.from({ length: N / 2 }, (_, k) => {
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
          const phase = (2 * Math.PI * k * n) / N;
          re += win[n] * Math.cos(phase);
          im -= win[n] * Math.sin(phase);
        }
        return Math.sqrt(re * re + im * im) / N;
      });
      const maxVal = Math.max(...spectrum);
      const inDb = spectrum.map(v => 20 * Math.log10(Math.max(v / maxVal, 1e-12)));

      const def = windowDefs[name];
      traces.push(
        { x, y: win, type: "scatter" as const, mode: "lines" as const, name: def.label + " (window)", line: { color: def.color, width: 1.5 } },
        { x: Array.from({ length: N / 2 }, (_, i) => i), y: inDb, type: "scatter" as const, mode: "lines" as const, name: def.label + " (ILS)", line: { color: def.color, dash: "dash" }, xaxis: "x2", yaxis: "y2" }
      );
    }
    return traces;
  }, [selected, nPoints]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Apodization Comparison" description="Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">N Points</span>
          <input type="number" value={nPoints} onChange={e => setNPoints(Math.max(16, +e.target.value))} min={16} max={2048} step={64} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">View Range (dB)</span>
          <input type="number" value={viewDb} onChange={e => setViewDb(+e.target.value)} min={-120} max={-10} step={-5} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.keys(windowDefs) as WindowFn[]).map(w => (
          <button key={w} onClick={() => toggle(w)}
            className={`px-3 py-1.5 rounded text-sm font-mono border ${selected.has(w) ? "border-blue-500 bg-blue-500/20 text-white" : "border-gray-700 bg-gray-900 text-gray-400"}`}>
            {windowDefs[w].label} ({windowDefs[w].sidelobeDb} dB)
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">ILS(f) = |FT&#123;w(t)&#125;|</span> — the instrument line shape determines peak shape.</p>
        <p>Lower sidelobe level → less ringing, but wider main lobe → lower resolution.</p>
        <p className="text-gray-500">Bandwidth factor: ratio of main lobe width to boxcar. Sidelobe dB: first sidelobe suppression.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 1, columns: 2, pattern: "independent" },
        xaxis: { title: "Sample Point", gridcolor: "#374151", domain: [0, 0.47] },
        yaxis: { title: "Amplitude", gridcolor: "#374151", range: [-0.1, 1.1] },
        xaxis2: { title: "Frequency Bin", gridcolor: "#374151", domain: [0.53, 1] },
        yaxis2: { title: "Magnitude (dB)", gridcolor: "#374151", range: [viewDb, 5] },
        height: 500, margin: { t: 30, b: 40 }, legend: { font: { size: 10 } },
      }} />
    </CalculatorShell>
  );
}
