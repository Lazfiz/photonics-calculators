"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import { abs } from "../../../physics/complex";
import { brewsterAngle, criticalAngle, fresnel, phaseDifference, phaseOf } from "../../../physics/polarization/fresnel";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const deg = (rad: number, digits = 2) => (Number.isFinite(rad) ? `${fix(rad / DEG, digits)}°` : "—");
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fix(v * 100, digits)} %` : "—");

/** R, T and the reflection phases against the angle of incidence, 0–89.9°. */
function angleCharts(n1: number, n2: number, k2: number) {
  const angles = Array.from({ length: 900 }, (_, i) => i * 0.1);
  const curves = angles.map((a) => fresnel(n1, n2, a * DEG, k2));
  const powerChart = [
    { x: angles, y: curves.map((c) => c.Rs), type: "scatter" as const, mode: "lines" as const, name: "Rₛ", line: { color: "#60a5fa", width: 2 } },
    { x: angles, y: curves.map((c) => c.Rp), type: "scatter" as const, mode: "lines" as const, name: "Rₚ", line: { color: "#f87171", width: 2 } },
    { x: angles, y: curves.map((c) => c.Ts), type: "scatter" as const, mode: "lines" as const, name: "Tₛ", line: { color: "#60a5fa", dash: "dash" } },
    { x: angles, y: curves.map((c) => c.Tp), type: "scatter" as const, mode: "lines" as const, name: "Tₚ", line: { color: "#f87171", dash: "dash" } },
  ];
  const phaseChart = [
    { x: angles, y: curves.map((c) => phaseOf(c.rs) / DEG), type: "scatter" as const, mode: "lines" as const, name: "arg rₛ", line: { color: "#60a5fa", width: 2 } },
    { x: angles, y: curves.map((c) => phaseOf(c.rp) / DEG), type: "scatter" as const, mode: "lines" as const, name: "arg rₚ", line: { color: "#f87171", width: 2 } },
    { x: angles, y: curves.map((c) => phaseDifference(c.rp, c.rs) / DEG), type: "scatter" as const, mode: "lines" as const, name: "Δ = arg(rₚ/rₛ)", line: { color: "#a78bfa", width: 2, dash: "dash" } },
  ];
  return { powerChart, phaseChart };
}

export default function FresnelPolarizationPage() {
  const [n1In, setN1] = useURLState("n1", 1.0);
  const [n2In, setN2] = useURLState("n2", 1.52);
  const [k2In, setK2] = useURLState("k2", 0);
  const [thetaIn, setThetaIDeg] = useURLState("thetaIDeg", 30);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const n1 = clamp(n1In, 1, 5);
  const n2 = clamp(n2In, 0.01, 10);
  const k2 = clamp(k2In, 0, 20);
  const theta = clamp(thetaIn, 0, 89.9) * DEG;

  const f = fresnel(n1, n2, theta, k2);
  const lossless = k2 === 0;
  const brewster = lossless ? brewsterAngle(n1, n2) : NaN;
  const critical = lossless ? criticalAngle(n1, n2) : NaN;
  const delta = phaseDifference(f.rp, f.rs);

  const { powerChart, phaseChart } = angleCharts(n1, n2, k2);

  const layout = (x: string, y: string, range?: [number, number]) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151", range: [0, 90] },
    yaxis: { title: y, gridcolor: "#374151", ...(range ? { range } : {}) },
    margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320, legend: { orientation: "h" as const, y: -0.3 },
  });

  const coeff = (label: string, z: { re: number; im: number }) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-mono text-gray-200">{fix(abs(z), 4)} ∠ {deg(phaseOf(z), 1)}</p>
    </div>
  );

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>r<sub>s</sub> = (n₁cos θ₁ − N₂cos θ₂)/(n₁cos θ₁ + N₂cos θ₂), &nbsp;r<sub>p</sub> = (N₂cos θ₁ − n₁cos θ₂)/(N₂cos θ₁ + n₁cos θ₂)</p>
        <p>n₁ sin θ₁ = N₂ sin θ₂, &nbsp;N₂ = n₂ − iκ₂; &nbsp;in total internal reflection N₂cos θ₂ = −i√(n₁²sin²θ₁ − n₂²)</p>
        <p>T<sub>s</sub> = Re(N₂cos θ₂)/(n₁cos θ₁)·|t<sub>s</sub>|², &nbsp;R + T = 1</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <ValidatedNumberInput label="n₁ (incident medium, lossless)" value={n1In} onChange={setN1} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="n₂ (second medium)" value={n2In} onChange={setN2} min={0.01} max={10} step="0.01" />
        <ValidatedNumberInput label="κ₂ (absorption index)" value={k2In} onChange={setK2} min={0} max={20} step="0.01" />
        <ValidatedNumberInput label="Angle of incidence (°)" value={thetaIn} onChange={setThetaIDeg} min={0} max={89.9} step="0.5" />
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Convention: time factor e<sup>i(ωt − kz)</sup>, so absorption is N = n − iκ and a positive phase is an advance;
        r<sub>p</sub> = −r<sub>s</sub> at normal incidence (Born &amp; Wolf, Hecht; the ellipsometry convention, Δ = 180° there).
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setN1(1); setN2(1.52); setK2(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Air → glass (1.52)</button>
        <button onClick={() => { setN1(1); setN2(3.48); setK2(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Air → silicon (3.48, 1.55 µm)</button>
        <button onClick={() => { setN1(1.52); setN2(1); setK2(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Glass → air</button>
        {lossless && Number.isFinite(brewster) && (
          <button onClick={() => setThetaIDeg(Math.round((brewster / DEG) * 100) / 100)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">Set Brewster angle</button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Refraction angle θ₂</p>
          <p className="text-2xl font-bold text-blue-400">{f.tir ? "TIR" : deg(f.thetaT)}</p>
          <p className="text-xs text-gray-500">{f.tir ? "no wave propagates into medium 2" : lossless ? "" : "complex in an absorbing medium"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Brewster / critical angle</p>
          <p className="text-2xl font-bold text-green-400">{deg(brewster)} / {deg(critical)}</p>
          <p className="text-xs text-gray-500">{lossless ? "Rₚ = 0 at Brewster; TIR above the critical angle" : "defined for lossless media only"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">R (unpolarized light)</p>
          <p className="text-2xl font-bold text-yellow-400">{pct((f.Rs + f.Rp) / 2)}</p>
          <p className="text-xs text-gray-500">reflected light polarized {pct((f.Rs - f.Rp) / (f.Rs + f.Rp), 1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δ = arg(r<sub>p</sub>/r<sub>s</sub>), ψ</p>
          <p className="text-2xl font-bold text-purple-400">{deg(delta, 1)}</p>
          <p className="text-xs text-gray-500">tan ψ = |r<sub>p</sub>|/|r<sub>s</sub>|: ψ = {deg(Math.atan2(abs(f.rp), abs(f.rs)), 2)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Amplitude coefficients (magnitude ∠ phase)</h3>
          <div className="grid grid-cols-2 gap-3">
            {coeff("rₛ", f.rs)}
            {coeff("rₚ", f.rp)}
            {coeff("tₛ", f.ts)}
            {coeff("tₚ", f.tp)}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Power</h3>
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div><p className="text-xs text-gray-500">R<sub>s</sub></p><p className="text-blue-400">{pct(f.Rs, 3)}</p></div>
            <div><p className="text-xs text-gray-500">R<sub>p</sub></p><p className="text-red-400">{pct(f.Rp, 3)}</p></div>
            <div><p className="text-xs text-gray-500">T<sub>s</sub></p><p className="text-blue-400">{pct(f.Ts, 3)}</p></div>
            <div><p className="text-xs text-gray-500">T<sub>p</sub></p><p className="text-red-400">{pct(f.Tp, 3)}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Reflectance and transmittance against the angle of incidence</h3>
          <ChartPanel data={powerChart} layout={layout("Angle of incidence (°)", "Fraction", [0, 1])} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Reflection phases (°)</h3>
          <ChartPanel data={phaseChart} layout={layout("Angle of incidence (°)", "Phase (°)", [-180, 180])} />
        </div>
      </div>
    </>
  );
}
