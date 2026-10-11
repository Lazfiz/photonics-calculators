"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import { brewsterAngle } from "../../../physics/polarization/fresnel";
import { pileDopAtBrewster, pileOfPlates } from "../../../physics/polarization/reflection-polarizers";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fix(v * 100, digits)} %` : "—");
const dB = (ratio: number) => (Number.isFinite(ratio) && ratio > 0 ? `${fix(10 * Math.log10(ratio), 2)} dB` : "—");

export default function BrewsterPolarizerPage() {
  const [nIn, setN] = useURLState("n2", 1.52);
  const [platesIn, setPlates] = useURLState("plates", 4);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const n = clamp(nIn, 1.01, 5);
  const m = Math.round(clamp(platesIn, 1, 50));

  const thetaB = brewsterAngle(1, n);
  const atB = pileOfPlates(n, thetaB, m);
  const singlePassDop = (atB.TpSinglePass - atB.TsSinglePass) / (atB.TpSinglePass + atB.TsSinglePass);

  const angleChart = useMemo(() => {
    const a = Array.from({ length: 891 }, (_, i) => i * 0.1);
    const piles = a.map((x) => pileOfPlates(n, x * DEG, m));
    return [
      { x: a, y: piles.map((p) => p.Tp), type: "scatter" as const, mode: "lines" as const, name: "Tₚ (pile)", line: { color: "#f87171", width: 2 } },
      { x: a, y: piles.map((p) => p.Ts), type: "scatter" as const, mode: "lines" as const, name: "Tₛ (pile)", line: { color: "#60a5fa", width: 2 } },
      { x: a, y: piles.map((p) => p.dop), type: "scatter" as const, mode: "lines" as const, name: "Degree of polarization", line: { color: "#a78bfa", width: 2, dash: "dash" } },
      { x: [thetaB / DEG], y: [atB.dop], type: "scatter" as const, mode: "markers" as const, name: "Brewster", marker: { color: "#4ade80", size: 9 } },
    ];
  }, [n, m, thetaB, atB.dop]);

  const platesChart = useMemo(() => {
    const ms = Array.from({ length: 40 }, (_, i) => i + 1);
    const single = ms.map((k) => {
      const p = pileOfPlates(n, thetaB, k);
      return (p.TpSinglePass - p.TsSinglePass) / (p.TpSinglePass + p.TsSinglePass);
    });
    return [
      { x: ms, y: ms.map((k) => pileDopAtBrewster(n, k)), type: "scatter" as const, mode: "lines+markers" as const, name: "With multiple reflections", line: { color: "#a78bfa", width: 2 } },
      { x: ms, y: single, type: "scatter" as const, mode: "lines" as const, name: "Ignoring them, (1 − r)²ᵐ", line: { color: "#9ca3af", dash: "dash" } },
    ];
  }, [n, thetaB]);

  const layout = (x: string, y: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: y, gridcolor: "#374151", range: [0, 1] },
    margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>θ<sub>B</sub> = arctan n, &nbsp;r<sub>p</sub>(θ<sub>B</sub>) = 0, &nbsp;r<sub>s</sub>(θ<sub>B</sub>) = ((n² − 1)/(n² + 1))²</p>
        <p>m plates (2m surfaces, incoherent): T = (1 − r)/(1 + (2m − 1) r) for each polarization</p>
        <p>P = (T<sub>p</sub> − T<sub>s</sub>)/(T<sub>p</sub> + T<sub>s</sub>) = m/(m + (2n/(n² − 1))²) at θ<sub>B</sub></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <ValidatedNumberInput label="Plate index n" value={nIn} onChange={setN} min={1.01} max={5} step="0.01" />
        <ValidatedNumberInput label="Number of plates m" value={platesIn} onChange={setPlates} min={1} max={50} step="1" />
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Lossless, plane-parallel plates in air, spaced so the reflections add in power (no interference). r is the
        reflectance of one surface; glass to air reflects the same at the refracted angle.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setN(1.52)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Crown glass 1.52</button>
        <button onClick={() => setN(1.76)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Flint 1.76</button>
        <button onClick={() => setN(2.42)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Diamond 2.42</button>
        <button onClick={() => setN(4.0)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Germanium 4.0 (IR)</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Brewster angle</p>
          <p className="text-2xl font-bold text-blue-400">{fix(thetaB / DEG, 2)}°</p>
          <p className="text-xs text-gray-500">one surface reflects r<sub>s</sub> = {pct(atB.rs)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pile transmittance at θ<sub>B</sub></p>
          <p className="text-xl font-bold text-green-400">T<sub>p</sub> {pct(atB.Tp, 1)}</p>
          <p className="text-xl font-bold text-blue-400">T<sub>s</sub> {pct(atB.Ts, 2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Degree of polarization (unpolarized in)</p>
          <p className="text-2xl font-bold text-purple-400">{fix(atB.dop, 4)}</p>
          <p className="text-xs text-gray-500">ignoring multiple reflections: {fix(singlePassDop, 4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction T<sub>p</sub>/T<sub>s</sub></p>
          <p className="text-2xl font-bold text-yellow-400">{dB(atB.extinction)}</p>
          <p className="text-xs text-gray-500">ratio {fix(atB.extinction, 2)} : 1</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmittance and polarization against the angle of incidence ({m} plates)</h3>
          <ChartPanel data={angleChart} layout={layout("Angle of incidence (°)", "Fraction")} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Degree of polarization at θ<sub>B</sub> against the number of plates</h3>
          <ChartPanel data={platesChart} layout={layout("Plates m", "Degree of polarization")} />
        </div>
      </div>
    </>
  );
}
