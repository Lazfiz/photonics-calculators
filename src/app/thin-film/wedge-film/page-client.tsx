"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function WedgeFilmPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.5);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [wedgeAngleDeg, setWedgeAngleDeg] = useURLState("wedgeAngleDeg", 0.1); // degrees

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);
    const r1 = (nInc - nFilm) / (nInc + nFilm);
    const r2 = (nFilm - nSub) / (nFilm + nSub);

    // Wedge angle causes thickness to vary across the surface
    // For a collimated beam at normal incidence, the thickness varies linearly
    // Δd = tan(α) × position, but for a uniform beam, the effect is averaging
    // Show R vs position for fixed wavelength, and R vs wavelength at different positions

    const wedgeRad = wedgeAngleDeg * Math.PI / 180;
    const positions = Array.from({ length: 200 }, (_, i) => (i - 100) * 0.5); // mm across surface

    // At center, thickness = QWL
    const dCenter = designWl / (4 * nFilm);

    // R vs wavelength at different positions
    const traces: any[] = [];
    const posValues = [-2, -1, 0, 1, 2]; // mm from center
    const posColors = ["#f87171", "#fbbf24", "#60a5fa", "#34d399", "#a78bfa"];

    for (let pi = 0; pi < posValues.length; pi++) {
      const d = dCenter + posValues[pi] * Math.tan(wedgeRad) * 1e6; // convert mm*rad to nm
      if (d <= 0) continue;
      const R = wls.map(wl => {
        const delta = (2 * Math.PI * nFilm * d) / wl;
        const cos2d = Math.cos(2 * delta);
        const num = r1 * r1 + r2 * r2 + 2 * r1 * r2 * cos2d;
        const den = 1 + r1 * r1 * r2 * r2 + 2 * r1 * r2 * cos2d;
        return num / den;
      });
      traces.push({
        x: wls, y: R, type: "scatter" as const, mode: "lines" as const,
        name: `x = ${posValues[pi]} mm`, line: { color: posColors[pi], width: 1.5 },
      });
    }

    // R vs position at design wavelength
    const R_vs_pos = positions.map(pos => {
      const d = dCenter + pos * Math.tan(wedgeRad) * 1e6;
      if (d <= 0) return 0;
      const delta = (2 * Math.PI * nFilm * d) / designWl;
      const cos2d = Math.cos(2 * delta);
      const num = r1 * r1 + r2 * r2 + 2 * r1 * r2 * cos2d;
      const den = 1 + r1 * r1 * r2 * r2 + 2 * r1 * r2 * cos2d;
      return num / den;
    });

    // Fringe spacing calculation
    const fringeSpacing = designWl / (2 * nFilm * Math.tan(wedgeRad) * 1e6); // mm between fringes

    return { mainTraces: traces, positions, R_vs_pos, fringeSpacing };
  }, [nFilm, nSub, nInc, designWl, wedgeAngleDeg]);

  const fringeSpacing = chartData.fringeSpacing;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Wedge Thin Film" description="Wedged thin films have a linearly varying thickness across the surface, creating spatially
        varying interference. Used in optical testing (Newton&apos;s rings, Fizeau interferometry),
        anti-reflection edge filters, and precision thickness measurement. The fringe spacing
        Δx = λ / (2n·tan α) determines the spatial period of constructive interference.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>film</sub></span>
          <ValidatedNumberInput label="nfilm" value={nFilm} onChange={setNFilm} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <ValidatedNumberInput label="nsubstrate" value={nSub} onChange={setNSub} step="0.01" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <ValidatedNumberInput label="nincident" value={nInc} onChange={setNInc} step="0.01" /></label>
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} step="10" />
        <ValidatedNumberInput label="Wedge angle α (degrees)" value={wedgeAngleDeg} onChange={setWedgeAngleDeg} min={0.001} max={10} step="0.001" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Fringe spacing Δx = <span className="text-blue-400 font-mono">{fringeSpacing.toFixed(3)} mm</span></p>
        <p className="text-gray-300">Thickness at center = <span className="text-blue-400 font-mono">{(designWl / (4 * nFilm)).toFixed(1)} nm</span></p>
        <p className="text-gray-300 text-xs mt-2">Δx = λ / (2·n<sub>f</sub>·tan α) — spacing between adjacent bright fringes</p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "R vs Wavelength at Different Positions", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.positions, y: chartData.R_vs_pos, type: "scatter" as const, mode: "lines" as const, name: `R at λ₀ = ${designWl} nm`, line: { color: "#fbbf24", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Position (at design λ)", font: { size: 13 } },
        xaxis: { title: "Position from center (mm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
