"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PlenopticCameraPage() {
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [mainLensFocalMm, setMainLensFocalMm] = useState(50);
  const [mainLensNA, setMainLensNA] = useState(0.2);
  const [microLensFocalMm, setMicroLensFocalMm] = useState(0.5);
  const [microLensPitchUm, setMicroLensPitchUm] = useState(150);
  const [pixelPitchUm, setPixelPitchUm] = useState(5.5);
  const [pixelsPerMicroLens, setPixelsPerMicroLens] = useState(15);
  const [sensorWidthPx, setSensorWidthPx] = useState(4000);
  const [sensorHeightPx, setSensorHeightPx] = useState(3000);

  const lambdaUm = wavelengthNm * 1e-3;
  const fNumber = 1 / (2 * mainLensNA);
  const angularRes = Math.atan(pixelPitchUm / (microLensFocalMm * 1000)) * 180 / Math.PI * 60; // arcmin
  const spatialRes = microLensPitchUm;
  const numMicroLensX = Math.floor(sensorWidthPx / pixelsPerMicroLens);
  const numMicroLensY = Math.floor(sensorHeightPx / pixelsPerMicroLens);
  const totalViews = pixelsPerMicroLens ** 2;
  const depthRange = 2 * mainLensFocalMm * microLensFocalMm / (microLensPitchUm / 1000); // mm (approx)
  const lightFieldSize = numMicroLensX * numMicroLensY * totalViews;
  const fileMBytes = lightFieldSize * 2 / 1e6;
  const refocusedRange = (microLensPitchUm * pixelsPerMicroLens / 2 / 1000) * mainLensFocalMm / microLensFocalMm; // mm approx

  const depthVsPitch = useMemo(() => {
    const pitches = Array.from({ length: 30 }, (_, i) => 50 + i * 10);
    const depths = pitches.map(p => 2 * mainLensFocalMm * (microLensFocalMm) / (p / 1000));
    return [
      { x: pitches, y: depths, type: "scatter", mode: "lines" as const, name: "Depth Range", line: { color: "#60a5fa", width: 2 } },
      { x: [microLensPitchUm], y: [depthRange], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [mainLensFocalMm, microLensFocalMm, microLensPitchUm, depthRange]);

  const viewsChart = useMemo(() => {
    const pml = Array.from({ length: 20 }, (_, i) => 5 + i * 2);
    const views = pml.map(p => p ** 2);
    const res = pml.map(p => microLensPitchUm); // spatial res stays same
    return [
      { x: pml, y: views, type: "scatter", mode: "lines" as const, name: "Total Views", line: { color: "#34d399", width: 2 }, yaxis: "y" },
      { x: [pixelsPerMicroLens], y: [totalViews], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 }, yaxis: "y" },
    ];
  }, [pixelsPerMicroLens, totalViews]);

  const tradeoffChart = useMemo(() => {
    const pml = Array.from({ length: 15 }, (_, i) => 5 + i * 3);
    const spatial = pml.map(() => spatialRes);
    const angular = pml.map(p => Math.atan(pixelPitchUm / (microLensFocalMm * 1000)) * 180 / Math.PI * 60 / p * p);
    return [
      { x: pml, y: pml.map(p => microLensPitchUm / p), type: "bar" as const, name: "Eff. Spatial (µm)", marker: { color: "#a78bfa" } },
    ];
  }, [microLensPitchUm, pixelPitchUm, microLensFocalMm]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Plenoptic Camera Design</h1>
      <p className="text-gray-400 mb-6">Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spatial Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{spatialRes} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Resolution</p>
          <p className="text-2xl font-bold text-green-400">{angularRes.toFixed(1)} arcmin</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Views</p>
          <p className="text-2xl font-bold text-yellow-400">{totalViews}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Light Field Data</p>
          <p className="text-2xl font-bold text-purple-400">{fileMBytes.toFixed(0)} MB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={400} max={800} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Main Lens f (mm)</span>
          <input type="number" value={mainLensFocalMm} onChange={e => setMainLensFocalMm(+e.target.value)} min={5} max={200} step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Main Lens NA</span>
          <input type="number" value={mainLensNA} onChange={e => setMainLensNA(+e.target.value)} min={0.05} max={0.5} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Micro-lens f (mm)</span>
          <input type="number" value={microLensFocalMm} onChange={e => setMicroLensFocalMm(+e.target.value)} min={0.1} max={5" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Micro-lens Pitch (µm)</span>
          <input type="number" value={microLensPitchUm} onChange={e => setMicroLensPitchUm(+e.target.value)} min={50} max={500} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pixels per Micro-lens</span>
          <input type="number" value={pixelsPerMicroLens} onChange={e => setPixelsPerMicroLens(+e.target.value)} min={3} max={30} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pixel Pitch (µm)</span>
          <input type="number" value={pixelPitchUm} onChange={e => setPixelPitchUm(+e.target.value)} min={1} max={15} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>L(u,v,s,t) — 4D light field parameterization</p>
          <p>Δθ = atan(Δp_pixel / f_µ) — Angular resolution</p>
          <p>Δx_spatial = p_µ — Spatial resolution (micro-lens pitch)</p>
          <p>Refocus: α·L(u,v,s + αu,t + αv) for virtual plane at 1/α</p>
          <p>Tradeoff: Δx · Δθ ≥ λ / D (diffraction limit)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Depth Range vs Micro-lens Pitch</h3>
          <Plot data={depthVsPitch} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Pitch (µm)" }, yaxis: { title: "Depth Range (mm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Views vs Pixels/Micro-lens</h3>
          <Plot data={viewsChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "px/µ-lens" }, yaxis: { title: "Total Views" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Spatial-Angular Tradeoff</h3>
          <Plot data={tradeoffChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "px/µ-lens" }, yaxis: { title: "Eff. Spatial Res. (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
