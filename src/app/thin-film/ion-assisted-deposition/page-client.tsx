"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function IonAssistedDepositionPage() {
  const [ionEnergy, setIonEnergy] = useURLState("ionEnergy", 300);
  const [ionCurrent, setIonCurrent] = useURLState("ionCurrent", 50);
  const [depositionRate, setDepositionRate] = useURLState("depositionRate", 0.5);
  const [ionMass, setIonMass] = useURLState("ionMass", 40);
  const [filmMaterial, setFilmMaterial] = useState("SiO2");
  const [chamberPressure, setChamberPressure] = useURLState("chamberPressure", 2e-4);

  const materials: Record<string, { density: number; packingDensity: number; n: number; name: string }> = {
    SiO2: { density: 2.2, packingDensity: 0.95, n: 1.46, name: "Silicon Dioxide" },
    TiO2: { density: 4.23, packingDensity: 0.92, n: 2.35, name: "Titanium Dioxide" },
    Ta2O5: { density: 8.2, packingDensity: 0.94, n: 2.1, name: "Tantalum Pentoxide" },
    MgF2: { density: 3.15, packingDensity: 0.90, n: 1.38, name: "Magnesium Fluoride" },
    ZrO2: { density: 5.68, packingDensity: 0.93, n: 2.1, name: "Zirconium Dioxide" },
    Al2O3: { density: 3.95, packingDensity: 0.96, n: 1.63, name: "Aluminum Oxide" },
    HfO2: { density: 9.68, packingDensity: 0.93, n: 2.05, name: "Hafnium Dioxide" },
  };

  const mat = materials[filmMaterial];

  const results = useMemo(() => {
    const E = ionEnergy;
    const J = ionCurrent * 1e-3; // mA to A
    const r = depositionRate; // nm/s
    const M = ionMass;
    const P = chamberPressure;

    // Ion-to-atom arrival ratio (flux ratio)
    // J/A = ion current density (A/m²), assume 10 cm² beam area
    const beamArea = 1e-3; // m² (10 cm²)
    const ionFlux = J / beamArea; // A/m²
    const e = 1.6e-19;
    const ionArrivalRate = ionFlux / e; // ions/m²/s

    // Atom arrival rate from deposition rate
    const atomArrivalRate = (r * 1e-9 * mat.density * 1e3 * 6.022e23) / (mat.density * 1e-3 * beamArea * M * 1.673e-27);
    const J_ratio = ionArrivalRate / Math.max(atomArrivalRate, 1);

    // Estimated packing density improvement (empirical model)
    const basePacking = mat.packingDensity - 0.15;
    const packingImprovement = 0.15 * (1 - Math.exp(-0.005 * E * J_ratio / Math.max(r, 0.01)));
    const packingDensity = Math.min(1.0, basePacking + packingImprovement);

    // Stress model (MPa) - compressive stress from ion bombardment
    // σ ≈ k * E * (J/ion flux) / deposition rate
    const stress = 50 * Math.sqrt(E) * (J_ratio / 10) * (1 / Math.max(r, 0.01));

    // Refractive index shift with packing density (Lorentz-Lorenz)
    const nBase = mat.n - 0.05;
    const nEff = nBase * (1 + 0.3 * (packingDensity - basePacking));

    // Energy per deposited atom
    const energyPerAtom = (E * J_ratio);

    // Sputter yield estimation
    const sputterYield = 0.042 * E * Math.sqrt(M) / (1000);

    // Mean free path of ions
    const mfp = 0.005 / P; // rough estimate in m

    return { J_ratio, packingDensity, stress, nEff, energyPerAtom, sputterYield, mfp, ionArrivalRate };
  }, [ionEnergy, ionCurrent, depositionRate, ionMass, chamberPressure, filmMaterial]);

  const sweepData = useMemo(() => {
    const energies = Array.from({ length: 100 }, (_, i) => 50 + i * 950 / 100);
    const densities = energies.map(E => {
      const J = ionCurrent * 1e-3;
      const beamArea = 1e-3;
      const ionFlux = J / beamArea;
      const ionArrivalRate = ionFlux / 1.6e-19;
      const atomArrivalRate = (depositionRate * 1e-9 * mat.density * 1e3 * 6.022e23) / (mat.density * 1e-3 * beamArea * ionMass * 1.673e-27);
      const Jr = ionArrivalRate / Math.max(atomArrivalRate, 1);
      const basePacking = mat.packingDensity - 0.15;
      return Math.min(1.0, basePacking + 0.15 * (1 - Math.exp(-0.005 * E * Jr / Math.max(depositionRate, 0.01))));
    });
    const stresses = energies.map(E => {
      const J = ionCurrent * 1e-3;
      const beamArea = 1e-3;
      const ionFlux = J / beamArea;
      const ionArrivalRate = ionFlux / 1.6e-19;
      const atomArrivalRate = (depositionRate * 1e-9 * mat.density * 1e3 * 6.022e23) / (mat.density * 1e-3 * beamArea * ionMass * 1.673e-27);
      const Jr = ionArrivalRate / Math.max(atomArrivalRate, 1);
      return 50 * Math.sqrt(E) * (Jr / 10) * (1 / Math.max(depositionRate, 0.01));
    });
    return [
      { x: energies, y: densities, type: "scatter" as const, mode: "lines" as const, name: "Packing Density", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: energies, y: stresses, type: "scatter" as const, mode: "lines" as const, name: "Stress (MPa)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [ionEnergy, ionCurrent, depositionRate, ionMass, filmMaterial]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Ion-Assisted Deposition (IAD)" description="Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Film Material</span>
          <select value={filmMaterial} onChange={e => setFilmMaterial(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name} ({k})</option>)}
          </select></label>
        <ValidatedNumberInput label="Ion Energy (eV)" value={ionEnergy} onChange={setIonEnergy} min={0} step="10" />
        <ValidatedNumberInput label="Ion Current (mA)" value={ionCurrent} onChange={setIonCurrent} step="1" />
        <ValidatedNumberInput label="Deposition Rate (nm/s)" value={depositionRate} onChange={setDepositionRate} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Ion Mass (amu)" value={ionMass} onChange={setIonMass} step="1" />
        <ValidatedNumberInput label="Chamber Pressure (Torr)" value={chamberPressure} onChange={setChamberPressure} step="1e-5" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Ion-to-Atom Ratio (J): <span className="text-blue-400 font-mono">{results.J_ratio.toFixed(2)}</span></p>
        <p className="text-gray-300">Packing Density: <span className="text-blue-400 font-mono">{results.packingDensity.toFixed(4)}</span></p>
        <p className="text-gray-300">Compressive Stress: <span className="text-blue-400 font-mono">{results.stress.toFixed(1)} MPa</span></p>
        <p className="text-gray-300">Effective n: <span className="text-blue-400 font-mono">{results.nEff.toFixed(4)}</span></p>
        <p className="text-gray-300">Energy/Atom: <span className="text-blue-400 font-mono">{results.energyPerAtom.toFixed(1)} eV</span></p>
        <p className="text-gray-300">Sputter Yield (est.): <span className="text-blue-400 font-mono">{results.sputterYield.toFixed(3)} atoms/ion</span></p>
        <p className="text-gray-300">Ion Mean Free Path: <span className="text-blue-400 font-mono">{(results.mfp * 100).toFixed(1)} cm</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>J<sub>ratio</sub> = Φ<sub>ion</sub> / Φ<sub>atom</sub> (ion-to-atom arrival rate ratio)</p>
        <p>ρ<sub>eff</sub> = ρ<sub>base</sub> + Δρ·(1 − e<sup>−k·E·J<sub>ratio</sub>/r</sup>)</p>
        <p>σ ≈ k·√E·(J<sub>ratio</sub>/10) / r (compressive stress model)</p>
        <p>λ<sub>mfp</sub> ≈ k<sub>t</sub> / P (ion mean free path)</p>
      </div>

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Ion Energy (eV)", gridcolor: "#374151" },
        yaxis: { title: "Packing Density", gridcolor: "#374151", range: [0.7, 1.02], side: "left" },
        yaxis2: { title: "Stress (MPa)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />
    </CalculatorShell>
  );
}
