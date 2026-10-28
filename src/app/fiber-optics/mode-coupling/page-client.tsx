"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { codirectionalPeak, codirectionalPsi, codirectionalTransfer } from "../../../physics/fiber-optics/coupled-mode";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function ModeCouplingCalculator() {
  const [lengthRaw, setLength] = useURLState("couplingLength", 1000); // µm
  const [kappaRaw, setKappa] = useURLState("couplingCoeff", 0.5); // 1/mm
  const [deltaBetaRaw, setDeltaBeta] = useURLState("propConstDiff", 0.1); // 1/mm
  const [inputPowerRaw, setInputPower] = useURLState("inputPower", 1); // mW

  const L_mm = clamp(lengthRaw, 0, 1e7, 1000) * 1e-3;
  const kappa = clamp(kappaRaw, 0, 1e4, 0.5); // 1/mm
  const deltaBeta = clamp(deltaBetaRaw, -1e4, 1e4, 0.1); // 1/mm
  const P0 = clamp(inputPowerRaw, 0, 1e9, 1); // mW

  const psi = codirectionalPsi(kappa, deltaBeta);
  const fraction = codirectionalTransfer(kappa, deltaBeta, L_mm);
  const peak = codirectionalPeak(kappa, deltaBeta);
  const beat = psi > 0 ? Math.PI / psi : Infinity; // period of the exchange, mm

  const zMax = Math.max(L_mm * 1.2, Number.isFinite(beat) ? 2 * beat : 0, 1e-3);
  // ~20 samples per exchange period π/ψ (capped), so long couplers do not alias.
  const nz = Math.min(20000, Math.max(401, Math.ceil((20 * zMax * psi) / Math.PI)));
  const zs = Array.from({ length: nz }, (_, i) => (i / (nz - 1)) * zMax);
  const lengthSeries = [
    { name: "Coupled guide", color: "#3b82f6", points: zs.map((z) => ({ x: round6(z), y: round6(codirectionalTransfer(kappa, deltaBeta, z) * P0) })) },
    { name: "Through guide", color: "#ef4444", points: zs.map((z) => ({ x: round6(z), y: round6((1 - codirectionalTransfer(kappa, deltaBeta, z)) * P0) })) },
    { name: "This length", color: "#22c55e", showPoints: true, points: [{ x: round6(L_mm), y: round6(fraction * P0) }] },
  ];

  // Transfer at this length vs mismatch: the coupler's wavelength (Δβ) response, over ±max(8π/L, 2|Δβ|, 4κ).
  const dbSpan = Math.max(L_mm > 0 ? (8 * Math.PI) / L_mm : 0, 2 * Math.abs(deltaBeta), 4 * kappa, 1e-6);
  // Fringes in Δβ are ≈ 2π/L apart (L in mm, Δβ in mm⁻¹); ~20 samples per fringe over the 2·dbSpan range.
  const ndb = Math.min(20000, Math.max(201, Math.ceil((20 * 2 * dbSpan * L_mm) / (2 * Math.PI))));
  const mismatchSeries = L_mm > 0 ? [
    { name: "Coupled fraction", color: "#a78bfa", points: Array.from({ length: ndb }, (_, i) => ((2 * i - (ndb - 1)) / (ndb - 1)) * dbSpan)
      .map((db) => ({ x: round6(db), y: round6(codirectionalTransfer(kappa, db, L_mm)) })) },
    { name: "This Δβ", color: "#22c55e", showPoints: true, points: [{ x: round6(deltaBeta), y: round6(fraction) }] },
  ] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Coupling length L (µm)" value={lengthRaw} onChange={setLength} min={0} max={1e7} step="any" />
        <ValidatedNumberInput label="Coupling coefficient κ (mm⁻¹)" value={kappaRaw} onChange={setKappa} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Mismatch Δβ = β₁ − β₂ (mm⁻¹)" value={deltaBetaRaw} onChange={setDeltaBeta} min={-1e4} max={1e4} step="any" />
        <ValidatedNumberInput label="Input power P₀ (mW)" value={inputPowerRaw} onChange={setInputPower} min={0} max={1e9} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Coupled power P₂" value={`${fmt(fraction * P0)} mW`} subtext={`${fmt(fraction * 100, 4)} % of P₀`} tone="blue" />
        <ResultCard label="Through power P₁" value={`${fmt((1 - fraction) * P0)} mW`} subtext={`${fmt((1 - fraction) * 100, 4)} % of P₀`} tone="red" />
        <ResultCard label="Maximum transfer κ²/ψ²" value={`${fmt(peak.fraction * 100, 4)} %`}
          subtext={Number.isFinite(peak.length) ? `first reached at π/(2ψ) = ${fmt(peak.length, 4)} mm${deltaBeta === 0 ? " (coupling length L_c)" : ""}` : "no coupling"} tone="green" />
        <ResultCard label="ψ = √(κ² + (Δβ/2)²)" value={`${fmt(psi, 4)} mm⁻¹`} subtext={Number.isFinite(beat) ? `exchange period π/ψ = ${fmt(beat, 4)} mm` : "—"} tone="orange" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6">
        <p>Two parallel guides exchange power through their overlapping evanescent fields. Launching P₀ into guide 1, the
          coupled-mode equations give P₂(z) = P₀(κ²/ψ²) sin²(ψz) and P₁ = P₀ − P₂, with ψ = √(κ² + (Δβ/2)²). Identical guides
          (Δβ = 0) transfer all the power after the coupling length L_c = π/(2κ). A mismatch speeds up the exchange but caps it
          at κ²/ψ², which is why a coupler made of unequal guides acts as a wavelength filter. For κ computed from the core
          spacing of two fibres, see the fiber coupler page.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <SimpleLineChart title="Power along the coupler" xLabel="Length z (mm)" yLabel="Power (mW)" series={lengthSeries} />
        {mismatchSeries.length > 0 && (
          <SimpleLineChart title="Coupled fraction at length L vs mismatch" xLabel="Δβ (mm⁻¹)" yLabel="P₂/P₀" series={mismatchSeries} />
        )}
      </div>
    </>
  );
}
