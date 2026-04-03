"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface NLCrystal {
  name: string;
  type: string;
  dEff_pmV: number; // effective nonlinear coefficient
  n: number; // average refractive index
  transparencyMin: number; // μm
  transparencyMax: number; // μm
  damageThreshold_NL: number; // GW/cm²
  phaseMatchType: string; // "I" or "II"
  walkOff_mrad: number; // spatial walk-off
  angularTolerance_mrad: number;
  spectralBandwidth_nm: number;
}

const crystals: Record<string, NLCrystal> = {
  "BBO": {
    name: "BBO (β-BaB₂O₄)", type: "Negative uniaxial",
    dEff_pmV: 2.2, n: 1.66,
    transparencyMin: 0.19, transparencyMax: 3.5,
    damageThreshold_NL: 10,
    phaseMatchType: "I / II", walkOff_mrad: 52, angularTolerance_mrad: 0.5, spectralBandwidth_nm: 4.0,
  },
  "LBO": {
    name: "LBO (LiB₃O₅)", type: "Negative biaxial",
    dEff_pmV: 0.83, n: 1.57,
    transparencyMin: 0.16, transparencyMax: 2.6,
    damageThreshold_NL: 18,
    phaseMatchType: "I / II", walkOff_mrad: 9, angularTolerance_mrad: 5.0, spectralBandwidth_nm: 2.0,
  },
  "KTP": {
    name: "KTP (KTiOPO₄)", type: "Positive biaxial",
    dEff_pmV: 3.2, n: 1.83,
    transparencyMin: 0.35, transparencyMax: 4.5,
    damageThreshold_NL: 5,
    phaseMatchType: "II", walkOff_mrad: 4, angularTolerance_mrad: 15.0, spectralBandwidth_nm: 1.5,
  },
  "LiNbO₃": {
    name: "LiNbO₃ (MgO)", type: "Negative uniaxial",
    dEff_pmV: 14.0, n: 2.20,
    transparencyMin: 0.33, transparencyMax: 5.5,
    damageThreshold_NL: 0.5,
    phaseMatchType: "I (QPM)", walkOff_mrad: 0, angularTolerance_mrad: 50.0, spectralBandwidth_nm: 0.5,
  },
  "PPLN": {
    name: "PPLN (Periodically Poled LiNbO₃)", type: "Negative uniaxial (QPM)",
    dEff_pmV: 16.0, n: 2.20,
    transparencyMin: 0.35, transparencyMax: 5.5,
    damageThreshold_NL: 0.3,
    phaseMatchType: "I (QPM)", walkOff_mrad: 0, angularTolerance_mrad: 100.0, spectralBandwidth_nm: 2.0,
  },
  "AgGaS₂": {
    name: "AgGaS₂ (AGS)", type: "Negative uniaxial",
    dEff_pmV: 12.0, n: 2.42,
    transparencyMin: 0.5, transparencyMax: 13.0,
    damageThreshold_NL: 0.03,
    phaseMatchType: "I / II", walkOff_mrad: 30, angularTolerance_mrad: 2.0, spectralBandwidth_nm: 50.0,
  },
  "ZnGeP₂": {
    name: "ZnGeP₂ (ZGP)", type: "Positive uniaxial",
    dEff_pmV: 75.0, n: 3.10,
    transparencyMin: 0.74, transparencyMax: 12.0,
    damageThreshold_NL: 0.05,
    phaseMatchType: "I / II", walkOff_mrad: 60, angularTolerance_mrad: 1.5, spectralBandwidth_nm: 30.0,
  },
  "GaSe": {
    name: "GaSe", type: "Negative uniaxial",
    dEff_pmV: 54.0, n: 2.82,
    transparencyMin: 0.65, transparencyMax: 18.0,
    damageThreshold_NL: 0.03,
    phaseMatchType: "I / II", walkOff_mrad: 5, angularTolerance_mrad: 3.0, spectralBandwidth_nm: 100.0,
  },
  "OP-GaAs": {
    name: "OP-GaAs (Orientation-patterned)", type: "Zincblende (QPM)",
    dEff_pmV: 94.0, n: 3.20,
    transparencyMin: 0.9, transparencyMax: 17.0,
    damageThreshold_NL: 0.05,
    phaseMatchType: "I (QPM)", walkOff_mrad: 0, angularTolerance_mrad: 50.0, spectralBandwidth_nm: 200.0,
  },
  "CLBO": {
    name: "CLBO (CsLiB₆O₁₀)", type: "Negative uniaxial",
    dEff_pmV: 0.95, n: 1.50,
    transparencyMin: 0.18, transparencyMax: 2.4,
    damageThreshold_NL: 13,
    phaseMatchType: "I", walkOff_mrad: 25, angularTolerance_mrad: 1.0, spectralBandwidth_nm: 3.0,
  },
  "BiBO": {
    name: "BiBO (BiB₃O₆)", type: "Negative biaxial",
    dEff_pmV: 3.2, n: 1.78,
    transparencyMin: 0.21, transparencyMax: 3.3,
    damageThreshold_NL: 5,
    phaseMatchType: "I / II", walkOff_mrad: 20, angularTolerance_mrad: 2.0, spectralBandwidth_nm: 5.0,
  },
  "KTA": {
    name: "KTA (KTiOAsO₄)", type: "Positive biaxial",
    dEff_pmV: 3.5, n: 1.83,
    transparencyMin: 0.35, transparencyMax: 5.3,
    damageThreshold_NL: 3,
    phaseMatchType: "II", walkOff_mrad: 3, angularTolerance_mrad: 20.0, spectralBandwidth_nm: 1.2,
  },
};

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7", "#e879f9", "#fb923c"];

