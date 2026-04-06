"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function AntiFogPage() {
  const [nCoat, setNCoat] = useState(1.33);
  const [nSub, setNSub] = useState(1.52);
  const [designWl, setDesignWl] = useState(550);
  const [thickness, setThickness] = useState(120);
  const [contactAngle, setContactAngle] = useState(15);

  // Anti-fog principle: hydrophilic coating → low contact angle → uniform water film
  // Optically: thin film acts as partial AR at visible wavelengths
  // Key metric: no scattering from water droplets when surface is hydrophilic (θ < 30°)

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 350 + i * 500 / N);
    const d = thickness; // nm

    const R = wls.map(wl => {
      // Transfer matrix for single layer: M = [[cos(δ), i·sin(δ)/η], [i·η·sin(δ), cos(δ)]]
      // Decompose into real/imaginary: M11=cos(δ), M12=i·sin(δ)/η, M21=i·η·sin(δ), M22=cos(δ)
      // r = (M11·nSub + M12·nSub·nInc - nInc·M21 - M22·nInc) / (M11·nSub + M12·nSub·nInc + nInc·M21 + M22·nInc)
      // Numerator: (cos(δ)·nSub - nInc·cos(δ)) + i·(sin(δ)/η·nSub·nInc - nInc·η·sin(δ))
      // Denominator: (cos(δ)·nSub + nInc·cos(δ)) + i·(sin(δ)/η·nSub·nInc + nInc·η·sin(δ))
      const delta = (2 * Math.PI * nCoat * d) / wl;
      const c = Math.cos(delta), s = Math.sin(delta);
      const eta = nCoat;
      const nInc = 1.0;

      // Real and imaginary parts of numerator and denominator
      const numR = c * nSub - nInc * c; // cos(δ)·(nSub - nInc)
      const numI = (s / eta) * nSub * nInc - nInc * eta * s; // sin(δ)·nInc·(nSub/eta - eta)
      const denR = c * nSub + nInc * c; // cos(δ)·(nSub + nInc)
      const denI = (s / eta) * nSub * nInc + nInc * eta * s; // sin(δ)·nInc·(nSub/eta + eta)

      return (numR * numR + numI * numI) / (denR * denR + denI * denI);
    });

    // With water layer on top (fog): n_water ≈ 1.33
    const RwithWater = wls.map(wl => {
      const delta1 = (2 * Math.PI * nCoat * d) / wl;
      const delta2 = (2 * Math.PI * 1.33 * 1000) / wl; // 1µm water film

      // Track complex matrix as 4 real values: [[A, iB], [iC, D]]
      let A = 1, B = 0, C = 0, D = 1;

      // Add layer: M_layer = [[cos(δ), i·sin(δ)/n], [i·n·sin(δ), cos(δ)]]
      const addLayer = (n: number, delta: number) => {
        const cl = Math.cos(delta), sl = Math.sin(delta);
        const nA = A * cl - B * n * sl;
        const nB = A * sl / n + B * cl;
        const nC = C * cl - D * n * sl;
        const nD = C * sl / n + D * cl;
        A = nA; B = nB; C = nC; D = nD;
      };

      addLayer(1.33, delta2); // water (from air side)
      addLayer(nCoat, delta1); // coating (from water side)

      // r = (A·nSub + iB·nSub·nInc - iC·nInc - D·nInc) / (A·nSub + iB·nSub·nInc + iC·nInc + D·nInc)
      const nInc = 1.0;
      const BnSub = B * nSub * nInc;
      const CnInc = C * nInc;
      const numR = A * nSub - D * nInc;
      const numI = BnSub - CnInc;
      const denR = A * nSub + D * nInc;
      const denI = BnSub + CnInc;
      return (numR * numR + numI * numI) / (denR * denR + denI * denI);
    });

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
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Anti-Fog Coating Design" description="Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>coating</sub></span>
          <input type="number" value={nCoat} onChange={e => setNCoat(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
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
    </CalculatorShell>
  );
}
