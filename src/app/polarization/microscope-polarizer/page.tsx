"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function MicroscopePolarizerPage() {
  const [na, setNA] = useState(0.95);
  const [wavelength, setWavelength] = useState(550);
  const [condenserNA, setCondenserNA] = useState(0.9);
  const [extinctionRatio, setExtinctionRatio] = useState(1000);
  const [analyzerDeg, setAnalyzerDeg] = useState(90);

  const analyzerRad = analyzerDeg * Math.PI / 180;

  // Polarization effects in microscope
  // Convergent light through high-NA objective creates angular spread
  const maxAngle = Math.asin(na);
  const maxAngleDeg = maxAngle * 180 / Math.PI;

  // Crossed polarizer transmission
  const crossTransmission = 1 / extinctionRatio;

  // Malus&apos;s law for partially polarized light
  const transmissionCrossed = 0.5 * (1 - 1 / extinctionRatio);
  const transmissionParallel = 0.5 * (1 + 1 / extinctionRatio);

  // Malus&apos;s law at analyzer angle
  const transmissionAngle = Math.cos(analyzerRad) ** 2;

  // Effective extinction in convergent beam (angular averaging)
  // High NA means light arrives at various angles, degrading extinction
  const angularDegradation = Math.sqrt(1 - (na / 1.5) ** 2) * 0.3 + 0.7;
  const effectiveExtinction = extinctionRatio * angularDegradation;

  // Birefringence detection sensitivity
  // Minimum detectable retardance
  const minRetardance = wavelength / (Math.PI * Math.sqrt(extinctionRatio));

  // Michel-Lévy interference color approximation
  const retToColor = (retNm: number) => {
    const order = retNm / 550;
    if (order < 0.18) return { r: 0, g: 0, b: 0 };
    if (order < 0.33) return { r: 100, g: 100, b: 200 };
    if (order < 0.5) return { r: 150, g: 200, b: 255 };
    if (order < 0.65) return { r: 255, g: 255, b: 200 };
    if (order < 0.8) return { r: 255, g: 200, b: 100 };
    if (order < 1.0) return { r: 255, g: 50, b: 50 };
    return { r: 100 + (order % 1) * 155, g: 100, b: 100 };
  };

  const intensityData = useMemo(() => {
    const angles = Array.from({ length: 360 }, (_, i) => (i / 360) * 180);
    const cross = angles.map(a => (Math.cos(a * Math.PI / 180)) ** 2);
    const partial = angles.map(a => 0.5 * (1 + Math.cos(a * Math.PI / 180) ** 2 / extinctionRatio));
    return [
      { x: angles, y: cross, type: "scatter" as const, mode: "lines" as const, name: "Malus (ideal)", line: { color: "#60a5fa", width: 2 } },
      { x: angles, y: partial, type: "scatter" as const, mode: "lines" as const, name: `ER=${extinctionRatio}:1`, line: { color: "#f87171", width: 2 } },
    ];
  }, [extinctionRatio]);

  const retData = useMemo(() => {
    const rets = Array.from({ length: 200 }, (_, i) => (i / 200) * 3000);
    const intensity = rets.map(r => Math.sin(Math.PI * r / wavelength) ** 2);
    return [
      { x: rets, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#4ade80", width: 2 } },
      { x: [550, 550], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "λ", line: { color: "#fbbf24", dash: "dash" } },
      { x: [1100, 1100], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "2λ", line: { color: "#fb923c", dash: "dash" } },
    ];
  }, [wavelength]);

  const naData = useMemo(() => {
    const nas = Array.from({ length: 100 }, (_, i) => 0.1 + (i / 100) * 1.3);
    const degradation = nas.map(n => Math.sqrt(1 - (n / 1.5) ** 2) * 0.3 + 0.7);
    const effExt = nas.map(n => extinctionRatio * (Math.sqrt(1 - (n / 1.5) ** 2) * 0.3 + 0.7));
    return [
      { x: nas, y: degradation, type: "scatter" as const, mode: "lines" as const, name: "Extinction factor", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: nas, y: effExt, type: "scatter" as const, mode: "lines" as const, name: "Effective ER", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
      { x: [na, na], y: [0, 1.1], type: "scatter" as const, mode: "lines" as const, name: "Current NA", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [na, extinctionRatio]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Microscope Polarizer Calculator" description="Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">T = cos²(θ) [Malus&apos;s law], T<sub>cross</sub> = 1/ER</p>
        <p className="text-gray-300 text-sm font-mono">I<sub>ret</sub>(Γ) = sin²(πΓ/λ) [retardance transmission]</p>
        <p className="text-gray-500 text-xs mt-1">High NA degrades extinction: convergent beams at oblique angles</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Objective NA</span>
          <input type="number" value={na} onChange={e => setNA(+e.target.value)} step="0.05" min="0.1" max="1.4"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="10" min="380" max="780"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Extinction Ratio</span>
          <input type="number" value={extinctionRatio} onChange={e => setExtinctionRatio(+e.target.value)} step="100" min="10" max="100000"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Condenser NA</span>
          <input type="number" value={condenserNA} onChange={e => setCondenserNA(+e.target.value)} step="0.05" min="0.1" max="1.4"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Analyzer Angle (°)</span>
          <input type="number" value={analyzerDeg} onChange={e => setAnalyzerDeg(+e.target.value)} min="0" max="180" step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNA(0.65); setCondenserNA(0.65); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">40× Dry</button>
        <button onClick={() => { setNA(1.3); setCondenserNA(1.2); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">100× Oil</button>
        <button onClick={() => { setAnalyzerDeg(90); }} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">Crossed</button>
        <button onClick={() => { setAnalyzerDeg(0); }} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">Parallel</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Collection Angle</p>
          <p className="text-2xl font-bold text-blue-400">{maxAngleDeg.toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Crossed Transmission</p>
          <p className="text-2xl font-bold text-red-400">{(transmissionCrossed * 100).toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective ER (with NA)</p>
          <p className="text-2xl font-bold text-yellow-400">{effectiveExtinction.toFixed(0)}:1</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Min Detectable Retardance</p>
          <p className="text-2xl font-bold text-green-400">{minRetardance.toFixed(1)} nm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Malus&apos;s Law (Analyzer Rotation)</h3>
          <ChartPanel data={intensityData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Analyzer Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Retardance Transmission (Crossed Pol)</h3>
          <ChartPanel data={retData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Retardance (nm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
      </div>

      <div className="mt-4 bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">NA Degradation of Extinction</h3>
        <ChartPanel data={naData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "NA", gridcolor: "#374151", range: [0, 1.5] },
          yaxis: { title: "Degradation Factor", gridcolor: "#374151", range: [0, 1.1] },
          yaxis2: { title: "Effective ER", gridcolor: "#374151", overlaying: "y", side: "right" },
          margin: { t: 20, r: 50, b: 50, l: 60 },
          showlegend: true,
          legend: { font: { color: "#9ca3af" } },
        }} />
      </div>
    </CalculatorShell>
  );
}
