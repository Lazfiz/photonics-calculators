"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

interface EOCrystal {
  name: string;
  crystalSystem: string;
  r33_pmV: number; // EO coefficient in pm/V
  r13_pmV: number;
  n: number; // refractive index
  epsilon: number; // dielectric constant
  halfWaveV_um: number; // half-wave voltage at 1 μm (kV)
  transparencyMin: number;
  transparencyMax: number;
  damageThreshold: number; // GW/cm²
}

const materials: Record<string, EOCrystal> = {
  "LiNbO₃": {
    name: "LiNbO₃", crystalSystem: "Trigonal (3m)",
    r33_pmV: 30.8, r13_pmV: 8.6, n: 2.2, epsilon: 28,
    halfWaveV_um: 5.4, transparencyMin: 0.33, transparencyMax: 5.5, damageThreshold: 0.5,
  },
  "KDP": {
    name: "KDP (KH₂PO₄)", crystalSystem: "Tetragonal (42m)",
    r33_pmV: 10.5, r13_pmV: 8.6, n: 1.49, epsilon: 21,
    halfWaveV_um: 8.6, transparencyMin: 0.18, transparencyMax: 1.7, damageThreshold: 5.0,
  },
  "KD*P": {
    name: "KD*P (KD₂PO₄)", crystalSystem: "Tetragonal (42m)",
    r33_pmV: 26.4, r13_pmV: 24.0, n: 1.50, epsilon: 50,
    halfWaveV_um: 3.8, transparencyMin: 0.20, transparencyMax: 2.0, damageThreshold: 3.5,
  },
  "BBO": {
    name: "BBO (β-BaB₂O₄)", crystalSystem: "Trigonal (3m)",
    r33_pmV: 2.7, r13_pmV: 0.9, n: 1.65, epsilon: 6,
    halfWaveV_um: 48, transparencyMin: 0.19, transparencyMax: 3.5, damageThreshold: 10.0,
  },
  "KTP": {
    name: "KTP (KTiOPO₄)", crystalSystem: "Orthorhombic (mm2)",
    r33_pmV: 36.3, r13_pmV: 9.5, n: 1.83, epsilon: 17,
    halfWaveV_um: 3.2, transparencyMin: 0.35, transparencyMax: 4.5, damageThreshold: 1.5,
  },
  "LiTaO₃": {
    name: "LiTaO₃", crystalSystem: "Trigonal (3m)",
    r33_pmV: 30.5, r13_pmV: 7.0, n: 2.18, epsilon: 43,
    halfWaveV_um: 2.8, transparencyMin: 0.28, transparencyMax: 5.5, damageThreshold: 0.3,
  },
  "SBN": {
    name: "SBN (Sr₀.₆Ba₀.₄Nb₂O₆)", crystalSystem: "Tetragonal (4mm)",
    r33_pmV: 420, r13_pmV: 47, n: 2.30, epsilon: 3400,
    halfWaveV_um: 0.04, transparencyMin: 0.37, transparencyMax: 6.0, damageThreshold: 0.05,
  },
  "GaAs": {
    name: "GaAs", crystalSystem: "Cubic (43m)",
    r33_pmV: 1.43, r13_pmV: 1.43, n: 3.3, epsilon: 13,
    halfWaveV_um: 10.0, transparencyMin: 0.9, transparencyMax: 17.0, damageThreshold: 0.1,
  },
  "BaTiO₃": {
    name: "BaTiO₃", crystalSystem: "Tetragonal (4mm)",
    r33_pmV: 80, r13_pmV: 24, n: 2.37, epsilon: 3600,
    halfWaveV_um: 0.1, transparencyMin: 0.4, transparencyMax: 5.5, damageThreshold: 0.05,
  },
  "RTP": {
    name: "RTP (RbTiOPO₄)", crystalSystem: "Orthorhombic (mm2)",
    r33_pmV: 32.0, r13_pmV: 10.0, n: 1.83, epsilon: 180,
    halfWaveV_um: 3.0, transparencyMin: 0.35, transparencyMax: 4.0, damageThreshold: 1.0,
  },
};

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7"];

export default function ElectroOpticPage() {
  const [selected, setSelected] = useState("LiNbO₃");
  const [voltage, setVoltage] = useURLState("voltage", 1000);
  const [gap, setGap] = useURLState("gap", 20); // μm
  const [wavelength, setWavelength] = useURLState("wavelength", 633);

  const m = materials[selected];

  // Phase shift Δφ = π · r₃₃ · n³ · V / (λ · d/L) — for longitudinal
  const longitudinalPhaseShift = Math.PI * m.r33_pmV * 1e-12 * Math.pow(m.n, 3) * voltage / (wavelength * 1e-9);
  // Half-wave voltage Vπ = λ / (2 · n³ · r₃₃)
  const Vpi = (wavelength * 1e-9) / (2 * Math.pow(m.n, 3) * m.r33_pmV * 1e-12);

  const rChart = useMemo(() => {
    const entries = Object.entries(materials).sort((a, b) => b[1].r33_pmV - a[1].r33_pmV);
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => cr.r33_pmV),
      type: "bar" as const,
      marker: { color: entries.map(([k]) => k === selected ? "#3b82f6" : "#4b5563") },
    }];
  }, [selected]);

  const figureOfMerit = useMemo(() => {
    // n³ · r figure of merit
    const entries = Object.entries(materials).sort((a, b) =>
      (Math.pow(b[1].n, 3) * b[1].r33_pmV) - (Math.pow(a[1].n, 3) * a[1].r33_pmV)
    );
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => Math.pow(cr.n, 3) * cr.r33_pmV),
      type: "bar" as const,
      marker: { color: "#22c55e" },
    }];
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Electro-Optic Coefficients" description="Pockels effect materials for modulators, Q-switches, and phase shifters">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.crystalSystem})</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₃₃ (pm/V)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{m.r33_pmV}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₁₃ (pm/V)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{m.r13_pmV}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{m.n.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ε (dielectric)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{m.epsilon}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Voltage (V)</label>
          <ValidatedNumberInput label="Voltage (V)" value={voltage} onChange={setVoltage} min={0} max={10000} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Electrode Gap (μm)</label>
          <ValidatedNumberInput label="Electrode Gap (μm)" value={gap} onChange={setGap} min={1} max={1000} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Longitudinal Phase Shift</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{(longitudinalPhaseShift / Math.PI).toFixed(3)}π rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V<sub>π</sub> (longitudinal)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{(Vpi / 1000).toFixed(2)} kV</p>
        </div>
      </div>

      <ChartPanel data={rChart}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Material", gridcolor: "#374151" },
          yaxis: { title: "r₃₃ (pm/V)", gridcolor: "#374151", type: "log" },
          margin: { t: 20, r: 20, b: 80, l: 60 },
        }}
       
       
      />

      <h2 className="text-xl font-bold mt-8 mb-4">Figure of Merit: n³ · r₃₃</h2>
      <ChartPanel data={figureOfMerit}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Material", gridcolor: "#374151" },
          yaxis: { title: "n³·r₃₃ (pm/V)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 80, l: 60 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
