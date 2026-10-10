"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { expandBeam } from "../../../physics/laser-safety/beam-expander";

/** W/m² → W/cm². */
const PER_CM2 = 1e-4;

/** Four significant digits; exponent form for very large or small values; "—" if not a number. */
function fmt(x: number): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  return Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? x.toExponential(3) : x.toPrecision(4);
}

export default function BeamExpanderPage() {
  const [power, setPower] = useURLState("power", 1); // W
  const [beamDia, setBeamDia] = useURLState("beamDia", 2); // mm
  const [expansion, setExpansion] = useURLState("expansion", 5); // M

  // Physics in SI: src/physics/laser-safety/beam-expander.ts. Irradiance is shown in W/cm².
  const result = useMemo(() => expandBeam(power, beamDia * 1e-3, expansion), [power, beamDia, expansion]);
  const irrIn = result.meanIrradianceIn * PER_CM2;
  const irrOut = result.meanIrradianceOut * PER_CM2;

  const chartData = useMemo(() => {
    const mMax = Math.max(25, Math.ceil(1.5 * expansion));
    const ratios = Array.from({ length: 61 }, (_, i) => 1 + ((mMax - 1) * i) / 60);
    const points = ratios
      .map((m) => ({ m, e: expandBeam(power, beamDia * 1e-3, m).meanIrradianceOut * PER_CM2 }))
      .filter((p) => Number.isFinite(p.e) && p.e > 0);
    const traces: Record<string, unknown>[] = [
      { x: points.map((p) => p.m), y: points.map(() => irrIn), type: "scatter", mode: "lines", name: "Input", line: { color: "#f87171", dash: "dash" } },
      { x: points.map((p) => p.m), y: points.map((p) => p.e), type: "scatter", mode: "lines", name: "Output", line: { color: "#60a5fa" } },
    ];
    if (Number.isFinite(irrOut) && irrOut > 0) {
      traces.push({ x: [expansion], y: [irrOut], type: "scatter", mode: "markers", name: "Current", marker: { color: "#facc15", size: 10 } });
    }
    return traces;
  }, [power, beamDia, expansion, irrIn, irrOut]);

  const hasResult = Number.isFinite(irrOut) && irrOut > 0 && Number.isFinite(irrIn);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} min={0.000001} max={100000} step="any" />
        <ValidatedNumberInput label="Input Beam Diameter (mm)" value={beamDia} onChange={setBeamDia} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Expansion Ratio (×)" value={expansion} onChange={setExpansion} min={1} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Diameter</p>
          <p className="text-2xl font-bold text-green-400">{Number.isFinite(result.outputDiameter) ? fmt(result.outputDiameter * 1e3) + " mm" : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Input Irradiance</p>
          <p className="text-2xl font-bold text-red-400">{Number.isFinite(irrIn) ? fmt(irrIn) + " W/cm²" : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Irradiance</p>
          <p className="text-2xl font-bold text-blue-400">{Number.isFinite(irrOut) ? fmt(irrOut) + " W/cm²" : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reduction Factor (M²)</p>
          <p className="text-2xl font-bold text-yellow-400">{Number.isFinite(result.reduction) ? fmt(result.reduction) + "×" : "—"}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 text-sm text-gray-300 space-y-2">
        <p className="font-mono">E = 4P / (π d²), E<sub>out</sub> = E<sub>in</sub> / M², θ<sub>out</sub> = θ<sub>in</sub> / M</p>
        <p>
          The diameter d is taken as the 1/e diameter (the ANSI Z136.1 / IEC 60825-1 convention, 63 % of the power), for
          which 4P/(πd²) is the peak irradiance of a Gaussian beam. If you have the 1/e² diameter instead, the peak
          irradiance is twice this value.
        </p>
        <p>
          This is the irradiance at the expander. The expander also cuts the divergence by M, so far from it the beam is
          smaller than it would be without the expander, and the distance at which it falls to a given limit (the
          hazard distance) grows by about the factor M.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        {hasResult ? (
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Expansion Ratio", gridcolor: "#374151" },
            yaxis: { title: "Irradiance (W/cm²)", type: "log", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        ) : (
          <p className="text-sm text-gray-400">Enter a power, a beam diameter and an expansion ratio to see the chart.</p>
        )}
      </div>
    </>
  );
}
