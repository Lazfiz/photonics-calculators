"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function SpeckleImagingPage() {
  const [wavelengthNm, setWavelengthNm] = useState(532);
  const [beamDiameterMm, setBeamDiameterMm] = useState(5);
  const [surfaceRoughnessUm, setSurfaceRoughnessUm] = useState(1.0);
  const [propagationDistMm, setPropagationDistMm] = useState(200);
  const [apertureDiameterMm, setApertureDiameterMm] = useState(10);
  const [numAverages, setNumAverages] = useState(10);
  const [speckleContrast, setSpeckleContrast] = useState(1.0);
  const [scatteringParticles, setScatteringParticles] = useState(100);

  const lambda = wavelengthNm * 1e-9;
  const lambdaUm = wavelengthNm * 1e-3;
  const beamRad = beamDiameterMm * 1e-3 / 2;
  const z = propagationDistMm * 1e-3;
  const speckleSize = 1.22 * lambda * z / (beamDiameterMm * 1e-3) * 1e6; // µm
  const rayleighRange = Math.PI * beamRad ** 2 / lambda;
  const numSpeckles = (apertureDiameterMm / (speckleSize / 1000)) ** 2;
  const roughnessWaves = surfaceRoughnessUm / lambdaUm;
  const isFullyDeveloped = roughnessWaves > 1;
  const reducedContrast = numAverages > 0 ? speckleContrast / Math.sqrt(numAverages) : 1;
  const snrImprovement = Math.sqrt(numAverages);
  const decorrelationLength = lambdaUm / (2 * Math.sin(Math.atan(beamDiameterMm / (2 * propagationDistMm))));

  const speckleSizeChart = useMemo(() => {
    const dists = Array.from({ length: 40 }, (_, i) => 50 + i * 25);
    const sizes = dists.map(d => 1.22 * lambda * (d * 1e-3) / (beamDiameterMm * 1e-3) * 1e6);
    return [
      { x: dists, y: sizes, type: "scatter", mode: "lines" as const, name: "Speckle Size", line: { color: "#60a5fa", width: 2 } },
      { x: [propagationDistMm], y: [speckleSize], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [lambda, beamDiameterMm, propagationDistMm, speckleSize]);

  const contrastChart = useMemo(() => {
    const n = Array.from({ length: 30 }, (_, i) => 1 + i * 2);
    const contrast = n.map(num => speckleContrast / Math.sqrt(num));
    return [
      { x: n, y: contrast, type: "scatter", mode: "lines" as const, name: "C after averaging", line: { color: "#34d399", width: 2 } },
      { x: [numAverages], y: [reducedContrast], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [speckleContrast, numAverages, reducedContrast]);

  const beamSizeChart = useMemo(() => {
    const dists = Array.from({ length: 50 }, (_, i) => 0 + i * 20);
    const w = dists.map(d => {
      const zmm = d * 1e-3;
      return beamRad * 1e3 * Math.sqrt(1 + (zmm / rayleighRange) ** 2);
    });
    return [{ x: dists, y: w, type: "scatter", mode: "lines" as const, name: "Beam 1/e² radius (mm)", line: { color: "#a78bfa", width: 2 } }];
  }, [beamRad, rayleighRange]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Speckle Imaging" description="Speckle size, contrast, averaging strategies, and surface roughness effects.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Speckle Size</p>
          <p className="text-2xl font-bold text-blue-400">{speckleSize.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Roughness (waves)</p>
          <p className="text-2xl font-bold text-green-400">{roughnessWaves.toFixed(2)}λ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Contrast after Avg.</p>
          <p className="text-2xl font-bold text-yellow-400">{reducedContrast.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fully Developed</p>
          <p className={`text-2xl font-bold ${isFullyDeveloped ? "text-green-400" : "text-red-400"}`}>{isFullyDeveloped ? "✓ Yes" : "✗ No"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={400} max={800} step="10"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Beam Diameter (mm)</span>
          <input type="number" value={beamDiameterMm} onChange={e => setBeamDiameterMm(+e.target.value)} min={0.5} max={50} step="0.5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Surface Roughness (µm)</span>
          <input type="number" value={surfaceRoughnessUm} onChange={e => setSurfaceRoughnessUm(+e.target.value)} min={0.01} max={10} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Propagation Distance (mm)</span>
          <input type="number" value={propagationDistMm} onChange={e => setPropagationDistMm(+e.target.value)} min={10} max={2000} step="10"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Number of Averages</span>
          <input type="number" value={numAverages} onChange={e => setNumAverages(+e.target.value)} min={1} max={100} step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Aperture Diameter (mm)</span>
          <input type="number" value={apertureDiameterMm} onChange={e => setApertureDiameterMm(+e.target.value)} min={1} max={50} step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>d_s = 1.22 λz / D — Objective speckle size</p>
          <p>C = σ_I / ⟨I⟩ — Speckle contrast</p>
          <p>C_N = C / √N — Contrast after N averages</p>
          <p>σ_h &gt; λ → fully developed speckle</p>
          <p>z_R = πw₀² / λ — Rayleigh range</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Speckle Size vs Distance</h3>
          <ChartPanel data={speckleSizeChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Distance (mm)" }, yaxis: { title: "Speckle Size (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Contrast Reduction by Averaging</h3>
          <ChartPanel data={contrastChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "N Averages" }, yaxis: { title: "Contrast" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Beam Divergence</h3>
          <ChartPanel data={beamSizeChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Distance (mm)" }, yaxis: { title: "Beam Radius (mm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
