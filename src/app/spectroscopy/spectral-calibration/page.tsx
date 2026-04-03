"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SpectralCalibrationPage() {
  const [pixelCount, setPixelCount] = useState(2048);
  const [centerWl, setCenterWl] = useState(600); // nm
  const [spectralWidth, setSpectralWidth] = useState(300); // nm total range
  const [lineWls, setLineWls] = useState("589.0,589.6,632.8,543.5,546.1");
  const [lineNames, setLineNames] = useState("Na D2,Na D1,HeNe,Green,Mercury");
  const [pixelNoise, setPixelNoise] = useState(0.5); // nm

  const chartData = useMemo(() => {
    const wls = lineWls.split(",").map(Number);
    const names = lineNames.split(",");
    const dispersion = spectralWidth / pixelCount; // nm/pixel

    // Map wavelength to pixel (linear)
    const wlToPixel = (wl: number) => ((wl - (centerWl - spectralWidth / 2)) / spectralWidth) * pixelCount;
    const pixelToWl = (px: number) => centerWl - spectralWidth / 2 + (px / pixelCount) * spectralWidth;

    // True positions + noise
    const truePixels = wls.map(wlToPixel);
    const measuredPixels = truePixels.map(p => p + pixelNoise * (Math.random() - 0.5) * 2);

    // Linear fit through measured points
    const n = measuredPixels.length;
    const sx = measuredPixels.reduce((a, b) => a + b, 0);
    const sy = wls.reduce((a, b) => a + b, 0);
    const sxx = measuredPixels.reduce((a, b) => a + b * b, 0);
    const sxy = measuredPixels.reduce((a, b, i) => a + measuredPixels[i] * wls[i], 0);
    const denom = n * sxx - sx * sx;
    const slope = (n * sxy - sx * sy) / denom;
    const intercept = (sy - slope * sx) / n;

    // Calibration curve
    const calPixels = Array.from({ length: 200 }, (_, i) => (i / 199) * pixelCount);
    const trueWls = calPixels.map(pixelToWl);
    const fittedWls = calPixels.map(p => slope * p + intercept);
    const residual = fittedWls.map((fw, i) => fw - trueWls[i]);

    return {
      lines: wls.map((wl, i) => ({
        x: [wlToPixel(wl), wlToPixel(wl)], y: [0, 1], type: "scatter" as const, mode: "lines" as const,
        name: names[i] || `Line ${i}`, line: { color: "#fbbf24", dash: "dash", width: 1 }, showlegend: false,
      })),
      calCurve: [
        { x: calPixels, y: trueWls, type: "scatter" as const, mode: "lines" as const, name: "True λ(pixel)", line: { color: "#60a5fa" } },
        { x: calPixels, y: fittedWls, type: "scatter" as const, mode: "lines" as const, name: "Linear Fit", line: { color: "#f87171", dash: "dot" } },
        { x: measuredPixels, y: wls, type: "scatter" as const, mode: "markers" as const, name: "Measured Lines", marker: { color: "#fbbf24", size: 10 } },
      ],
      residual: { x: calPixels, y: residual, type: "scatter" as const, mode: "lines" as const, name: "Residual (nm)", line: { color: "#34d399" } },
      slope, intercept, dispersion,
    };
  }, [pixelCount, centerWl, spectralWidth, lineWls, lineNames, pixelNoise]);

  const dispersionNm = spectralWidth / pixelCount;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Spectral Calibration</h1>
      <p className="text-gray-400 mb-8">Wavelength calibration using known emission lines and linear/polynomial fitting.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Pixel Count</span>
          <input type="number" value={pixelCount} onChange={e => setPixelCount(Math.max(64, +e.target.value))} min={64} step={256} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Center λ (nm)</span>
          <input type="number" value={centerWl} onChange={e => setCenterWl(+e.target.value)} min={100} step={50} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Spectral Width (nm)</span>
          <input type="number" value={spectralWidth} onChange={e => setSpectralWidth(Math.max(1, +e.target.value))} min={1} step={50} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Line Wavelengths (nm, comma)</span>
          <input type="text" value={lineWls} onChange={e => setLineWls(e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Line Names (comma)</span>
          <input type="text" value={lineNames} onChange={e => setLineNames(e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pixel Noise (nm)</span>
          <input type="number" value={pixelNoise} onChange={e => setPixelNoise(Math.max(0, +e.target.value))} min={0} step={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dispersion</p>
          <p className="text-xl font-bold text-blue-400">{dispersionNm.toFixed(4)} nm/px</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fit Slope</p>
          <p className="text-xl font-bold text-green-400">{chartData.slope.toFixed(6)} nm/px</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fit Intercept</p>
          <p className="text-xl font-bold text-yellow-400">{chartData.intercept.toFixed(2)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">λ = a·pixel + b</span> — linear calibration (first order).</p>
        <p><span className="text-green-400 font-mono">λ = a·pixel² + b·pixel + c</span> — quadratic for nonlinear dispersion.</p>
        <p>Use known atomic emission lines (Hg, Ne, Ar, Na) as reference wavelengths.</p>
      </div>

      <Plot data={[...chartData.calCurve]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pixel Number", gridcolor: "#374151" },
        yaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        height: 350, margin: { t: 30, b: 40 },
      }} config={{ responsive: true }} />

      <Plot data={[chartData.residual]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pixel Number", gridcolor: "#374151" },
        yaxis: { title: "Residual (nm)", gridcolor: "#374151" },
        height: 250, margin: { t: 20, b: 40 },
      }} config={{ responsive: true }} />
    </div>
  );
}
