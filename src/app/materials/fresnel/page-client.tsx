"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";
interface FresnelResult {
  Rs: number;
  Rp: number;
  R_avg: number;
  T_avg: number;
  thetaT: number;
}

function fresnel(n1: number, n2: number, thetaI: number): FresnelResult {
  const sinThetaT = (n1 * Math.sin(thetaI)) / n2;
  if (Math.abs(sinThetaT) > 1) {
    return { Rs: 1, Rp: 1, R_avg: 1, T_avg: 0, thetaT: NaN };
  }
  const thetaT = Math.asin(sinThetaT);
  const cosI = Math.cos(thetaI);
  const cosT = Math.cos(thetaT);
  const Rs = Math.pow((n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT), 2);
  const Rp = Math.pow((n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT), 2);
  return { Rs, Rp, R_avg: (Rs + Rp) / 2, T_avg: 1 - (Rs + Rp) / 2, thetaT };
}

const interfacePresets = [
  { label: "Air → Glass", n1: 1.0, n2: 1.5 },
  { label: "Glass → Air", n1: 1.5, n2: 1.0 },
  { label: "Air → Water", n1: 1.0, n2: 1.33 },
  { label: "Silica → Air", n1: 1.45, n2: 1.0 },
];
const currentHref = "/materials/fresnel";

export default function FresnelPage() {
  const [n1, setN1] = useURLState("n1", 1.0);
  const [n2, setN2] = useURLState("n2", 1.5);
  const [angle, setAngle] = useURLState("angle", 45);

  const result = useMemo(() => fresnel(n1, n2, (angle * Math.PI) / 180), [n1, n2, angle]);
  const brewster = Math.atan(n2 / n1) * 180 / Math.PI;

  const series = useMemo(() => {
    const angles = Array.from({ length: 181 }, (_, i) => i * 0.5);
    return [
      { name: "Rs (s-pol)", color: "#3b82f6", points: angles.map((a) => ({ x: a, y: fresnel(n1, n2, (a * Math.PI) / 180).Rs * 100 })) },
      { name: "Rp (p-pol)", color: "#ef4444", points: angles.map((a) => ({ x: a, y: fresnel(n1, n2, (a * Math.PI) / 180).Rp * 100 })) },
      { name: "Ravg", color: "#f59e0b", dashed: true, points: angles.map((a) => ({ x: a, y: fresnel(n1, n2, (a * Math.PI) / 180).R_avg * 100 })) },
      { name: "Current angle", color: "#22c55e", showPoints: true, points: [{ x: angle, y: result.R_avg * 100 }] },
    ];
  }, [n1, n2, angle, result.R_avg]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Fresnel Equations" description="Reflection and transmission at a dielectric interface with angle sweeps, presets, and polarization split.">
      <div className="mb-5 flex flex-wrap gap-2">
        {interfacePresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setN1(preset.n1);
              setN2(preset.n2);
            }}
            className={`rounded-full border px-3 py-1 text-sm transition ${n1 === preset.n1 && n2 === preset.n2 ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-xs text-gray-400 font-mono leading-6">
        R<sub>s</sub> = ((n₁cosθᵢ − n₂cosθₜ)/(n₁cosθᵢ + n₂cosθₜ))² &nbsp;|&nbsp; R<sub>p</sub> = ((n₂cosθᵢ − n₁cosθₜ)/(n₂cosθᵢ + n₁cosθₜ))²
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <InputSlider label="n₁ (incident medium)" value={n1} onChange={setN1} min={1} max={3} step={0.01} />
        <InputSlider label="n₂ (transmitting medium)" value={n2} onChange={setN2} min={1} max={3} step={0.01} />
        <InputSlider label="Angle of incidence" value={angle} onChange={setAngle} min={0} max={89.9} step={0.1} unit="deg" />
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5 mb-8">
        <ResultCard label="Rs (s-pol)" value={`${(result.Rs * 100).toFixed(3)}%`} tone="blue" />
        <ResultCard label="Rp (p-pol)" value={`${(result.Rp * 100).toFixed(3)}%`} tone="red" />
        <ResultCard label="Ravg" value={`${(result.R_avg * 100).toFixed(3)}%`} tone="yellow" />
        <ResultCard label="Tavg" value={`${(result.T_avg * 100).toFixed(3)}%`} tone="green" />
        <ResultCard label="θt" value={isNaN(result.thetaT) ? "TIR" : `${((result.thetaT * 180) / Math.PI).toFixed(2)}°`} tone="purple" />
      </div>

      <div className="mb-6 text-sm text-gray-400">
        Brewster angle: <span className="font-semibold text-green-400">{brewster.toFixed(2)}°</span>
      </div>

      <SimpleLineChart title="Reflectance vs angle" xLabel="Angle of incidence (°)" yLabel="Reflectance (%)" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
