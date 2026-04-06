"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ThermalEvaporationPage() {
  const [material, setMaterial] = useState("SiO2");
  const [sourceTemp, setSourceTemp] = useState(1400);
  const [sourceSubstrateDist, setSourceSubstrateDist] = useState(30);
  const [sourceDiameter, setSourceDiameter] = useState(2);
  const [chamberPressure, setChamberPressure] = useState(1e-6);
  const [substrateTemp, setSubstrateTemp] = useState(100);

  const materials: Record<string, { M: number; density: number; dHvap: number; A: number; B: number; n: number; name: string }> = {
    SiO2: { M: 60.08, density: 2.2, dHvap: 450, A: 5.5, B: 26000, n: 1.46, name: "SiO₂" },
    TiO2: { M: 79.87, density: 4.23, dHvap: 550, A: 5.8, B: 28000, n: 2.35, name: "TiO₂" },
    Ta2O5: { M: 441.89, density: 8.2, dHvap: 600, A: 6.0, B: 32000, n: 2.10, name: "Ta₂O₅" },
    Al2O3: { M: 101.96, density: 3.95, dHvap: 520, A: 5.6, B: 27500, n: 1.63, name: "Al₂O₃" },
    MgF2: { M: 62.3, density: 3.15, dHvap: 350, A: 5.3, B: 22000, n: 1.38, name: "MgF₂" },
    ZrO2: { M: 123.22, density: 5.68, dHvap: 580, A: 5.9, B: 30000, n: 2.10, name: "ZrO₂" },
    HfO2: { M: 210.49, density: 9.68, dHvap: 620, A: 6.1, B: 33000, n: 2.05, name: "HfO₂" },
    Al: { M: 26.98, density: 2.7, dHvap: 294, A: 5.0, B: 17000, n: 1.37, name: "Aluminum" },
    Ag: { M: 107.87, density: 10.49, dHvap: 250, A: 5.2, B: 15000, n: 0.05, name: "Silver" },
    Au: { M: 196.97, density: 19.3, dHvap: 340, A: 5.3, B: 18000, n: 0.17, name: "Gold" },
    SiO: { M: 44.09, density: 2.13, dHvap: 380, A: 5.4, B: 21000, n: 1.55, name: "SiO" },
    ZnS: { M: 97.47, density: 4.09, dHvap: 400, A: 5.5, B: 23000, n: 2.35, name: "ZnS" },
  };

  const mat = materials[material];

  const results = useMemo(() => {
    const T = sourceTemp;
    const T_K = T + 273.15;
    const d = sourceSubstrateDist * 1e-2; // m
    const r_source = (sourceDiameter / 2) * 1e-2; // m
    const P = chamberPressure;
    const T_sub = substrateTemp + 273.15;

    // Vapor pressure (Clausius-Clapeyron)
    const logP_vapor = mat.A - mat.B / T_K;
    const P_vapor = Math.pow(10, logP_vapor); // Torr

    // Evaporation rate (Hertz-Knudsen)
    const alpha = 1.0; // evaporation coefficient
    const m = mat.M * 1.673e-27; // mass per molecule (using amu)
    const flux = alpha * P_vapor * 133.322 / Math.sqrt(2 * Math.PI * m * 1.38e-23 * T_K); // molecules/m²/s

    // Deposition rate at substrate (point source cos model)
    const cosTheta = 1; // normal incidence at center
    const geometricFactor = r_source * r_source / (d * d) * cosTheta;
    const depRate = flux * m * geometricFactor * 1e9; // nm/s

    // Mean free path
    const mfp = 0.005 / P; // m (rough)
    const mfpCm = mfp * 100;

    // Knudsen number
    const Kn = mfp / d;

    // Film uniformity (cos^n model for point source)
    const uniformity85 = Math.pow(Math.cos(Math.atan(0.15 * sourceDiameter / sourceSubstrateDist)), 3);

    // Stoichiometry deviation (from pressure and temperature)
    const stoichFactor = Math.min(1.0, P_vapor / 1e-3) > 1 ? 1.0 : Math.sqrt(P_vapor * 1000);

    // Packing density estimate
    const energyEvap = 1.5 * 1.38e-23 * T_K; // thermal energy ~ kT
    const surfaceDiffusion = Math.exp(-0.5 / (1.38e-23 * T_sub / mat.dHvap * 1000));
    const packingDensity = 0.6 + 0.2 * Math.min(surfaceDiffusion, 1) + 0.05 * Math.min(Kn, 1);

    // Molecular speed
    const v_mol = Math.sqrt(8 * 1.38e-23 * T_K / (Math.PI * m));

    return { P_vapor, depRate, mfpCm, Kn, uniformity85, v_mol, packingDensity, stoichFactor, flux };
  }, [material, sourceTemp, sourceSubstrateDist, sourceDiameter, chamberPressure, substrateTemp]);

  const sweepData = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => 500 + i * 2500 / 100);
    const rates = temps.map(T => {
      const T_K = T + 273.15;
      const logP = mat.A - mat.B / T_K;
      const Pv = Math.pow(10, logP);
      const m = mat.M * 1.673e-27;
      const fl = Pv * 133.322 / Math.sqrt(2 * Math.PI * m * 1.38e-23 * T_K);
      const d = sourceSubstrateDist * 1e-2;
      const r = (sourceDiameter / 2) * 1e-2;
      return fl * m * r * r / (d * d) * 1e9;
    });
    const pressures = temps.map(T => {
      const T_K = T + 273.15;
      return Math.pow(10, mat.A - mat.B / T_K);
    });
    return [
      { x: temps, y: rates, type: "scatter" as const, mode: "lines" as const, name: "Dep Rate (nm/s)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: temps, y: pressures, type: "scatter" as const, mode: "lines" as const, name: "Vapor P (Torr)", line: { color: "#fbbf24" }, yaxis: "y2" },
    ];
  }, [material, sourceSubstrateDist, sourceDiameter]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Thermal Evaporation" description="Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select></label>
        <ValidatedNumberInput label="Source Temp (°C)" value={sourceTemp} onChange={setSourceTemp} step="10" />
        <ValidatedNumberInput label="Source-Substrate Dist (cm)" value={sourceSubstrateDist} onChange={setSourceSubstrateDist} step="1" />
        <ValidatedNumberInput label="Source Diameter (cm)" value={sourceDiameter} onChange={setSourceDiameter} step="0.5" />
        <ValidatedNumberInput label="Chamber Pressure (Torr)" value={chamberPressure} onChange={setChamberPressure} step="1e-7" />
        <ValidatedNumberInput label="Substrate Temp (°C)" value={substrateTemp} onChange={setSubstrateTemp} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Vapor Pressure: <span className="text-blue-400 font-mono">{results.P_vapor.toExponential(3)} Torr</span></p>
        <p className="text-gray-300">Deposition Rate: <span className="text-blue-400 font-mono">{results.depRate.toFixed(3)} nm/s ({(results.depRate * 10).toFixed(2)} Å/s)</span></p>
        <p className="text-gray-300">Mean Free Path: <span className="text-blue-400 font-mono">{results.mfpCm.toFixed(1)} cm</span></p>
        <p className="text-gray-300">Knudsen Number: <span className="text-blue-400 font-mono">{results.Kn.toFixed(2)}</span></p>
        <p className="text-gray-300">Molecular Speed: <span className="text-blue-400 font-mono">{results.v_mol.toFixed(0)} m/s</span></p>
        <p className="text-gray-300">Film Uniformity (85% dia): <span className="text-blue-400 font-mono">{(results.uniformity85 * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300">Packing Density (est.): <span className="text-blue-400 font-mono">{results.packingDensity.toFixed(3)}</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>log₁₀(P) = A − B/T (Clausius-Clapeyron vapor pressure)</p>
        <p>Φ = α·P·√(M/2πkT) (Hertz-Knudsen evaporation flux)</p>
        <p>R = Φ·m·(r²/d²)·cos θ (deposition rate at substrate)</p>
        <p>λ<sub>mfp</sub> ≈ 0.005/P [m] (mean free path)</p>
        <p>Kn = λ<sub>mfp</sub>/d (Knudsen number, Kn &gt;&gt; 1 → molecular flow)</p>
      </div>

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Source Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Dep Rate (nm/s)", gridcolor: "#374151", side: "left" },
        yaxis2: { title: "Vapor Pressure (Torr)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" },
        margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />
    </CalculatorShell>
  );
}
