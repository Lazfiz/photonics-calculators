"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Reconstruction3DPage() {
  const [numSlices, setNumSlices] = useState(100);
  const [sliceSpacing, setSliceSpacing] = useState(0.5);
  const [xyResolution, setXyResolution] = useState(0.2);
  const [na, setNa] = useState(1.0);
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [refractiveIndex, setRefractiveIndex] = useState(1.33);
  const [method, setMethod] = useState<"widefield" | "confocal" | "lightsheet">("confocal");
  const [wobble, setWobble] = useState(1);
  const [numViews, setNumViews] = useState(1);

  const axialRes = (2 * refractiveIndex * wavelengthNm) / (na ** 2) * 1000; // nm
  const lateralRes = (0.61 * wavelengthNm) / na * 1000; // nm
  const totalHeight = numSlices * sliceSpacing;
  const voxelSize = (xyResolution * xyResolution * sliceSpacing).toFixed(4);
  const totalVoxels = Math.round((totalHeight / sliceSpacing) * (100 / xyResolution) ** 2);
  const volumeBytes = totalVoxels * 2; // 16-bit

  // Sectioning quality factor
  const sectioningFactor = method === "widefield" ? 1 : method === "confocal" ? 0.4 : 0.15;
  const effectiveAxial = axialRes * sectioningFactor;

  const resolutionVsNA = useMemo(() => {
    const nas = Array.from({ length: 50 }, (_, i) => 0.2 + i * 0.036);
    const lateral = nas.map(n => (0.61 * wavelengthNm) / n * 1000);
    const axial = nas.map(n => (2 * refractiveIndex * wavelengthNm) / (n ** 2) * 1000);
    return [
      { x: nas, y: lateral, type: "scatter", mode: "lines" as const, name: "Lateral", line: { color: "#60a5fa", width: 2 } },
      { x: nas, y: axial, type: "scatter", mode: "lines" as const, name: "Axial (Widefield)", line: { color: "#f87171", width: 2 } },
      { x: nas, y: axial.map(v => v * 0.4), type: "scatter", mode: "lines" as const, name: "Axial (Confocal)", line: { color: "#34d399", width: 2, dash: "dash" } },
      { x: [na], y: [lateralRes], type: "scatter", mode: "markers" as const, name: "Current Lat.", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [na, wavelengthNm, refractiveIndex, lateralRes]);

  const samplingChart = useMemo(() => {
    const spacings = Array.from({ length: 30 }, (_, i) => 0.1 + i * 0.1);
    const voxels = spacings.map(s => Math.round((totalHeight / s) * (100 / xyResolution) ** 2));
    return [{
      x: spacings, y: voxels.map(v => v / 1e6), type: "scatter", mode: "lines" as const,
      name: "Total Voxels (M)", line: { color: "#a78bfa", width: 2 },
    }, {
      x: [sliceSpacing], y: [totalVoxels / 1e6], type: "scatter", mode: "markers" as const,
      name: "Current", marker: { color: "#f87171", size: 12 },
    }];
  }, [sliceSpacing, xyResolution, totalHeight, totalVoxels]);

  const methodCompare = useMemo(() => {
    const methods = ["Widefield", "Confocal", "Light Sheet"];
    const axialVals = [axialRes, axialRes * 0.4, axialRes * 0.15];
    const lateralVals = [lateralRes, lateralRes * 0.8, lateralRes * 0.9];
    const phototox = [100, 60, 15];
    const speed = [1, 0.3, 2];
    return [
      { x: methods, y: axialVals, type: "bar" as const, name: "Axial (nm)", marker: { color: "#f87171" } },
      { x: methods, y: lateralVals, type: "bar" as const, name: "Lateral (nm)", marker: { color: "#60a5fa" } },
    ];
  }, [axialRes, lateralRes]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">3D Reconstruction Methods</h1>
      <p className="text-gray-400 mb-6">Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{lateralRes.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Axial Res.</p>
          <p className="text-2xl font-bold text-green-400">{effectiveAxial.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Voxels</p>
          <p className="text-2xl font-bold text-yellow-400">{(totalVoxels / 1e6).toFixed(1)}M</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Volume Size</p>
          <p className="text-2xl font-bold text-purple-400">{(volumeBytes / 1e6).toFixed(1)} MB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Z-Slices</span>
          <input type="number" value={numSlices} onChange={e => setNumSlices(+e.target.value)} min={10} max={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Z-Step (µm)</span>
          <input type="number" value={sliceSpacing} onChange={e => setSliceSpacing(+e.target.value)} min={0.05} max={10} step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">XY Resolution (µm)</span>
          <input type="number" value={xyResolution} onChange={e => setXyResolution(+e.target.value)} min={0.01} max={5} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Numerical Aperture</span>
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
          <span className="text-gray-300 text-sm">Method</span>
          <select value={method} onChange={e => setMethod(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="widefield">Widefield Deconvolution</option>
            <option value="confocal">Confocal</option>
            <option value="lightsheet">Light Sheet</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Views</span>
          <input type="number" value={numViews} onChange={e => setNumViews(+e.target.value)} min={1} max={6}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Resolution vs NA</h3>
          <Plot data={resolutionVsNA} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "NA", gridcolor: "#374151" }, yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 70 }, legend: { font: { size: 9 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Voxel Count vs Z-Step</h3>
          <Plot data={samplingChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Z-Step (µm)", gridcolor: "#374151" }, yaxis: { title: "Voxels (Millions)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Method Comparison</h3>
        <Plot data={methodCompare} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Method" }, yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 60 }, barmode: "group",
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Lateral (Abbe):</span> d_xy = 0.61λ / NA</p>
          <p><span className="text-blue-400">Axial (widefield):</span> d_z = 2nλ / NA²</p>
          <p><span className="text-blue-400">Axial (confocal):</span> d_z ≈ 0.4 × 2nλ / NA²</p>
          <p><span className="text-blue-400">Nyquist sampling:</span> Δz ≤ d_z / 2</p>
          <p><span className="text-blue-400">Volume size:</span> V = N_x × N_y × N_z × bytes/voxel</p>
          <p><span className="text-blue-400">Voxel aspect ratio:</span> AR = Δz / Δxy</p>
        </div>
      </div>
    </div>
  );
}
