"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function WavefrontErrorPage() {
  const [wavelength, setWavelength] = useState(550);
  const [pvRms, setPvRms] = useState(0.25);
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [numZernike, setNumZernike] = useState(6);

  // Wavefront error in waves and nm
  const wfErrorWaves = pvRms;
  const wfErrorNm = pvRms * wavelengthNm;
  const wfErrorPv = pvRms * Math.sqrt(numZernike) * 2;

  // Marechal criterion: RMS < λ/14
  const marechalLimit = 1 / 14;
  const isDiffractionLimited = pvRms < marechalLimit;

  // Strehl ratio approximation
  const strehl = Math.exp(-(2 * Math.PI * pvRms) ** 2);

  // Encircled energy (approximate)
  const ee80 = 0.8 * (1 - pvRms * 2);

  const chartData = useMemo(() => {
    const rms = Array.from({ length: 100 }, (_, i) => i * 0.01);
    return [
      { x: rms, y: rms.map(r => Math.exp(-(2 * Math.PI * r) ** 2)), type: "scatter", mode: "lines", name: "Strehl Ratio", line: { color: "#34d399" } },
      { x: [pvRms], y: [strehl], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
      { x: [rms[0], rms[rms.length - 1]], y: [0.8, 0.8], type: "scatter", mode: "lines", name: "Maréchal (S=0.8)", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [pvRms, strehl]);

  const zernikeData = useMemo(() => {
    const terms = Array.from({ length: numZernike }, (_, i) => i + 1);
    return [
      { x: terms, y: terms.map(() => pvRms / Math.sqrt(numZernike)), type: "bar", name: "RMS per term", marker: { color: "#a78bfa" } },
    ];
  }, [pvRms, numZernike]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Wavefront Error Analysis</h1>
      <p className="text-gray-400 mb-8">Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Reference λ (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={300} max={2000"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">RMS Wavefront Error (λ)</span>
          <input type="number" value={pvRms} onChange={e => setPvRms(+e.target.value)} min={0} max={2} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Zernike Terms</span>
          <input type="number" value={numZernike} onChange={e => setNumZernike(+e.target.value)} min={1} max={36}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Status</span>
          <div className={`mt-1 px-3 py-2 rounded text-center font-bold ${isDiffractionLimited ? "bg-green-900 text-green-400 border border-green-700" : "bg-red-900 text-red-400 border border-red-700"}`}>
            {isDiffractionLimited ? "✓ Diffraction Limited" : "✗ Not Diff. Limited"}
          </div>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">RMS Error</p>
          <p className="text-2xl font-bold text-blue-400">{pvRms.toFixed(3)} λ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">RMS (nm)</p>
          <p className="text-2xl font-bold text-green-400">{wfErrorNm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strehl Ratio</p>
          <p className="text-2xl font-bold text-yellow-400">{strehl.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Est. PV (nm)</p>
          <p className="text-2xl font-bold text-purple-400">{wfErrorPv.toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-400 text-sm"><code className="text-yellow-400">S ≈ exp(-(2πσ)²)</code> where σ = RMS in waves</p>
        <p className="text-gray-400 text-sm"><code className="text-green-400">Maréchal criterion: σ &lt; λ/14 ≈ 0.071λ</code></p>
        <p className="text-gray-400 text-sm"><code className="text-purple-400">PV ≈ 2√N × RMS</code> (RMS to PV estimate)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "RMS Wavefront Error (λ)", gridcolor: "#374151" },
            yaxis: { title: "Strehl Ratio", gridcolor: "#374151", range: [0, 1.1] },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={zernikeData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Zernike Term", gridcolor: "#374151" },
            yaxis: { title: "RMS (λ)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
