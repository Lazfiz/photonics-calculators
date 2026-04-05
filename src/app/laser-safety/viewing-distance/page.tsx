"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyCwBounds from "../../../components/laser-safety-cw-bounds";
import { cwPointSourceNohdPrecheck } from "../../../lib/laser-safety-cw-suite";

export default function ViewingDistancePage() {
  const [power, setPower] = useState(500);
  const [wavelength, setWavelength] = useState(532);
  const [beamDiameter, setBeamDiameter] = useState(2);
  const [divergence, setDivergence] = useState(0.5);
  const [exposure, setExposure] = useState(0.25);
  const [safetyFactor, setSafetyFactor] = useState(1);

  const result = useMemo(
    () => cwPointSourceNohdPrecheck({ wavelengthNm: wavelength, exposureS: exposure, powerMw: power, beamDiameterMm: beamDiameter, divergenceMrad: divergence, safetyFactor }),
    [power, wavelength, beamDiameter, divergence, exposure, safetyFactor]
  );

  const chartData = useMemo(() => {
    if (result.status !== "supported") return [];
    const maxDist = Math.max(result.nohdM * 1.5, 10);
    const distances = Array.from({ length: 180 }, (_, i) => maxDist * Math.pow(10, -2 + (i / 179) * 2));
    return [
      {
        x: distances,
        y: distances.map((d) => result.irradianceAtDistance(d)),
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Irradiance",
        line: { color: "#60a5fa" },
      },
      {
        x: distances,
        y: distances.map(() => result.targetIrradianceWcm2),
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Target irradiance",
        line: { color: "#f87171", dash: "dash" },
      },
    ];
  }, [result]);

  const formatDist = (d: number) =>
    d >= 1000 ? (d / 1000).toFixed(2) + " km" : d >= 1 ? d.toFixed(2) + " m" : (d * 100).toFixed(1) + " cm";

  return (
    <CalculatorShell
      backHref="/laser-safety"
      backLabel="Laser Safety"
      title="Safe Viewing Distance (CW point-source pre-check)"
      description="Simplified direct-beam viewing-distance estimate built from the same bounded CW point-source assumptions as the MPE and NOHD pages."
    >
      <LaserSafetyDisclaimer />
      <LaserSafetyCwBounds />

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Power" value={power} onChange={setPower} min={1} max={5000} step={1} unit="mW" />
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={400} max={1050} step={1} unit="nm" />
        <InputSlider label="Beam diameter" value={beamDiameter} onChange={setBeamDiameter} min={0.5} max={10} step={0.1} unit="mm" />
        <InputSlider label="Full-angle divergence" value={divergence} onChange={setDivergence} min={0.1} max={5} step={0.1} unit="mrad" />
        <InputSlider label="Exposure time" value={exposure} onChange={setExposure} min={0.001} max={10} step={0.001} unit="s" />
        <InputSlider label="Safety factor" value={safetyFactor} onChange={setSafetyFactor} min={1} max={20} step={1} />
      </div>

      {result.status === "supported" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <ResultCard label="Safe viewing distance" value={formatDist(result.nohdM)} tone="red" subtext="Direct beam" />
            <ResultCard label="Target irradiance" value={`${result.targetIrradianceWcm2.toExponential(2)} W/cm²`} tone="yellow" />
            <ResultCard label="Diameter at boundary" value={`${result.diameterAtNohdCm.toFixed(2)} cm`} tone="blue" />
            <ResultCard label="MPE branch" value={result.mpe.regime} tone="green" subtext={result.mpe.scope} />
          </div>

          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 mb-6 text-sm text-red-100 leading-6">
            <ul className="list-disc space-y-1 pl-5">
              {result.mpe.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <ChartPanel
            data={chartData}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              xaxis: { title: "Distance (m)", type: "log", gridcolor: "#374151" },
              yaxis: { title: "Irradiance (W/cm²)", type: "log", gridcolor: "#374151" },
              margin: { t: 30, r: 30, b: 50, l: 70 },
            }}
          />
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
    </CalculatorShell>
  );
}
