"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function CGHPage() {
  const [wavelengthNm, setWavelengthNm] = useState(633);
  const [pixelPitchUm, setPixelPitchUm] = useState(8);
  const [slmWidth, setSlmWidth] = useState(1920);
  const [slmHeight, setSlmHeight] = useState(1080);
  const [reconstructionDistMm, setReconstructionDistMm] = useState(500);
  const [objectPoints, setObjectPoints] = useState(1000);
  const [bitDepth, setBitDepth] = useState(8);
  const [fillFactor, setFillFactor] = useState(0.9);
  const [diffractionEfficiency, setDiffractionEfficiency] = useState(0.4);

  const lambda = wavelengthNm * 1e-9;
  const lambdaUm = wavelengthNm * 1e-3;
  const dx = pixelPitchUm * 1e-6;
  const z = reconstructionDistMm * 1e-3;
  const numPixels = slmWidth * slmHeight;
  const memoryBytes = numPixels * (bitDepth / 8);
  const fovX = slmWidth * pixelPitchUm;
  const fovY = slmHeight * pixelPitchUm;
  const angularRes = lambdaUm / (slmWidth * pixelPitchUm) * 1e3; // mrad
  const maxDiffAngle = Math.asin(Math.min(lambda / (2 * dx), 1)) * 180 / Math.PI;
  const hologramBandwidth = 1 / pixelPitchUm; // µm⁻¹
  const zeroOrderEff = 1 - diffractionEfficiency;
  const reconPixelPitch = (lambda * z) / (slmWidth * dx) * 1e6;

  const fftComplexity = useMemo(() => {
    const sizes = [256, 512, 1024, 2048, 4096];
    const ops = sizes.map(n => n * n * Math.log2(n * n));
    return [{ x: sizes, y: ops.map(o => o / 1e6), type: "bar" as const, name: "FFT Ops (M)", marker: { color: "#60a5fa" } }];
  }, []);

  const efficiencyChart = useMemo(() => {
    const types = ["Binary Amplitude", "Binary Phase", "Kinoform", "Blazed Grating", "Multi-level (8)", "Ideal"];
    const effs = [0.101, 0.405, 1.0, 1.0, 0.95, 1.0];
    return [{ x: types, y: effs, type: "bar" as const, name: "Diff. Efficiency", marker: { color: effs.map(e => e > 0.9 ? "#34d399" : e > 0.3 ? "#fbbf24" : "#f87171") } }];
  }, []);

  const fovChart = useMemo(() => {
    const pitches = Array.from({ length: 30 }, (_, i) => 3 + i * 1);
    const fvs = pitches.map(p => slmWidth * p / 1000);
    return [
      { x: pitches, y: fvs, type: "scatter", mode: "lines" as const, name: "FOV Width", line: { color: "#a78bfa", width: 2 } },
      { x: [pixelPitchUm], y: [fovX / 1000], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [slmWidth, pixelPitchUm, fovX]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Computer-Generated Holography" description="CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Hologram Memory</p>
          <p className="text-2xl font-bold text-blue-400">{(memoryBytes / 1e6).toFixed(1)} MB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FOV (w × h)</p>
          <p className="text-2xl font-bold text-green-400">{(fovX).toFixed(0)}×{(fovY).toFixed(0)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Resolution</p>
          <p className="text-2xl font-bold text-yellow-400">{angularRes.toFixed(3)} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Diff. Angle</p>
          <p className="text-2xl font-bold text-purple-400">{maxDiffAngle.toFixed(1)}°</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={400} max={800} step="10" />
        <ValidatedNumberInput label="Pixel Pitch (µm)" value={pixelPitchUm} onChange={setPixelPitchUm} min={1} max={20} step="0.5" />
        <ValidatedNumberInput label="SLM Width (px)" value={slmWidth} onChange={setSlmWidth} min={256} max={4096} step="128" />
        <ValidatedNumberInput label="SLM Height (px)" value={slmHeight} onChange={setSlmHeight} min={256} max={4096} step="128" />
        <ValidatedNumberInput label="Reconstruction Distance (mm)" value={reconstructionDistMm} onChange={setReconstructionDistMm} min={10} max={5000} step="10" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bit Depth</span>
          <select value={bitDepth} onChange={e => setBitDepth(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={1}>1 (Binary)</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
          </select>
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>θ_max = arcsin(λ / 2Δx) — Maximum diffraction angle</p>
          <p>FOV = N · Δx — Field of view per axis</p>
          <p>Δθ = λ / (N · Δx) — Angular resolution</p>
          <p>η_binary_amp ≈ 10.1%, η_binary_phase ≈ 40.5%, η_kinoform ≈ 100%</p>
          <p>Memory = N_x · N_y · (bits / 8)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Diffraction Efficiency by Type</h3>
          <ChartPanel data={efficiencyChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, yaxis: { title: "Efficiency", range: [0, 1.1] }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">FOV vs Pixel Pitch</h3>
          <ChartPanel data={fovChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Pixel Pitch (µm)" }, yaxis: { title: "FOV Width (mm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">FFT Computational Cost</h3>
          <ChartPanel data={fftComplexity} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Array Size (px)" }, yaxis: { title: "Operations (M)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
