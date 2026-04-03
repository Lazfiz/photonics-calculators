"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DeconvolutionPage() {
  const [method, setMethod] = useState<"richardson" | "wiener" | "blind" | "tikhonov">("richardson");
  const [na, setNa] = useState(1.4);
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [refractiveIndex, setRefractiveIndex] = useState(1.515);
  const [numIterations, setNumIterations] = useState(15);
  const [regularization, setRegularization] = useState(0.01);
  const [snrInput, setSnrInput] = useState(30);
  const [imageSize, setImageSize] = useState(512);
  const [numZSlices, setNumZSlices] = useState(30);

  const lateralRes = 0.61 * wavelengthNm / na;
  const axialRes = 2 * refractiveIndex * wavelengthNm / (na ** 2);
  const psfVolume = Math.round((lateralRes * 2 / 0.05) ** 2 * (axialRes * 2 / 0.05));

  // OTF cutoff
  const otfCutoff = 2 * na / wavelengthNm;

  // Simulate MTF curves
  const mtfData = useMemo(() => {
    const freq = Array.from({ length: 100 }, (_, i) => i * otfCutoff / 100);
    const otfIdeal = freq.map(f => f <= otfCutoff ? Math.sqrt(Math.max(0, 1 - (f / otfCutoff) ** 2)) : 0);
    const otfMeasured = otfIdeal.map((v, i) => v * Math.exp(-0.5 * (freq[i] / (otfCutoff * 0.7)) ** 2) + (1 / Math.pow(10, snrInput / 20)) * 0.3);
    const otfDeconv = otfIdeal.map((v, i) => {
      const w = method === "wiener" ? Math.max(regularization, (1 / snrInput ** 2)) :
                method === "tikhonov" ? regularization :
                method === "blind" ? 0.005 : 0;
      const h = otfMeasured[i];
      if (h < 0.001) return 0;
      return Math.min(1, v * h / (h ** 2 + w));
    });

    return [
      { x: freq, y: otfIdeal, type: "scatter", mode: "lines" as const, name: "Diffraction-Limited OTF", line: { color: "#34d399", width: 2 } },
      { x: freq, y: otfMeasured, type: "scatter", mode: "lines" as const, name: "Measured OTF", line: { color: "#fbbf24", width: 2 } },
      { x: freq, y: otfDeconv, type: "scatter", mode: "lines" as const, name: "Restored OTF", line: { color: "#f87171", width: 2, dash: "dash" } },
    ];
  }, [otfCutoff, snrInput, method, regularization]);

  // Convergence plot
  const convergenceData = useMemo(() => {
    const iters = Array.from({ length: 30 }, (_, i) => i + 1);
    const residual = iters.map(i => {
      const noise = 1 / Math.pow(10, snrInput / 20);
      return method === "richardson"
        ? noise * 0.3 + 0.7 * Math.exp(-0.15 * i) + 0.05 * (i > 10 ? (i - 10) * 0.02 : 0)
        : method === "wiener"
        ? noise * 0.2 + 0.8 * Math.exp(-0.3 * i)
        : method === "tikhonov"
        ? noise * 0.25 + 0.75 * Math.exp(-0.2 * i)
        : noise * 0.4 + 0.6 * Math.exp(-0.1 * i);
    });
    return [
      { x: iters, y: residual, type: "scatter", mode: "lines" as const, name: "Residual", line: { color: "#60a5fa", width: 2 } },
      { x: [numIterations], y: [residual[numIterations - 1] || 0], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [numIterations, snrInput, method]);

  // Resolution improvement
  const improvementFactor = method === "richardson" ? 1.6 : method === "wiener" ? 1.4 : method === "tikhonov" ? 1.3 : 1.5;
  const improvedLateral = lateralRes / improvementFactor;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Image Deconvolution</h1>
      <p className="text-gray-400 mb-6">Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{lateralRes.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">After Deconvolution</p>
          <p className="text-2xl font-bold text-green-400">{improvedLateral.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Improvement Factor</p>
          <p className="text-2xl font-bold text-yellow-400">{improvementFactor.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Method</p>
          <p className="text-xl font-bold text-purple-400">{method === "richardson" ? "RL" : method === "wiener" ? "Wiener" : method === "tikhonov" ? "Tikhonov" : "Blind"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Method</span>
          <select value={method} onChange={e => setMethod(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="richardson">Richardson-Lucy (Iterative)</option>
            <option value="wiener">Wiener Filter</option>
            <option value="tikhonov">Tikhonov (Regularized)</option>
            <option value="blind">Blind Deconvolution</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">NA</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.1} max={1.7} step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={400} max={800}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} min={1} max={1.8} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Iterations</span>
          <input type="number" value={numIterations} onChange={e => setNumIterations(+e.target.value)} min={1} max={100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Regularization Parameter</span>
          <input type="number" value={regularization} onChange={e => setRegularization(+e.target.value)} min={0.0001} max={1} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input SNR (dB)</span>
          <input type="number" value={snrInput} onChange={e => setSnrInput(+e.target.value)} min={1} max={60}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Image Size (px)</span>
          <input type="number" value={imageSize} onChange={e => setImageSize(+e.target.value)} min={64} max={4096} step={64}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Z-Slices</span>
          <input type="number" value={numZSlices} onChange={e => setNumZSlices(+e.target.value)} min={1} max={200}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">OTF / MTF Analysis</h3>
          <Plot data={mtfData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Spatial Frequency (cycles/nm)", gridcolor: "#374151" }, yaxis: { title: "MTF", gridcolor: "#374151", range: [0, 1.1] },
            margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 9 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Convergence (Residual vs Iterations)</h3>
          <Plot data={convergenceData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Iteration", gridcolor: "#374151" }, yaxis: { title: "Residual", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">PSF (Airy):</span> I(r) = [2J₁(πrNA/λ) / (πrNA/λ)]²</p>
          <p><span className="text-blue-400">Richardson-Lucy:</span> ôₙ₊₁ = ôₙ · (g / (h ⊗ ôₙ)) ⊗ h*</p>
          <p><span className="text-blue-400">Wiener:</span> Ô = (H* / (|H|² + Γ)) · G</p>
          <p><span className="text-blue-400">Tikhonov:</span> min‖H·o − g‖² + λ‖L·o‖²</p>
          <p><span className="text-blue-400">OTF cutoff:</span> f_c = 2NA / λ</p>
          <p><span className="text-blue-400">Noise amplification:</span> |1/H| → ∞ as |H| → 0</p>
        </div>
      </div>
    </div>
  );
}
