"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ConnectorReturnLossPage() {
  const [n1, setN1] = useState(1.4677); // SMF-28 core
  const [n2, setN2] = useState(1.0); // air gap
  const [gapNm, setGapNm] = useState(0); // nm gap
  const [angMisalign, setAngMisalign] = useState(0); // degrees
  const [lateralOffset, setLateralOffset] = useState(0); // µm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [coreRadius, setCoreRadius] = useState(4.1); // µm

  const chartData = useMemo(() => {
    const gaps = Array.from({ length: 200 }, (_, i) => i * 10000 / 200); // 0 to 10 µm
    const offsets = Array.from({ length: 200 }, (_, i) => i * 10 / 200); // 0 to 10 µm

    // Fresnel return loss vs gap (two interfaces)
    const rlGap = gaps.map(g => {
      const r = (n1 - n2) / (n1 + n2);
      const phase = (4 * Math.PI * n2 * g * 1000) / wavelength; // gap in µm → phase in nm
      // Effective reflectance with gap: r_eff = r * (1 - e^(i*phase))
      // Magnitude: |r_eff|² = r² * (1 - cos(phase))² + r² * sin²(phase) = 2*r²*(1 - cos(phase))
      const re = r * (1 - Math.cos(phase));
      const im = r * Math.sin(phase);
      return -20 * Math.log10(Math.sqrt(re * re + im * im));
    });

    // Lateral offset coupling loss
    const lossOffset = offsets.map(d => {
      const u = (2.405 * d) / coreRadius;
      // Gaussian approximation: η = exp(-(d/w)²) where w ≈ coreRadius
      return -10 * Math.log10(Math.exp(-2 * (d / coreRadius) ** 2));
    });

    // Angular misalignment coupling loss (small angle)
    const angles = Array.from({ length: 200 }, (_, i) => i * 5 / 200); // 0 to 5 degrees
    const lossAngle = angles.map(theta => {
      const thetaRad = (theta * Math.PI) / 180;
      const w = coreRadius; // mode field radius approximation
      return -10 * Math.log10(Math.exp(-(Math.PI * n1 * w * thetaRad * 1000 / wavelength) ** 2));
    });

    return [
      { x: gaps, y: rlGap, type: "scatter" as const, mode: "lines" as const, name: "Return loss vs gap", line: { color: "#f87171" } },
    ];
  }, [n1, n2, wavelength, coreRadius]);

  const rFresnel = (n1 - n2) / (n1 + n2);
  const rlFresnel = -20 * Math.log10(Math.abs(rFresnel));
  const insertionLossFresnel = -10 * Math.log10(1 - rFresnel * rFresnel);

  // Lateral offset loss
  const latLoss = -10 * Math.log10(Math.exp(-2 * (lateralOffset / coreRadius) ** 2));

  // Angular misalignment loss
  const thetaRad = (angMisalign * Math.PI) / 180;
  const angLoss = -10 * Math.log10(Math.exp(-(Math.PI * n1 * coreRadius * thetaRad * 1000 / wavelength) ** 2));

  // Gap phase
  const gapPhase = (4 * Math.PI * n2 * gapNm) / wavelength;
  const re = rFresnel * (1 - Math.cos(gapPhase));
  const im = rFresnel * Math.sin(gapPhase);
  const rEff = Math.sqrt(re * re + im * im);
  const rlGap = gapNm > 0 ? -20 * Math.log10(rEff) : rlFresnel;

  const totalIL = insertionLossFresnel * 2 + latLoss + angLoss;

  const offsetData = useMemo(() => {
    const offsets = Array.from({ length: 200 }, (_, i) => i * 10 / 200);
    return [{
      x: offsets, y: offsets.map(d => -10 * Math.log10(Math.exp(-2 * (d / coreRadius) ** 2))),
      type: "scatter" as const, mode: "lines" as const, name: "IL vs offset",
      line: { color: "#60a5fa" },
    }];
  }, [coreRadius]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Connector Return Loss</h1>
      <p className="text-gray-400 mb-8">
        Calculates return loss (RL) and insertion loss (IL) for fiber connectors with air gaps, lateral offsets, and angular misalignment.
        Fresnel: r = (n₁ − n₂)/(n₁ + n₂), RL = −20 log₁₀|r|. Physical contact (PC) eliminates air gap.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n<sub>core</sub></span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} step="0.0001" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>gap medium</sub></span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Gap (nm) — 0 for PC/UPC</span>
          <input type="number" value={gapNm} onChange={e => setGapNm(+e.target.value)} step="10" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Lateral offset (µm)</span>
          <input type="number" value={lateralOffset} onChange={e => setLateralOffset(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Angular misalign (°)</span>
          <input type="number" value={angMisalign} onChange={e => setAngMisalign(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">λ (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Core radius (µm)</span>
          <input type="number" value={coreRadius} onChange={e => setCoreRadius(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Fresnel RL = <span className="text-blue-400 font-mono">{rlFresnel.toFixed(2)} dB</span></p>
        <p className="text-gray-300">RL with gap = <span className="text-blue-400 font-mono">{rlGap.toFixed(2)} dB</span></p>
        <p className="text-gray-300">Fresnel IL (single surface) = <span className="text-yellow-400 font-mono">{insertionLossFresnel.toFixed(4)} dB</span></p>
        <p className="text-gray-300">Lateral offset IL = <span className="text-yellow-400 font-mono">{latLoss.toFixed(4)} dB</span></p>
        <p className="text-gray-300">Angular misalign IL = <span className="text-yellow-400 font-mono">{angLoss.toFixed(4)} dB</span></p>
        <p className="text-gray-300 font-semibold">Total connector IL ≈ <span className="text-green-400 font-mono">{totalIL.toFixed(4)} dB</span></p>
      </div>

      <h3 className="text-lg font-semibold mb-3 text-gray-200">Return Loss vs Gap Width</h3>
      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Gap (µm)", gridcolor: "#374151" },
        yaxis: { title: "Return Loss (dB)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
      }} className="w-full" style={{ height: 350 }} />

      <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-200">Insertion Loss vs Lateral Offset</h3>
      <Plot data={offsetData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Offset (µm)", gridcolor: "#374151" },
        yaxis: { title: "IL (dB)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
      }} className="w-full" style={{ height: 350 }} />
    </div>
  );
}
