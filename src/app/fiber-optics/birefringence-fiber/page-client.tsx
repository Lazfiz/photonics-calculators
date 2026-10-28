"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { beatLength, dgdPerLength, geometricBirefringence } from "../../../physics/fiber-optics/fiber-birefringence";
import { numericalAperture } from "../../../physics/fiber-optics/step-index-modes";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
// Text for a result, or a dash when the model has no finite value.
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const lengthText = (L: number) => (L === Infinity ? "∞ (no birefringence)" : L >= 1 ? `${L.toPrecision(4)} m` : `${(L * 1e3).toPrecision(4)} mm`);

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function BirefringenceCalculator() {
  const [n1Raw, setN1] = useURLState("coreIndex", 1.468);
  const [n2Raw, setN2] = useURLState("claddingIndex", 1.463);
  const [radiusRaw, setRadius] = useURLState("coreRadius", 4.5); // µm, mean semi-axis
  const [ratioRaw, setRatio] = useURLState("ellipticity", 0.98); // axis ratio b/a
  const [lambdaRaw, setLambda] = useURLState("wavelength", 1550); // nm
  const [stressRaw, setStress] = useURLState("stressB", 0); // ×10⁻⁴

  const n1 = clamp(n1Raw, 1.3, 2);
  const n2 = clamp(n2Raw, 1.3, 2);
  const a_um = clamp(radiusRaw, 0.5, 50);
  const ratio = clamp(ratioRaw, 0.5, 1);
  const lambda_nm = clamp(lambdaRaw, 400, 2000);
  const Bs = clamp(stressRaw, -20, 20) * 1e-4;

  const calc = useMemo(() => {
    const fiber = { a: a_um * 1e-6, n1, n2, ellipticity: 1 - ratio };
    const geo = geometricBirefringence(fiber, lambda_nm * 1e-9);
    const B = geo.B + Bs;
    // Stress birefringence is nearly independent of λ, so its group value equals the phase value.
    const groupB = geo.groupB + Bs;
    const NA = n1 > n2 ? numericalAperture(n1, n2) : NaN;

    // Sweep V from 0.8 to 3 by wavelength at fixed geometry.
    const lambdas: number[] = [], phase: (number | null)[] = [], group: (number | null)[] = [];
    if (Number.isFinite(NA)) {
      const lMin = (2 * Math.PI * a_um * 1e3 * NA) / 3, lMax = (2 * Math.PI * a_um * 1e3 * NA) / 0.8;
      for (let i = 0; i <= 120; i++) {
        const l = lMin * (lMax / lMin) ** (i / 120);
        const g = geometricBirefringence(fiber, l * 1e-9);
        lambdas.push(l);
        phase.push(Number.isFinite(g.B) ? g.B : null);
        group.push(Number.isFinite(g.groupB) ? g.groupB : null);
      }
    }
    return { geo, B, groupB, NA, L_B: beatLength(B, lambda_nm * 1e-9), dgd: dgdPerLength(groupB), lambdas, phase, group };
  }, [a_um, n1, n2, ratio, lambda_nm, Bs]);

  const { geo } = calc;
  const valid = Number.isFinite(geo.B);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Core Index n₁" value={n1Raw} onChange={setN1} min={1.3} max={2} step="any" />
        <ValidatedNumberInput label="Cladding Index n₂" value={n2Raw} onChange={setN2} min={1.3} max={2} step="any" />
        <ValidatedNumberInput label="Mean Core Radius (µm)" value={radiusRaw} onChange={setRadius} min={0.5} max={50} step="any" />
        <ValidatedNumberInput label="Core Axis Ratio b/a" value={ratioRaw} onChange={setRatio} min={0.5} max={1} step="any" />
        <ValidatedNumberInput label="Stress Birefringence (×10⁻⁴, same axes)" value={stressRaw} onChange={setStress} min={-20} max={20} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setLambda} min={400} max={2000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card label="NA and V" value={show(geo.V, () => `${calc.NA.toFixed(4)}, V = ${geo.V.toFixed(3)}`)}
          sub={show(geo.delta, () => `Δ = ${(geo.delta * 100).toFixed(3)} %, ellipticity ε = 1 − b/a = ${(1 - ratio).toFixed(3)}`)} tone="text-gray-200" />
        <Card label="Geometric B" value={show(geo.B, () => geo.B.toExponential(3))}
          sub="ε n₁ Δ² G(V); slow axis along the major axis" tone="text-blue-400" />
        <Card label="Total B" value={show(calc.B, () => calc.B.toExponential(3))}
          sub={`geometric + stress (${Bs.toExponential(2)})`} tone="text-green-400" />
        <Card label="Beat Length" value={show(calc.L_B, () => lengthText(calc.L_B))} sub="L_B = λ/|B|" tone="text-yellow-400" />
        <Card label="Group Birefringence" value={show(calc.groupB, () => calc.groupB.toExponential(3))}
          sub={show(geo.groupB, () => `geometric part ε n₁ Δ² d(VG)/dV = ${geo.groupB.toExponential(2)}`)} tone="text-gray-200" />
        <Card label="DGD per Length" value={show(calc.dgd, () => `${(calc.dgd * 1e15).toPrecision(4)} fs/m`)}
          sub={show(calc.dgd, () => `${(calc.dgd * 1e15).toPrecision(4)} ps/km, uncoupled (short) fibre`)} tone="text-gray-200" />
      </div>

      {!valid && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          Needs n₁ &gt; n₂ and V ≥ 0.5: below that the mode is barely guided and the perturbation result does not apply.
        </p>
      )}
      {geo.multimode && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          V &gt; 2.405: the fibre also guides LP11. The values are for the fundamental mode only.
        </p>
      )}
      {ratio < 0.8 && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          ε = {(1 - ratio).toFixed(2)}: the model is first order in the ellipticity ε, so it loses accuracy for strongly
          elliptical cores.
        </p>
      )}
      {valid && geo.delta > 0.03 && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          Δ = {(geo.delta * 100).toFixed(1)} % &gt; 3 %: the weak-guidance formulas lose accuracy.
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>B_geo = ε n₁ Δ² G(V), ε = 1 − b/a, Δ = (n₁ − n₂)/n₁</p>
          <p>G(V) = (W²/V⁴)[U² + (U² − W²)(J₀/J₁)² + UW²(J₀/J₁)³] at U, W of LP01</p>
          <p>B_group = ε n₁ Δ² d(VG)/dV (+ stress B); DGD = B_group/c</p>
          <p>L_B = λ/|B|</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Sakai and Kimura&apos;s first-order result for a slightly elliptical step-index core in a weakly guiding
          fibre. G peaks at ≈ 0.49 near V = 1.8, so B is a few 10⁻⁷ for a telecom core and tens of 10⁻⁵ only with a
          large Δ and ε. The geometric group birefringence changes sign near V = 2.5. The stress input adds an
          anisotropic-stress term (from the core or stress rods) with the same axes; enter it negative if its slow axis
          is the minor axis. Ignored: material dispersion of n₁ and Δ, and random coupling in long fibres (PMD grows
          as √L there).
        </p>
      </div>

      <ChartPanel data={[
        { x: calc.lambdas, y: calc.phase, type: "scatter", mode: "lines", name: "Geometric B (phase)", line: { color: "#3b82f6", width: 2 } },
        { x: calc.lambdas, y: calc.group, type: "scatter", mode: "lines", name: "Geometric group B", line: { color: "#f59e0b", width: 2, dash: "dash" } },
        ...(Number.isFinite(geo.B) ? [{ x: [lambda_nm], y: [geo.B], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#22c55e", size: 10 } }] : []),
      ]} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm), V from 3 down to 0.8", gridcolor: "#374151" },
        yaxis: { title: "Geometric Birefringence", gridcolor: "#374151", exponentformat: "e" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
      <p className="text-xs text-gray-400 mt-2">
        Chart: geometric phase and group birefringence against wavelength at the current core shape; the phase
        value peaks where V ≈ 1.8.
      </p>
    </>
  );
}
