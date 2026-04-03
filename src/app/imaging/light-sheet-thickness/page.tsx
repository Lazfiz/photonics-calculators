"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function LightSheetThicknessPage() {
  const [wavelength, setWavelength] = useState(488);
  const [na, setNa] = useState(0.1);
  const [sheetLength, setSheetLength] = useState(100);
  const [gaussianBeamWaist, setGaussianBeamWaist] = useState(0);

  // If gaussianBeamWaist is 0, compute from NA
  const beamWaist = gaussianBeamWaist > 0 ? gaussianBeamWaist : wavelength / (Math.PI * na);
  // Rayleigh range
  const zR = Math.PI * beamWaist * beamWaist / wavelength;
  // Sheet thickness (FWHM of Gaussian ~ 2.355 × waist for intensity, but commonly 2× waist)
  const sheetThickness = 2 * beamWaist * 1000; // µm
  const rayleighRangeUm = zR * 1000;

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.01 + i * 0.002);
    return [
      { x: nas, y: nas.map(n => 2 * (wavelength / (Math.PI * n)) * 1000), type: "scatter", mode: "lines", name: "Sheet Thickness", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => (Math.PI * Math.pow(wavelength / (Math.PI * n), 2) / wavelength) * 1000), type: "scatter", mode: "lines", name: "Rayleigh Range", line: { color: "#fbbf24", dash: "dash" } },
      { x: [na], y: [sheetThickness], type: "scatter", mode: "markers", name: "Current Thickness", marker: { color: "#34d399", size: 12 } },
    ];
  }, [wavelength, na, sheetThickness]);

  const profileData = useMemo(() => {
    const z = Array.from({ length: 200 }, (_, i) => (i - 100) * sheetLength / 100);
    return [
      { x: z, y: z.map(zz => Math.exp(-2 * zz * zz / (zR * zR))), type: "scatter", mode: "lines", name: "Intensity Profile", line: { color: "#a78bfa" } },
    ];
  }, [sheetLength, zR]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Light Sheet Thickness Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={350} max={800}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Cylinder NA</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.01} max={0.5} step="0.005"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Sheet Length (µm)</span>
          <input type="number" value={sheetLength} onChange={e => setSheetLength(+e.target.value)} min={10} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Beam Waist override (µm, 0=auto)</span>
          <input type="number" value={gaussianBeamWaist} onChange={e => setGaussianBeamWaist(+e.target.value)} min={0} max={50} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Waist (w₀)</p>
          <p className="text-2xl font-bold text-blue-400">{(beamWaist * 1000).toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sheet Thickness (2w₀)</p>
          <p className="text-2xl font-bold text-green-400">{sheetThickness.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range (z<sub>R</sub>)</p>
          <p className="text-2xl font-bold text-yellow-400">{rayleighRangeUm.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Aspect Ratio</p>
          <p className="text-2xl font-bold text-purple-400">{(2 * zR / beamWaist).toFixed(1)}:1</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-400 text-sm"><code className="text-blue-400">w₀ = λ / (π × NA)</code></p>
        <p className="text-gray-400 text-sm"><code className="text-yellow-400">z<sub>R</sub> = π w₀² / λ</code></p>
        <p className="text-gray-400 text-sm"><code className="text-green-400">Thickness = 2w₀</code> (Gaussian 1/e² beam diameter)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Cylinder NA", gridcolor: "#374151" },
            yaxis: { title: "Thickness (µm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={profileData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "z (µm)", gridcolor: "#374151" },
            yaxis: { title: "Normalized Intensity", gridcolor: "#374151", range: [0, 1.1] },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
