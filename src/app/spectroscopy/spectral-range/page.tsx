"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SpectralRangePage() {
  const [grooveDensity, setGrooveDensity] = useState(1200); // l/mm
  const [order, setOrder] = useState(1);
  const [focalLength, setFocalLength] = useState(100); // mm
  const [detectorWidth, setDetectorWidth] = useState(25.6); // mm
  const [detectorPixels, setDetectorPixels] = useState(2048);
  const [centralAngle, setCentralAngle] = useState(10); // degrees (diffraction angle at center)

  const chartData = useMemo(() => {
    const d = 1e6 / grooveDensity; // μm
    const beta0 = (centralAngle * Math.PI) / 180;

    // Spectral range covered by detector
    // d(sinα + sinβ) = mλ, so Δλ ≈ (d·cosβ·Δβ) / m
    const pixelSize = detectorWidth / detectorPixels; // mm
    const totalAngle = Math.atan(detectorWidth / (2 * focalLength)) * 2; // rad
    const betaMin = beta0 - totalAngle / 2;
    const betaMax = beta0 + totalAngle / 2;

    // Use Littrow approximation for incident angle: α ≈ β₀
    const alpha = beta0;
    const wlMin = d * (Math.sin(alpha) + Math.sin(betaMin)) * 1000 / order; // nm
    const wlMax = d * (Math.sin(alpha) + Math.sin(betaMax)) * 1000 / order; // nm

    // Plot spectral coverage vs groove density
    const densities = Array.from({ length: 200 }, (_, i) => 50 + i * 15);
    const ranges = densities.map(gd => {
      const dd = 1e6 / gd;
      const wMin = dd * (Math.sin(alpha) + Math.sin(betaMin)) * 1000 / order;
      const wMax = dd * (Math.sin(alpha) + Math.sin(betaMax)) * 1000 / order;
      return wMax - wMin;
    });

    // Plot resolution vs order for this grating
    const orders = Array.from({ length: 10 }, (_, i) => i + 1);
    const resolutions = orders.map(o => {
      const illuminatedGrooves = detectorWidth * gd_mm() * 1000 / d; // approximate
      return o * illuminatedGrooves;
    });

    // Dispersion vs wavelength
    const wls = Array.from({ length: 200 }, (_, i) => (wlMin || 200) + ((wlMax || 800) - (wlMin || 200)) * (i / 199));
    const dispersion = wls.map(wl => {
      const beta = Math.asin((order * wl / 1000) / d - Math.sin(alpha));
      return (d * Math.cos(beta)) / (order * focalLength) * 1000; // nm/mm
    });

    return {
      rangeVsDensity: [
        { x: densities, y: ranges, type: "scatter" as const, mode: "lines" as const, name: "Spectral Range (nm)", line: { color: "#60a5fa" } },
        { x: [grooveDensity], y: [((wlMax || 0) - (wlMin || 0))], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
      ],
      dispersionVsWl: { x: wls, y: dispersion, type: "scatter" as const, mode: "lines" as const, name: "Dispersion (nm/mm)", line: { color: "#34d399" } },
      wlMin, wlMax,
    };
  }, [grooveDensity, order, focalLength, detectorWidth, detectorPixels, centralAngle]);

  function gd_mm() { return grooveDensity; }
  const d = 1e6 / grooveDensity;
  const beta0 = (centralAngle * Math.PI) / 180;
  const alpha = beta0;
  const totalAngle = Math.atan(detectorWidth / (2 * focalLength)) * 2;
  const wlMin = d * (Math.sin(alpha) + Math.sin(beta0 - totalAngle / 2)) * 1000 / order;
  const wlMax = d * (Math.sin(alpha) + Math.sin(beta0 + totalAngle / 2)) * 1000 / order;
  const spectralRange = Math.abs(wlMax - wlMin);
  const resolution = order * grooveDensity * detectorWidth / 10; // approximate R
  const pixelResolution = spectralRange / detectorPixels;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Spectral Range Calculator</h1>
      <p className="text-gray-400 mb-8">Spectral coverage, resolution, and dispersion for a grating-based spectrometer.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Groove Density (l/mm)</span>
          <input type="number" value={grooveDensity} onChange={e => setGrooveDensity(+e.target.value)} min={50} step={100} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Order</span>
          <input type="number" value={order} onChange={e => setOrder(Math.max(1, +e.target.value))} min={1} max={10} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Focal Length (mm)</span>
          <input type="number" value={focalLength} onChange={e => setFocalLength(+e.target.value)} min={10} step={10} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Detector Width (mm)</span>
          <input type="number" value={detectorWidth} onChange={e => setDetectorWidth(Math.max(0.1, +e.target.value))} min={0.1} step={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Detector Pixels</span>
          <input type="number" value={detectorPixels} onChange={e => setDetectorPixels(Math.max(64, +e.target.value))} min={64} step={256} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Central Diff. Angle (°)</span>
          <input type="number" value={centralAngle} onChange={e => setCentralAngle(+e.target.value)} min={1} max={80} step={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">λ Min</p>
          <p className="text-xl font-bold text-blue-400">{wlMin.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">λ Max</p>
          <p className="text-xl font-bold text-green-400">{wlMax.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Range</p>
          <p className="text-xl font-bold text-yellow-400">{spectralRange.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pixel Resolution</p>
          <p className="text-xl font-bold text-red-400">{pixelResolution.toFixed(3)} nm/px</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">Δλ = d·cos(β)·Δβ / m</span> — spectral range from angular coverage.</p>
        <p><span className="text-green-400 font-mono">R = m · N_grooves</span> — resolving power scales with order and illuminated grooves.</p>
        <p><span className="text-yellow-400 font-mono">FSR = λ / m</span> — free spectral range (limit before order overlap).</p>
        <p>Higher groove density → narrower range but higher dispersion & resolution.</p>
      </div>

      <Plot data={chartData.rangeVsDensity} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Groove Density (l/mm)", gridcolor: "#374151" },
        yaxis: { title: "Spectral Range (nm)", gridcolor: "#374151" },
        height: 400, margin: { t: 30, b: 40 },
      }} config={{ responsive: true }} />

      <Plot data={[chartData.dispersionVsWl]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Dispersion (nm/mm)", gridcolor: "#374151" },
        height: 300, margin: { t: 20, b: 40 },
      }} config={{ responsive: true }} />
    </div>
  );
}
