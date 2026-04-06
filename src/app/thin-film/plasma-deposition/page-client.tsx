"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function PlasmaDepositionPage() {
  const [power, setPower] = useState(500);
  const [pressure, setPressure] = useState(5e-3);
  const [gasFlow, setGasFlow] = useState(30);
  const [substrateTemp, setSubstrateTemp] = useState(300);
  const [frequency, setFrequency] = useState(13.56);
  const [electrodeGap, setElectrodeGap] = useState(5);
  const [gasType, setGasType] = useState("Ar/O2");

  const gases: Record<string, { mw: number; gamma: number; ionizationE: number; name: string }> = {
    Ar: { mw: 39.95, gamma: 0.01, ionizationE: 15.76, name: "Argon" },
    "Ar/O2": { mw: 34, gamma: 0.05, ionizationE: 14.5, name: "Argon/Oxygen mix" },
    "Ar/N2": { mw: 36, gamma: 0.03, ionizationE: 15.0, name: "Argon/Nitrogen mix" },
    O2: { mw: 32, gamma: 0.1, ionizationE: 12.07, name: "Oxygen" },
    N2: { mw: 28, gamma: 0.02, ionizationE: 15.58, name: "Nitrogen" },
  };

  const gas = gases[gasType];

  const results = useMemo(() => {
    const P = power; // W
    const p = pressure; // Torr
    const Q = gasFlow; // sccm
    const T_s = substrateTemp; // K (displayed as °C)
    const f = frequency * 1e6; // Hz
    const d = electrodeGap * 1e-3; // m
    const A = 0.01; // electrode area m² (~100 cm²)

    // Electron temperature estimate (Lieberman model)
    const Te_eV = 2 + 0.5 * Math.log10(1 + p / 1e-3);

    // Electron density
    const E_field = P / (A * d * p * 0.133); // V/m (p in Pa = p*0.133)
    const ne = (P * 0.01) / (Te_eV * 1.6e-19 * A * d * 1e6 * Math.sqrt(8 * Te_eV * 1.6e-19 / (Math.PI * gas.mw * 1.673e-27)));

    // Ion energy at substrate (simplified sheath model)
    const sheathVoltage = Math.min(P / (ne * e_charge(A) + 1e-10), 300);
    const ionEnergy = sheathVoltage * 0.8;

    // Debye length
    const Debye = 69 * Math.sqrt(Te_eV / Math.max(ne, 1e10)) * 1e-2; // m

    // Deposition rate estimate
    const depositionRate = (P * 0.001) / (gas.mw * 10); // nm/s rough

    // Plasma density
    const plasmaDensity = ne;

    // Ion bombardment energy at substrate
    const ionBombEnergy = Math.min(50 + P * 0.1 / Math.max(gasFlow, 1), 500);

    // Sticking coefficient
    const stickingCoeff = Math.min(0.95, 0.5 + 0.3 * (1 - Math.exp(-ionBombEnergy / 100)));

    // Film uniformity (edge-to-center ratio)
    const uniformity = 1 - 0.1 * (d * d) / 0.01;

    return { Te_eV, ne, ionEnergy, Debye, depositionRate, ionBombEnergy, stickingCoeff, uniformity, sheathVoltage };
  }, [power, pressure, gasFlow, substrateTemp, frequency, electrodeGap, gasType]);

  function e_charge(A: number) { return 1.6e-19 * 0.1 * A; }

  const sweepData = useMemo(() => {
    const pressures = Array.from({ length: 100 }, (_, i) => 1e-4 + i * 0.02 / 100);
    const Te = pressures.map(p => 2 + 0.5 * Math.log10(1 + p / 1e-3));
    const rates = pressures.map(p => {
      const te = 2 + 0.5 * Math.log10(1 + p / 1e-3);
      const ne_est = (power * 0.01) / (te * 1.6e-19 * 0.01 * electrodeGap * 1e-3 * 1e6);
      return Math.min((power * 0.001 * 0.5) / (gas.mw * 10) * Math.exp(-p / 0.05), 5);
    });
    return [
      { x: pressures.map(p => p * 1000), y: Te, type: "scatter" as const, mode: "lines" as const, name: "Te (eV)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: pressures.map(p => p * 1000), y: rates, type: "scatter" as const, mode: "lines" as const, name: "Dep Rate (nm/s)", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [power, electrodeGap, gasType]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Plasma Deposition" description="Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Gas Type</span>
          <select value={gasType} onChange={e => setGasType(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(gases).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select></label>
        <ValidatedNumberInput label="RF Power (W)" value={power} onChange={setPower} step="10" />
        <ValidatedNumberInput label="Pressure (Torr)" value={pressure} onChange={setPressure} step="1e-4" />
        <ValidatedNumberInput label="Gas Flow (sccm)" value={gasFlow} onChange={setGasFlow} step="1" />
        <ValidatedNumberInput label="Substrate Temp (°C)" value={substrateTemp} onChange={setSubstrateTemp} step="10" />
        <ValidatedNumberInput label="RF Frequency (MHz)" value={frequency} onChange={setFrequency} step="0.01" />
        <ValidatedNumberInput label="Electrode Gap (cm)" value={electrodeGap} onChange={setElectrodeGap} step="0.5" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Electron Temperature T<sub>e</sub>: <span className="text-blue-400 font-mono">{results.Te_eV.toFixed(2)} eV</span></p>
        <p className="text-gray-300">Electron Density n<sub>e</sub>: <span className="text-blue-400 font-mono">{results.ne.toExponential(2)} m⁻³</span></p>
        <p className="text-gray-300">Sheath Voltage: <span className="text-blue-400 font-mono">{results.sheathVoltage.toFixed(1)} V</span></p>
        <p className="text-gray-300">Ion Bombardment Energy: <span className="text-blue-400 font-mono">{results.ionBombEnergy.toFixed(1)} eV</span></p>
        <p className="text-gray-300">Debye Length: <span className="text-blue-400 font-mono">{(results.Debye * 1e6).toFixed(1)} μm</span></p>
        <p className="text-gray-300">Deposition Rate (est.): <span className="text-blue-400 font-mono">{results.depositionRate.toFixed(2)} nm/s</span></p>
        <p className="text-gray-300">Sticking Coefficient: <span className="text-blue-400 font-mono">{results.stickingCoeff.toFixed(3)}</span></p>
        <p className="text-gray-300">Film Uniformity (est.): <span className="text-blue-400 font-mono">{(results.uniformity * 100).toFixed(1)}%</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>T<sub>e</sub> ≈ 2 + 0.5·log₁₀(1 + p/p₀) (electron temperature, Lieberman model)</p>
        <p>n<sub>e</sub> ≈ P<sub>abs</sub> / (e·T<sub>e</sub>·u<sub>B</sub>·A) (electron density from power balance)</p>
        <p>V<sub>sh</sub> ~ P / (J<sub>i</sub>·A) (sheath voltage)</p>
        <p>λ<sub>D</sub> = 69·√(T<sub>e</sub>/n<sub>e</sub>) [m] (Debye length)</p>
      </div>

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pressure (mTorr)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Te (eV)", gridcolor: "#374151", side: "left" },
        yaxis2: { title: "Dep Rate (nm/s)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />
    </CalculatorShell>
  );
}
