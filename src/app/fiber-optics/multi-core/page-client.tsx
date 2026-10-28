"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  averagePowerCoupling, couplingCoefficient, criticalBendRadius, pairCrosstalk,
} from "../../../physics/fiber-optics/coupled-mode";
import { LP11_CUTOFF_V, MIN_V, elastoOpticBendRadius, lp01Mode, vNumber } from "../../../physics/fiber-optics/macro-bending-loss";
import { effectiveIndex, numericalAperture } from "../../../physics/fiber-optics/step-index-modes";

/** Core layouts: nearest neighbours of the worst core, and the outer-core centre radius in pitches. */
const LAYOUTS: Record<number, { neighbours: number; outerRadius: number; name: string }> = {
  1: { neighbours: 0, outerRadius: 0, name: "single core" },
  3: { neighbours: 2, outerRadius: 1 / Math.sqrt(3), name: "triangle" },
  7: { neighbours: 6, outerRadius: 1, name: "hexagonal, centre core" },
  12: { neighbours: 2, outerRadius: 1 / (2 * Math.sin(Math.PI / 12)), name: "ring of 12" },
  19: { neighbours: 6, outerRadius: 2, name: "hexagonal, two rings" },
};

const toDb = (x: number) => 10 * Math.log10(x);
/** Crosstalk in dB; 0 (no length, or h̄ underflowed) is shown as "−∞ dB". */
const fmtXt = (x: number) => (!Number.isFinite(x) ? "—" : x === 0 ? "−∞ dB" : `${toDb(x).toFixed(1)} dB`);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtExp = (x: number, unit = "") => (Number.isFinite(x) ? `${x.toExponential(2)}${unit}` : "—");

