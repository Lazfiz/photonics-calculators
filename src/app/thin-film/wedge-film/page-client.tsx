"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

export default function WedgeFilmPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.5);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [wedgeAngleDeg, setWedgeAngleDeg] = useURLState("wedgeAngleDeg", 0.1); // degrees

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);
    const reflectance = (dNm: number, wlNm: number) =>
      stackResponse({ incident: nInc, layers: [{ n: nFilm, thickness: dNm * 1e-9 }], substrate: { n: nSub } }, wlNm * 1e-9).R;

    // The thickness grows by tan α across the surface; at the centre it is a quarter wave at λ₀.
    const slopeNmPerMm = Math.tan(wedgeAngleDeg * Math.PI / 180) * 1e6;
    const dCenter = designWl / (4 * nFilm);
    // Bright-to-bright spacing at λ₀ (thickness step λ₀/2n); the film edge (d = 0) is at −Δx/2.
    const fringeSpacing = slopeNmPerMm > 0 ? designWl / (2 * nFilm * slopeNmPerMm) : NaN; // mm

    // Spectra at x = 0, Δx/4, Δx/2, Δx and 2Δx: 1, 1.5, 2, 3 and 5 quarter waves thick.
    const posFractions = [0, 0.25, 0.5, 1, 2];
    const posColors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];
    const mainTraces = Number.isFinite(fringeSpacing)
      ? posFractions.map((frac, i) => {
          const x = frac * fringeSpacing;
          const d = dCenter + x * slopeNmPerMm;
          return {
            x: wls, y: wls.map(wl => reflectance(d, wl)), type: "scatter" as const, mode: "lines" as const,
            name: `x = ${x.toPrecision(3)} mm (d = ${d.toFixed(0)} nm)`, line: { color: posColors[i], width: 1.5 },
          };
        })
      : [];

    // R vs position at λ₀ over 10 fringes starting at the film edge (x = −Δx/2, d = 0), 100 points per fringe; x = 0 is where d = λ₀/4n.
    const positions = Number.isFinite(fringeSpacing)
      ? Array.from({ length: 1001 }, (_, i) => -fringeSpacing / 2 + (i * 10 * fringeSpacing) / 1000)
      : [];
    const R_vs_pos = positions.map(pos => reflectance(Math.max(dCenter + pos * slopeNmPerMm, 0), designWl));

    return { mainTraces, positions, R_vs_pos, fringeSpacing };
  }, [nFilm, nSub, nInc, designWl, wedgeAngleDeg]);

  const fringeSpacing = chartData.fringeSpacing;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>film</sub></>} value={nFilm} onChange={setNFilm} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} step="10" />
        <ValidatedNumberInput label="Wedge angle α (degrees)" value={wedgeAngleDeg} onChange={setWedgeAngleDeg} min={0.001} max={2} step="0.001" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Fringe spacing Δx = <span className="text-blue-400 font-mono">{Number.isFinite(fringeSpacing) ? `${fringeSpacing.toFixed(3)} mm` : "—"}</span></p>
        <p className="text-gray-300">Thickness at x = 0 = <span className="text-blue-400 font-mono">{(designWl / (4 * nFilm)).toFixed(1)} nm</span></p>
        <p className="text-gray-300 text-xs mt-2">Δx = λ / (2·n<sub>f</sub>·tan α) — spacing between adjacent bright fringes</p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "R vs Wavelength at Different Positions", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.positions, y: chartData.R_vs_pos, type: "scatter" as const, mode: "lines" as const, name: `R at λ₀ = ${designWl} nm`, line: { color: "#fbbf24", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Position (at design λ)", font: { size: 13 } },
        xaxis: { title: "Position x (mm), x = 0 where d = λ₀/4n", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
