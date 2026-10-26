"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  gParameter, oneWayGouyPhase, resonatorFsr, resonatorStability, transverseModeSpacing, twoMirrorMode,
} from "../../../physics/wave-optics/two-mirror-resonator";
import { fsrWavelength } from "../../../physics/spectroscopy/etalon";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const firstFinite = (...xs: number[]) => xs.find((x) => Number.isFinite(x)) ?? NaN;

const ORDER_COLORS = ["#60a5fa", "#34d399", "#facc15", "#fb923c", "#f87171"];

export default function CavityModeSpacingPage() {
  // NaN when absent: links from the old cavity-stability page carry L, r1, r2 (mm) at a fixed 1064 nm.
  const [lengthRaw, setLength] = useURLState("cavityLength", NaN); // mm
  const [r1Raw, setR1] = useURLState("R1", NaN); // mm, 0 = flat
  const [r2Raw, setR2] = useURLState("R2", NaN);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", NaN); // nm
  const [nRaw, setN] = useURLState("n", 1);
  const [oldL] = useURLState("L", NaN);
  const [oldR1] = useURLState("r1", NaN);
  const [oldR2] = useURLState("r2", NaN);
  const oldLink = [oldL, oldR1, oldR2].some(Number.isFinite);

  const lengthIn = firstFinite(lengthRaw, oldL, oldLink ? 500 : 150);
  const r1In = firstFinite(r1Raw, oldR1, oldLink ? 1000 : 100);
  const r2In = firstFinite(r2Raw, oldR2, oldLink ? 1000 : 100);
  const wavelengthIn = firstFinite(wavelengthRaw, oldLink ? 1064 : 1550);

  const L_mm = clamp(lengthIn, 0.1, 1e5, 150);
  const R1_mm = clamp(r1In, -1e7, 1e7, 100);
  const R2_mm = clamp(r2In, -1e7, 1e7, 100);
  const wavelength = clamp(wavelengthIn, 200, 11000, 1550);
  const n = clamp(nRaw, 1, 4, 1);

  const L = L_mm * 1e-3;
  const toRadius = (R_mm: number) => (R_mm === 0 ? Infinity : R_mm * 1e-3);
  const g1 = gParameter(L, toRadius(R1_mm));
  const g2 = gParameter(L, toRadius(R2_mm));
  const stability = resonatorStability(g1, g2);
  const mode = twoMirrorMode(wavelength * 1e-9, L, g1, g2, n);
  const fsr = resonatorFsr(L, n);
  const theta = oneWayGouyPhase(g1, g2);
  const dNuT = transverseModeSpacing(fsr, g1, g2);
  const lambdaFsr_pm = fsrWavelength(wavelength * 1e-9, n, L, 1) * 1e12;
  const statusTone = stability === "stable" ? "green" : stability === "marginal" ? "yellow" : "red";
  const statusText = { stable: "Stable", marginal: "On the boundary", unstable: "Unstable" }[stability];

  // Mode frequencies ν − ν(q, 00) over two FSRs, one stick series per transverse order m + n.
  const fsrGHz = fsr / 1e9;
  const span = 2 * fsrGHz;
  const maxOrder = Number.isFinite(theta) ? 4 : 0;
  const spectrum = Array.from({ length: maxOrder + 1 }, (_, order) => {
    const height = 1 - 0.18 * order;
    const offset = order === 0 ? 0 : (order * theta) / Math.PI; // in FSRs (θ is NaN for an unstable cavity)
    const freqs: number[] = [];
    for (let k = -Math.ceil(offset); k <= 2; k++) {
      const f = (k + offset) * fsrGHz;
      if (f >= -1e-9 * span && f <= span * (1 + 1e-9)) freqs.push(round6(f));
    }
    const points = [{ x: 0, y: 0 }, ...freqs.flatMap((f) => [{ x: f, y: 0 }, { x: f, y: round6(height) }, { x: f, y: 0 }]), { x: round6(span), y: 0 }];
    return { name: `m + n = ${order}`, color: ORDER_COLORS[order], points };
  });

  // Stability diagram: stable between the axes and the hyperbola g₁g₂ = 1.
  const hyperbola = (sign: 1 | -1) =>
    Array.from({ length: 61 }, (_, i) => {
      const x = sign * (0.5 + (1.5 * i) / 60);
      return { x: round6(x), y: round6(1 / x) };
    });
  const onChart = Math.abs(g1) <= 3 && Math.abs(g2) <= 3;
  const diagram = [
    { name: "g₁g₂ = 1 (boundary)", color: "#9ca3af", points: hyperbola(1) },
    { name: "g₁g₂ = 1, negative branch", color: "#9ca3af", points: hyperbola(-1) },
    { name: "g₁ = 0 and g₂ = 0 (boundary)", color: "#6b7280", dashed: true, points: [{ x: -2, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 }, { x: 0, y: 0 }, { x: 2, y: 0 }] },
    { name: "Symmetric: planar, confocal, concentric", color: "#60a5fa", dashed: true, showPoints: true, points: [{ x: -1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 1 }] },
    { name: onChart ? "This cavity" : "This cavity (off the chart)", color: stability === "unstable" ? "#f87171" : "#34d399", showPoints: true, points: onChart ? [{ x: round6(g1), y: round6(g2) }] : [] },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Mirror spacing L (mm)" value={lengthIn} onChange={setLength} min={0.1} max={1e5} step="any" />
        <ValidatedNumberInput label="Mirror 1 radius R₁ (mm; 0 = flat, < 0 convex)" value={r1In} onChange={setR1} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="Mirror 2 radius R₂ (mm; 0 = flat, < 0 convex)" value={r2In} onChange={setR2} min={-1e7} max={1e7} step="any" />
        <ValidatedNumberInput label="Wavelength λ (nm, vacuum)" value={wavelengthIn} onChange={setWavelength} min={200} max={11000} />
        <ValidatedNumberInput label="Refractive index n filling the cavity" value={nRaw} onChange={setN} min={1} max={4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="g₁ / g₂" value={`${fmt(g1)} / ${fmt(g2)}`} subtext="g = 1 − L/R" tone="blue" />
        <ResultCard label="g₁g₂" value={fmt(g1 * g2)} subtext={statusText} tone={statusTone} />
        <ResultCard label="Free spectral range c/(2nL)" value={`${fmt(fsrGHz)} GHz`} subtext={`${fmt(lambdaFsr_pm)} pm at λ`} tone="cyan" />
        <ResultCard label="Transverse mode spacing" value={`${fmt(dNuT / 1e9)} GHz`} subtext={`One-way Gouy phase θ = ${fmt((theta * 180) / Math.PI)}°`} tone="orange" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Waist radius w₀ (1/e²)" value={`${fmt(mode.w0 * 1e6)} µm`} subtext={`Rayleigh range ${fmt(mode.zR * 1e3)} mm in the medium`} tone="green" />
        <ResultCard label="Waist distance from mirror 1" value={`${fmt(mode.z1 * 1e3)} mm`} subtext="Towards mirror 2; negative is behind mirror 1" tone="purple" />
        <ResultCard label="Spot radius on mirror 1" value={`${fmt(mode.w1 * 1e6)} µm`} tone="yellow" />
        <ResultCard label="Spot radius on mirror 2" value={`${fmt(mode.w2 * 1e6)} µm`} tone="yellow" />
      </div>

      {stability !== "stable" && !(g1 === 0 && g2 === 0) && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          {stability === "unstable"
            ? "Outside 0 ≤ g₁g₂ ≤ 1 rays walk out of the cavity: there is no Gaussian mode and no transverse mode spacing."
            : "On the stability boundary the Gaussian mode is lost (a spot grows without limit or shrinks to zero) and the transverse modes are degenerate."}
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>g₁ = 1 − L/R₁, g₂ = 1 − L/R₂; stable for 0 ≤ g₁g₂ ≤ 1. ν<sub>qmn</sub> = FSR [q + (m + n + 1) θ/π], θ = arccos(±√(g₁g₂)),
          + for g &gt; 0 and − for g &lt; 0.</p>
        <p>z<sub>R</sub>² = L² g₁g₂(1 − g₁g₂)/(g₁ + g₂ − 2g₁g₂)², w₀² = λz<sub>R</sub>/(nπ), z₁ = L g₂(1 − g₁)/(g₁ + g₂ − 2g₁g₂),
          w₁² = (λL/nπ)√(g₂/(g₁(1 − g₁g₂))).</p>
      </div>

      <div className="space-y-6">
        <SimpleLineChart
          title="Mode frequencies relative to TEM₀₀ of order q (stick height marks the order, not the power)"
          xLabel="ν − ν(q, 00) (GHz)"
          yLabel="Transverse order (taller = lower)"
          series={spectrum}
        />
        <SimpleLineChart title="Stability diagram: stable between the axes and the hyperbola" xLabel="g₁" yLabel="g₂" series={diagram} />
      </div>
    </>
  );
}
