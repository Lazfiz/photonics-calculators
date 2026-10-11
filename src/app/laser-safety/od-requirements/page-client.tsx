"use client";

import Link from "next/link";
import { useMemo } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import { fmtNum, fmtPower } from "../../../components/eye-limit-labels";
import LaserSafetyBeamDefinition, { parseBeamDefinition } from "../../../components/laser-safety-beam-definition";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetySuiteLinks from "../../../components/laser-safety-suite-links";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { apertureIrradiance } from "../../../physics/laser-safety/eye-exposure-limits";

export default function ODRequirementsPage() {
  const [powerRaw, setPower] = useURLState("power", 500); // mW
  const [beamDiameterRaw, setBeamDiameter] = useURLState("beamDiameter", 2); // mm
  const [limitRaw, setLimit] = useURLState("validatedMpeIrradiance", 0.0025); // W/cm²
  const [apertureRaw, setAperture] = useURLState("aperture", 7); // mm
  const [safetyFactorRaw, setSafetyFactor] = useURLState("safetyFactor", 1);
  const [beamDefinitionRaw, setBeamDefinition] = useURLState("beamDefinition", "1/e2");

  // URL values aren't range-checked: clamp them here.
  const power = Math.max(powerRaw, 0);
  const beamDiameter = Math.max(beamDiameterRaw, 0);
  const limit = Math.max(limitRaw, 1e-12);
  const aperture = Math.max(apertureRaw, 0.1);
  const safetyFactor = Math.max(safetyFactorRaw, 1);
  const beamDefinition = parseBeamDefinition(beamDefinitionRaw);

  // Gaussian beam averaged over the centred aperture: src/physics/laser-safety/eye-exposure-limits.ts. SI inside.
  const d = beamDiameter * 1e-3 * (beamDefinition === "1/e" ? Math.SQRT2 : 1); // m, 1/e²
  const irradiance = apertureIrradiance(power * 1e-3, d, aperture * 1e-3) / 1e4; // W/cm²
  const target = limit / safetyFactor; // W/cm²
  const requiredOD = Math.max(0, Math.log10(irradiance / target)); // log10(0) = −∞ gives 0

  // Irradiance behind a filter of optical density OD against the target: they cross at the required OD.
  const series = useMemo(() => {
    const ods = Array.from({ length: 101 }, (_, i) => i * 0.1);
    return [
      { name: "Behind the filter", color: "#60a5fa", points: ods.map((od) => ({ x: od, y: irradiance * Math.pow(10, -od) })) },
      { name: "Target", color: "#f87171", dashed: true, points: ods.map((od) => ({ x: od, y: target })) },
    ];
  }, [irradiance, target]);

  return (
    <>
      <LaserSafetyDisclaimer />

      <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-sm leading-6 text-cyan-100">
        <p className="font-semibold text-cyan-200">A limit you supply</p>
        <p className="mt-2">
          This page doesn&apos;t look up the exposure limit: enter one from a standard or a reviewed calculation, with
          the aperture it is averaged over. To get the limit from the wavelength and exposure time, use the{" "}
          <Link href="/laser-safety/optical-density" className="underline hover:text-white">optical density</Link> page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Beam power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Beam diameter (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0} step="any" />
        <ValidatedNumberInput label="Exposure limit, irradiance (W/cm²)" value={limit} onChange={setLimit} min={1e-12} step="any" />
        <ValidatedNumberInput label="Averaging aperture (mm)" value={aperture} onChange={setAperture} min={0.1} step="any" />
        <ValidatedNumberInput label="Safety factor" value={safetyFactor} onChange={setSafetyFactor} min={1} step="any" />
        <LaserSafetyBeamDefinition value={beamDefinition} onChange={setBeamDefinition} withDivergence={false} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Beam irradiance" value={`${fmtNum(irradiance)} W/cm²`} tone="yellow" subtext={`Averaged over ${fmtNum(aperture)} mm`} />
        <ResultCard label="Target irradiance" value={`${fmtNum(target)} W/cm²`} tone="blue" subtext="Limit / safety factor" />
        <ResultCard label="Required OD" value={`OD ${requiredOD.toFixed(2)}`} tone="red" />
        <ResultCard label="Behind the filter" value={fmtPower(power * 1e-3 * Math.pow(10, -requiredOD))} tone="green" subtext="Beam power at the required OD" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>OD = log₁₀(E<sub>beam</sub> / E<sub>target</sub>), E<sub>target</sub> = limit / safety factor</p>
        <p>E<sub>beam</sub> = P(1 − exp(−2D²/d²)) / (πD²/4): a Gaussian beam of 1/e² diameter d averaged over the aperture D</p>
        <p>Transmission = 10<sup>−OD</sup></p>
      </div>

      <SimpleLineChart title="Irradiance behind the filter vs optical density" xLabel="Optical density" yLabel="Irradiance (W/cm²)" yScale="log" series={series} />

      <p className="text-sm text-gray-400 mt-6 mb-8">
        ICNIRP 2013 averages the eye limits over 7 mm for the retina (400–1400 nm), 3.5 mm for the anterior eye, and
        1 mm growing to 3.5 mm at 10 s on the cornea in the UV and from 1.4 µm. A wide beam&apos;s average approaches its
        peak irradiance, 8P/(πd²) with the 1/e² diameter; a narrow beam puts all its power inside the aperture.
      </p>

      <LaserSafetySuiteLinks currentHref="/laser-safety/od-requirements" />
    </>
  );
}
