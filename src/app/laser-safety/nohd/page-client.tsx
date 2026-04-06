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
import { cwPointSourceNohdPrecheck } from "../../../lib/laser-safety-cw-suite";
import { useURLState } from "../../../hooks/use-url-state";

const powerPresets = [5, 100, 1000];

export default function NOHDPage() {
  const [power, setPower] = useURLState("power", 100);
  const [wavelength, setWavelength] = useURLState("wavelength", 532);
  const [exposure, setExposure] = useURLState("exposure", 0.25);
  const [beamDia, setBeamDia] = useURLState("beamDia", 2);
  const [divergence, setDivergence] = useURLState("divergence", 1);
  const [safetyFactor, setSafetyFactor] = useURLState("safetyFactor", 1);

  const result = useMemo(
    () => cwPointSourceNohdPrecheck({ wavelengthNm: wavelength, exposureS: exposure, powerMw: power, beamDiameterMm: beamDia, divergenceMrad: divergence, safetyFactor }),
    [wavelength, exposure, power, beamDia, divergence, safetyFactor]
  );

  const chartData = useMemo(() => {
    if (result.status !== "supported") return [];
    const maxDistance = Math.max(result.nohdM * 1.5, 10);
    const distances = Array.from({ length: 160 }, (_, i) => (i * maxDistance) / 159);
    const irradiances = distances.map((z) => result.irradianceAtDistance(z));
    return [
      { x: distances, y: irradiances, type: "scatter" as const, mode: "lines", name: "Direct-beam irradiance", line: { color: "#60a5fa", width: 3 } },
      { x: [0, maxDistance], y: [result.targetIrradianceWcm2, result.targetIrradianceWcm2], type: "scatter" as const, mode: "lines", name: "Target irradiance", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [result]);

  return (
    <CalculatorShell
      backHref="/laser-safety"
      backLabel="Laser Safety"
      title="Nominal Ocular Hazard Distance (NOHD)"
      description="Bounded engineering pre-check for CW point-source direct-beam NOHD using the same restricted MPE branch as the MPE page."
    >
      <LaserSafetyDisclaimer />
      <LaserSafetyCwBounds />
      <LaserSafetyCwReferences />
      <LaserSafetyCwScope />

      <div className="mb-5 flex flex-wrap gap-2">
        {powerPresets.map((preset) => (
          <button key={preset} onClick={() => setPower(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${power === preset ? "border-red-400 bg-red-500/15 text-red-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset} mW</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Power" value={power} onChange={setPower} min={1} max={5000} step={1} unit="mW" />
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={1050} step={1} unit="nm" />
        <InputSlider label="Exposure time" value={exposure} onChange={setExposure} min={0.001} max={30000} step={0.001} unit="s" />
        <InputSlider label="Beam diameter" value={beamDia} onChange={setBeamDia} min={0.5} max={10} step={0.1} unit="mm" />
        <InputSlider label="Full-angle divergence" value={divergence} onChange={setDivergence} min={0.1} max={5} step={0.1} unit="mrad" />
        <InputSlider label="Safety factor" value={safetyFactor} onChange={setSafetyFactor} min={1} max={20} step={1} />
      </div>

      {result.status === "supported" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <ResultCard label="NOHD" value={`${result.nohdM.toFixed(2)} m`} tone="red" subtext="Direct beam" />
            <ResultCard label="Target irradiance" value={`${result.targetIrradianceWcm2.toExponential(2)} W/cm²`} tone="yellow" subtext="MPE / safety factor" />
            <ResultCard label="Diameter at NOHD" value={`${result.diameterAtNohdCm.toFixed(2)} cm`} tone="blue" subtext="Beam diameter model" />
            <ResultCard label="MPE branch" value={result.mpe.regime} tone="green" subtext={result.mpe.scope} />
          </div>

          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 mb-6 text-sm text-red-100 leading-6">
            <ul className="list-disc space-y-1 pl-5">
              {result.mpe.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <SimpleLineChart title="Direct-beam irradiance vs distance" xLabel="Distance (m)" yLabel="Irradiance (W/cm²)" xScale="linear" yScale="log" series={[{ name: "Direct-beam irradiance", color: "#60a5fa", points: chartData[0]?.x.map((x: number, i: number) => ({ x, y: chartData[0].y[i] })) ?? [] }, { name: "Target irradiance", color: "#f87171", dashed: true, points: chartData[1]?.x.map((x: number, i: number) => ({ x, y: chartData[1].y[i] })) ?? [] }]} />
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

      <LaserSafetySuiteLinks currentHref="/laser-safety/nohd" />
    </CalculatorShell>
  );
}
