"use client";

import Link from "next/link";
import { useState } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  absorbance,
  absorbanceFromNapierian,
  attenuationDb,
  concentrationForAbsorbance,
  epsilonForAbsorbance,
  massAbsorptionCoefficient,
  transmittance,
} from "../../../physics/spectroscopy/lambert-beer-law";

// Lab units → SI: 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³, 1 cm = 0.01 m, 1 g/mol = 1e-3 kg/mol,
// 1 L g⁻¹ cm⁻¹ = 100 m²/kg.
const EPS_SI = 0.1, CONC_SI = 1000, CM = 0.01, G_MOL = 1e-3, MASS_LAB = 100;
const C_MAX = 10, L_MIN = 0.1, L_MAX = 10, EPS_MAX = 4e5, A_MAX = 6, M_MIN = 1, M_MAX = 1e6;
const ALPHA_MAX = 1e5, D_MIN = 0.001, D_MAX = 1000; // cm⁻¹, mm
const concentrationPresets = [1e-6, 5e-6, 1e-5, 5e-5]; // mol/L
const pathPresets = [0.1, 1, 5, 10];
const epsilonPresets = [1000, 10000, 50000, 100000];
const absorbancePresets = [0.1, 0.5, 1, 2];
const SOLVE = ["A", "c", "eps"] as const;
type Solve = (typeof SOLVE)[number];
const solveLabel: Record<Solve, string> = { A: "Absorbance A", c: "Concentration c", eps: "Coefficient ε" };

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);
const fmtConc = (c: number) =>
  !Number.isFinite(c) ? "—" : c === 0 ? "0" : c >= 1e-3 ? `${+c.toPrecision(4)} M` : c >= 1e-6 ? `${+(c * 1e6).toPrecision(4)} µM` : `${+(c * 1e9).toPrecision(4)} nM`;
const chip = (active: boolean, colour: string) =>
  `rounded-full border px-3 py-1 text-sm transition ${active ? colour : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`;

