"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { evanescentIntensityRatio, lp01PowerBeyondPlane } from "../../../physics/fiber-optics/coupled-mode";
import { LP11_CUTOFF_V, MIN_V, lp01Mode, vNumber } from "../../../physics/fiber-optics/macro-bending-loss";
import { effectiveIndex, petermannIIRadius } from "../../../physics/fiber-optics/step-index-modes";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtPct = (x: number) =>
  !Number.isFinite(x) ? "—" : x >= 1e-3 ? `${(100 * x).toPrecision(3)} %` : `${(100 * x).toExponential(2)} %`;
/**
 * First-order perturbation needs the shift to be small against the guidance margin n_eff − n₂, and the outer index
 * to stay well below n_eff (as it approaches n_eff the real tail spreads out and first order underestimates).
 */
const PERTURBATION_FRACTION = 0.1;
const NEAR_LEAK_FRACTION = 0.5;

export default function DShapedFiberPage() {
  const [cladDia, setCladDia] = useURLState("cladDia", 125); // µm
  const [coreDia, setCoreDia] = useURLState("coreDia", 9); // µm
  const [flatDepth, setFlatDepth] = useURLState("flatDepth", 8); // µm, core centre to flat
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [n_core, setN_core] = useURLState("n_core", 1.4494);
  const [n_clad, setN_clad] = useURLState("n_clad", 1.444);
  const [n_ext, setN_ext] = useURLState("n_ext", 1.333); // medium on the flat (water)

  const a_um = coreDia / 2;
  const fiber = useMemo(
    () => ({ a: a_um * 1e-6, n1: n_core, NA: Math.sqrt(n_core ** 2 - n_clad ** 2) }),
    [a_um, n_core, n_clad],
  );

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const V = vNumber(fiber, lambda);
    const mode = lp01Mode(V);
    const nEff = effectiveIndex(fiber, lambda, mode);
    const rho0 = flatDepth / a_um;
    const eta = lp01PowerBeyondPlane(mode, rho0);
    return {
      V, mode, nEff, eta,
      surface: evanescentIntensityRatio(mode, rho0),
      mfd_um: 2 * petermannIIRadius(fiber, lambda, mode) * 1e6,
      // First-order perturbation (Snyder & Love 1983): Δ(n_eff²) = η(n_ext² − n₂²); its slope gives the sensitivity.
      dNeff: (eta * (n_ext ** 2 - n_clad ** 2)) / (2 * nEff),
      sensitivity: (eta * n_ext) / nEff,
    };
  }, [fiber, wavelength, flatDepth, a_um, n_ext, n_clad]);

  const chartData = useMemo(() => {
    const depths: number[] = [];
    const etas: (number | null)[] = [];
    for (let i = 0; i <= 60; i++) {
      const d = a_um + (i * 10) / 60; // µm from the core centre: core edge to 10 µm beyond it
      const eta = lp01PowerBeyondPlane(calc.mode, d / a_um);
      depths.push(d);
      etas.push(eta > 0 ? 100 * eta : null);
    }
    return [
      { x: depths, y: etas, type: "scatter" as const, mode: "lines" as const, name: "Power beyond the flat (%)", line: { color: "#60a5fa" } },
    ];
  }, [calc.mode, a_um]);

  const noFlat = flatDepth >= cladDia / 2;
  const cutsCore = flatDepth < a_um;
  const valid = Number.isFinite(calc.eta) && !noFlat;
  const leaky = valid && n_ext >= calc.nEff;
  const margin = calc.nEff - n_clad;
  const strong = valid && !leaky && Math.abs(calc.dNeff) > PERTURBATION_FRACTION * margin;
  const nearLeak = valid && !leaky && calc.nEff - n_ext < NEAR_LEAK_FRACTION * margin;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Cladding Ø (µm)" value={cladDia} onChange={setCladDia} min={10} max={1000} step="1" />
        <ValidatedNumberInput label="Core Ø (µm)" value={coreDia} onChange={setCoreDia} min={1} max={60} step="0.1" />
        <ValidatedNumberInput label="Flat Distance from Core Centre (µm)" value={flatDepth} onChange={setFlatDepth} min={0} max={500} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2500} step="1" />
        <ValidatedNumberInput label="Core Index n₁" value={n_core} onChange={setN_core} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Cladding Index n₂" value={n_clad} onChange={setN_clad} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="External Index on the Flat" value={n_ext} onChange={setN_ext} min={1} max={2} step="0.001" />
      </div>

      {noFlat && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The flat lies at or beyond the cladding radius ({cladDia / 2} µm): the fibre is round and nothing is computed.
        </p>
      )}
      {!noFlat && cutsCore && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The flat cuts into the core (distance &lt; a = {a_um} µm): the round-fibre mode no longer applies and nothing is computed.
        </p>
      )}
      {!noFlat && !cutsCore && !Number.isFinite(calc.eta) && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the model needs n₁ &gt; n₂ and V ≥ {MIN_V} (here V = {fmt(calc.V, 3)}).
        </p>
      )}
      {valid && calc.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} &gt; {LP11_CUTOFF_V.toFixed(3)}: the fibre is not single-mode; only LP01 is computed.
        </p>
      )}
      {leaky && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The external index is at or above n_eff = {calc.nEff.toFixed(5)}: the mode leaks out through the flat, and the guided-mode
          shift and sensitivity do not apply.
        </p>
      )}
      {strong && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The external medium shifts n_eff by more than {100 * PERTURBATION_FRACTION} % of the guidance margin n_eff − n₂ ={" "}
          {margin.toExponential(2)}: first-order perturbation theory is only a rough estimate here
          {n_ext < n_clad ? " (it overestimates the shift)" : ""}.
        </p>
      )}
      {nearLeak && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The external index is close to n_eff: the real field spreads further past the flat than the unperturbed mode, so the
          first-order shift and sensitivity underestimate the true values. This is where D-fibre refractometers are most sensitive.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Power beyond the flat" value={valid ? fmtPct(calc.eta) : "—"} tone="blue" subtext={`V = ${fmt(calc.V, 3)}, n_eff = ${fmt(calc.nEff, 5)}`} />
        <ResultCard label="Intensity at the flat" value={valid ? fmtPct(calc.surface) : "—"} tone="cyan" subtext={`of the core-boundary value; ${fmt(flatDepth - a_um, 1, " µm")} of cladding left`} />
        <ResultCard label="Index shift Δn_eff" value={valid && !leaky ? calc.dNeff.toExponential(2) : "—"} tone="purple" subtext={`external index ${n_ext} vs cladding, first order`} />
        <ResultCard label="Sensitivity ∂n_eff/∂n_ext" value={valid && !leaky ? calc.sensitivity.toExponential(2) : "—"} tone="yellow" subtext={`MFD ${fmt(calc.mfd_um, 2, " µm")} (Petermann II)`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Evanescent Power vs Flat Position</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Flat distance from core centre (µm), from the core edge", gridcolor: "#374151" },
          yaxis: { title: "Power beyond the flat (%)", gridcolor: "#374151", type: "log" },
          legend: { x: 0.6, y: 0.98 },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 340,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">ψ(r) = J₀(U) K₀(Wr/a)/K₀(W) for r &gt; a;  η = ∫_(x &gt; h) ψ² dA / ∫ψ² dA</p>
          <p className="font-mono">Δn_eff ≈ η (n_ext² − n₂²) / (2 n_eff),  ∂n_eff/∂n_ext ≈ η n_ext / n_eff</p>
          <p>
            The flat is a plane at distance h from the core centre. The exact LP01 mode of the round step-index fibre (eigenvalues U and W)
            gives η, the fraction of the mode power beyond that plane; its tail decays as K₀(Wr/a). Replacing the cladding beyond the flat by
            a medium of index n_ext perturbs n_eff to first order by η(n_ext² − n₂²)/(2n_eff), which sets the refractometric sensitivity of a
            D-fibre sensor.
          </p>
          <p>
            First order uses the unperturbed mode. By the variational principle it overestimates the shift for n_ext &lt; n₂ (water, air)
            and underestimates the shift and the sensitivity as n_ext approaches n_eff.
          </p>
          <p className="text-gray-400">
            Not included: the change of the mode itself (see above), polarization (scalar LP model), the form birefringence of the D shape (it needs a vector mode solver; commercial polarization-maintaining
            D-fibres use an elliptical core), and roughness of the flat.
          </p>
        </div>
      </div>
    </>
  );
}
