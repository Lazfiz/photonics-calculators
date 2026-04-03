"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DifferenceFrequencyPage() {
  const [lambdaPump, setLambdaPump] = useState(1064); // nm
  const [lambdaSignal, setLambdaSignal] = useState(1550); // nm
  const [deff, setDeff] = useState(14.0); // pm/V (PPLN)
  const [crystalLength, setCrystalLength] = useState(20); // mm
  const [pumpPower, setPumpPower] = useState(500); // mW
  const [signalPower, setSignalPower] = useState(10); // mW
  const [beamWaist, setBeamWaist] = useState(40); // µm

  // DFG: 1/λ_DFG = 1/λ_pump - 1/λ_signal
  const lambdaDFG = 1 / (1 / lambdaPump - 1 / lambdaSignal);

  // Quantum defect
  const qd = lambdaDFG > 0 ? (1 - lambdaPump / lambdaSignal) * 100 : 0;

  const n = 2.2;
  const area = Math.PI * (beamWaist * 1e-6) ** 2;
  const L = crystalLength * 1e-3;
  const d = deff * 1e-12;
  const epsilon0 = 8.854e-12;
  const c = 3e8;
  const lambdaOut = (lambdaDFG > 0 ? lambdaDFG : lambdaPump) * 1e-9;

  // Conversion efficiency
  const eta = (8 * Math.PI ** 2 * d ** 2 * L ** 2) / (epsilon0 * c * n ** 3 * lambdaOut ** 2 * area) * (pumpPower * 1e-3 / area);
  const pDFG = signalPower * 1e-3 * eta * pumpPower * 1e-3;

  // Tuning curve: DFG wavelength vs signal wavelength
  const tuningData = useMemo(() => {
    const lSignals = Array.from({ length: 200 }, (_, i) => lambdaPump * 1.02 + i * (lambdaPump * 3 - lambdaPump * 1.02) / 200);
    const lDFGs = lSignals.map(ls => {
      const ld = 1 / (1 / lambdaPump - 1 / ls);
      return ld > 0 && ld < 20000 ? ld : NaN;
    });
    return [
      { x: lSignals, y: lDFGs, type: "scatter", mode: "lines", name: "λ_DFG", line: { color: "#60a5fa", width: 2 } },
      { x: [lambdaSignal, lambdaSignal], y: [0, (lambdaDFG > 0 ? lambdaDFG : 10000)], type: "scatter", mode: "lines", name: "Current", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [lambdaPump, lambdaSignal]);

  // Power vs crystal length
  const powerData = useMemo(() => {
    const lengths = Array.from({ length: 200 }, (_, i) => 0.1 + i * 40 / 200);
    const powers = lengths.map(l => {
      const e = (8 * Math.PI ** 2 * d ** 2 * (l * 1e-3) ** 2) / (epsilon0 * c * n ** 3 * lambdaOut ** 2 * area) * (pumpPower * 1e-3 / area);
      return signalPower * 1e-3 * e * pumpPower * 1e-3 * 1e6;
    });
    return [
      { x: lengths, y: powers, type: "scatter", mode: "lines", name: "P_DFG", line: { color: "#34d399", width: 2 } },
    ];
  }, [lambdaPump, lambdaSignal, deff, pumpPower, signalPower, beamWaist, crystalLength]);

  const tuningLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Signal wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "DFG wavelength (nm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const powerLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Crystal length (mm)", gridcolor: "#374151" },
    yaxis: { title: "DFG power (µW)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Difference Frequency Generation (DFG)</h1>
      <p className="text-gray-400 mb-8">Downconversion via χ⁽²⁾: ω<sub>p</sub> − ω<sub>s</sub> → ω<sub>i</sub> for mid-IR generation.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">Energy:</span> 1/λ<sub>i</sub> = 1/λ<sub>p</sub> − 1/λ<sub>s</sub></p>
        <p><span className="text-blue-400">Phase match:</span> Δk = k<sub>p</sub> − k<sub>s</sub> − k<sub>i</sub> = 0</p>
        <p><span className="text-blue-400">η</span> = (8π² d<sub>eff</sub>² L²) / (ε₀ c n³ λ<sub>i</sub>² A) × (P<sub>p</sub>/A)</p>
        <p><span className="text-blue-400">Manley-Rowe:</span> P<sub>p</sub>/ω<sub>p</sub> + P<sub>i</sub>/ω<sub>i</sub> = const</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Pump λ (nm)</span>
          <input type="number" value={lambdaPump} onChange={e => setLambdaPump(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Signal λ (nm)</span>
          <input type="number" value={lambdaSignal} onChange={e => setLambdaSignal(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">d<sub>eff</sub> (pm/V)</span>
          <input type="number" value={deff} onChange={e => setDeff(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Crystal Length (mm)</span>
          <input type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pump Power (mW)</span>
          <input type="number" value={pumpPower} onChange={e => setPumpPower(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Signal Power (mW)</span>
          <input type="number" value={signalPower} onChange={e => setSignalPower(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DFG Wavelength</p>
          <p className="text-xl font-bold text-blue-400">{isFinite(lambdaDFG) && lambdaDFG > 0 ? lambdaDFG.toFixed(1) : "—"} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Conversion Efficiency</p>
          <p className="text-xl font-bold text-green-400">{(eta * 100).toExponential(2)} %</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DFG Power</p>
          <p className="text-xl font-bold text-orange-400">{(pDFG * 1e6).toExponential(2)} µW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Quantum Defect</p>
          <p className="text-xl font-bold text-purple-400">{isFinite(qd) ? qd.toFixed(1) : "—"} %</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={tuningData} layout={tuningLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={powerData} layout={powerLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