export default function NonlinearCrystalsPage() {
  const [selected, setSelected] = useState("BBO");
  const [pumpWavelength, setPumpWavelength] = useState(1064); // nm
  const [length, setLength] = useState(20); // mm
  const [pumpPower, setPumpPower] = useState(5); // W

  const c = crystals[selected];

  // SHG efficiency ∝ (d_eff² · L² · P) / (n³ · λ²)
  // Relative efficiency
  const relEfficiency = (c.dEff_pmV ** 2) / (c.n ** 3);

  // SHG wavelength
  const shgWavelength = pumpWavelength / 2;

  const dEffChart = useMemo(() => {
    const entries = Object.entries(crystals).sort((a, b) => b[1].dEff_pmV - a[1].dEff_pmV);
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => cr.dEff_pmV),
      type: "bar" as const,
      marker: { color: entries.map(([k]) => k === selected ? "#3b82f6" : "#4b5563") },
    }];
  }, [selected]);

  const efficiencyChart = useMemo(() => {
    const entries = Object.entries(crystals).sort((a, b) =>
      (b[1].dEff_pmV ** 2 / b[1].n ** 3) - (a[1].dEff_pmV ** 2 / a[1].n ** 3)
    );
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => (cr.dEff_pmV ** 2 / cr.n ** 3).toFixed(2)),
      type: "bar" as const,
      marker: { color: "#22c55e" },
    }];
  }, []);

  const damageChart = useMemo(() => {
    const entries = Object.entries(crystals).sort((a, b) => b[1].damageThreshold_NL - a[1].damageThreshold_NL);
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => cr.damageThreshold_NL),
      type: "bar" as const,
      marker: { color: entries.map(([k]) => k === selected ? "#ef4444" : "#4b5563") },
    }];
  }, [selected]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Nonlinear Crystal Comparison</h1>
      <p className="text-gray-400 mb-6">SHG, OPO, and frequency conversion crystal properties</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Crystal</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(crystals).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pump λ (nm)</label>
          <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={300} max={5000} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Crystal Length (mm)</label>
          <input type="number" value={length} onChange={e => setLength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={1} max={100} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">d<sub>eff</sub></p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{c.dEff_pmV} pm/V</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SHG λ</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{shgWavelength} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Damage Threshold</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{c.damageThreshold_NL} GW/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase Matching</p>
          <p className="text-lg font-bold text-purple-400 mt-1">{c.phaseMatchType}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Walk-off</p>
          <p className="text-lg font-bold text-cyan-400 mt-1">{c.walkOff_mrad} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Tol.</p>
          <p className="text-lg font-bold text-rose-400 mt-1">{c.angularTolerance_mrad} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δλ Bandwidth</p>
          <p className="text-lg font-bold text-teal-400 mt-1">{c.spectralBandwidth_nm} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transparency</p>
          <p className="text-lg font-bold text-orange-400 mt-1">{c.transparencyMin}–{c.transparencyMax} μm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">Relative SHG efficiency ∝ d²<sub>eff</sub>/n³: <span className="text-white font-bold">{relEfficiency.toFixed(2)}</span></p>
      </div>

      <Plot
        data={dEffChart}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Crystal", gridcolor: "#374151" },
          yaxis: { title: "d_eff (pm/V)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 100, l: 60 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: 400 }}
      />

      <Plot
        data={damageChart}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Crystal", gridcolor: "#374151" },
          yaxis: { title: "Damage Threshold (GW/cm²)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 100, l: 60 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: 400 }}
      />
    </div>
  );
}
