"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function AntiFogPage() {
  const [nCoat, setNCoat] = useURLState("nCoat", 1.33);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [thickness, setThickness] = useURLState("thickness", 120);
  const [contactAngle, setContactAngle] = useURLState("contactAngle", 15);

  // Anti-fog principle: hydrophilic coating → low contact angle → uniform water film
  // Optically: thin film acts as partial AR at visible wavelengths
  // Key metric: no scattering from water droplets when surface is hydrophilic (θ < 30°)

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 350 + i * 500 / N);
    const d = thickness; // nm

    const wlsM = wls.map((wl) => wl * 1e-9);
    const coating = { n: nCoat, thickness: d * 1e-9 };
    // Air | coating | substrate
    const R = reflectanceSpectrum({ incident: 1, layers: [coating], substrate: { n: nSub } }, wlsM);

    // With a uniform 1 µm water film on top (fog on a hydrophilic surface): air | water | coating | substrate
    const water = { n: 1.33, thickness: 1000e-9 };
    const RwithWater = reflectanceSpectrum({ incident: 1, layers: [water, coating], substrate: { n: nSub } }, wlsM);

    return { wls, R, RwithWater };
  }, [nCoat, nSub, thickness]);

  const T = tmm.R.map(r => 1 - r);
  const TwithWater = tmm.RwithWater.map(r => 1 - r);
  const avgT = T.reduce((a, b) => a + b) / T.length;
  const avgTwithWater = TwithWater.reduce((a, b) => a + b) / TwithWater.length;

  // Surface energy from contact angle (Young's equation approximation)
  // γ_sv = γ_sl + γ_lv · cos(θ) → cos(θ) close to 1 means hydrophilic
  const cosTheta = Math.cos(contactAngle * Math.PI / 180);
  const surfaceEnergy = cosTheta * 72.8; // mN/m, relative to water (γ_water = 72.8 mN/m)

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>coating</sub></>} value={nCoat} onChange={setNCoat} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Coating thickness (nm)" value={thickness} onChange={setThickness} />
        <ValidatedNumberInput label="Contact angle (°)" value={contactAngle} onChange={setContactAngle} min={0} max={90} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Dry T (avg)</p>
          <p className="text-2xl font-bold text-blue-400">{(avgT * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">With fog T (avg)</p>
          <p className="text-2xl font-bold text-cyan-400">{(avgTwithWater * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Surface Energy</p>
          <p className="text-2xl font-bold text-green-400">{surfaceEnergy.toFixed(1)} mN/m</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>TMM: M = [[cos(δ), i·sin(δ)/η], [i·η·sin(δ), cos(δ)]]</p>
          <p>δ = 2πn·d / λ (phase thickness)</p>
          <p>R = |r|² where r = (A·n_sub - D·n_inc + i(B·n_sub·n_inc - C·n_inc)) / (...)</p>
          <p>Surface energy: γ = γ_water · cos(θ_contact)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Dry T", line: { color: "#60a5fa", width: 2 } },
          { x: tmm.wls, y: TwithWater, type: "scatter", mode: "lines", name: "With fog T", line: { color: "#22d3ee", width: 2 } },
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Dry R", line: { color: "#f87171", width: 1, dash: "dot" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { orientation: "h", y: 1.12 },
        }} />
      </div>
    </>
  );
}
