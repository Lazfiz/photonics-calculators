"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ResearchLabSafetyPage() {
  const [power, setPower] = useURLState("power", 500); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 780); // nm (Ti:Sapph)
  const [beamDia, setBeamDia] = useURLState("beamDia", 1.5); // mm
  const [divergence, setDivergence] = useURLState("divergence", 1.5); // mrad
  const [numBeams, setNumBeams] = useURLState("numBeams", 1); // multiple beam paths
  const [labLength, setLabLength] = useURLState("labLength", 5); // m
  const [labWidth, setLabWidth] = useURLState("labWidth", 4); // m

  // MPE: retinal hazard (400-1400nm) in W/cm² — ANSI Z136.1 simplified
  // Visible (400-700nm): ~1.8e-3 × t^-0.25 W/cm²; Near-IR (700-1400nm): C_A × 1e-3 W/cm²
  // Far-IR (>1400nm): corneal hazard, ~0.1 W/cm² (order of magnitude)
  const mpeWcm2 = wavelength <= 700 ? 1.8e-3 : (wavelength <= 1400 ? 1e-3 : 0.1);

  const beamAreaCm2 = Math.PI * Math.pow(beamDia / 20, 2);
  const powerDensity = (power / 1000) / beamAreaCm2;
  const odRequired = Math.ceil(Math.log10(powerDensity / mpeWcm2));

  // NOHD
  const nohd = useMemo(() => {
    const a = (beamDia / 2) / 1000;
    const phi = divergence / 1000;
    const mpeWm2 = mpeWcm2 * 1e4;
    const factor = 1.27 * (power / 1000) / (mpeWm2 * a * a);
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [power, beamDia, divergence, mpeWcm2]);

  // Lab diagonal (worst case specular reflection path)
  const labDiagonal = Math.sqrt(labLength * labLength + labWidth * labWidth);
  const labArea = labLength * labWidth;
  const labPerimeter = 2 * (labLength + labWidth);

  // Classification
  const classification = useMemo(() => {
    const pw = power / 1000;
    if (pw <= 0.004) return { class: "1", color: "text-green-400" };
    if (pw <= 0.01 && wavelength <= 1400) return { class: "1M", color: "text-green-400" };
    if (pw <= 0.001 && wavelength <= 700) return { class: "1", color: "text-green-400" };
    if (wavelength <= 700 && pw <= 1) return { class: "2", color: "text-yellow-400" };
    if (wavelength <= 1400 && pw <= 0.5) return { class: "3R", color: "text-orange-400" };
    if (pw <= 0.5) return { class: "3R", color: "text-orange-400" };
    if (pw <= 500) return { class: "3B", color: "text-red-400" };
    return { class: "4", color: "text-red-500" };
  }, [power, wavelength]);

  // Multiple beam paths total hazard
  const totalPower = power * numBeams;
  const totalNOHD = nohd * Math.sqrt(numBeams);

  // Beam path analysis at lab walls
  const wallIrradiance = useMemo(() => {
    const dMin = Math.min(labLength, labWidth);
    const bd = beamDia + dMin * divergence;
    return (power / 1000) / (Math.PI * Math.pow(bd / 20, 2));
  }, [power, beamDia, divergence, labLength, labWidth]);

  // Scatter plot: irradiance map (simplified 2D)
  const heatmapData = useMemo(() => {
    const n = 30;
    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];
    for (let i = 0; i < n; i++) {
      const xi = (i / (n - 1)) * labLength;
      x.push(Math.round(xi * 10) / 10);
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        const yj = (j / (n - 1)) * labWidth;
        y.push(Math.round(yj * 10) / 10);
        const dist = Math.sqrt(xi * xi + yj * yj);
        const bd = beamDia + dist * divergence;
        const irr = (totalPower / 1000) / (Math.PI * Math.pow(bd / 20, 2));
        row.push(Math.log10(Math.max(irr, 1e-10)));
      }
      z.push(row);
    }
    return [{ x, y, z, type: "heatmap" as const, colorscale: "Hot", showscale: true,
      colorbar: { title: { text: "log₁₀(E) W/cm²", font: { color: "#9ca3af" } }, tickfont: { color: "#9ca3af" } } }];
  }, [totalPower, beamDia, divergence, labLength, labWidth]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Research Lab Laser Safety Calculator" description="Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Power per beam (mW)" value={power} onChange={setPower} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDia} onChange={setBeamDia} step="0.1" />
        <ValidatedNumberInput label="Divergence (mrad)" value={divergence} onChange={setDivergence} step="0.1" />
        <ValidatedNumberInput label="Number of Beam Paths" value={numBeams} onChange={setNumBeams} />
        <ValidatedNumberInput label="Lab Length (m)" value={labLength} onChange={setLabLength} step="0.5" />
        <ValidatedNumberInput label="Lab Width (m)" value={labWidth} onChange={setLabWidth} step="0.5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Classification</p>
          <p className={`text-2xl font-bold ${classification.color}`}>Class {classification.class}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">NOHD (per beam)</p>
          <p className="text-2xl font-bold text-red-400">{nohd.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Min OD Required</p>
          <p className="text-2xl font-bold text-yellow-400">OD{odRequired}+</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Wall Irradiance (min)</p>
          <p className="text-2xl font-bold text-orange-400">{wallIrradiance.toFixed(2)} W/cm²</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Lab Diagonal</p>
          <p className="text-xl font-bold text-gray-300">{labDiagonal.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Total Power ({numBeams} beams)</p>
          <p className="text-xl font-bold text-gray-300">{totalPower.toFixed(0)} mW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">NOHD exceeds room?</p>
          <p className={`text-xl font-bold ${nohd > labDiagonal ? "text-red-400" : "text-green-400"}`}>{nohd > labDiagonal ? "⚠ YES" : "✓ NO"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>NOHD = (1/φ)(√(1.27P/(MPE·a²)) − 1)</p>
          <p>E(z) = P / (π(d₀ + zφ)²/4)</p>
          <p>OD<sub>min</sub> = ⌈log₁₀(E / MPE)⌉</p>
          <p>Lab diagonal = √(L² + W²)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={heatmapData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Lab Length (m)", gridcolor: "#374151" },
          yaxis: { title: "Lab Width (m)", gridcolor: "#374151" },
          margin: { t: 30, r: 80, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
