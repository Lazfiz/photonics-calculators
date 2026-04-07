"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
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
    const nRe = r01 + r12 * c;
    const nIm = -r12 * s;
    const dRe = 1 + r01 * r12 * c;
    const dIm = -r01 * r12 * s;
    const dMag2 = dRe ** 2 + dIm ** 2;
    const rRe = (nRe * dRe + nIm * dIm) / dMag2;
    const rIm = (nIm * dRe - nRe * dIm) / dMag2;
    return rRe ** 2 + rIm ** 2;
  };

  return { Rs: reflectance(r01s, r12s), Rp: reflectance(r01p, r12p), theta1, theta2 };
}

const substratePresets = [1.45, 1.52, 1.76];
const currentHref = "/thin-film/single-ar";

export default function SingleARPage() {
  const [nSubstrate, setNSubstrate] = useState(1.52);
  const [nFilm, setNFilm] = useState(1.38);
  const [nIncident, setNIncident] = useState(1.0);
  const [designWavelength, setDesignWavelength] = useState(550);
  const [angle, setAngle] = useState(0);

  const theta0 = (angle * Math.PI) / 180;
  const theta1 = snellAngle(nIncident, nFilm, theta0);
  const designThickness = theta1 === null ? 0 : designWavelength / (4 * nFilm * Math.cos(theta1));
  const optimalNFilm = Math.sqrt(nSubstrate * nIncident);

  const series = useMemo(() => {
    const wls = Array.from({ length: 220 }, (_, i) => 350 + i * 4);
    const Rs = wls.map((wl) => interfaceReflectance(nIncident, nFilm, nSubstrate, theta0, wl, designThickness).Rs * 100);
    const Rp = wls.map((wl) => interfaceReflectance(nIncident, nFilm, nSubstrate, theta0, wl, designThickness).Rp * 100);
    const Ru = Rs.map((r, i) => 0.5 * (r + Rp[i]));
    return [
      { name: "Unpolarized", color: "#60a5fa", points: wls.map((x, i) => ({ x, y: Ru[i] })) },
      { name: "s-pol", color: "#f472b6", dashed: true, points: wls.map((x, i) => ({ x, y: Rs[i] })) },
      { name: "p-pol", color: "#34d399", dashed: true, points: wls.map((x, i) => ({ x, y: Rp[i] })) },
    ];
  }, [nIncident, nFilm, nSubstrate, theta0, designThickness]);

  const atDesign = interfaceReflectance(nIncident, nFilm, nSubstrate, theta0, designWavelength, designThickness);
  const averageDesignR = 0.5 * (atDesign.Rs + atDesign.Rp);

  return (
    <CalculatorShell
      backHref="/thin-film"
      backLabel="Thin Film"
      title="Single Layer AR Coating"
      description="Quarter-wave antireflection coating design with Snell’s law and explicit s/p polarization handling at oblique incidence."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {substratePresets.map((preset) => (
          <button key={preset} onClick={() => setNSubstrate(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${nSubstrate === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>nₛ = {preset}</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Incident medium index" value={nIncident} onChange={setNIncident} min={1} max={1.6} step={0.01} />
        <InputSlider label="Film index" value={nFilm} onChange={setNFilm} min={1.1} max={2.4} step={0.01} />
        <InputSlider label="Substrate index" value={nSubstrate} onChange={setNSubstrate} min={1.3} max={2.4} step={0.01} />
        <InputSlider label="Design wavelength" value={designWavelength} onChange={setDesignWavelength} min={350} max={1100} step={1} unit="nm" />
        <InputSlider label="Incidence angle" value={angle} onChange={setAngle} min={0} max={75} step={1} unit="deg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Optimal n_film" value={optimalNFilm.toFixed(3)} tone="green" subtext="Normal-incidence target" />
        <ResultCard label="Quarter-wave thickness" value={`${designThickness.toFixed(1)} nm`} tone="blue" subtext="Uses θ₁ inside film" />
        <ResultCard label="R @ design λ" value={`${(100 * averageDesignR).toFixed(2)} %`} tone="yellow" subtext="Unpolarized average" />
        <ResultCard label="Film angle θ₁" value={theta1 === null ? "TIR" : `${(theta1 * 180 / Math.PI).toFixed(2)}°`} tone="purple" subtext="Snell’s law" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6">
        <p>
          The external angle propagates through each interface with Snell’s law, and the coating reflectance is evaluated separately for
          <span className="text-pink-300"> s-polarized</span> and <span className="text-green-300"> p-polarized</span> light before averaging.
        </p>
      </div>

      <SimpleLineChart
        title="Reflectance vs wavelength"
        xLabel="Wavelength (nm)"
        yLabel="Reflectance (%)"
        series={series}
      />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