export default function LambertBeerLawPage() {
  const [solveRaw, setSolve] = useURLState("solve", "A");
  const [concentrationRaw, setConcentration] = useURLState("concentration", 1e-5); // mol/L
  const [pathLengthRaw, setPathLength] = useURLState("pathLength", 1); // cm
  const [extinctionCoeffRaw, setExtinctionCoeff] = useURLState("extinctionCoeff", 50000); // L mol⁻¹ cm⁻¹
  const [absorbanceRaw, setAbsorbance] = useURLState("absorbance", 0.5);
  const [molarMassRaw, setMolarMass] = useURLState("molarMass", 500); // g/mol
  const [alphaRaw, setAlpha] = useURLState("alpha", 1); // Napierian, cm⁻¹
  const [thicknessRaw, setThickness] = useURLState("thickness", 10); // mm
  const [plotVar, setPlotVar] = useState<"conc" | "path" | "epsilon">("conc");

  const solve: Solve = (SOLVE as readonly string[]).includes(solveRaw) ? (solveRaw as Solve) : "A";
  const concentrationIn = clamp(concentrationRaw, 0, C_MAX, 1e-5);
  const pathLength = clamp(pathLengthRaw, L_MIN, L_MAX, 1);
  const extinctionCoeffIn = clamp(extinctionCoeffRaw, 0, EPS_MAX, 50000);
  const absorbanceIn = clamp(absorbanceRaw, 0, A_MAX, 0.5);
  const molarMass = clamp(molarMassRaw, M_MIN, M_MAX, 500);
  const alpha = clamp(alphaRaw, 0, ALPHA_MAX, 1);
  const thickness = clamp(thicknessRaw, D_MIN, D_MAX, 10);

  // Two of A, c, ε are inputs; the third follows from A = ε c l.
  const A = solve === "A" ? absorbance(extinctionCoeffIn * EPS_SI, concentrationIn * CONC_SI, pathLength * CM) : absorbanceIn;
  const concentration = solve === "c" ? concentrationForAbsorbance(A, extinctionCoeffIn * EPS_SI, pathLength * CM) / CONC_SI : concentrationIn;
  const extinctionCoeff = solve === "eps" ? epsilonForAbsorbance(A, concentrationIn * CONC_SI, pathLength * CM) / EPS_SI : extinctionCoeffIn;
  const T = transmittance(A);
  const massConc_mgL = concentration * molarMass * 1000; // mol/L · g/mol = g/L
  const massCoeff = massAbsorptionCoefficient(extinctionCoeff * EPS_SI, molarMass * G_MOL) / MASS_LAB; // L g⁻¹ cm⁻¹
  const solved = Number.isFinite(concentration) && Number.isFinite(extinctionCoeff);
  const noSolution = solve === "c" ? "ε = 0 absorbs nothing, so no concentration gives this A" : "c = 0 absorbs nothing, so no ε gives this A";

  const at = (c: number, l: number, e: number) => absorbance(e * EPS_SI, c * CONC_SI, l * CM);
  // Sweep 0 → 4× the current value (or to the value giving A = 1 when the current value is 0).
  const sweepMax = (current: number, forA1: number) => (current > 0 ? 4 * current : Number.isFinite(forA1) && forA1 > 0 ? forA1 : 1);
  const n = 200;
  const max =
    plotVar === "conc" ? sweepMax(concentration, 1 / (extinctionCoeff * pathLength))
    : plotVar === "path" ? sweepMax(pathLength, 1 / (extinctionCoeff * concentration))
    : sweepMax(extinctionCoeff, 1 / (concentration * pathLength));
  const xs = Array.from({ length: n + 1 }, (_, i) => (i / n) * max);
  const as = xs.map((x) =>
    plotVar === "conc" ? at(x, pathLength, extinctionCoeff) : plotVar === "path" ? at(concentration, x, extinctionCoeff) : at(concentration, pathLength, x));
  const series = [
    { name: "Absorbance A", color: "#60a5fa", points: xs.map((x, i) => ({ x, y: as[i] })) },
    { name: "Transmittance T", color: "#34d399", dashed: true, points: xs.map((x, i) => ({ x, y: transmittance(as[i]) })) },
  ];
  const xLabel = plotVar === "conc" ? "Concentration (mol/L)" : plotVar === "path" ? "Path Length (cm)" : "ε (L·mol⁻¹·cm⁻¹)";
  const tooHigh = A > 2;
  // Bulk slab: α in cm⁻¹ → m⁻¹ (× 100), d in mm → m.
  const slabA = absorbanceFromNapierian(alpha * 100, thickness * 1e-3);
  const slabT = transmittance(slabA);

  return (
    <>
      <div role="group" aria-label="Solve for" className="flex gap-2 mb-5 flex-wrap">
        {SOLVE.map((s) => (
          <button key={s} onClick={() => setSolve(s)} className={`px-3 py-1 rounded text-sm ${solve === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            Solve for {solveLabel[s]}
          </button>
        ))}
      </div>

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {solve === "c"
            ? absorbancePresets.map((preset) => (
                <button key={`a-${preset}`} onClick={() => setAbsorbance(preset)} className={chip(absorbanceIn === preset, "border-blue-400 bg-blue-500/15 text-blue-200")}>
                  A = {preset}
                </button>
              ))
            : concentrationPresets.map((preset) => (
                <button key={`c-${preset}`} onClick={() => setConcentration(preset)} className={chip(concentrationIn === preset, "border-blue-400 bg-blue-500/15 text-blue-200")}>
                  c = {fmtConc(preset)}
                </button>
              ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {pathPresets.map((preset) => (
            <button key={`l-${preset}`} onClick={() => setPathLength(preset)} className={chip(pathLength === preset, "border-green-400 bg-green-500/15 text-green-200")}>
              l = {preset} cm
            </button>
          ))}
          {solve === "eps"
            ? absorbancePresets.map((preset) => (
                <button key={`a-${preset}`} onClick={() => setAbsorbance(preset)} className={chip(absorbanceIn === preset, "border-purple-400 bg-purple-500/15 text-purple-200")}>
                  A = {preset}
                </button>
              ))
            : epsilonPresets.map((preset) => (
                <button key={`e-${preset}`} onClick={() => setExtinctionCoeff(preset)} className={chip(extinctionCoeffIn === preset, "border-purple-400 bg-purple-500/15 text-purple-200")}>
                  ε = {preset.toLocaleString()}
                </button>
              ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {solve !== "A" && (
          <InputSlider label="Measured absorbance A" value={absorbanceRaw} onChange={setAbsorbance} min={0} max={A_MAX} step={0.01} />
        )}
        {solve !== "c" && (
          <ValidatedNumberInput label="Concentration (mol/L)" value={concentrationRaw} onChange={setConcentration} min={0} max={C_MAX} step="0.000001" />
        )}
        <InputSlider label="Path Length" value={pathLengthRaw} onChange={setPathLength} min={L_MIN} max={L_MAX} step={0.1} unit="cm" />
        {solve !== "eps" && (
          <InputSlider label="Molar absorption coefficient ε" value={extinctionCoeffRaw} onChange={setExtinctionCoeff} min={0} max={EPS_MAX} step={1000} unit="L·mol⁻¹·cm⁻¹" />
        )}
        <ValidatedNumberInput label="Molar mass (g/mol)" value={molarMassRaw} onChange={setMolarMass} min={M_MIN} max={M_MAX} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        {solve === "A" && (
          <ResultCard label="Absorbance (A)" value={fmt(A)} tone={tooHigh ? "red" : "blue"} subtext="= optical density for a clear sample" />
        )}
        {solve === "c" && (
          <ResultCard label="Concentration c" value={fmtConc(concentration)} tone="blue" subtext={solved ? `c = A/(ε·l), ${fmt(concentration)} mol/L` : noSolution} />
        )}
        {solve === "eps" && (
          <ResultCard label="Molar absorption coefficient ε" value={fmt(extinctionCoeff, 5)} tone="blue" subtext={solved ? "L·mol⁻¹·cm⁻¹, ε = A/(c·l)" : noSolution} />
        )}
        <ResultCard label="Transmittance" value={`${fmt(T * 100)} %`} tone="yellow" subtext={`absorbed ${fmt((1 - T) * 100)} %`} />
        <ResultCard label="Mass concentration" value={`${fmt(massConc_mgL)} mg/L`} tone="green" subtext="ρ = c·M (mg/L = µg/mL)" />
        <ResultCard label="Mass absorption coefficient" value={`${fmt(massCoeff)} L·g⁻¹·cm⁻¹`} tone="purple" subtext="a = ε/M: the A of 1 g/L over 1 cm" />
      </div>
      <div className="mb-8 space-y-1 text-sm text-amber-300">
        {tooHigh && <p>A is above ≈ 2 (T &lt; 1 %): stray light and detector noise make measured absorbances read low; dilute or shorten the path.</p>}
        {Number.isFinite(concentration) && concentration > 0.01 && <p>c is above ≈ 10 mM, where absorbers interact and the refractive index changes, so A is no longer linear in c.</p>}
      </div>

      <div role="group" aria-label="Options" className="flex gap-2 mb-6 flex-wrap">
        {(["conc", "path", "epsilon"] as const).map((v) => (
          <button key={v} onClick={() => setPlotVar(v)} className={`px-3 py-1 rounded text-sm ${plotVar === v ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {v === "conc" ? "Sweep Concentration" : v === "path" ? "Sweep Path Length" : "Sweep ε"}
          </button>
        ))}
      </div>

      {solved ? (
        <SimpleLineChart title="Beer-Lambert sweep" xLabel={xLabel} yLabel="A, T" series={series} />
      ) : (
        <p className="text-sm text-gray-400">No sweep: {noSolution}.</p>
      )}

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-6">
        <h2 className="text-lg font-semibold mb-1">Bulk sample: absorption coefficient α and thickness</h2>
        <p className="text-sm text-gray-400 mb-4">
          For a solid or a pure liquid the Napierian absorption coefficient α replaces ε·c: T = e^(−α·d) inside the sample.
          The <Link href="/spectroscopy/absorption-depth" className="underline hover:text-white">absorption depth</Link> calculator gives α(λ) for silicon and water.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <ValidatedNumberInput label="Absorption coefficient α (cm⁻¹, Napierian)" value={alphaRaw} onChange={setAlpha} min={0} max={ALPHA_MAX} step="any" />
          <ValidatedNumberInput label="Thickness d (mm)" value={thicknessRaw} onChange={setThickness} min={D_MIN} max={D_MAX} step="any" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ResultCard label="Internal transmittance" value={`${fmt(slabT * 100)} %`} tone="yellow" subtext="e^(−α·d); surface reflections not included" />
          <ResultCard label="Absorbance (decadic)" value={fmt(slabA)} tone="blue" subtext="A = α·d / ln 10" />
          <ResultCard label="Absorption loss" value={`${fmt(attenuationDb(slabA))} dB`} tone="red" subtext={`${fmt((10 * alpha) / Math.LN10)} dB/cm = 4.343·α`} />
          <ResultCard label="1/e depth" value={alpha > 0 ? `${fmt(10 / alpha)} mm` : "—"} tone="green" subtext={alpha > 0 ? "δ = 1/α" : "α = 0: no absorption"} />
        </div>
      </section>

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">A = ε · c · l, so c = A / (ε · l) and ε = A / (c · l)</p>
        <p className="font-mono text-green-400">T = I/I₀ = 10⁻ᴬ</p>
        <p className="font-mono text-purple-400">a = ε / M, ρ = c · M</p>
        <p className="font-mono text-red-400">bulk: T = e^(−α·d), α = ln 10 · ε · c</p>
        <p>
          ε is the molar decadic absorption coefficient (IUPAC; &quot;extinction coefficient&quot; is the older name),
          and a is the mass absorption coefficient (formerly &quot;specific extinction coefficient&quot;; for proteins at
          280 nm it is the absorbance of a 1 mg/mL solution). The law holds for monochromatic light in dilute
          solutions: at high concentration (≳ 10 mM) absorbers interact and the refractive index changes, and above
          A ≈ 2 (T &lt; 1 %) stray light and detector noise make measured absorbances read low. Scattering samples add
          to the optical density without absorbing.
        </p>
        <p className="text-gray-500">Reference: IUPAC Compendium of Chemical Terminology (Gold Book), &quot;absorbance&quot;, &quot;molar (decadic) absorption coefficient&quot;, &quot;mass absorption coefficient&quot;.</p>
      </div>
    </>
  );
}
