"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function LowCoherencePage() {
  const [wavelengthNm, setWavelengthNm] = useState(1300);
  const [bandwidthNm, setBandwidthNm] = useState(80);
  const [refractiveIndex, setRefractiveIndex] = useState(1.4);
  const [scanRangeMm, setScanRangeMm] = useState(2);
  const [mirrorSpeedMmPerS, setMirrorSpeedMmPerS] = useState(50);
  const [numAScans, setNumAScans] = useState(500);
  const [referenceReflectivity, setReferenceReflectivity] = useState(0.9);
  const [sampleReflectivity, setSampleReflectivity] = useState(0.004);

  const lambda0 = wavelengthNm * 1e-9;
  const dLambda = bandwidthNm * 1e-9;
  const coherenceLen = (2 * Math.LN2 / Math.PI) * (lambda0 ** 2) / dLambda * 1e3; // mm
  const axialRes = (2 * Math.LN2 / Math.PI) * (lambda0 ** 2) / dLambda / (2 * refractiveIndex) * 1e6; // µm
  const mirrorTravelTime = scanRangeMm / mirrorSpeedMmPerS; // s per A-scan
  const aScanRate = 1 / mirrorTravelTime;
  const bScanTime = numAScans * mirrorTravelTime;
  const fringeVisibility = (2 * Math.sqrt(referenceReflectivity * sampleReflectivity)) / (referenceReflectivity + sampleReflectivity);
  const opticalPathMatch = coherenceLen / 2; // max OPD for interference

  const interferenceEnvelope = useMemo(() => {
    const opd = Array.from({ length: 300 }, (_, i) => (i - 150) * 0.02); // mm
    const sigma = coherenceLen / (2 * Math.sqrt(2 * Math.LN2));
    const envelope = opd.map(d => Math.exp(-0.5 * (d / sigma) ** 2));
    const carrier = opd.map(d => Math.cos(2 * Math.PI * d / (lambda0 * 1e3) * refractiveIndex));
    const signal = opd.map((d, i) => envelope[i] * carrier[i] * fringeVisibility);
    return [
      { x: opd, y: envelope, type: "scatter", mode: "lines" as const, name: "Envelope", line: { color: "#60a5fa", width: 1, dash: "dash" } },
      { x: opd, y: signal, type: "scatter", mode: "lines" as const, name: "Interferogram", line: { color: "#34d399", width: 1 } },
    ];
  }, [wavelengthNm, coherenceLen, fringeVisibility, refractiveIndex]);

  const depthResChart = useMemo(() => {
    const nVals = Array.from({ length: 30 }, (_, i) => 1 + i * 0.03);
    const res = nVals.map(n => (2 * Math.LN2 / Math.PI) * (lambda0 ** 2) / dLambda / (2 * n) * 1e6);
    return [
      { x: nVals, y: res, type: "scatter", mode: "lines" as const, name: "Axial Resolution", line: { color: "#f87171", width: 2 } },
      { x: [refractiveIndex], y: [axialRes], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [lambda0, dLambda, refractiveIndex, axialRes]);

  const reflectivityChart = useMemo(() => {
    const sR = Array.from({ length: 40 }, (_, i) => 0.001 + i * 0.003);
    const vis = sR.map(r => (2 * Math.sqrt(referenceReflectivity * r)) / (referenceReflectivity + r));
    return [
      { x: sR.map(r => r * 100), y: vis, type: "scatter", mode: "lines" as const, name: "Fringe Visibility", line: { color: "#a78bfa", width: 2 } },
      { x: [sampleReflectivity * 100], y: [fringeVisibility], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [referenceReflectivity, sampleReflectivity, fringeVisibility]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Low Coherence Interferometry</h1>
      <p className="text-gray-400 mb-6">Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coherence Length</p>
          <p className="text-2xl font-bold text-blue-400">{coherenceLen.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Axial Resolution</p>
          <p className="text-2xl font-bold text-green-400">{axialRes.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fringe Visibility</p>
          <p className="text-2xl font-bold text-yellow-400">{fringeVisibility.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">B-scan Time</p>
          <p className="text-2xl font-bold text-purple-400">{(bScanTime * 1000).toFixed(1)} ms</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Center Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={600} max={1600} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bandwidth (nm)</span>
          <input type="number" value={bandwidthNm} onChange={e => setBandwidthNm(+e.target.value)} min={5} max={300} step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} min={1} max={1.8} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Scan Range (mm)</span>
          <input type="number" value={scanRangeMm} onChange={e => setScanRangeMm(+e.target.value)} min={0.1} max={10} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Mirror Speed (mm/s)</span>
          <input type="number" value={mirrorSpeedMmPerS} onChange={e => setMirrorSpeedMmPerS(+e.target.value)} min={1} max={200} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">A-scans per B-scan</span>
          <input type="number" value={numAScans} onChange={e => setNumAScans(+e.target.value)} min={50} max={2000} step="50"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Reference Reflectivity</span>
          <input type="number" value={referenceReflectivity} onChange={e => setReferenceReflectivity(+e.target.value)} min={0.1} max={1} step="0.05"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Sample Reflectivity</span>
          <input type="number" value={sampleReflectivity} onChange={e => setSampleReflectivity(+e.target.value)} min={0.0001} max={0.1} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>I(Δ) = I_r + I_s + 2√(I_r · I_s) · |γ(Δ)| · cos(2πΔ/λ)</p>
          <p>|γ(Δ)| = exp(−(Δ/l_c)²) — Gaussian envelope</p>
          <p>V = 2√(R_r · R_s) / (R_r + R_s) — Fringe visibility</p>
          <p>Δz = l_c / (2n) — Axial resolution in sample</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Interferogram & Envelope</h3>
          <Plot data={interferenceEnvelope} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "OPD (mm)" }, yaxis: { title: "Intensity" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Fringe Visibility vs Sample Reflectivity</h3>
          <Plot data={reflectivityChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Sample Reflectivity (%)" }, yaxis: { title: "Visibility" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Axial Resolution vs Refractive Index</h3>
          <Plot data={depthResChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Refractive Index" }, yaxis: { title: "Axial Res. (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} config={{ displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
