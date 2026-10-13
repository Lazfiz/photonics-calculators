"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  couplingCoefficient, evanescentIntensityRatio, lp01PowerBeyondPlane, polishedCouplerPhase,
} from "../../../physics/fiber-optics/coupled-mode";
import { LP11_CUTOFF_V, MIN_V, lp01Mode, vNumber } from "../../../physics/fiber-optics/macro-bending-loss";
import { effectiveIndex } from "../../../physics/fiber-optics/step-index-modes";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtPct = (x: number) =>
  !Number.isFinite(x) ? "—" : x >= 1e-3 ? `${(100 * x).toPrecision(3)} %` : `${(100 * x).toExponential(2)} %`;
/**
 * First-order perturbation needs the shift to be small against the guidance margin n_eff − n₂, and the outer index
 * to stay well below n_eff (as it approaches n_eff the real tail spreads out and first order underestimates).
 */
const PERTURBATION_FRACTION = 0.1;
const NEAR_LEAK_FRACTION = 0.5;

export default function SidePolishedPage() {
  const [remainingClad, setRemainingClad] = useURLState("remainingClad", 2); // µm, core boundary to polished face
  const [coreDia, setCoreDia] = useURLState("coreDia", 8.2); // µm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [n_core, setN_core] = useURLState("n_core", 1.4494);
  const [n_clad, setN_clad] = useURLState("n_clad", 1.444);
  const [n_overlay, setN_overlay] = useURLState("n_overlay", 1.444);
  const [blockRadius, setBlockRadius] = useURLState("blockRadius", 25); // cm, radius the fibre is bent to in the block

  const fiber = useMemo(
    () => ({ a: (coreDia / 2) * 1e-6, n1: n_core, NA: Math.sqrt(n_core ** 2 - n_clad ** 2) }),
    [coreDia, n_core, n_clad],
  );

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const V = vNumber(fiber, lambda);
    const mode = lp01Mode(V);
    const nEff = effectiveIndex(fiber, lambda, mode);
    const rho0 = 1 + (remainingClad * 1e-6) / fiber.a;
    const eta = lp01PowerBeyondPlane(mode, rho0);
    // First-order perturbation: Δ(n_eff²) = η (n_ov² − n₂²) (Snyder & Love 1983), so Δn_eff ≈ η(n_ov² − n₂²)/(2 n_eff).
    const dNeff = (eta * (n_overlay ** 2 - n_clad ** 2)) / (2 * nEff);
    // Two identical fibres polished face to face, gap index-matched: minimum core spacing D₀ = 2(a + d).
    const D0 = 2 * (fiber.a + remainingClad * 1e-6);
    const kappa0 = couplingCoefficient(fiber, lambda, D0, mode);
    const phi = polishedCouplerPhase(fiber, lambda, D0, blockRadius * 1e-2, mode);
    return {
      V, mode, nEff, eta, dNeff, kappa0, phi,
      surface: evanescentIntensityRatio(mode, rho0),
      decayLength_um: (fiber.a / mode.W) * 1e6,
      coupled: Math.sin(phi) ** 2,
      Leff_mm: (phi / kappa0) * 1e3,
    };
  }, [fiber, wavelength, remainingClad, n_overlay, n_clad, blockRadius]);

  const chartData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const ds: number[] = [];
    const etas: (number | null)[] = [];
    const coupled: (number | null)[] = [];
    for (let i = 0; i <= 60; i++) {
      const d = i * 0.15; // µm
      const eta = lp01PowerBeyondPlane(calc.mode, 1 + (d * 1e-6) / fiber.a);
      const phi = polishedCouplerPhase(fiber, lambda, 2 * (fiber.a + d * 1e-6), blockRadius * 1e-2, calc.mode);
      ds.push(d);
      etas.push(eta > 0 ? 100 * eta : null);
      coupled.push(Number.isFinite(phi) ? 100 * Math.sin(phi) ** 2 : null);
    }
    return [
      { x: ds, y: etas, type: "scatter" as const, mode: "lines" as const, name: "Power beyond the face (%)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: ds, y: coupled, type: "scatter" as const, mode: "lines" as const, name: "Polished coupler, coupled (%)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [calc.mode, fiber, wavelength, blockRadius]);

  const valid = Number.isFinite(calc.eta);
  const leaky = valid && n_overlay >= calc.nEff;
  const margin = calc.nEff - n_clad;
  const strong = valid && !leaky && Math.abs(calc.dNeff) > PERTURBATION_FRACTION * margin;
  const nearLeak = valid && !leaky && calc.nEff - n_overlay < NEAR_LEAK_FRACTION * margin;
  const mismatchedGap = Math.abs(n_overlay - n_clad) > 0.002;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Remaining Cladding d (µm)" value={remainingClad} onChange={setRemainingClad} min={0} max={30} step="0.1" />
        <ValidatedNumberInput label="Core Diameter (µm)" value={coreDia} onChange={setCoreDia} min={1} max={60} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2500} step="1" />
        <ValidatedNumberInput label="Overlay Index" value={n_overlay} onChange={setN_overlay} min={1} max={2} step="0.0001" />
        <ValidatedNumberInput label="Core Index n₁" value={n_core} onChange={setN_core} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Cladding Index n₂" value={n_clad} onChange={setN_clad} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Block Radius R (cm)" value={blockRadius} onChange={setBlockRadius} min={1} max={500} step="1" />
      </div>

      {!valid && (
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
          The overlay index is at or above n_eff = {calc.nEff.toFixed(5)}: the mode is no longer guided at the polished face and power
          leaks into the overlay (the principle of polished-fibre polarizers and attenuators). The guided-mode results below do not apply there.
        </p>
      )}
      {strong && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The overlay shifts n_eff by more than {100 * PERTURBATION_FRACTION} % of the guidance margin n_eff − n₂ ={" "}
          {margin.toExponential(2)}: first-order perturbation theory is only a rough estimate here
          {n_overlay < n_clad ? " (it overestimates the shift)" : ""}.
        </p>
      )}
      {nearLeak && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The overlay index is close to n_eff: the real field spreads further into the overlay than the unperturbed mode, so the
          first-order shift underestimates the true one.
        </p>
      )}
      {valid && remainingClad < 0.5 && (
        <p className="mb-6 text-sm text-gray-400" role="status">
          Under 0.5 µm of cladding is left: the twin cores almost touch, where coupled-mode theory is at its limit.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Power beyond the face" value={fmtPct(calc.eta)} tone="blue" subtext={`V = ${fmt(calc.V, 3)}, n_eff = ${fmt(calc.nEff, 5)}`} />
        <ResultCard label="Intensity at the face" value={fmtPct(calc.surface)} tone="cyan" subtext={`of the core-boundary value; tail 1/e length a/W = ${fmt(calc.decayLength_um, 2, " µm")}`} />
        <ResultCard label="Overlay shift Δn_eff" value={leaky || !valid ? "—" : calc.dNeff.toExponential(2)} tone="purple" subtext="first-order, η(n_ov² − n₂²)/(2n_eff)" />
        <ResultCard
          label="Polished coupler"
          value={fmtPct(calc.coupled)}
          tone="yellow"
          subtext={`coupled to a twin fibre; κ₀ = ${Number.isFinite(calc.kappa0) ? calc.kappa0.toPrecision(3) : "—"} m⁻¹, L_eff = ${fmt(calc.Leff_mm, 2, " mm")}`}
        />
      </div>
      {mismatchedGap && (
        <p className="mb-6 text-sm text-gray-400" role="status">
          The coupler result assumes the gap between the two polished faces is index-matched to the cladding (n₂); with this overlay it is indicative only.
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Evanescent Power and Coupler Transfer vs Remaining Cladding</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Remaining cladding d (µm)", gridcolor: "#374151" },
          yaxis: { title: "Power beyond the face (%)", gridcolor: "#374151", type: "log" },
          yaxis2: { title: "Coupled power (%)", overlaying: "y", side: "right", range: [0, 105], gridcolor: "#374151" },
          legend: { x: 0.35, y: 0.98 },
          margin: { t: 20, r: 70, b: 50, l: 70 }, height: 360,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">ψ(r) = J₀(U) K₀(Wr/a)/K₀(W) in the cladding;  η = ∫_(x &gt; a+d) ψ² dA / ∫ψ² dA</p>
          <p className="font-mono">κ(D) = (NA/(n₁a)) (U²/V³) K₀(WD/a)/K₁²(W),  D(z) = 2(a + d) + z²/R,  P₂ = sin²(∫κ dz)</p>
          <p>
            The exact LP01 mode of the unpolished step-index fibre (eigenvalues U, W) gives the field beyond the polished face, which lies
            a distance d from the core boundary. Its tail decays as K₀(Wr/a), faster near the core than a pure exponential. η is the fraction
            of the mode power on the far side of the face; an overlay of index n_ov shifts n_eff to first order by η(n_ov² − n₂²)/(2n_eff).
          </p>
          <p>
            Coupler: two identical fibres, each bent to radius R in a block and polished, are placed face to face. Their core spacing
            grows as z²/R away from the centre, so the coupling κ (Snyder&apos;s coefficient) acts over an effective length close to
            Digonnet and Shaw&apos;s √(πaR/W). The fibres are identical, so the transfer is complete when ∫κ dz = π/2.
          </p>
          <p className="text-gray-400">
            Not included: the change of the mode itself near the face (first order overestimates the shift for n_ov &lt; n₂ and
            underestimates it as n_ov approaches n_eff), polarization (scalar LP model; polished-fibre polarizers rely on it), polishing scatter and roughness, and a gap index different from n₂ in the coupler.
          </p>
        </div>
      </div>
    </>
  );
}
