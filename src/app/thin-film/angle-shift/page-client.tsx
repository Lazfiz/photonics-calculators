"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function AngleShiftPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [maxAngle, setMaxAngle] = useURLState("maxAngle", 60);

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => (i * maxAngle) / 200);
    // The phase thickness 2πnd·cos θ_film/λ is the same for s and p, so the quarter-wave point of
    // a film moves to λ₀·cos θ_film for both (incidence from air).
    const shift = angles.map(theta => {
      const t = (theta * Math.PI) / 180;
      const cosT = Math.sqrt(1 - (Math.sin(t) / nFilm) ** 2);
      return designWl * cosT;
    });
    return [
      { x: angles, y: shift, type: "scatter" as const, mode: "lines" as const, name: "λ₀·cos θ_film (s and p)", line: { color: "#60a5fa" } },
    ];
  }, [nFilm, designWl, maxAngle]);

  const cos45film = Math.sqrt(1 - (Math.sin(45 * Math.PI / 180) / nFilm) ** 2);
  const shiftAt45 = designWl * cos45film;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>film</sub></>} value={nFilm} onChange={setNFilm} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Max Angle (°)" value={maxAngle} onChange={setMaxAngle} min={1} max={89} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Effective λ at 45° = <span className="text-blue-400 font-mono">{shiftAt45.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Blue shift at 45° = <span className="text-blue-400 font-mono">{(designWl - shiftAt45).toFixed(1)} nm</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Angle of Incidence (°)", gridcolor: "#374151" }, yaxis: { title: "Effective λ (nm)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true }} />
    </>
  );
}
