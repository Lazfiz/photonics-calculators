"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function LowCoherencePage() {
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelengthNm", 1300);
  const [bandwidthNm, setBandwidthNm] = useURLState("bandwidthNm", 80);
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.4);
  const [scanRangeMm, setScanRangeMm] = useURLState("scanRangeMm", 2);
  const [mirrorSpeedMmPerS, setMirrorSpeedMmPerS] = useURLState("mirrorSpeedMmPerS", 50);
  const [numAScans, setNumAScans] = useURLState("numAScans", 500);
  const [referenceReflectivity, setReferenceReflectivity] = useURLState("referenceReflectivity", 0.9);
  const [sampleReflectivity, setSampleReflectivity] = useURLState("sampleReflectivity", 0.004);

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
    const carrier = opd.map(d => Math.cos(2 * Math.PI * d / (lambda0 * 1e3))); // OPD already includes n
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
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Low Coherence Interferometry" description="Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.">
            
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
        <ValidatedNumberInput label="Center Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={600} max={1600} step="10" />
        <ValidatedNumberInput label="Bandwidth (nm)" value={bandwidthNm} onChange={setBandwidthNm} min={5} max={300} step="5" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1} max={1.8} step="0.01" />
        <ValidatedNumberInput label="Scan Range (mm)" value={scanRangeMm} onChange={setScanRangeMm} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Mirror Speed (mm/s)" value={mirrorSpeedMmPerS} onChange={setMirrorSpeedMmPerS} min={1} max={200} step="1" />
        <ValidatedNumberInput label="A-scans per B-scan" value={numAScans} onChange={setNumAScans} min={50} max={2000} step="50" />
        <ValidatedNumberInput label="Reference Reflectivity" value={referenceReflectivity} onChange={setReferenceReflectivity} min={0.1} max={1} step="0.05" />
        <ValidatedNumberInput label="Sample Reflectivity" value={sampleReflectivity} onChange={setSampleReflectivity} min={0.0001} max={0.1} step="0.001" />
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
          <ChartPanel data={interferenceEnvelope} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "OPD (mm)" }, yaxis: { title: "Intensity" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Fringe Visibility vs Sample Reflectivity</h3>
          <ChartPanel data={reflectivityChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Sample Reflectivity (%)" }, yaxis: { title: "Visibility" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Axial Resolution vs Refractive Index</h3>
          <ChartPanel data={depthResChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Refractive Index" }, yaxis: { title: "Axial Res. (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
