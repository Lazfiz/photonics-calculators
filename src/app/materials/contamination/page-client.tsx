"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

interface Material {
  name: string;
  // Scatter per particle density (ppm) at 1064nm
  scatterPerPpm: number; // % per ppm
  // Absorption per particle density
  absPerPpm: number; // cm⁻¹ per ppm
  // Particle adhesion rate (relative, 1 = moderate)
  adhesionRate: number;
  // Cleanability (fraction removable with standard cleaning)
  cleanability: number;
  // Laser cleaning threshold (J/cm²)
  laserCleanThreshold: number;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica", scatterPerPpm: 0.05, absPerPpm: 0.001, adhesionRate: 0.5, cleanability: 0.95, laserCleanThreshold: 0.1 },
  "BK7": { name: "BK7", scatterPerPpm: 0.06, absPerPpm: 0.001, adhesionRate: 0.6, cleanability: 0.90, laserCleanThreshold: 0.08 },
  "AR Coating": { name: "AR Coating (generic)", scatterPerPpm: 0.15, absPerPpm: 0.005, adhesionRate: 1.0, cleanability: 0.7, laserCleanThreshold: 0.05 },
  "HR Mirror": { name: "HR Mirror Coating", scatterPerPpm: 0.2, absPerPpm: 0.01, adhesionRate: 0.8, cleanability: 0.6, laserCleanThreshold: 0.03 },
  "CaF2": { name: "CaF₂", scatterPerPpm: 0.04, absPerPpm: 0.0008, adhesionRate: 0.4, cleanability: 0.92, laserCleanThreshold: 0.12 },
  "ZnSe": { name: "ZnSe", scatterPerPpm: 0.07, absPerPpm: 0.002, adhesionRate: 0.7, cleanability: 0.85, laserCleanThreshold: 0.06 },
  "Gold Mirror": { name: "Gold Mirror", scatterPerPpm: 0.25, absPerPpm: 0.02, adhesionRate: 0.9, cleanability: 0.5, laserCleanThreshold: 0.02 },
  "Dielectric Coating": { name: "Dielectric Coating", scatterPerPpm: 0.18, absPerPpm: 0.008, adhesionRate: 0.9, cleanability: 0.65, laserCleanThreshold: 0.04 },
};

interface Contaminant {
  name: string;
  particleSize: number; // μm (mean)
  density: number; // g/cm³
  absorptionCoeff: number; // relative
  scatteringCoeff: number; // relative (Mie)
  chemicalRisk: number; // 0-1
}

const contaminants: Record<string, Contaminant> = {
  "Dust (ambient)": { name: "Dust (ambient)", particleSize: 2, density: 2.5, absorptionCoeff: 0.3, scatteringCoeff: 1.0, chemicalRisk: 0.1 },
  "Hydrocarbons": { name: "Hydrocarbons (vacuum)", particleSize: 0.01, density: 0.9, absorptionCoeff: 0.8, scatteringCoeff: 0.05, chemicalRisk: 0.5 },
  "Metal particles": { name: "Metal particles", particleSize: 5, density: 7.8, absorptionCoeff: 1.0, scatteringCoeff: 0.8, chemicalRisk: 0.3 },
  "Fibers": { name: "Fibers (lint)", particleSize: 10, density: 1.5, absorptionCoeff: 0.2, scatteringCoeff: 1.5, chemicalRisk: 0.1 },
  "Molecular film": { name: "Molecular film", particleSize: 0.001, density: 1.0, absorptionCoeff: 0.6, scatteringCoeff: 0.01, chemicalRisk: 0.7 },
  "Salts": { name: "Salt residues", particleSize: 1, density: 2.2, absorptionCoeff: 0.4, scatteringCoeff: 0.5, chemicalRisk: 0.4 },
};

function totalScatterLoss(mat: Material, cont: Contaminant, ppm: number): number {
  return ppm * mat.scatterPerPpm * cont.scatteringCoeff;
}

function totalAbsorption(mat: Material, cont: Contaminant, ppm: number): number {
  return ppm * mat.absPerPpm * cont.absorptionCoeff;
}

function contaminationGrowth(baseRate: number, time: number, cleaning: number): number {
  // Growth with periodic cleaning: P(t) = P0 * (1 + r*t) * (1-C)^floor(t/T_clean)
  const cleanPeriod = 30; // days
  const cleans = Math.floor(time / cleanPeriod);
  return baseRate * (1 + time * 0.01) * Math.pow(1 - cleaning, cleans);
}

export default function ContaminationPage() {
  const [selectedMat, setSelectedMat] = useState("Fused Silica");
  const [selectedCont, setSelectedCont] = useState("Dust (ambient)");
  const [ppm, setPpm] = useURLState("ppm", 10);
  const [wavelength, setWavelength] = useURLState("wavelength", 1064);
  const [exposureDays, setExposureDays] = useURLState("exposureDays", 90);

  const mat = materials[selectedMat];
  const cont = contaminants[selectedCont];
  const scatter = useMemo(() => totalScatterLoss(mat, cont, ppm), [mat, cont, ppm]);
  const absorption = useMemo(() => totalAbsorption(mat, cont, ppm), [mat, cont, ppm]);
  const contamination = useMemo(() => contaminationGrowth(ppm, exposureDays, mat.cleanability * 0.8), [ppm, exposureDays, mat.cleanability]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 100 }, (_, i) => i * 3.65);
    return [
      {
        x: days,
        y: days.map(d => contaminationGrowth(ppm, d, mat.cleanability * 0.8)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Contamination level", line: { color: "#3b82f6", width: 2 },
        yaxis: "y",
      },
      {
        x: days,
        y: days.map(d => totalScatterLoss(mat, cont, contaminationGrowth(ppm, d, mat.cleanability * 0.8))),
        type: "scatter" as const, mode: "lines" as const,
        name: "Scatter loss (%)", line: { color: "#ef4444", width: 2, dash: "dash" },
        yaxis: "y2",
      },
    ];
  }, [selectedMat, selectedCont, ppm, mat, cont]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Contamination Effects" description="Particle contamination impact on optical surfaces">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
        <p>Scatter ∝ particle density × Mie(λ) &nbsp;|&nbsp; Absorption ∝ α_cont × density &nbsp;|&nbsp; P(t) = P₀·(1+rt)·(1-C)^⌊t/T⌋</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Optical Surface</label>
          <select value={selectedMat} onChange={e => setSelectedMat(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Contaminant</label>
          <select value={selectedCont} onChange={e => setSelectedCont(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(contaminants).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Initial contamination (ppm)</label>
          <ValidatedNumberInput label="Initial contamination (ppm)" value={ppm} onChange={setPpm} min={0.1} step="0.1" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exposure (days)</label>
          <ValidatedNumberInput label="Exposure (days)" value={exposureDays} onChange={setExposureDays} min={1} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Scatter loss</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{scatter.toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Added absorption</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{absorption.toExponential(2)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Contamination growth</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{contamination.toFixed(2)} ppm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cleanability</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{(mat.cleanability * 100).toFixed(0)}%</p>
        </div>
      </div>

      <ChartPanel data={chartData}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Time (days)", gridcolor: "#374151" },
          yaxis: { title: "Contamination (ppm)", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "Scatter Loss (%)", gridcolor: "#374151", overlaying: "y", side: "right" },
          margin: { t: 20, r: 60, b: 50, l: 70 },
          legend: { orientation: "h", y: -0.15 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
