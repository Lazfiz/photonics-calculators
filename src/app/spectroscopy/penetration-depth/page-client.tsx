"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function PenetrationDepthPage() {
  const [wavelengthNm, setWavelengthNm] = useState(800);
  const [refractiveIndexN, setRefractiveIndexN] = useState(1.5);
  const [extinctionCoeffK, setExtinctionCoeffK] = useState(0.001);
  const [angleDeg, setAngleDeg] = useState(0);

  const angleRad = (angleDeg * Math.PI) / 180;
  const wavelengthM = wavelengthNm * 1e-9;
  const lambda0 = wavelengthM / refractiveIndexN; // wavelength in medium
  const alpha = (4 * Math.PI * extinctionCoeffK) / wavelengthM; // absorption coeff m⁻¹
  const skinDepthM = 1 / Math.max(alpha, 1e-10);
  const skinDepthNm = skinDepthM * 1e9;

  // Snell's law for oblique incidence
  const sinThetaT = Math.sin(angleRad) / refractiveIndexN;
  const hasTIR = Math.abs(sinThetaT) > 1;
  const thetaT = hasTIR ? 0 : Math.asin(sinThetaT);
  const cosThetaT = hasTIR ? 0 : Math.cos(thetaT);

  // Effective penetration depth (1/e field depth) for oblique
  const dpEff = hasTIR
    ? wavelengthM / (2 * Math.PI * Math.sqrt(Math.sin(angleRad) ** 2 - refractiveIndexN ** 2))
    : (cosThetaT > 0 ? 1 / (alpha / cosThetaT) : skinDepthM);

  const chartData = useMemo(() => {
    const kRange = Array.from({ length: 300 }, (_, i) => 0 + i * 2 / 300);
    const skinD = kRange.map(k => {
      const a = (4 * Math.PI * k) / wavelengthM;
      return a > 0 ? (1 / a) * 1e9 : 1e9;
    });
    return [
      { x: kRange, y: skinD, type: "scatter", mode: "lines", name: "δ (nm)",
        line: { color: "#34d399", width: 2 } },
      { x: [extinctionCoeffK], y: [skinDepthNm], type: "scatter", mode: "markers",
        name: "Current k", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [wavelengthNm, extinctionCoeffK]);

  // Intensity vs depth plot
  const depthData = useMemo(() => {
    const maxDepth = Math.min(skinDepthNm * 5, 1e7);
    const depths = Array.from({ length: 200 }, (_, i) => (i / 200) * maxDepth);
    const intensity = depths.map(d => Math.exp(-d * 1e-9 * alpha));
    return [
      { x: depths, y: intensity, type: "scatter", mode: "lines", name: "I(z)/I₀",
        line: { color: "#818cf8", width: 2 } },
      { x: [skinDepthNm], y: [Math.exp(-1)], type: "scatter", mode: "markers",
        name: "1/e point", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [alpha, skinDepthNm]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Penetration Depth Calculator" description="Calculate optical penetration depth from complex refractive index ñ = n + ik. Includes oblique incidence via Snell&apos;s law.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength λ₀ (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={100} step="10" />
        <ValidatedNumberInput label="Refractive Index n" value={refractiveIndexN} onChange={setRefractiveIndexN} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Extinction Coefficient k" value={extinctionCoeffK} onChange={setExtinctionCoeffK} min={0} step="0.001" />
        <ValidatedNumberInput label="Angle of Incidence (°)" value={angleDeg} onChange={setAngleDeg} min={0} max={90} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorption Coeff α</p>
          <p className="text-xl font-bold text-red-400">{alpha.toExponential(2)} m⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Skin Depth δ</p>
          <p className="text-xl font-bold text-green-400">{skinDepthNm < 1 ? skinDepthNm.toExponential(2) : skinDepthNm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">λ in medium</p>
          <p className="text-xl font-bold text-blue-400">{(lambda0 * 1e9).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>α = 4πk / λ₀ (m⁻¹)</p>
        <p>δ = 1/α (skin depth, intensity falls to 1/e)</p>
        <p>I(z) = I₀ · exp(−αz)</p>
        {hasTIR && <p className="text-yellow-400">⚠ TIR at this angle (θ &gt; θ<sub>c</sub>)</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={depthData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "Intensity vs Depth", font: { size: 13 } },
          xaxis: { title: "Depth (nm)", gridcolor: "#374151" },
          yaxis: { title: "I/I₀", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "Skin Depth vs k", font: { size: 13 } },
          xaxis: { title: "Extinction Coefficient k", gridcolor: "#374151" },
          yaxis: { title: "δ (nm)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
      </div>
    </CalculatorShell>
  );
}
