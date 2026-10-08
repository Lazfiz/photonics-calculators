"use client";

import { useState, useMemo } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { absorbance, concentrationForAbsorbance, transmittance } from "../../../physics/spectroscopy/lambert-beer-law";

// Lab units → SI: 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³, 1 cm = 0.01 m.
const EPS_SI = 0.1, CONC_SI = 1000, CM = 0.01;
const concentrationPresets = [1e-6, 5e-6, 1e-5, 5e-5]; // mol/L
const pathPresets = [0.1, 1, 5, 10];
const epsilonPresets = [1000, 10000, 50000, 100000];

const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);
const fmtConc = (c: number) => (c >= 1e-3 ? `${c} M` : c >= 1e-6 ? `${+(c * 1e6).toPrecision(3)} µM` : `${+(c * 1e9).toPrecision(3)} nM`);

export default function LambertBeerLawPage() {
  const [concentration, setConcentration] = useURLState("concentration", 1e-5); // mol/L
  const [pathLength, setPathLength] = useURLState("pathLength", 1); // cm
  const [extinctionCoeff, setExtinctionCoeff] = useURLState("extinctionCoeff", 50000); // L mol⁻¹ cm⁻¹
  const [plotVar, setPlotVar] = useState<"conc" | "path" | "epsilon">("conc");

  const A = absorbance(extinctionCoeff * EPS_SI, concentration * CONC_SI, pathLength * CM);
  const T = transmittance(A);
  const concForA1 = concentrationForAbsorbance(1, extinctionCoeff * EPS_SI, pathLength * CM) / CONC_SI; // mol/L

  const series = useMemo(() => {
    const n = 200;
    // Sweep 0 → 4× the current value (or to the value giving A = 1 when the current value is 0).
    const sweepMax = (current: number, forA1: number) => (current > 0 ? 4 * current : Number.isFinite(forA1) && forA1 > 0 ? forA1 : 1);
    const at = (c: number, l: number, e: number) => absorbance(e * EPS_SI, c * CONC_SI, l * CM);
    let xs: number[], as: number[];
    if (plotVar === "conc") {
      const max = sweepMax(concentration, concForA1);
      xs = Array.from({ length: n + 1 }, (_, i) => (i / n) * max);
      as = xs.map((c) => at(c, pathLength, extinctionCoeff));
    } else if (plotVar === "path") {
      const max = sweepMax(pathLength, 1 / (extinctionCoeff * concentration));
      xs = Array.from({ length: n + 1 }, (_, i) => (i / n) * max);
      as = xs.map((l) => at(concentration, l, extinctionCoeff));
    } else {
      const max = sweepMax(extinctionCoeff, 1 / (concentration * pathLength));
      xs = Array.from({ length: n + 1 }, (_, i) => (i / n) * max);
      as = xs.map((e) => at(concentration, pathLength, e));
    }
    return [
      { name: "Absorbance A", color: "#60a5fa", points: xs.map((x, i) => ({ x, y: as[i] })) },
      { name: "Transmittance T", color: "#34d399", dashed: true, points: xs.map((x, i) => ({ x, y: transmittance(as[i]) })) },
    ];
  }, [concentration, pathLength, extinctionCoeff, plotVar, concForA1]);

  const xLabel = plotVar === "conc" ? "Concentration (mol/L)" : plotVar === "path" ? "Path Length (cm)" : "ε (L·mol⁻¹·cm⁻¹)";
  const tooHigh = A > 2;

  return (
    <>
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {concentrationPresets.map((preset) => (
            <button key={`c-${preset}`} onClick={() => setConcentration(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${concentration === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
              c = {fmtConc(preset)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {pathPresets.map((preset) => (
            <button key={`l-${preset}`} onClick={() => setPathLength(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${pathLength === preset ? "border-green-400 bg-green-500/15 text-green-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
              l = {preset} cm
            </button>
          ))}
          {epsilonPresets.map((preset) => (
            <button key={`e-${preset}`} onClick={() => setExtinctionCoeff(preset)} className={`rounded-full border px-3 py-1 text-sm transition ${extinctionCoeff === preset ? "border-purple-400 bg-purple-500/15 text-purple-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
              ε = {preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Concentration (mol/L)" value={concentration} onChange={setConcentration} min={0} max={10} step="0.000001" />
        <InputSlider label="Path Length" value={pathLength} onChange={setPathLength} min={0.1} max={10} step={0.1} unit="cm" />
        <InputSlider label="Molar absorption coefficient ε" value={extinctionCoeff} onChange={setExtinctionCoeff} min={0} max={200000} step={1000} unit="L·mol⁻¹·cm⁻¹" />
      </div>

      <div role="group" aria-label="Options" className="flex gap-2 mb-6 flex-wrap">
        {(["conc", "path", "epsilon"] as const).map((v) => (
          <button key={v} onClick={() => setPlotVar(v)} className={`px-3 py-1 rounded text-sm ${plotVar === v ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {v === "conc" ? "Sweep Concentration" : v === "path" ? "Sweep Path Length" : "Sweep ε"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Absorbance (A)" value={fmt(A)} tone={tooHigh ? "red" : "blue"}
          subtext={tooHigh ? "above ≈ 2 stray light dominates; dilute or shorten the path" : "= optical density for a clear sample"} />
        <ResultCard label="Transmittance" value={`${fmt(T * 100)} %`} tone="yellow" subtext={`absorbed ${fmt((1 - T) * 100)} %`} />
        <ResultCard label="Concentration for A = 1" value={Number.isFinite(concForA1) ? fmtConc(concForA1) : "—"} tone="green" subtext={`at ε = ${extinctionCoeff.toLocaleString()}, l = ${pathLength} cm`} />
      </div>

      <SimpleLineChart title="Beer-Lambert sweep" xLabel={xLabel} yLabel="A, T" series={series} />

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">A = ε · c · l</p>
        <p className="font-mono text-green-400">T = I/I₀ = 10⁻ᴬ</p>
        <p>
          ε is the molar decadic absorption coefficient (IUPAC; &quot;extinction coefficient&quot; is the older name).
          The law holds for monochromatic light in dilute solutions: at high concentration (≳ 10 mM) absorbers
          interact and the refractive index changes, and above A ≈ 2 (T &lt; 1 %) stray light and detector noise
          make measured absorbances read low. Scattering samples add to the optical density without absorbing.
        </p>
        <p className="text-gray-500">Reference: IUPAC Compendium of Chemical Terminology (Gold Book), &quot;absorbance&quot;.</p>
      </div>
    </>
  );
}
