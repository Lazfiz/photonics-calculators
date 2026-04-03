"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function LightFieldPage() {
  const [na, setNa] = useState(0.2);
  const [magnification, setMagnification] = useState(20);
  const [pixelSize, setPixelSize] = useState(6.5);
  const [microlensPitch, setMicrolensPitch] = useState(150);
  const [wavelength, setWavelength] = useState(550);

  const results = useMemo(() => {
    const lambda_um = wavelength * 1e-3;
    const resLateral = 0.61 * lambda_um / na;
    const resAngular = lambda_um / (2 * na * microlensPitch);
    const angularRange = na / magnification;
    const rayPixels = microlensPitch / (pixelSize * magnification);
    const depthOfField = lambda_um / (na * na);
    const syntheticApertureNA = na * Math.sqrt(rayPixels);
    const synthRes = 0.61 * lambda_um / syntheticApertureNA;

    const angles: number[] = [];
    const psfSizes: number[] = [];
    const anglesDeg: number[] = [];
    for (let a = -angularRange; a <= angularRange; a += angularRange / 100) {
      angles.push(a);
      anglesDeg.push(a * 180 / Math.PI);
      const blur = Math.abs(a) * (microlensPitch / na);
      psfSizes.push(blur);
    }

    return { resLateral, resAngular, angularRange, rayPixels, depthOfField, syntheticApertureNA, synthRes, angles, anglesDeg, psfSizes };
  }, [na, magnification, pixelSize, microlensPitch, wavelength]);

  const plotData = useMemo(() => [
    {
      x: results.anglesDeg, y: results.psfSizes.map(v => v * 1000),
      type: "scatter" as const, mode: "lines" as const,
      name: "Angular PSF spread", line: { color: "#60a5fa", width: 2 },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Angle (°)", gridcolor: "#374151" },
    yaxis: { title: "PSF Spread (nm)", gridcolor: "#374151" },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Light Field Microscopy</h1>
      <p className="text-gray-400 mb-8">Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <input type="number" step={0.01} min={0.05} max={1.8} value={na} onChange={e => setNa(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Magnification</label>
            <input type="number" step={1} min={1} max={200} value={magnification} onChange={e => setMagnification(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pixel Size (µm)</label>
            <input type="number" step={0.1} min={1} max={20} value={pixelSize} onChange={e => setPixelSize(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Microlens Pitch (µm)</label>
            <input type="number" step={10} min={50} max={500} value={microlensPitch} onChange={e => setMicrolensPitch(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} min={200} max={2000} value={wavelength} onChange={e => setWavelength(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Lateral Resolution</div>
              <div className="text-xl font-mono text-blue-400">{(results.resLateral * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Angular Resolution</div>
              <div className="text-xl font-mono text-green-400">{(results.resAngular * 1000).toFixed(2)} mrad</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Rays per Microlens</div>
              <div className="text-xl font-mono text-gray-300">{results.rayPixels.toFixed(1)} px</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Depth of Field</div>
              <div className="text-xl font-mono text-yellow-400">{results.depthOfField.toFixed(2)} µm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Synthetic Aperture NA</div>
              <div className="text-xl font-mono text-purple-400">{results.syntheticApertureNA.toFixed(3)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Synthetic Resolution</div>
              <div className="text-xl font-mono text-purple-400">{(results.synthRes * 1000).toFixed(1)} nm</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <Plot data={plotData} layout={darkLayout} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: 400 }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>r_lateral = 0.61 λ / NA</p>
          <p>Δθ = λ / (2 · NA · p_ML)</p>
          <p>θ_max = NA / M</p>
          <p>N_rays = p_ML / (p_pixel · M)</p>
          <p>DOF = λ / NA²</p>
          <p>NA_synth = NA · √N_rays</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>Light field microscopy captures both spatial and angular information by placing a microlens array at the native image plane. Each microlens samples a different spatial position while the pixels behind it encode angular rays.</p>
          <p>The spatial-angular tradeoff means increasing angular sampling (more rays per microlens) reduces spatial sampling and vice versa. Synthetic aperture techniques can recover resolution by computationally combining views.</p>
        </div>
      </div>
    </div>
  );
}
