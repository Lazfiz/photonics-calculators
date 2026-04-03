"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DigitalHolographyPage() {
  const [wavelengthNm, setWavelengthNm] = useState(532);
  const [pixelSizeUm, setPixelSizeUm] = useState(6.5);
  const [sensorWidth, setSensorWidth] = useState(2048);
  const [sensorHeight, setSensorHeight] = useState(2048);
  const [propagationDistanceMm, setPropagationDistanceMm] = useState(100);
  const [refractiveIndex, setRefractiveIndex] = useState(1.0);
  const [objectSizeUm, setObjectSizeUm] = useState(500);
  const [numericalAperture, setNumericalAperture] = useState(0.1);

  const lambda = wavelengthNm * 1e-9;
  const lambdaUm = wavelengthNm * 1e-3;
  const dx = pixelSizeUm * 1e-6;
  const z = propagationDistanceMm * 1e-3;
  const fresnelNumber = (objectSizeUm * 1e-6) ** 2 / (lambda * z);
  const maxAngle = Math.asin(Math.min(numericalAperture / refractiveIndex, 1));
  const lateralRes = lambdaUm / (2 * numericalAperture);
  const axialRes = lambdaUm / (numericalAperture ** 2);
  const fieldOfViewX = sensorWidth * pixelSizeUm;
  const fieldOfViewY = sensorHeight * pixelSizeUm;
  const samplingCriterion = lambdaUm / (2 * numericalAperture);
  const nyquistSatisfied = pixelSizeUm <= samplingCriterion;
  const reconstructionPixelPitch = (lambda * z) / (sensorWidth * dx) * 1e6; // µm

  const transferFunction = useMemo(() => {
    const freqs = Array.from({ length: 200 }, (_, i) => i * 0.5);
    const cutoffFreq = numericalAperture / lambdaUm;
    const tf = freqs.map(f => f <= cutoffFreq ? 1.0 : Math.exp(-((f - cutoffFreq) / (cutoffFreq * 0.1)) ** 2));
    return [{ x: freqs, y: tf, type: "scatter", mode: "lines" as const, name: "CTF", line: { color: "#60a5fa", width: 2 } }];
  }, [numericalAperture, lambdaUm]);

  const lateralResChart = useMemo(() => {
    const nas = Array.from({ length: 40 }, (_, i) => 0.02 + i * 0.02);
    const res = nas.map(na => lambdaUm / (2 * na));
    return [
      { x: nas, y: res, type: "scatter", mode: "lines" as const, name: "Lateral Res.", line: { color: "#34d399", width: 2 } },
      { x: [numericalAperture], y: [lateralRes], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [lambdaUm, numericalAperture, lateralRes]);

  const pixelPitchChart = useMemo(() => {
    const dists = Array.from({ length: 40 }, (_, i) => 10 + i * 10);
    const pitch = dists.map(d => (lambda * d * 1e-3) / (sensorWidth * dx) * 1e6);
    return [
      { x: dists, y: pitch, type: "scatter", mode: "lines" as const, name: "Recon. Pitch", line: { color: "#a78bfa", width: 2 } },
      { x: [propagationDistanceMm], y: [reconstructionPixelPitch], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [lambda, dx, sensorWidth, propagationDistanceMm, reconstructionPixelPitch]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Digital Holography</h1>
      <p className="text-gray-400 mb-6">Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{lateralRes.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Axial Resolution</p>
          <p className="text-2xl font-bold text-green-400">{axialRes.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fresnel Number</p>
          <p className="text-2xl font-bold text-yellow-400">{fresnelNumber.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nyquist Satisfied</p>
          <p className={`text-2xl font-bold ${nyquistSatisfied ? "text-green-400" : "text-red-400"}`}>{nyquistSatisfied ? "✓ Yes" : "✗ No"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={400} max={800} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pixel Size (µm)</span>
          <input type="number" value={pixelSizeUm} onChange={e => setPixelSizeUm(+e.target.value)} min={1} max={20} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Sensor Width (px)</span>
          <input type="number" value={sensorWidth} onChange={e => setSensorWidth(+e.target.value)} min={256} max={4096} step="256"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Sensor Height (px)</span>
          <input type="number" value={sensorHeight} onChange={e => setSensorHeight(+e.target.value)} min={256} max={4096} step="256"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Propagation Distance (mm)</span>
          <input type="number" value={propagationDistanceMm} onChange={e => setPropagationDistanceMm(+e.target.value)} min={1} max={1000} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Numerical Aperture</span>
          <input type="number" value={numericalAperture} onChange={e => setNumericalAperture(+e.target.value)} min={0.01} max={0.5} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} min={1} max={1.8} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Object Size (µm)</span>
          <input type="number" value={objectSizeUm} onChange={e => setObjectSizeUm(+e.target.value)} min={10} max={5000} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>U(x,y,z) = F⁻¹{ F{U(x,y,0)} · H(fx,fy;z) }</p>
          <p>H = exp(−jπλz(fx² + fy²)) — Transfer function</p>
          <p>N_F = a² / (λz) — Fresnel number</p>
          <p>Δx_lat = λ / (2NA),  Δz = λ / NA²</p>
          <p>Δp_recon = λz / (N·Δp_sensor)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Coherent Transfer Function</h3>
          <Plot data={transferFunction} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Spatial Freq (µm⁻¹)" }, yaxis: { title: "|CTF|" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Lateral Resolution vs NA</h3>
          <Plot data={lateralResChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "NA" }, yaxis: { title: "Resolution (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Reconstruction Pixel Pitch vs Distance</h3>
          <Plot data={pixelPitchChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Distance (mm)" }, yaxis: { title: "Pitch (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
