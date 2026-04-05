"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyCwBounds from "../../../components/laser-safety-cw-bounds";
import { cornealIrradianceWcm2 } from "../../../lib/laser-safety-cw-suite";

export default function ODRequirementsPage() {
  const [power, setPower] = useState(500);
  const [beamDiameter, setBeamDiameter] = useState(2);
  const [validatedMpeIrradiance, setValidatedMpeIrradiance] = useState(0.0025); // W/cm²
  const [safetyFactor, setSafetyFactor] = useState(1);

  const irradiance = useMemo(() => cornealIrradianceWcm2(power, beamDiameter), [power, beamDiameter]);
  const targetIrradiance = validatedMpeIrradiance / safetyFactor;
  const requiredOD = useMemo(() => {
    if (irradiance <= 0 || targetIrradiance <= 0) return 0;
    return Math.max(0, Math.log10(irradiance / targetIrradiance));
  }, [irradiance, targetIrradiance]);

  const transmittedPower = useMemo(() => power * Math.pow(10, -requiredOD), [power, requiredOD]);

  const chartData = useMemo(() => {
    const ods = Array.from({ length: 100 }, (_, i) => i * 0.1);
    return [
      {
        x: ods,
        y: ods.map((od) => (power / 1000) * Math.pow(10, -od)),
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Transmitted power",
        line: { color: "#60a5fa" },
      },
      {
        x: ods,
        y: ods.map(() => targetIrradiance),
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Target irradiance",
        line: { color: "#f87171", dash: "dash" },
      },
    ];
  }, [power, targetIrradiance]);

  return (
    <CalculatorShell
      backHref="/laser-safety"
      backLabel="Laser Safety"
      title="OD Requirements (manual validated-MPE mode)"
      description="Use this only when you already have a validated irradiance limit from a standards-backed calculation. This page is just the attenuation math wrapper."
    >
      <LaserSafetyDisclaimer />
      <LaserSafetyCwBounds />

      <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-sm leading-6 text-cyan-100">
        <p className="font-semibold text-cyan-200">Manual mode</p>
        <p className="mt-2">
          This page does <span className="font-semibold">not</span> derive MPE from wavelength/time. It assumes you already obtained a valid irradiance limit from ANSI / IEC tables or a reviewed calculation and just need the OD attenuation math.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Beam power" value={power} onChange={setPower} min={1} max={5000} step={1} unit="mW" />
        <InputSlider label="Beam diameter" value={beamDiameter} onChange={setBeamDiameter} min={0.5} max={10} step={0.1} unit="mm" />
        <InputSlider label="Validated MPE irradiance" value={validatedMpeIrradiance} onChange={setValidatedMpeIrradiance} min={0.0001} max={1} step={0.0001} unit="W/cm²" />
        <InputSlider label="Safety factor" value={safetyFactor} onChange={setSafetyFactor} min={1} max={20} step={1} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Beam irradiance" value={`${irradiance.toFixed(3)} W/cm²`} tone="yellow" />
        <ResultCard label="Target irradiance" value={`${targetIrradiance.toExponential(2)} W/cm²`} tone="blue" subtext="Validated limit / safety factor" />
        <ResultCard label="Required OD" value={`OD ${requiredOD.toFixed(2)}`} tone="red" />
        <ResultCard label="Transmitted power" value={`${transmittedPower.toFixed(4)} mW`} tone="green" subtext="At required OD" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>OD = log₁₀(E<sub>beam</sub> / E<sub>target</sub>)</p>
        <p>E<sub>target</sub> = E<sub>validated limit</sub> / safety factor</p>
        <p>Transmission = 10<sup>-OD</sup></p>
      </div>

      <ChartPanel
        data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Optical density", gridcolor: "#374151" },
          yaxis: { title: "Transmitted power / target irradiance", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }}
      />
    </CalculatorShell>
  );
}
