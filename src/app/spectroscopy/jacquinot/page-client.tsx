"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function JacquinotPage() {
  const [maxOPD, setMaxOPD] = useURLState("maxOPD", 1.0); // cm
  const [wavenumber, setWavenumber] = useURLState("wavenumber", 1000); // cm⁻¹

  const chartData = useMemo(() => {
    const wns = Array.from({ length: 300 }, (_, i) => 400 + i * 3600 / 300);
    // Jacquinot advantage: throughput = 2π·A·Ω = π·θ² (for FTIR circular aperture)
    // G = (2π·Δν̃)/ν̃ where Δν̃ = 1/(2·L) is resolution
    const resolution = wns.map(wn => 1 / maxOPD);
    const G = wns.map(wn => (2 * Math.PI) / (wn * maxOPD));
    // Also: etendue advantage over grating
    // FTIR throughput advantage ≈ 2π·Δν̃/ν̃ ≈ 2π/(ν̃·2L) = π/(ν̃·L)
    return [{ x: wns, y: G, type: "scatter" as const, mode: "lines" as const, name: "Throughput Advantage", line: { color: "#60a5fa" } }];
  }, [maxOPD]);

  const deltaNu = 1 / maxOPD;
  const jacquinotAdv = (2 * Math.PI) / (wavenumber * maxOPD);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Jacquinot Advantage" description="Maximum solid angle of an FTIR interferometer: Ω = 2π/(ν̃·L). True Jacquinot advantage = T_FT/T_G is the throughput ratio vs a grating spectrometer.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Max OPD (cm)" value={maxOPD} onChange={setMaxOPD} step="0.1" />
        <ValidatedNumberInput label="Wavenumber (cm⁻¹)" value={wavenumber} onChange={setWavenumber} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Resolution Δν̃ = <span className="text-blue-400 font-mono">{deltaNu.toFixed(3)} cm⁻¹</span></p>
        <p className="text-gray-300">Jacquinot Advantage (Ω) at {wavenumber} cm⁻¹ = <span className="text-blue-400 font-mono">{jacquinotAdv.toExponential(3)} sr</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151" }, yaxis: { title: "Solid Angle Ω (sr)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
