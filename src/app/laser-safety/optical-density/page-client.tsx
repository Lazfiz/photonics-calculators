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
import { cwPointSourceOdPrecheck } from "../../../lib/laser-safety-cw-suite";
import LaserSafetyBeamDefinition, { parseBeamDefinition } from "../../../components/laser-safety-beam-definition";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
export default function OpticalDensityPage() {
  // URL values aren't range-checked: clamp them to the sliders' ranges.
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 532);
  const [powerRaw, setPower] = useURLState("power", 500);
  const [beamDiamRaw, setBeamDiam] = useURLState("beamDiam", 3);
  const [exposureRaw, setExposure] = useURLState("exposure", 0.25);
  const [safetyFactorRaw, setSafetyFactor] = useURLState("safetyFactor", 10);
  const [beamDefinitionRaw, setBeamDefinition] = useURLState("beamDefinition", "1/e2");
  const wavelength = clampToRange(wavelengthRaw, 400, 1050);
  const power = clampToRange(powerRaw, 1, 5000);
  const beamDiam = clampToRange(beamDiamRaw, 0.5, 10);
  const exposure = clampToRange(exposureRaw, 0.001, 30000);
  const safetyFactor = clampToRange(safetyFactorRaw, 1, 20);
  const beamDefinition = parseBeamDefinition(beamDefinitionRaw);

  const result = useMemo(
    () => cwPointSourceOdPrecheck({ wavelengthNm: wavelength, exposureS: exposure, powerMw: power, beamDiameterMm: beamDiam, beamDefinition, safetyFactor }),
    [wavelength, power, beamDiam, exposure, beamDefinition, safetyFactor]
  );

  const chartData = useMemo(() => {
    if (result.status !== "supported") return [];
    const ods = Array.from({ length: 100 }, (_, i) => i * 0.1);
    const transmissionPct = ods.map((od) => Math.pow(10, -od) * 100);
    return [
      { x: ods, y: transmissionPct, type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", line: { color: "#60a5fa", width: 2 } },
      {
        x: [result.requiredOd],
        y: [Math.pow(10, -result.requiredOd) * 100],
        type: "scatter" as const,
        mode: "markers" as const,
        name: "Required OD",
        marker: { color: "#f87171", size: 12 },
      },
    ];
  }, [result]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <LaserSafetyCwBounds />
      <LaserSafetyCwReferences />
      <LaserSafetyCwScope />

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={1050} step={1} unit="nm" />
        <InputSlider label="Beam power" value={power} onChange={setPower} min={1} max={5000} step={1} unit="mW" />
        <InputSlider label="Beam diameter" value={beamDiam} onChange={setBeamDiam} min={0.5} max={10} step={0.1} unit="mm" />
        <InputSlider label="Exposure time" value={exposure} onChange={setExposure} min={0.001} max={30000} step={0.001} unit="s" />
        <InputSlider label="Safety factor" value={safetyFactor} onChange={setSafetyFactor} min={1} max={20} step={1} />
        <LaserSafetyBeamDefinition value={beamDefinition} onChange={setBeamDefinition} withDivergence={false} />
      </div>

      {result.status === "supported" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <ResultCard label="Required OD" value={`OD ${result.requiredOd.toFixed(2)}`} tone="red" subtext="Round up for eyewear selection" />
            <ResultCard label="Beam irradiance" value={`${result.irradianceWcm2.toFixed(3)} W/cm²`} tone="blue" subtext="Averaged over the 7 mm aperture" />
            <ResultCard label="Target irradiance" value={`${result.targetIrradianceWcm2.toExponential(2)} W/cm²`} tone="yellow" subtext="MPE / safety factor" />
            <ResultCard label="Transmitted power" value={`${result.transmittedPowerMw.toFixed(4)} mW`} tone="green" subtext="At required OD" />
          </div>

          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 mb-6 text-sm text-red-100 leading-6">
            <ul className="list-disc space-y-1 pl-5">
              {result.mpe.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <SimpleLineChart title="Transmission vs optical density" xLabel="Optical density" yLabel="Transmission (%)" yScale="log" series={[{ name: "Transmission (%)", color: "#60a5fa", points: chartData[0]?.x.map((x: number, i: number) => ({ x, y: chartData[0].y[i] })) ?? [] }, { name: "Required OD", color: "#f87171", points: chartData[1]?.x.map((x: number, i: number) => ({ x, y: chartData[1].y[i] })) ?? [] }]} />
        </>
      ) : (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-red-100">
          <p className="text-lg font-semibold">Unsupported regime intentionally disabled</p>
          <p className="mt-2 text-sm leading-6">{result.mpe.reason}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-red-100/90">
            {result.mpe.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <LaserSafetySuiteLinks currentHref="/laser-safety/optical-density" />
    </>
  );
}
