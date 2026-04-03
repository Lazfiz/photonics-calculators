"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ParametricAmplificationPage() {
  const [wavelength, setWavelength] = useState(1550); // nm
  const [pumpPower, setPumpPower] = useState(500); // mW
  const [chi2, setChi2] = useState(2.0); // pm/V
  const [crystalLength, setCrystalLength] = useState(20); // mm
  const [pumpDepletion, setPumpDepletion] = useState(false);
  const [walkoff, setWalkoff] = useState(0.1); // mrad

  // Parametric gain
  const lambdaP = wavelength;
  const omegaP = 2 * Math.PI * 3e8 / (lambdaP * 1e-9);
  const n = 2.2; // typical PPLN
  const epsilon0 = 8.854e-12;
  const dEff = chi2 * 1e-12; // m/V

  // Small-signal parametric gain coefficient
  const gammaPA = (2 * omegaP * dEff) / (n * 3e8) * Math.sqrt(2 * pumpPower * 1e-3 / (epsilon0 * n * 3e8 * 8e-11));
  // Simplified gain in dB: G ≈ 10 log10(cosh²(γPL))
  const gL = gammaPA * crystalLength * 1e-3;
  const gainLinear = Math.cosh(gL) ** 2;
  const gainDB = 10 * Math.log10(gainLinear);

  // Gain vs crystal length
  const gainData = useMemo(() => {
    const lengths = Array.from({ length: 200 }, (_, i) => 0.1 + i * 50 / 200);
    const gains = lengths.map(L => {
      const g = gammaPA * L * 1e-3;
      return 10 * Math.log10(Math.cosh(g) ** 2);
    });
    return [
      { x: lengths, y: gains, type: "scatter", mode: "lines", name: "Parametric gain", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [wavelength, pumpPower, chi2, crystalLength]);

  // Gain bandwidth vs pump power
  const powerData = useMemo(() => {
    const powers = Array.from({ length: 200 }, (_, i) => 10 + i * 990 / 200);
    const gains = powers.map(P => {
      const gam = (2 * omegaP * dEff) / (n * 3e8) * Math.sqrt(2 * P * 1e-3 / (epsilon0 * n * 3e8 * 8e-11));
      return 10 * Math.log10(Math.cosh(gam * crystalLength * 1e-3) ** 2);
    });
    return [
      { x: powers, y: gains, type: "scatter", mode: "lines", name: "Gain vs P_pump", line: { color: "#34d399", width: 2 } },
    ];
  }, [wavelength, chi2, crystalLength]);

  const plotLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Crystal length (mm)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const powerLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Pump power (mW)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  // Bandwidth (phase-matching bandwidth)
  const bandwidth = 1.77 / (crystalLength * 1e-3 * walkoff * 1e-3) * 1e-12; // THz approx
  const bwNm = bandwidth * (wavelength * 1e-9) ** 2 / 3e8 * 1e9; // nm

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Parametric Amplification</h1>
      <p className="text-gray-400 mb-8">Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">G</span> = cosh²(g · L)</p>
        <p><span className="text-blue-400">g</span> = (2ω<sub>s</sub> d<sub>eff</sub> / n c) √(2I<sub>p</sub> / (ε₀ n c))</p>
        <p><span className="text-blue-400">G<sub>max</sub></span> = (P<sub>p</sub> / P<sub>th</sub>) · sinh²(gL) + cosh²(gL)</p>
        <p><span className="text-blue-400">Δν</span> ≈ 0.44 / (L · ρ) — group-velocity walkoff bandwidth</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pump Power (mW)</span>
          <input type="number" value={pumpPower} onChange={e => setPumpPower(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">d<sub>eff</sub> (pm/V)</span>
          <input type="number" value={chi2} onChange={e => setChi2(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Crystal Length (mm)</span>
          <input type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Walk-off ρ (mrad)</span>
          <input type="number" value={walkoff} onChange={e => setWalkoff(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Parametric Gain</p>
          <p className="text-xl font-bold text-blue-400">{gainDB.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gain Coefficient g</p>
          <p className="text-xl font-bold text-green-400">{gammaPA.toFixed(2)} m⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">g · L Product</p>
          <p className="text-xl font-bold text-orange-400">{gL.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bandwidth</p>
          <p className="text-xl font-bold text-purple-400">{isFinite(bwNm) ? bwNm.toFixed(1) : "—"} nm</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={gainData} layout={plotLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={powerData} layout={powerLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
