"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

const powerPresets = [5, 100, 1000];

export default function NOHDPage() {
  const [power, setPower] = useState(100);
  const [beamDia, setBeamDia] = useState(2);
  const [divergence, setDivergence] = useState(1);
  const [mpe, setMpe] = useState(100);

  const nohd = useMemo(() => {
    const a = (beamDia / 2) / 1000;
    const phi = (divergence / 1000) * Math.PI / 180;
    const mpeWm2 = (mpe / 1000) * 1e4;
    const factor = (1.27 * power) / (mpeWm2 * a ** 2);
    if (factor <= 1 || phi <= 0) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [power, beamDia, divergence, mpe]);

  const chartData = useMemo(() => {
    const maxDistance = Math.max(nohd * 1.5, 25);
    const distances = Array.from({ length: 150 }, (_, i) => (i * maxDistance) / 149);
    const irradiances = distances.map((z) => {
      const a = (beamDia / 2) / 1000;
      const phi = (divergence / 1000) * Math.PI / 180;
      const w = a + z * Math.tan(phi);
      return (power / (Math.PI * w * w)) * 1e-4;
    });
    return [
      { x: distances, y: irradiances, type: "scatter" as const, mode: "lines", name: "Irradiance", line: { color: "#60a5fa", width: 3 } },
      { x: [0, maxDistance], y: [mpe / 1000, mpe / 1000], type: "scatter" as const, mode: "lines", name: "MPE", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [power, beamDia, divergence, mpe, nohd]);

  return (
    <CalculatorShell
      backHref="/laser-safety"
      backLabel="Laser Safety"
      title="Nominal Ocular Hazard Distance (NOHD)"
      description="Distance at which direct-beam irradiance falls below the chosen MPE threshold in a simplified free-space model."
    >
      <LaserSafetyDisclaimer />

      <div className="mb-5 flex flex-wrap gap-2">
        {powerPresets.map((preset) => (
          <button key={preset} onClick={() => setPower(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${power === preset ? "border-red-400 bg-red-500/15 text-red-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>{preset} mW</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <InputSlider label="Power" value={power} onChange={setPower} min={1} max={5000} step={1} unit="mW" />
        <InputSlider label="Beam diameter" value={beamDia} onChange={setBeamDia} min={0.5} max={10} step={0.1} unit="mm" />
        <InputSlider label="Divergence" value={divergence} onChange={setDivergence} min={0.1} max={5} step={0.1} unit="mrad" />
        <InputSlider label="MPE threshold" value={mpe} onChange={setMpe} min={1} max={200} step={1} unit="mJ/cm²" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="NOHD" value={`${nohd.toFixed(1)} m`} tone="red" />
        <ResultCard label="Beam diameter" value={`${beamDia.toFixed(1)} mm`} tone="blue" />
        <ResultCard label="Divergence" value={`${divergence.toFixed(1)} mrad`} tone="green" />
        <ResultCard label="MPE line" value={`${(mpe / 1000).toFixed(3)} W/cm²`} tone="yellow" />
      </div>

      <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 mb-6 text-sm text-red-100 leading-6">
        <p>
          This simplified NOHD estimate ignores many practical effects including scan patterns, pulse structure, beam quality,
          atmospheric attenuation, source-size corrections, and standard-specific rule sets.
        </p>
      </div>

      <ChartPanel
        data={chartData}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (m)", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }}
      />
    </CalculatorShell>
  );
}
