"use client";

import { useMemo } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyCwBounds from "../../../components/laser-safety-cw-bounds";
import LaserSafetyCwReferences from "../../../components/laser-safety-cw-references";
import LaserSafetyCwScope from "../../../components/laser-safety-cw-scope";
import LaserSafetySuiteLinks from "../../../components/laser-safety-suite-links";
import LaserSafetyBeamDefinition, { parseBeamDefinition } from "../../../components/laser-safety-beam-definition";
import { cornealIrradianceWcm2, toOneOverE } from "../../../lib/laser-safety-cw-suite";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
export default function ODRequirementsPage() {
  // URL values aren't range-checked: clamp them to the sliders' ranges.
  const [powerRaw, setPower] = useURLState("power", 500);
  const [beamDiameterRaw, setBeamDiameter] = useURLState("beamDiameter", 2);
  const [validatedMpeIrradianceRaw, setValidatedMpeIrradiance] = useURLState("validatedMpeIrradiance", 0.0025); // W/cm²
  const [safetyFactorRaw, setSafetyFactor] = useURLState("safetyFactor", 1);
  const [beamDefinitionRaw, setBeamDefinition] = useURLState("beamDefinition", "1/e2");
  const power = clampToRange(powerRaw, 1, 5000);
  const beamDiameter = clampToRange(beamDiameterRaw, 0.5, 10);
  const validatedMpeIrradiance = clampToRange(validatedMpeIrradianceRaw, 0.0001, 1);
  const safetyFactor = clampToRange(safetyFactorRaw, 1, 20);
  const beamDefinition = parseBeamDefinition(beamDefinitionRaw);

  // Averaged over the 7 mm aperture, from the 1/e diameter.
  const irradiance = useMemo(
    () => cornealIrradianceWcm2(power, toOneOverE(beamDiameter, beamDefinition)),
    [power, beamDiameter, beamDefinition]
  );
  const targetIrradiance = validatedMpeIrradiance / safetyFactor;
  const requiredOD = useMemo(() => {
    if (irradiance <= 0 || targetIrradiance <= 0) return 0;
    return Math.max(0, Math.log10(irradiance / targetIrradiance));
  }, [irradiance, targetIrradiance]);

  const transmittedPower = useMemo(() => power * Math.pow(10, -requiredOD), [power, requiredOD]);

  // Irradiance behind a filter of optical density OD against the target: they cross at the required OD.
  const chartData = useMemo(() => {
    const ods = Array.from({ length: 101 }, (_, i) => i * 0.1);
    return [
      {
        x: ods,
        y: ods.map((od) => irradiance * Math.pow(10, -od)),
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Behind filter",
        line: { color: "#60a5fa" },
      },
      {
        x: ods,
        y: ods.map(() => targetIrradiance),
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Target",
        line: { color: "#f87171", dash: "dash" },
      },
    ];
  }, [irradiance, targetIrradiance]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <LaserSafetyCwBounds />
      <LaserSafetyCwReferences />
      <LaserSafetyCwScope />

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
        <LaserSafetyBeamDefinition value={beamDefinition} onChange={setBeamDefinition} withDivergence={false} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Beam irradiance" value={`${irradiance.toFixed(3)} W/cm²`} tone="yellow" subtext="Averaged over the 7 mm aperture" />
        <ResultCard label="Target irradiance" value={`${targetIrradiance.toExponential(2)} W/cm²`} tone="blue" subtext="Validated limit / safety factor" />
        <ResultCard label="Required OD" value={`OD ${requiredOD.toFixed(2)}`} tone="red" />
        <ResultCard label="Transmitted power" value={`${transmittedPower.toFixed(4)} mW`} tone="green" subtext="At required OD" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>OD = log₁₀(E<sub>beam</sub> / E<sub>target</sub>), E<sub>beam</sub> = 4P / (π max(d, 7 mm)²) with the 1/e diameter d</p>
        <p>E<sub>target</sub> = E<sub>validated limit</sub> / safety factor</p>
        <p>Transmission = 10<sup>-OD</sup></p>
      </div>

      <SimpleLineChart title="Irradiance behind the filter vs optical density" xLabel="Optical density" yLabel="Irradiance (W/cm²)" yScale="log" series={[{ name: "Behind filter", color: "#60a5fa", points: chartData[0].x.map((x: number, i: number) => ({ x, y: chartData[0].y[i] })) }, { name: "Target", color: "#f87171", dashed: true, points: chartData[1].x.map((x: number, i: number) => ({ x, y: chartData[1].y[i] })) }]} />

      <LaserSafetySuiteLinks currentHref="/laser-safety/od-requirements" />
    </>
  );
}
