"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
function hermite(n: number, x: number): number {
  if (n === 0) return 1;
  if (n === 1) return 2 * x;
  let h0 = 1, h1 = 2 * x;
  for (let i = 2; i <= n; i++) {
    const h2 = 2 * x * h1 - 2 * (i - 1) * h0;
    h0 = h1;
    h1 = h2;
  }
  return h1;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export default function HermiteGaussianPage() {
  const [wavelength, setWavelength] = useState(1550); // nm
  const [waist, setWaist] = useState(50); // µm
  const [m, setM] = useState(0);
  const [n, setN] = useState(0);
  const [plotAxis, setPlotAxis] = useState<"x" | "y" | "both">("both");

  const w0 = waist; // µm
  const zR = Math.PI * w0 * w0 / wavelength; // mm (µm²/nm = mm)

  const chartData = useMemo(() => {
    const extent = w0 * 4;
    const N = 200;
    const xs = Array.from({ length: N }, (_, i) => -extent + (2 * extent * i) / (N - 1));
    const ys = Array.from({ length: N }, (_, i) => -extent + (2 * extent * i) / (N - 1));

    if (plotAxis === "x") {
      const profile = xs.map(x => {
        const u = Math.SQRT2 * x / w0;
        const norm = 1 / Math.sqrt(Math.pow(2, m) * factorial(m) * Math.sqrt(Math.PI)) / Math.pow(w0, 0.5);
        return norm * hermite(m, u) * Math.exp(-u * u / 2);
      });
      const intensity = profile.map(v => v * v);
      return [
        { x: xs, y: profile, type: "scatter" as const, mode: "lines" as const, name: `H${m}(x)·exp`, line: { color: "#60a5fa" } },
        { x: xs, y: intensity, type: "scatter" as const, mode: "lines" as const, name: `|u${m}|²`, line: { color: "#f87171" } },
      ];
    }

    if (plotAxis === "y") {
      const profile = ys.map(y => {
        const v = Math.SQRT2 * y / w0;
        const norm = 1 / Math.sqrt(Math.pow(2, n) * factorial(n) * Math.sqrt(Math.PI)) / Math.pow(w0, 0.5);
        return norm * hermite(n, v) * Math.exp(-v * v / 2);
      });
      const intensity = profile.map(v => v * v);
      return [
        { x: ys, y: profile, type: "scatter" as const, mode: "lines" as const, name: `H${n}(y)·exp`, line: { color: "#60a5fa" } },
        { x: ys, y: intensity, type: "scatter" as const, mode: "lines" as const, name: `|v${n}|²`, line: { color: "#f87171" } },
      ];
    }

    // 2D heatmap
    const z = [];
    for (let j = N - 1; j >= 0; j--) {
      const row: number[] = [];
      for (let i = 0; i < N; i++) {
        const u = Math.SQRT2 * xs[i] / w0;
        const v = Math.SQRT2 * ys[j] / w0;
        const norm = 1 / Math.sqrt(Math.pow(2, m + n) * factorial(m) * factorial(n) * Math.PI) / w0;
        const field = norm * hermite(m, u) * hermite(n, v) * Math.exp(-(u * u + v * v) / 2);
        row.push(field * field);
      }
      z.push(row);
    }
    return [
      { z, x: xs, y: ys, type: "heatmap" as const, colorscale: "Inferno", name: `TEM${m}${n}` },
    ];
  }, [wavelength, waist, m, n, plotAxis]);

  const orthogonality = m === n ? 1 : 0;

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Hermite-Gaussian Modes (TEMmn)" description="Rectangular higher-order Gaussian beam modes.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Waist w₀ (µm)" value={waist} onChange={setWaist} step="any" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Mode index m (0–5)" value={m} onChange={setM} min={0} max={5} />
        <ValidatedNumberInput label="Mode index n (0–5)" value={n} onChange={setN} min={0} max={5} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Plot</span>
          <select value={plotAxis} onChange={e => setPlotAxis(e.target.value as any)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="both">2D Intensity</option>
            <option value="x">X Profile</option>
            <option value="y">Y Profile</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Mode</p>
          <p className="text-xl font-bold text-blue-400">TEM<sub>{m}{n}</sub></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range</p>
          <p className="text-xl font-bold text-green-400">{zR.toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nodal lines (m + n)</p>
          <p className="text-xl font-bold text-orange-400">{m + n}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          u<sub>mn</sub>(x,y) = C · H<sub>{m}</sub>(√2·x/w₀) · H<sub>{n}</sub>(√2·y/w₀) · exp(−(x²+y²)/w₀²)
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          ...(plotAxis === "both"
            ? { xaxis: { title: "x (µm)", gridcolor: "#374151" }, yaxis: { title: "y (µm)", gridcolor: "#374151" } }
            : { xaxis: { title: plotAxis === "x" ? "x (µm)" : "y (µm)", gridcolor: "#374151" }, yaxis: { title: "Amplitude / Intensity", gridcolor: "#374151" } }),
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