export default function MultiCoreFiberCalculator() {
  const [numCores, setNumCores] = useURLState("numCores", 7);
  const [corePitch, setCorePitch] = useURLState("corePitch", 45, { min: 5, max: 200 }); // µm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5, { min: 0.5, max: 30 }); // µm
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.468, { min: 1, max: 4 });
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.463, { min: 1, max: 4 });
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 400, max: 2500 }); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10, { min: 0, max: 10000 }); // km
  const [deltaBeta, setDeltaBeta] = useURLState("deltaBeta", 0, { min: 0, max: 100000 }); // rad/m, core-to-core mismatch
  const [bendRadius, setBendRadius] = useURLState("bendRadius", 100, { min: 1, max: 10000 }); // mm
  const [correlationLength, setCorrelationLength] = useURLState("correlationLength", 0.05, { min: 0.001, max: 10 }); // m
  const [outerCladding, setOuterCladding] = useURLState("outerCladding", 30, { min: 0, max: 200 }); // µm, outer core centre to cladding edge

  const cores = LAYOUTS[numCores] ? numCores : 7; // a URL value that isn't a layout falls back to 7
  const layout = LAYOUTS[cores];

  const fiber = useMemo(
    () => ({ a: coreRadius * 1e-6, n1: coreIndex, NA: numericalAperture(coreIndex, claddingIndex) }),
    [coreRadius, coreIndex, claddingIndex],
  );

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const V = vNumber(fiber, lambda);
    const mode = lp01Mode(V);
    const beta = (2 * Math.PI * effectiveIndex(fiber, lambda, mode)) / lambda;
    const L = fiberLength * 1e3;
    const xtAt = (pitch_um: number) => {
      const kappa = couplingCoefficient(fiber, lambda, pitch_um * 1e-6, mode);
      const h = averagePowerCoupling({
        kappa, beta, pitch: pitch_um * 1e-6, bendRadius: bendRadius * 1e-3, correlationLength, deltaBeta,
      });
      return { kappa, h, pair: pairCrosstalk(h, L) };
    };
    const { kappa, h, pair } = xtAt(corePitch);
    return {
      V, beta, kappa, h, pair, xtAt,
      // First-order sum over the nearest neighbours: valid while it is ≪ 1.
      worst: layout.neighbours * pair,
      rpk: deltaBeta !== 0 ? criticalBendRadius(beta, corePitch * 1e-6, deltaBeta) : Infinity,
      claddingDiameter: 2 * (layout.outerRadius * corePitch + outerCladding),
    };
  }, [fiber, wavelength, fiberLength, corePitch, bendRadius, correlationLength, deltaBeta, layout, outerCladding]);

  const plotData = useMemo(() => {
    const pitches: number[] = [];
    const pair: (number | null)[] = [];
    const worst: (number | null)[] = [];
    const pLo = Math.max(2 * coreRadius, corePitch / 2);
    const pHi = Math.max(2 * corePitch, corePitch / 2 + 10);
    const nPts = 80;
    for (let i = 0; i <= nPts; i += 1) {
      const p = pLo + (i * (pHi - pLo)) / nPts;
      const xt = calc.xtAt(p).pair;
      pitches.push(p);
      pair.push(xt > 0 ? toDb(xt) : null);
      worst.push(xt > 0 && layout.neighbours > 0 ? toDb(layout.neighbours * xt) : null);
    }
    const traces = [
      {
        x: pitches, y: pair, type: "scatter" as const, mode: "lines" as const,
        name: "One neighbour, tanh(h̄L)", line: { color: "#3b82f6", width: 2 },
      },
    ];
    if (layout.neighbours > 1) {
      traces.push({
        x: pitches, y: worst, type: "scatter" as const, mode: "lines" as const,
        name: `Worst core, ${layout.neighbours} neighbours`, line: { color: "#f59e0b", width: 2 },
      });
    }
    const current = calc.pair > 0 ? toDb(calc.pair) : NaN;
    return Number.isFinite(current)
      ? [...traces, {
        x: [corePitch], y: [current], type: "scatter" as const, mode: "markers" as const,
        name: "Current pitch", marker: { color: "#22c55e", size: 11 },
      }]
      : traces;
  }, [calc, corePitch, layout, coreRadius]);

  const valid = Number.isFinite(calc.kappa) && Number.isFinite(calc.h);
  const weakCoupling = valid && calc.pair < 0.1;
  // Weak guidance (LP modes): Δ = (n₁² − n₂²)/(2n₁²) must be small; 3 % is the usual limit.
  const delta = (coreIndex ** 2 - claddingIndex ** 2) / (2 * coreIndex ** 2);
  const eoFactor = elastoOpticBendRadius(1, coreIndex);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="numCores">Number of cores</label>
          <select id="numCores" value={cores} onChange={(e) => setNumCores(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
            {Object.entries(LAYOUTS).map(([n, l]) => (
              <option key={n} value={n}>{n} ({l.name})</option>
            ))}
          </select>
        </div>
        <ValidatedNumberInput label="Core Pitch Λ (µm)" value={corePitch} onChange={setCorePitch} min={5} max={200} step="1" />
        <ValidatedNumberInput label="Core Radius a (µm)" value={coreRadius} onChange={setCoreRadius} min={0.5} max={30} step="0.1" />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Cladding Index n₂" value={claddingIndex} onChange={setCladdingIndex} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2500} step="1" />
        <ValidatedNumberInput label="Fiber Length (km)" value={fiberLength} onChange={setFiberLength} min={0} max={10000} step="1" />
        <ValidatedNumberInput label="Bend Radius R_b (mm)" value={bendRadius} onChange={setBendRadius} min={1} max={10000} step="1" />
        <ValidatedNumberInput label="Core Mismatch Δβ (rad/m)" value={deltaBeta} onChange={setDeltaBeta} min={0} max={100000} step="100" />
        <ValidatedNumberInput label="Correlation Length d (m)" value={correlationLength} onChange={setCorrelationLength} min={0.001} max={10} step="0.01" />
        <ValidatedNumberInput label="Outer Cladding Thickness (µm)" value={outerCladding} onChange={setOuterCladding} min={0} max={200} step="1" />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the model needs n₁ &gt; n₂, V ≥ {MIN_V} (here V = {fmt(calc.V, 3)}) and a pitch of at least two core radii.
        </p>
      )}
      {valid && calc.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} &gt; {LP11_CUTOFF_V.toFixed(3)}: the cores carry LP11 as well; only LP01 coupling is computed, and LP11 couples far more strongly.
        </p>
      )}
      {Number.isFinite(delta) && delta > 0.03 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          Δ = {(delta * 100).toFixed(2)} % &gt; 3 %: outside the weakly guiding LP model, so κ and the LP01 field are only approximate.
        </p>
      )}
      {valid && !weakCoupling && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The pair crosstalk is above −10 dB: the cores are strongly coupled over this length and the neighbour sum overestimates the worst core.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Coupling coefficient κ" value={fmtExp(calc.kappa, " m⁻¹")} tone="blue" subtext={`V = ${fmt(calc.V, 3)}, κ/β = ${fmtExp(calc.kappa / calc.beta)}`} />
        <ResultCard label="Power coupling h̄" value={fmtExp(calc.h, " m⁻¹")} tone="purple" subtext="bend- and twist-averaged" />
        <ResultCard label="Crosstalk, one neighbour" value={layout.neighbours === 0 ? "—" : fmtXt(calc.pair)} tone="green" subtext={layout.neighbours === 0 ? "single core: no crosstalk" : `tanh(h̄L) after ${fiberLength} km`} />
        <ResultCard
          label="Worst core"
          value={layout.neighbours === 0 ? "no neighbours" : fmtXt(calc.worst)}
          tone="yellow"
          subtext={layout.neighbours === 0 ? "single core" : `${layout.neighbours} nearest neighbours, first-order sum`}
        />
        <ResultCard label="Critical bend radius R_pk" value={Number.isFinite(calc.rpk) ? `${(calc.rpk * 1e3).toPrecision(3)} mm` : "∞ (Δβ = 0)"} tone="orange" subtext="βΛ/Δβ: bends tighter than this phase-match the cores" />
        <ResultCard label="Cladding diameter" value={fmt(calc.claddingDiameter, 0, " µm")} tone="cyan" subtext={`${cores} cores, ${layout.name}`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Crosstalk vs Core Pitch ({fiberLength} km, R_b = {bendRadius} mm)</h3>
        <ChartPanel data={plotData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Core pitch Λ (µm)", gridcolor: "#374151" },
          yaxis: { title: "Crosstalk (dB)", gridcolor: "#374151" },
          legend: { x: 0.55, y: 0.98 },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 380,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">κ = (NA/(n₁a)) · (U²/V³) · K₀(WΛ/a) / K₁²(W)</p>
          <p className="font-mono">h̄ = 2κ²d · Re[1/√((1 + i dΔβ)² + (dβΛ/R_b)²)]  →  2κ²R_b/(βΛ) for Δβ = 0, d ≫ R_b/(βΛ)</p>
          <p className="font-mono">XT = tanh(h̄L)</p>
          <p>
            κ is Snyder&apos;s coupled-mode coefficient for two identical step-index cores, using the exact LP01 eigenvalues U and W.
            Random bends and twists sweep the phase mismatch between cores through Δβ + (βΛ/R_b) cos θ. Averaging over the twist angle θ,
            with an exponential autocorrelation of correlation length d, gives Koshiba&apos;s h̄. For identical cores (Δβ = 0) and d ≫ R_b/(βΛ) it is
            Hayashi&apos;s 2κ²R_b/(βΛ), independent of d. For cores that differ by Δβ, bends gentler than R_pk never phase-match them, and
            the crosstalk drops by orders of magnitude.
          </p>
          <p className="text-gray-400">
            κ is computed for identical cores; Δβ enters only through phase matching, which is fine while the cores differ slightly.
            Not included: LP11 and other higher-order modes, trench-assisted profiles, and coupling to cores beyond the nearest
            neighbours. The worst-core value adds the neighbour pairs, which holds while each pair is well below −10 dB. R_b is the
            physical bend radius, as in Hayashi&apos;s equivalent-index model; the elasto-optic effect makes silica act as if it were
            about {eoFactor > 0 ? eoFactor.toFixed(2) : "—"}× larger (Nagano et al. 1978), which would raise the Δβ = 0 crosstalk by about 1 dB.
          </p>
        </div>
      </div>
    </>
  );
}
