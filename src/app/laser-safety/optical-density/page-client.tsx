"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyCwBounds from "../../../components/laser-safety-cw-bounds";
import LaserSafetyCwReferences from "../../../components/laser-safety-cw-references";
import LaserSafetyCwScope from "../../../components/laser-safety-cw-scope";
import LaserSafetySuiteLinks from "../../../components/laser-safety-suite-links";
import { cwPointSourceOdPrecheck } from "../../../lib/laser-safety-cw-suite";

export default function OpticalDensityPage() {
  const [wavelength, setWavelength] = useState(532);
  const [power, setPower] = useState(500);
  const [beamDiam, setBeamDiam] = useState(3);
  const [exposure, setExposure] = useState(0.25);
  const [safetyFactor, setSafetyFactor] = useState(10);

  const result = useMemo(
    () => cwPointSourceOdPrecheck({ wavelengthNm: wavelength, exposureS: exposure, powerMw: power, beamDiameterMm: beamDiam, safetyFactor }),
    [wavelength, power, beamDiam, exposure, safetyFactor]
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
    <CalculatorShell
      backHref="/laser-safety"
      backLabel="Laser Safety"
      title="Optical Density (CW point-source pre-check)"
      description="Required OD pre-check derived from the same bounded CW point-source MPE branch as the MPE page."
    >
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
      </div>

      {result.status === "supported" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <ResultCard label="Required OD" value={`OD ${result.requiredOd.toFixed(2)}`} tone="red" subtext="Round up for eyewear selection" />
            <ResultCard label="Beam irradiance" value={`${result.irradianceWcm2.toFixed(3)} W/cm²`} tone="blue" />
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
    </CalculatorShell>
  );
}
