"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function RetinalHazardPage() {
  const [power, setPower] = useURLState("power", 10); // mW
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 2); // mm
  const [cornealDiam, setCornealDiam] = useURLState("cornealDiam", 7); // mm
  const [divergence, setDivergence] = useURLState("divergence", 1); // mrad

  const calc = useMemo(() => {
    const P = power * 1e-3; // W
    const w0 = (beamDiam / 2) * 1e-3; // m
    const rCornea = (cornealDiam / 2) * 1e-3; // m
    const theta = divergence * 1e-3; // rad
    const fEye = 17e-3; // m, effective focal length of eye

    // Retinal image diameter (diffraction-limited)
    const dRetinal = 2 * 1.22 * 550e-9 * fEye / (2 * w0); // m (using 550nm as eye peak)
    const wRetinal = dRetinal / 2;

    // Retinal spot area
    const Aretina = Math.PI * wRetinal * wRetinal;

    // Retinal irradiance
    const Iretina = P / Aretina;

    // Corneal irradiance
    const Acornea = Math.PI * rCornea * rCornea;
    const Icornea = P / Acornea;

    // Radiance (W/m²/sr) = P / (π * w0² * π*θ²) for Gaussian
    const L = P / (Math.PI * w0 * w0 * Math.PI * theta * theta);

    return {
      Iretina, Icornea, L, dRetinal: dRetinal * 1e6, // µm
      Aretina: Aretina * 1e12, // µm²
      Acornea: Acornea * 1e6, // mm²
    };
  }, [power, beamDiam, cornealDiam, divergence]);

  const chartData = useMemo(() => {
    const powers = Array.from({ length: 100 }, (_, i) => (i + 1) * 0.5);
    const fEye = 17e-3;
    const w0 = (beamDiam / 2) * 1e-3;
    const theta = divergence * 1e-3;
    const dRet = 2 * 1.22 * 550e-9 * fEye / (2 * w0);
    const Aret = Math.PI * (dRet / 2) * (dRet / 2);

    const retIrr = powers.map(p => (p * 1e-3) / Aret);
    const corIrr = powers.map(p => (p * 1e-3) / (Math.PI * 3.5e-3 * 3.5e-3));

    return [
      { x: powers, y: retIrr, type: "scatter" as const, mode: "lines" as const, name: "Retinal", line: { color: "#f87171" }, yaxis: "y" },
      { x: powers, y: corIrr, type: "scatter" as const, mode: "lines" as const, name: "Corneal", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [beamDiam, divergence]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Retinal Hazard Calculator" description="Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Corneal Power (mW)" value={power} onChange={setPower} min={0.01} step="any" />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiam} onChange={setBeamDiam} min={0.1} step="any" />
        <ValidatedNumberInput label="Corneal Limiting Aperture (mm)" value={cornealDiam} onChange={setCornealDiam} min={1} max={11} />
        <ValidatedNumberInput label="Beam Divergence (mrad)" value={divergence} onChange={setDivergence} min={0.01} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retinal Irradiance</p>
          <p className="text-xl font-bold text-red-400">{calc.Iretina.toExponential(2)} W/m²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Corneal Irradiance</p>
          <p className="text-xl font-bold text-blue-400">{calc.Icornea.toExponential(2)} W/m²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retinal Spot Ø</p>
          <p className="text-xl font-bold text-yellow-400">{calc.dRetinal.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Radiance</p>
          <p className="text-xl font-bold text-green-400">{calc.L.toExponential(2)} W/m²/sr</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Power (mW)", gridcolor: "#374151" },
          yaxis: { title: "Retinal Irradiance (W/m²)", gridcolor: "#374151", color: "#f87171", side: "left" },
          yaxis2: { title: "Corneal Irradiance (W/m²)", gridcolor: "#374151", color: "#60a5fa", overlaying: "y", side: "right" },
          margin: { t: 30, r: 70, b: 50, l: 70 }, legend: { x: 0.02, y: 0.99 },
        }} />
      </div>
    </CalculatorShell>
  );
}
