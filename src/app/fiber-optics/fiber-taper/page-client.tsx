"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  adiabaticityScan, coreCladdingTransitionRatio, lp0Modes, taperRadiusAt, taperShape, transitionVEstimate,
} from "../../../physics/fiber-optics/fiber-taper";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
/** TE01/TM01 cut off at V = 2.405 for any index contrast, so below it the cladding–surround guide carries only HE11. */
const SINGLE_MODE_V = 2.405;
/** Diameter in µm with 1 decimal, or 3 significant figures below 1 µm (strong pulls). */
const fmtDia = (d_um: number) => (Number.isFinite(d_um) && d_um < 1 ? `${d_um.toPrecision(3)} µm` : fmt(d_um, 1, " µm"));
/** Below this V_clad the scalar treatment of the cladding–surround boundary is no longer a fair approximation. */
const SCALAR_LIMIT_V_CLAD = 10;

export default function FiberTaperPage() {
  const [initialDia, setInitialDia] = useURLState("initialDia", 125, { min: 10, max: 1000 }); // µm, cladding
  const [coreDia, setCoreDia] = useURLState("coreDia", 8.2, { min: 1, max: 100 }); // µm
  const [na, setNa] = useURLState("na", 0.1246, { min: 0.02, max: 0.4 });
  const [nClad, setNClad] = useURLState("nClad", 1.444, { min: 1.3, max: 2 });
  const [nExt, setNExt] = useURLState("nExt", 1, { min: 1, max: 1.9 });
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 400, max: 2500 }); // nm
  const [hotZone, setHotZone] = useURLState("heaterWidth", 5, { min: 0.1, max: 200 }); // mm, L₀
  const [elongation, setElongation] = useURLState("elongation", 15, { min: 0, max: 500 }); // mm, x
  const [alpha, setAlpha] = useURLState("alpha", 0, { min: -0.9, max: 0.9 });

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const pull = { r0: (initialDia / 2) * 1e-6, L0: hotZone * 1e-3, x: elongation * 1e-3, alpha };
    const fibre0 = {
      a: (coreDia / 2) * 1e-6, rho: pull.r0, n1: Math.sqrt(nClad ** 2 + na ** 2), n2: nClad, n3: nExt,
    };
    const shape = taperShape(pull);
    const ratio = shape.waistRadius / pull.r0;
    const k = (2 * Math.PI) / lambda;
    const V0 = k * fibre0.a * na;
    const tcc = coreCladdingTransitionRatio(fibre0, lambda);
    const waist = { ...fibre0, a: fibre0.a * ratio, rho: shape.waistRadius };
    const [nEffWaist] = lp0Modes(waist, lambda, 1);
    const cladNA = Math.sqrt(nClad ** 2 - nExt ** 2);
    const scan = adiabaticityScan(pull, fibre0, lambda, 40);
    // Ω_d is NaN where no LP01 is found (waists far below the wavelength); count those points instead of hiding them.
    let worst: (typeof scan)[number] | undefined;
    let undefinedPoints = 0;
    for (const s of scan) {
      const r = s.angle / s.delineation;
      if (!Number.isFinite(r)) undefinedPoints++;
      else if (!worst || r > worst.angle / worst.delineation) worst = s;
    }
    return {
      pull, shape, ratio, V0, tcc, nEffWaist, scan, worst, undefinedPoints,
      valid: Number.isFinite(shape.waistRadius) && Number.isFinite(tcc),
      coreWaist_um: coreDia * ratio,
      VcoreWaist: V0 * ratio,
      VcladWaist: k * shape.waistRadius * cladNA,
      singleModeDia_um: ((2 * SINGLE_MODE_V) / (k * cladNA)) * 1e6,
      transitionDia_um: initialDia * tcc,
      Vcc: V0 * tcc,
      VccEstimate: transitionVEstimate(initialDia / coreDia),
      decay_um: nEffWaist !== undefined ? (1 / (k * Math.sqrt(nEffWaist ** 2 - nExt ** 2))) * 1e6 : NaN,
      worstRatio: worst ? worst.angle / worst.delineation : NaN,
    };
  }, [initialDia, coreDia, na, nClad, nExt, wavelength, hotZone, elongation, alpha]);

  const profileData = useMemo(() => {
    const { shape, pull } = calc;
    if (!Number.isFinite(shape.totalLength)) return [];
    const lead = Math.max(0.1 * shape.totalLength, 1e-3); // m of untapered fibre each side
    const zs: number[] = [];
    const ds: number[] = [];
    for (let i = 0; i <= 300; i++) {
      const z = -lead + (i / 300) * (shape.totalLength + 2 * lead);
      const zMirror = Math.min(z, shape.totalLength - z); // the second transition mirrors the first
      zs.push(z * 1e3);
      ds.push(2 * taperRadiusAt(pull, zMirror) * 1e6);
    }
    const traces: Record<string, unknown>[] = [
      { x: zs, y: ds, type: "scatter" as const, mode: "lines" as const, name: "Cladding Ø (µm)", line: { color: "#f87171" } },
    ];
    if (calc.tcc < 1) {
      traces.push({
        x: [zs[0], zs[zs.length - 1]], y: [calc.transitionDia_um, calc.transitionDia_um], type: "scatter" as const,
        mode: "lines" as const, name: "Core–cladding transition Ø", line: { color: "#a78bfa", dash: "dash" },
      });
    }
    return traces;
  }, [calc]);

  const adiabaticData = useMemo(() => {
    const ok = calc.scan.filter((s) => Number.isFinite(s.angle) && s.angle > 0 && Number.isFinite(s.delineation) && s.delineation > 0);
    const dia = ok.map((s) => 2 * s.r * 1e6);
    return [
      { x: dia, y: ok.map((s) => s.delineation * 1e3), type: "scatter" as const, mode: "lines" as const, name: "Love delineation Ω_d (mrad)", line: { color: "#34d399" } },
      { x: dia, y: ok.map((s) => s.angle * 1e3), type: "scatter" as const, mode: "lines" as const, name: "Taper angle Ω (mrad)", line: { color: "#fbbf24" } },
    ];
  }, [calc]);

  const coreGeometryBad = !(coreDia < initialDia);
  const indexBad = !(nExt < nClad);
  const hotZoneBad = !(hotZone + alpha * elongation > 0);
  const pastTransition = calc.valid && calc.ratio < calc.tcc;
  const adiabatic = calc.worstRatio < 1;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Hot-Zone Length L₀ (mm)" value={hotZone} onChange={setHotZone} min={0.1} max={200} step="any" />
        <ValidatedNumberInput label="Elongation x (mm)" value={elongation} onChange={setElongation} min={0} max={500} step="any" />
        <ValidatedNumberInput label="Hot-Zone Growth α (dL/dx)" value={alpha} onChange={setAlpha} min={-0.9} max={0.9} step="0.05" />
        <ValidatedNumberInput label="Cladding Ø (µm)" value={initialDia} onChange={setInitialDia} min={10} max={1000} step="any" />
        <ValidatedNumberInput label="Core Ø (µm)" value={coreDia} onChange={setCoreDia} min={1} max={100} step="any" />
        <ValidatedNumberInput label="Core NA" value={na} onChange={setNa} min={0.02} max={0.4} step="0.001" />
        <ValidatedNumberInput label="Cladding Index n₂" value={nClad} onChange={setNClad} min={1.3} max={2} step="0.0001" />
        <ValidatedNumberInput label="Surround Index n₃" value={nExt} onChange={setNExt} min={1} max={1.9} step="0.001" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2500} step="1" />
      </div>

      {(coreGeometryBad || indexBad || hotZoneBad || !calc.valid) && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result:{" "}
          {coreGeometryBad
            ? "the core must be thinner than the cladding."
            : indexBad
              ? "the surround index must be below the cladding index, or the cladding guides nothing."
              : hotZoneBad
                ? "with α < 0 the hot zone shrinks to zero length (L₀ + αx ≤ 0) before the pull ends."
                : "the inputs are outside the model's domain."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard
          label="Waist Diameter"
          value={fmtDia(2 * calc.shape.waistRadius * 1e6)}
          tone="red"
          subtext={`taper ratio r₀/r_w = ${fmt(1 / calc.ratio, 3)}; core Ø there ${fmt(calc.coreWaist_um, 2, " µm")}`}
        />
        <ResultCard
          label="Taper Lengths"
          value={fmt(calc.shape.totalLength * 1e3, 2, " mm")}
          tone="blue"
          subtext={`waist ${fmt(calc.shape.waistLength * 1e3, 2, " mm")} + 2 transitions of ${fmt(calc.shape.transitionLength * 1e3, 2, " mm")}`}
        />
        <ResultCard
          label="Core–Cladding Transition"
          value={calc.tcc < 1 ? fmt(calc.transitionDia_um, 1, " µm") : calc.valid ? "untapered" : "—"}
          tone="purple"
          subtext={
            calc.tcc < 1
              ? `cladding Ø where LP01 n_eff = n₂ (V = ${fmt(calc.Vcc, 3)}; small-V estimate √(2/(ln S + ¼)) ${fmt(calc.VccEstimate, 3)})`
              : "LP01 is already below n₂ in the untapered fibre"
          }
        />
        <ResultCard
          label="Waist Mode (LP01)"
          value={calc.nEffWaist !== undefined ? `n_eff ${calc.nEffWaist.toFixed(5)}` : "—"}
          tone="cyan"
          subtext={`${pastTransition ? "guided by the cladding–surround boundary" : "still core-guided"}; V_core ${fmt(calc.VcoreWaist, 3)}, V_clad ${fmt(calc.VcladWaist, 1)}`}
        />
        <ResultCard
          label="Evanescent Decay Length"
          value={fmt(calc.decay_um, 3, " µm")}
          tone="green"
          subtext={pastTransition ? "1/e field depth into the surround, λ/(2π√(n_eff² − n₃²))" : "into the surround; tiny while the core guides"}
        />
        <ResultCard
          label="Adiabaticity (worst Ω/Ω_d)"
          value={fmt(calc.worstRatio, 2)}
          tone={adiabatic ? "green" : "yellow"}
          subtext={
            calc.worst
              ? `${adiabatic ? "below" : "above"} Love's delineation; worst at Ø ${fmt(2 * calc.worst.r * 1e6, 1, " µm")}`
              : "—"
          }
        />
      </div>

      {calc.valid && !adiabatic && Number.isFinite(calc.worstRatio) && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The taper angle exceeds Love&apos;s delineation curve: LP01 couples to LP02 there and the taper is lossy. A longer hot zone
          (Ω ∝ 1/L₀) or a profile with a gentler start (α &lt; 0) brings it below the curve.
        </p>
      )}
      {calc.valid && calc.undefinedPoints > 0 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No guided LP01 was found at {calc.undefinedPoints} of {calc.scan.length} points near the waist (cladding far below the
          wavelength), so the delineation and the worst ratio there are undefined and left out. Shorten the pull or lengthen the hot zone.
        </p>
      )}
      {calc.valid && calc.VcladWaist < SCALAR_LIMIT_V_CLAD && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V_clad = {calc.VcladWaist.toFixed(2)} at the waist: the waist is close to the wavelength, where the scalar mode model of the
          cladding–surround boundary is inaccurate (it needs vector HE/EH modes). Waist results are rough.
          {calc.VcladWaist < SINGLE_MODE_V ? " The waist is single-mode (only HE11 is guided)." : ""}
        </p>
      )}
      {calc.valid && calc.VcladWaist >= SINGLE_MODE_V && (
        <p className="mb-6 text-sm text-gray-400" role="status">
          The waist guide is multimode (V_clad = {calc.VcladWaist.toFixed(1)}); an adiabatic taper still keeps the light in its
          fundamental mode. It becomes single-mode below Ø {calc.singleModeDia_um.toFixed(2)} µm (V_clad &lt; 2.405).
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Taper Profile (Birks–Li)</h3>
        <ChartPanel data={profileData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Position along the taper (mm)", gridcolor: "#374151" },
          yaxis: { title: "Cladding diameter (µm)", gridcolor: "#374151", rangemode: "tozero" },
          legend: { x: 0.01, y: 0.02 },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 320,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Adiabaticity: Taper Angle vs Love&apos;s Delineation Curve</h3>
        <ChartPanel data={adiabaticData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Local cladding diameter (µm)", gridcolor: "#374151", autorange: "reversed" },
          yaxis: { title: "Angle (mrad)", gridcolor: "#374151", type: "log" },
          legend: { x: 0.01, y: 0.98 },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 340,
        }} />
        <p className="mt-2 text-sm text-gray-400">
          The taper is locally adiabatic where the taper angle (amber) lies below the delineation curve (green). The curve dips
          where LP01 leaves the core, near Ø {fmt(calc.transitionDia_um, 0, " µm")}.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">r_w = r₀ (1 + αx/L₀)^(−1/2α) → r₀ e^(−x/2L₀) (α = 0);  L_w = L₀ + αx;  z₀ = (1 − α)x/2</p>
          <p className="font-mono">Ω(r) = r (r/r₀)^(2α) / ((1 − α)L₀);  Ω_d = ρ(β₁ − β₂)/2π</p>
          <p className="font-mono">transition: J₀(V)/(V J₁(V)) = ln S + K₀(W)/(W K₁(W))</p>
          <p>
            Shape: Birks and Li&apos;s volume-conservation model. A hot zone of length L₀ + αx softens the fibre while it is
            stretched by x; α = 0 is a constant hot zone (exponential transitions), α = −0.5 gives linear transitions.
          </p>
          <p>
            Modes: the core and cladding shrink together inside the surround (index n₃). The circularly symmetric LP0m modes of this
            core–cladding–surround step profile are solved exactly in the scalar approximation. LP01 starts in the core; once its
            n_eff falls below n₂ it is guided by the cladding–surround boundary. Love&apos;s length-scale criterion compares the local
            taper length r/Ω with the LP01–LP02 beat length; the taper is adiabatic where Ω &lt; Ω_d (LP02 replaced by the radiation
            edge kn₃ when it is not guided). The criterion is approximate, to a factor of order one.
          </p>
          <p className="text-gray-400">
            Not included: vector (HE/EH) corrections at the cladding–surround boundary (important for waists near the wavelength),
            dopant diffusion and the real hot-zone temperature profile, non-circular tapers (which couple to LP1m), and the loss value
            itself (the criterion only says where coupling becomes significant).
          </p>
        </div>
      </div>
    </>
  );
}
