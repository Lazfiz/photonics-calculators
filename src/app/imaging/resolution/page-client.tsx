"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
const media = [
  { label: "Air", n: 1.0 },
  { label: "Water", n: 1.33 },
  { label: "Oil", n: 1.52 },
  { label: "Custom", n: 0 },
];

export default function ResolutionPage() {
  const [na, setNa] = useState(0.95);
  const [wavelength, setWavelength] = useState(550);
  const [mediumIdx, setMediumIdx] = useState(2);
  const [customN, setCustomN] = useState(1.5);

  const n = mediumIdx === 3 ? customN : media[mediumIdx].n;

  const results = useMemo(() => {
    const lambda_m = wavelength * 1e-9;
    const abbe = lambda_m / (2 * na) * 1e9;
    const rayleigh = 0.61 * lambda_m / na * 1e9;
    return { abbe, rayleigh };
  }, [na, wavelength]);

  const plotData = useMemo(() => {
    const wavelengths = [400, 500, 550, 600, 700];
    const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#c084fc"];
    return wavelengths.map((wl, i) => {
      const nas = [];
      const abbeVals = [];
      const rayleighVals = [];
      for (let x = 0.1; x <= 1.5; x += 0.01) {
        nas.push(x);
        const lam = wl * 1e-9;
        abbeVals.push(lam / (2 * x) * 1e9);
        rayleighVals.push(0.61 * lam / x * 1e9);
      }
      return [
        { x: nas, y: abbeVals, type: "scatter" as const, mode: "lines" as const, name: `Abbe ${wl}nm`, line: { color: colors[i], dash: "solid" } },
        { x: nas, y: rayleighVals, type: "scatter" as const, mode: "lines" as const, name: `Rayleigh ${wl}nm`, line: { color: colors[i], dash: "dash" } },
      ];
    }).flat();
  }, []);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Resolution Calculator" description="Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numerical Aperture (NA)</label>
            <input type="number" step={0.01} min={0.01} max={1.8} value={na} onChange={e => setNa(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} min={200} max={2000} value={wavelength} onChange={e => setWavelength(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Immersion Medium</label>
            <select value={mediumIdx} onChange={e => setMediumIdx(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              {media.map((m, i) => <option key={i} value={i}>{m.label} (n={m.n || customN})</option>)}
            </select>
          </div>
          {mediumIdx === 3 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custom refractive index</label>
              <input type="number" step={0.01} min={1} max={2} value={customN} onChange={e => setCustomN(+e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          )}
          <p className="text-xs text-gray-500">Immersion medium sets n. NA must be ≤ n for valid results.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Refractive index (n)</span>
            <span className="font-mono text-white">{n.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Abbe resolution</span>
            <span className="font-mono text-blue-400">{results.abbe.toFixed(1)} nm</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Rayleigh resolution</span>
            <span className="font-mono text-green-400">{results.rayleigh.toFixed(1)} nm</span>
          </div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Abbe: d = λ / (2·NA)</p>
            <p>Rayleigh: d = 0.61·λ / NA</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Resolution vs NA (different wavelengths)</h2>
        <ChartPanel data={plotData}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#ccc" },
            xaxis: { title: "NA", gridcolor: "#333" },
            yaxis: { title: "Resolution (nm)", gridcolor: "#333" },
            legend: { font: { size: 10 }, orientation: "h", y: -0.25 },
            margin: { b: 120, l: 60, r: 20, t: 20 },
          }}
         
         
        />
      </div>
    </CalculatorShell>
  );
}
