"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SpectralUnmixingPage() {
  const [numEndmembers, setNumEndmembers] = useState(3);
  const [numBands, setNumBands] = useState(32);
  const [noiseLevel, setNoiseLevel] = useState(5);
  const [method, setMethod] = useState<"nnls" | "cls" | "vertex">("nnls");
  const [abundance1, setAbundance1] = useState(0.6);
  const [abundance2, setAbundance2] = useState(0.3);

  const abundance3 = Math.max(0, 1 - abundance1 - abundance2);
  const abundances = [abundance1, abundance2, abundance3, ...Array(6).fill(0)].slice(0, numEndmembers);
  const normalizedAbundances = abundances.map(a => a / abundances.reduce((s, v) => s + v, 0));

  // Simulate endmember spectra (Gaussian peaks at different wavelengths)
  const endmemberPeaks = [520, 580, 640, 700, 450, 750];
  const endmemberWidths = [25, 20, 30, 25, 20, 25];

  const spectralData = useMemo(() => {
    const wavelengths = Array.from({ length: numBands }, (_, i) => 400 + i * (320 / numBands));
    const traces: any[] = [];

    // Endmember spectra
    for (let e = 0; e < numEndmembers; e++) {
      const peak = endmemberPeaks[e];
      const width = endmemberWidths[e];
      const spectrum = wavelengths.map(w => Math.exp(-0.5 * ((w - peak) / width) ** 2));
      traces.push({
        x: wavelengths, y: spectrum, type: "scatter", mode: "lines" as const,
        name: `EM${e + 1} (${peak}nm)`,
        line: { color: ["#34d399", "#fbbf24", "#f87171", "#a78bfa", "#60a5fa", "#f472b6"][e], width: 2 },
      });
    }

    // Mixed spectrum
    const mixed = wavelengths.map((w, i) => {
      let val = 0;
      for (let e = 0; e < numEndmembers; e++) {
        val += normalizedAbundances[e] * Math.exp(-0.5 * ((w - endmemberPeaks[e]) / endmemberWidths[e]) ** 2);
      }
      return val + (noiseLevel / 100) * (Math.sin(i * 1.7) * 0.5 + 0.5);
    });
    traces.push({
      x: wavelengths, y: mixed, type: "scatter", mode: "lines" as const,
      name: "Observed Mix", line: { color: "#ffffff", width: 2, dash: "dash" },
    });

    return traces;
  }, [numEndmembers, numBands, noiseLevel, normalizedAbundances]);

  const abundanceData = useMemo(() => {
    const labels = normalizedAbundances.map((_, i) => `EM${i + 1}`);
    const colors = ["#34d399", "#fbbf24", "#f87171", "#a78bfa", "#60a5fa", "#f472b6"];
    // Simulate unmixing error
    const error = method === "nnls" ? 0.02 : method === "cls" ? 0.05 : 0.08;
    const unmixed = normalizedAbundances.map(a => Math.max(0, a + (Math.random() - 0.5) * error));
    const sum = unmixed.reduce((s, v) => s + v, 0);
    const final = unmixed.map(a => a / sum);

    return [{
      x: labels, y: final, type: "bar" as const,
      marker: { color: colors.slice(0, numEndmembers) },
      name: "Estimated Abundance",
    }, {
      x: labels, y: normalizedAbundances, type: "scatter", mode: "markers+lines" as const,
      name: "True Abundance", line: { color: "#ffffff", dash: "dot" },
      marker: { color: "#ffffff", size: 8 },
    }];
  }, [numEndmembers, normalizedAbundances, method]);

  const errorData = useMemo(() => {
    const noiseLevels = Array.from({ length: 20 }, (_, i) => i * 2.5);
    const errors = noiseLevels.map(n => {
      const base = method === "nnls" ? 0.5 : method === "cls" ? 1.2 : 2.5;
      return base + n * (method === "nnls" ? 0.08 : method === "cls" ? 0.15 : 0.25);
    });
    return [{
      x: noiseLevels, y: errors, type: "scatter", mode: "lines" as const,
      name: "Unmixing Error (%)", line: { color: "#60a5fa", width: 2 },
    }, {
      x: [noiseLevel], y: [method === "nnls" ? 0.5 + noiseLevel * 0.08 : method === "cls" ? 1.2 + noiseLevel * 0.15 : 2.5 + noiseLevel * 0.25],
      type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 },
    }];
  }, [noiseLevel, method]);

  const reconstructionError = method === "nnls" ? 0.5 + noiseLevel * 0.08 : method === "cls" ? 1.2 + noiseLevel * 0.15 : 2.5 + noiseLevel * 0.25;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Spectral Unmixing</h1>
      <p className="text-gray-400 mb-6">Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Endmembers</p>
          <p className="text-2xl font-bold text-blue-400">{numEndmembers}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Method</p>
          <p className="text-xl font-bold text-green-400">{method === "nnls" ? "NNLS" : method === "cls" ? "CLS" : "Vertex"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Recon. Error</p>
          <p className="text-2xl font-bold text-yellow-400">{reconstructionError.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Noise Level</p>
          <p className="text-2xl font-bold text-purple-400">{noiseLevel}%</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Endmembers</span>
          <input type="number" value={numEndmembers} onChange={e => setNumEndmembers(Math.max(2, Math.min(6, +e.target.value)))} min={2} max={6}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Spectral Bands</span>
          <input type="number" value={numBands} onChange={e => setNumBands(+e.target.value)} min={8} max={256}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Noise Level (%)</span>
          <input type="number" value={noiseLevel} onChange={e => setNoiseLevel(+e.target.value)} min={0} max={30}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Method</span>
          <select value={method} onChange={e => setMethod(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="nnls">NNLS (Non-negative Least Squares)</option>
            <option value="cls">CLS (Constrained Least Squares)</option>
            <option value="vertex">Vertex Component Analysis</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Abundance EM1 (fraction)</span>
          <input type="number" value={abundance1} onChange={e => setAbundance1(+e.target.value)} min={0} max={1} step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Abundance EM2 (fraction)</span>
          <input type="number" value={abundance2} onChange={e => setAbundance2(+e.target.value)} min={0} max={1} step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Abundance Fractions (Σ = 1)</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {normalizedAbundances.slice(0, numEndmembers).map((a, i) => (
            <div key={i} className="bg-gray-800 rounded p-3">
              <p className="text-xs text-gray-400">EM{i + 1} ({endmemberPeaks[i]}nm)</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div className="h-2 rounded-full" style={{ width: `${a * 100}%`, backgroundColor: ["#34d399", "#fbbf24", "#f87171", "#a78bfa", "#60a5fa", "#f472b6"][i] }} />
              </div>
              <p className="text-sm font-bold mt-1">{(a * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Endmember Spectra & Observed Mix</h3>
          <Plot data={spectralData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 9 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Estimated vs True Abundances</h3>
          <Plot data={abundanceData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Endmember" }, yaxis: { title: "Abundance (fraction)", gridcolor: "#374151", range: [0, 1] },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Error vs Noise Level</h3>
        <Plot data={errorData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Noise Level (%)", gridcolor: "#374151" }, yaxis: { title: "Unmixing Error (%)", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Linear mixing model:</span> r = E·a + n</p>
          <p><span className="text-blue-400">Constraints:</span> aᵢ ≥ 0, Σ aᵢ = 1 (sum-to-one, non-negativity)</p>
          <p><span className="text-blue-400">NNLS:</span> min‖r − E·a‖² s.t. aᵢ ≥ 0</p>
          <p><span className="text-blue-400">CLS:</span> â = (EᵀE)⁻¹Eᵀr with constraint projection</p>
          <p><span className="text-blue-400">Reconstruction error:</span> RMSE = √(Σ(rᵢ − r̂ᵢ)² / N)</p>
        </div>
      </div>
    </div>
  );
}
