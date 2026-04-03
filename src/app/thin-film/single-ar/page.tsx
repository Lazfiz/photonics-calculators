"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

function snellAngle(nFrom: number, nTo: number, thetaFrom: number) {
  const sinTheta = (nFrom / nTo) * Math.sin(thetaFrom);
  if (Math.abs(sinTheta) > 1) return null;
  return Math.asin(sinTheta);
}

function interfaceReflectance(
  n0: number,
  n1: number,
  n2: number,
  theta0: number,
  wavelength: number,
  thickness: number
) {
  const theta1 = snellAngle(n0, n1, theta0);
  if (theta1 === null) return { Rs: 1, Rp: 1, theta1: null as number | null, theta2: null as number | null };

  const theta2 = snellAngle(n1, n2, theta1);
  if (theta2 === null) return { Rs: 1, Rp: 1, theta1, theta2: null as number | null };

  const cos0 = Math.cos(theta0);
  const cos1 = Math.cos(theta1);
  const cos2 = Math.cos(theta2);

  const r01s = (n0 * cos0 - n1 * cos1) / (n0 * cos0 + n1 * cos1);
  const r12s = (n1 * cos1 - n2 * cos2) / (n1 * cos1 + n2 * cos2);
  const r01p = (n1 * cos0 - n0 * cos1) / (n1 * cos0 + n0 * cos1);
  const r12p = (n2 * cos1 - n1 * cos2) / (n2 * cos1 + n1 * cos2);

  const delta = (2 * Math.PI * n1 * thickness * cos1) / wavelength;
  const c = Math.cos(2 * delta);
  const s = Math.sin(2 * delta);

  const reflectance = (r01: number, r12: number) => {
    const numeratorRe = r01 + r12 * c;
    const numeratorIm = -r12 * s;
    const denominatorRe = 1 + r01 * r12 * c;
    const denominatorIm = -r01 * r12 * s;
    const denomMag2 = denominatorRe ** 2 + denominatorIm ** 2;
    const rRe = (numeratorRe * denominatorRe + numeratorIm * denominatorIm) / denomMag2;
    const rIm = (numeratorIm * denominatorRe - numeratorRe * denominatorIm) / denomMag2;
    return rRe ** 2 + rIm ** 2;
  };

  return {
    Rs: reflectance(r01s, r12s),
    Rp: reflectance(r01p, r12p),
    theta1,
    theta2,
  };
}

export default function SingleARPage() {
  const [nSubstrate, setNSubstrate] = useState(1.52);
  const [nFilm, setNFilm] = useState(1.38);
  const [nIncident, setNIncident] = useState(1.0);
  const [designWavelength, setDesignWavelength] = useState(550);
  const [angle, setAngle] = useState(0);

  const theta0 = (angle * Math.PI) / 180;
  const theta1 = snellAngle(nIncident, nFilm, theta0);
  const designThickness = theta1 === null ? 0 : designWavelength / (4 * nFilm * Math.cos(theta1));

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 300 + i * 5);
    const Rs = wls.map((wl) => interfaceReflectance(nIncident, nFilm, nSubstrate, theta0, wl, designThickness).Rs);
    const Rp = wls.map((wl) => interfaceReflectance(nIncident, nFilm, nSubstrate, theta0, wl, designThickness).Rp);
    const Ru = Rs.map((value, i) => 0.5 * (value + Rp[i]));

    return [
      { x: wls, y: Ru, type: "scatter" as const, mode: "lines" as const, name: "Unpolarized", line: { color: "#60a5fa", width: 3 } },
      { x: wls, y: Rs, type: "scatter" as const, mode: "lines" as const, name: "s-pol", line: { color: "#f472b6", dash: "dash" } },
      { x: wls, y: Rp, type: "scatter" as const, mode: "lines" as const, name: "p-pol", line: { color: "#34d399", dash: "dot" } },
    ];
  }, [nIncident, nFilm, nSubstrate, theta0, designThickness]);

  const optimalNFilm = Math.sqrt(nSubstrate * nIncident);
  const atDesign = interfaceReflectance(nIncident, nFilm, nSubstrate, theta0, designWavelength, designThickness);
  const averageDesignR = 0.5 * (atDesign.Rs + atDesign.Rp);

  return (
    <CalculatorShell
      backHref="/thin-film"
      backLabel="Thin Film"
      title="Single Layer AR Coating"
      description="Quarter-wave antireflection coating design with Snell’s law and explicit s/p polarization handling at oblique incidence."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n (incident medium)</span>
          <input type="number" value={nIncident} onChange={e => setNIncident(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n (film)</span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n (substrate)</span>
          <input type="number" value={nSubstrate} onChange={e => setNSubstrate(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Design Wavelength (nm)</span>
          <input type="number" value={designWavelength} onChange={e => setDesignWavelength(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Incidence Angle (deg)</span>
          <input type="number" value={angle} onChange={e => setAngle(+e.target.value)} min="0" max="89" step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Optimal n_film" value={optimalNFilm.toFixed(3)} tone="green" subtext="Normal-incidence target" />
        <ResultCard label="Quarter-wave thickness" value={`${designThickness.toFixed(1)} nm`} tone="blue" subtext="Uses θ₁ inside the film" />
        <ResultCard label="R @ design λ (avg)" value={`${(100 * averageDesignR).toFixed(2)} %`} tone="yellow" subtext="Unpolarized" />
        <ResultCard
          label="Internal film angle"
          value={theta1 === null ? "TIR" : `${(theta1 * 180 / Math.PI).toFixed(2)}°`}
          tone="purple"
          subtext="From Snell’s law"
        />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6">
        <p>
          This version propagates the external angle through each interface with Snell’s law and calculates separate
          <span className="text-pink-300"> s-polarized</span> and <span className="text-green-300">p-polarized</span>
          reflectance before averaging.
        </p>
      </div>

      <ChartPanel
        data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 60 },
          height: 400,
        }}
      />
    </CalculatorShell>
  );
}
