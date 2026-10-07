"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function AngleTuningPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairs, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);
    const lambdas = wls.map((wl) => wl * 1e-9);
    const indices = Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
    const stack = { incident: nInc, layers: quarterWaveLayers(indices, designWl * 1e-9), substrate: { n: nSub } };

    const traces: any[] = [];
    const angles = [0, 15, 30, 45];
    const angleColors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

    for (let ai = 0; ai < angles.length; ai++) {
      const angle = angles[ai] * Math.PI / 180;
      const RTE = reflectanceSpectrum(stack, lambdas, angle, "s");
      const RTM = reflectanceSpectrum(stack, lambdas, angle, "p");

      traces.push({
        x: wls, y: RTE, type: "scatter" as const, mode: "lines" as const,
        name: `${angles[ai]}° TE (s)`, line: { color: angleColors[ai], width: 2 },
      });
      traces.push({
        x: wls, y: RTM, type: "scatter" as const, mode: "lines" as const,
        name: `${angles[ai]}° TM (p)`, line: { color: angleColors[ai], width: 1, dash: "dash" },
      });
    }

    // Center wavelength shift vs angle
    const angleSweep = Array.from({ length: 90 }, (_, i) => i);
    // For a QWL stack, λ(θ) ≈ λ₀ × cos(θ_eff), approximate shift
    const lambdaShift = angleSweep.map(a => {
      const aRad = a * Math.PI / 180;
      return designWl * Math.sqrt(1 - Math.pow(nInc * Math.sin(aRad) / ((nH + nL) / 2), 2));
    });

    return { mainTraces: traces, angleSweep, lambdaShift };
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Angle Tuning of Coatings" description="Changing the angle of incidence shifts the spectral response of thin film coatings toward
        shorter wavelengths (blue shift). TE (s-polarization) and TM (p-polarization) respond differently,
        with TM showing reduced reflectance at Brewster&apos;s angle. The shift follows
        λ(θ) ≈ λ₀·√(1 − (n₀ sin θ/neff)²).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={20} />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs">Solid lines = TE (s-pol), Dashed = TM (p-pol). Each color = different angle.</p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Wavelength at Various Angles", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 9 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.angleSweep, y: chartData.lambdaShift, type: "scatter" as const, mode: "lines" as const, name: "λ_center(θ)", line: { color: "#a78bfa", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Center Wavelength Shift vs Angle", font: { size: 13 } },
        xaxis: { title: "Angle of incidence (°)", gridcolor: "#374151" },
        yaxis: { title: "λ_center (nm)", gridcolor: "#374151" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
