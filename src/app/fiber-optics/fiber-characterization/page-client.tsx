"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { sellmeierDispersion } from "../../../physics/fiber-optics/chromatic-dispersion";
import { SILICA_N2, nonlinearCoefficient } from "../../../physics/fiber-optics/fiber-nonlinear";
import {
  LP11_CUTOFF_V, MIN_V, lp01Mode, lp11CutoffWavelength, modeFieldRadius, vNumber,
} from "../../../physics/fiber-optics/macro-bending-loss";
import {
  coreConfinement, effectiveIndex, normalizedB, numericalAperture, petermannIIRadius, relativeIndexDifference,
} from "../../../physics/fiber-optics/step-index-modes";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function FiberCharacterizationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 400, max: 2000 }); // nm
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.44937, { min: 1, max: 4 });
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.444, { min: 1, max: 4 });
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.1, { min: 0.5, max: 50 }); // µm
  const [zeroDispersion, setZeroDispersion] = useURLState("zeroDispersion", 1310, { min: 1200, max: 1700 }); // nm
  const [dispersionSlope, setDispersionSlope] = useURLState("dispersionSlope", 0.092, { min: 0, max: 0.2 }); // ps/(nm²·km)

  const fiber = useMemo(
    () => ({ a: coreRadius * 1e-6, n1: coreIndex, NA: numericalAperture(coreIndex, claddingIndex) }),
    [coreRadius, coreIndex, claddingIndex],
  );

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const V = vNumber(fiber, lambda);
    const mode = lp01Mode(V);
    const w = modeFieldRadius(fiber, lambda);
    const Aeff = Math.PI * w * w;
    return {
      V,
      NA: fiber.NA,
      delta: relativeIndexDifference(fiber),
      acceptance_deg: fiber.NA <= 1 ? (Math.asin(fiber.NA) * 180) / Math.PI : NaN,
      cutoff_nm: lp11CutoffWavelength(fiber) * 1e9,
      b: normalizedB(mode),
      nEff: effectiveIndex(fiber, lambda, mode),
      confinement: coreConfinement(mode),
      mfd_um: 2e6 * w,
      mfdPII_um: 2e6 * petermannIIRadius(fiber, lambda, mode),
      aeff_um2: Aeff * 1e12,
      gamma_perWkm: nonlinearCoefficient(SILICA_N2, lambda, Aeff) * 1e3,
      // s/m² → ps/(nm·km): × 1e6. S₀ in ps/(nm²·km) → s/m³: × 1e3.
      D: sellmeierDispersion(lambda, zeroDispersion * 1e-9, dispersionSlope * 1e3) * 1e6,
    };
  }, [fiber, wavelength, zeroDispersion, dispersionSlope]);

  const valid = Number.isFinite(calc.mfd_um) && Number.isFinite(calc.b);

  const vNumberData = useMemo(() => {
    const wls = Array.from({ length: 201 }, (_, i) => 800 + i * 5);
    const Vs = wls.map((wl) => vNumber(fiber, wl * 1e-9));
    const keep = Vs.map(Number.isFinite);
    return [
      { x: wls.filter((_, i) => keep[i]), y: Vs.filter((_, i) => keep[i]), type: "scatter" as const, mode: "lines" as const, name: "V-number", line: { color: "#60a5fa", width: 2 } },
      { x: [800, 1800], y: [LP11_CUTOFF_V, LP11_CUTOFF_V], type: "scatter" as const, mode: "lines" as const, name: "LP11 cutoff", line: { color: "#f87171", dash: "dash" as const } },
    ];
  }, [fiber]);

  const mfdData = useMemo(() => {
    const wls = Array.from({ length: 151 }, (_, i) => 1200 + i * 4);
    const pick = (ys: number[]) => {
      const keep = ys.map(Number.isFinite);
      return { x: wls.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]) };
    };
    return [
      { ...pick(wls.map((wl) => 2e6 * petermannIIRadius(fiber, wl * 1e-9))), type: "scatter" as const, mode: "lines" as const, name: "Petermann II", line: { color: "#60a5fa", width: 2 } },
      { ...pick(wls.map((wl) => 2e6 * modeFieldRadius(fiber, wl * 1e-9))), type: "scatter" as const, mode: "lines" as const, name: "Gaussian fit", line: { color: "#34d399", width: 2, dash: "dash" as const } },
    ];
  }, [fiber]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={2000} step="1" />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.00001" />
        <ValidatedNumberInput label="Cladding Index n₂" value={claddingIndex} onChange={setCladdingIndex} min={1} max={4} step="0.00001" />
        <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} min={0.5} max={50} step="0.1" />
        <ValidatedNumberInput label="Zero-Dispersion λ₀ (nm)" value={zeroDispersion} onChange={setZeroDispersion} min={1200} max={1700} step="1" />
        <ValidatedNumberInput label="Zero-Dispersion Slope S₀ (ps/nm²/km)" value={dispersionSlope} onChange={setDispersionSlope} min={0} max={0.2} step="0.001" />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No mode result: the model needs n₂ &lt; n₁ and V ≥ {MIN_V} (here V = {fmt(calc.V, 3)}).
        </p>
      )}
      {valid && calc.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} &gt; 2.405: LP11 is also guided at this wavelength. Mode values are for LP01.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="V-number" value={fmt(calc.V, 3)} tone="blue" subtext={Number.isFinite(calc.V) ? (calc.V < LP11_CUTOFF_V ? "Single-mode" : "Multimode") : undefined} />
        <ResultCard label="LP11 cutoff λc" value={fmt(calc.cutoff_nm, 0, " nm")} tone="purple" subtext="From a and NA (fibre cutoff, not cable cutoff)" />
        <ResultCard label="MFD" value={fmt(calc.mfd_um, 2, " µm")} tone="green" subtext={`Gaussian fit; Petermann II ${fmt(calc.mfdPII_um, 2, " µm")}`} />
        <ResultCard label="Effective area" value={fmt(calc.aeff_um2, 1, " µm²")} tone="yellow" subtext="π w² (Gaussian fit)" />
        <ResultCard label="Nonlinear γ" value={fmt(calc.gamma_perWkm, 2, " /(W·km)")} tone="purple" subtext="2πn₂/(λA_eff), n₂ = 2.6e-20 m²/W" />
        <ResultCard label="Numerical aperture" value={fmt(calc.NA, 4)} tone="cyan" subtext={`Acceptance half-angle ${fmt(calc.acceptance_deg, 2, "°")}`} />
        <ResultCard label="Relative index Δ" value={fmt(calc.delta * 100, 3, " %")} tone="gray" subtext="(n₁² − n₂²)/(2n₁²)" />
        <ResultCard label="Effective index" value={fmt(calc.nEff, 5)} tone="gray" subtext={`b = ${fmt(calc.b, 4)}; ${fmt(calc.confinement * 100, 1, " %")} of power in the core`} />
        <ResultCard label="Dispersion D" value={fmt(calc.D, 2, " ps/(nm·km)")} tone="orange" subtext="From λ₀ and S₀ you enter (datasheet), not from the geometry" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">V-number vs Wavelength</h3>
          <ChartPanel data={vNumberData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "λ (nm)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "V", color: "#9ca3af", gridcolor: "#374151" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 10 } },
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Mode Field Diameter vs Wavelength</h3>
          <ChartPanel data={mfdData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "λ (nm)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "MFD (µm)", color: "#9ca3af", gridcolor: "#374151" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 10 } },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">V = 2πa·NA/λ,  NA = √(n₁² − n₂²),  λc = 2πa·NA/2.405</p>
          <p className="font-mono">w/a = 0.65 + 1.619/V^1.5 + 2.879/V^6,  A_eff = πw²,  γ = 2πn₂/(λA_eff)</p>
          <p className="font-mono">n_eff² = n₂² + b(n₁² − n₂²),  b = W²/V²,  D = (S₀/4)(λ − λ₀⁴/λ³)</p>
          <p>
            Weakly guiding step-index fibre with the exact LP01 eigenvalues (Gloge 1971), Marcuse&apos;s Gaussian MFD fit and
            the exact Petermann II MFD. Defaults are an SMF-28-like step equivalent with phase indices (pure-silica cladding
            1.4440 at 1550 nm). Dispersion uses the ITU-T G.652 form with your λ₀ and S₀; waveguide dispersion of the step
            profile is not computed.
          </p>
        </div>
      </div>
    </>
  );
}
