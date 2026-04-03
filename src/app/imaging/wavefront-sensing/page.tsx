"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function WavefrontSensingPage() {
  const [wavelengthNm, setWavelengthNm] = useState(632.8);
  const [apertureDiameterMm, setApertureDiameterMm] = useState(10);
  const [numZernikeTerms, setNumZernikeTerms] = useState(15);
  const [rmsWavefrontNm, setRmsWavefrontNm] = useState(100);
  const [numSubapertures, setNumSubapertures] = useState(64);
  const [detectorPixelSizeUm, setDetectorPixelSizeUm] = useState(5.5);
  const [focalLengthMm, setFocalLengthMm] = useState(100);
  const [sensingWavelengthNm, setSensingWavelengthNm] = useState(632.8);

  const lambda = wavelengthNm * 1e-9;
  const lambdaUm = wavelengthNm * 1e-3;
  const D = apertureDiameterMm * 1e-3;
  const rmsWaves = rmsWavefrontNm / wavelengthNm;
  const strehl = Math.exp(-(2 * Math.PI * rmsWaves) ** 2);
  const maréchalCrit = rmsWaves <= 1 / 14;
  const diffLimit = 1.22 * lambda / D * 1e6; // µm
  const subapDiam = D / Math.sqrt(numSubapertures) * 1e3; // mm
  const subapSampling = (subapDiam * 1e-3 / (lambdaUm * 1e-6 * focalLengthMm * 1e-3)) * detectorPixelSizeUm;
  const dynamicRange = Math.PI / (rmsWaves * 2 * Math.PI); // in waves
  const sensitivity = 2 * Math.PI * detectorPixelSizeUm * 1e-6 / (lambda * focalLengthMm * 1e-3); // rad sensitivity
  const zernikeFitError = rmsWavefrontNm / Math.sqrt(numZernikeTerms);

  const strehlChart = useMemo(() => {
    const rms = Array.from({ length: 40 }, (_, i) => i * 10);
    const s = rms.map(r => Math.exp(-(2 * Math.PI * r / wavelengthNm) ** 2));
    return [
      { x: rms, y: s, type: "scatter", mode: "lines" as const, name: "Strehl Ratio", line: { color: "#60a5fa", width: 2 } },
      { x: [rmsWavefrontNm], y: [strehl], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
      { x: [wavelengthNm / 14], y: [Math.exp(-(2 * Math.PI / 14) ** 2)], type: "scatter", mode: "markers" as const, name: "Maréchal", marker: { color: "#34d399", size: 12, symbol: "diamond" } },
    ];
  }, [wavelengthNm, rmsWavefrontNm, strehl]);

  const zernikeChart = useMemo(() => {
    const terms = Array.from({ length: 20 }, (_, i) => 3 + i * 3);
    const fitErr = terms.map(n => rmsWavefrontNm / Math.sqrt(n));
    return [
      { x: terms, y: fitErr, type: "scatter", mode: "lines" as const, name: "Fit Residual RMS", line: { color: "#a78bfa", width: 2 } },
      { x: [numZernikeTerms], y: [zernikeFitError], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [rmsWavefrontNm, numZernikeTerms, zernikeFitError]);

  const sensitivityChart = useMemo(() => {
    const fls = Array.from({ length: 30 }, (_, i) => 20 + i * 20);
    const sens = fls.map(f => 2 * Math.PI * detectorPixelSizeUm * 1e-6 / (lambda * f * 1e-3) * 1e6);
    return [
      { x: fls, y: sens, type: "scatter", mode: "lines" as const, name: "Sensitivity (µrad/px)", line: { color: "#34d399", width: 2 } },
      { x: [focalLengthMm], y: [sensitivity * 1e6], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [lambda, detectorPixelSizeUm, focalLengthMm]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Wavefront Sensing</h1>
      <p className="text-gray-400 mb-6">Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strehl Ratio</p>
          <p className="text-2xl font-bold text-blue-400">{strehl.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">RMS (waves)</p>
          <p className="text-2xl font-bold text-green-400">{rmsWaves.toFixed(3)}λ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Maréchal Criterion</p>
          <p className={`text-2xl font-bold ${maréchalCrit ? "text-green-400" : "text-red-400"}`}>{maréchalCrit ? "✓ Pass" : "✗ Fail"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Zernike Fit Error</p>
          <p className="text-2xl font-bold text-yellow-400">{zernikeFitError.toFixed(1)} nm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={400} max={800} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Aperture Diameter (mm)</span>
          <input type="number" value={apertureDiameterMm} onChange={e => setApertureDiameterMm(+e.target.value)} min={1} max={100} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">RMS Wavefront Error (nm)</span>
          <input type="number" value={rmsWavefrontNm} onChange={e => setRmsWavefrontNm(+e.target.value)} min={1} max={2000} step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Zernike Terms</span>
          <input type="number" value={numZernikeTerms} onChange={e => setNumZernikeTerms(+e.target.value)} min={3} max={65} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Sub-apertures</span>
          <input type="number" value={numSubapertures} onChange={e => setNumSubapertures(+e.target.value)} min={4} max={256} step="4"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Focal Length (mm)</span>
          <input type="number" value={focalLengthMm} onChange={e => setFocalLengthMm(+e.target.value)} min={10} max={500} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Detector Pixel (µm)</span>
          <input type="number" value={detectorPixelSizeUm} onChange={e => setDetectorPixelSizeUm(+e.target.value)} min={1} max={20} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>S = exp(−(2π σ_w/λ)²) — Strehl ratio (Maréchal approx.)</p>
          <p>σ_w ≤ λ/14 — Maréchal criterion (S ≥ 0.8)</p>
          <p>W(r,θ) = Σ a_n Z_n(r,θ) — Zernike decomposition</p>
          <p>Sensitivity ∝ p_det / (λ · f) — Angle per pixel</p>
          <p>σ_fit = σ_w / √N — Residual after Zernike fit</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Strehl Ratio vs RMS Error</h3>
          <Plot data={strehlChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "RMS Wavefront (nm)" }, yaxis: { title: "Strehl Ratio", range: [0, 1.05] }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Zernike Fit Residual</h3>
          <Plot data={zernikeChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Zernike Terms" }, yaxis: { title: "RMS Residual (nm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Sensitivity vs Focal Length</h3>
          <Plot data={sensitivityChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Focal Length (mm)" }, yaxis: { title: "Sensitivity (µrad/px)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
