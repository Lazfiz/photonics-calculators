"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { fix } from "../../../components/polarization-format";
import { useURLState } from "../../../hooks/use-url-state";
import { analyzerTransmission, microscopeExtinction, minimumRetardance } from "../../../physics/polarization/microscope-extinction";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
/** A positive number to three significant digits, exponential when very large or small; "—" when undefined. */
const sci = (v: number) => (Number.isFinite(v) ? (v >= 1e4 || v < 0.01 ? v.toExponential(2) : v.toPrecision(3)) : "—");
const ratio = (v: number) => (v === Infinity ? "∞" : sci(v));

const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, type: "log" as const, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300,
});

export default function MicroscopePolarizerPage() {
  const [logERIn, setLogER] = useURLState("logER", 4);
  const [angleIn, setAngle] = useURLState("analyzer", 0);
  const [condenserIn, setCondenser] = useURLState("condenserNA", 0.5);
  const [objectiveIn, setObjective] = useURLState("objectiveNA", 0.65);
  const [mIn, setM] = useURLState("surfaces", 2);
  const [nIn, setN] = useURLState("glassIndex", 1.52);
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 546);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const ER = 10 ** clamp(logERIn, 1, 6);
  const angle = clamp(angleIn, -90, 90);
  const NAeff = Math.min(clamp(condenserIn, 0, 0.95), clamp(objectiveIn, 0, 0.95));
  const m = Math.round(clamp(mIn, 0, 8));
  const n = clamp(nIn, 1, 2.5);
  const lambda = clamp(wavelengthIn, 200, 2000) * 1e-9;

  const { e, sheetsOnly } = useMemo(
    () => ({ e: microscopeExtinction(ER, n, m, NAeff), sheetsOnly: microscopeExtinction(ER, n, 0, 0) }),
    [ER, n, m, NAeff],
  );
  const atAngle = analyzerTransmission(e, Math.PI / 2 - angle * DEG);
  const rMin = minimumRetardance(lambda, e.ER);

  const byAngle = useMemo(() => {
    const x = Array.from({ length: 181 }, (_, i) => i - 90);
    const y = x.map((a) => analyzerTransmission(e, Math.PI / 2 - a * DEG));
    return { x: x.filter((_, i) => y[i] > 0 && Number.isFinite(y[i])), y: y.filter((v) => v > 0 && Number.isFinite(v)) };
  }, [e]);
  const byNA = useMemo(() => {
    const x = Array.from({ length: 96 }, (_, i) => (i / 95) * 0.95);
    const withSurfaces = x.map((na) => microscopeExtinction(ER, n, m, na).ER);
    const polarizersOnly = x.map((na) => microscopeExtinction(ER, n, 0, na).ER);
    const keep = (ys: number[]) => ({ x: x.filter((_, i) => ys[i] > 0 && Number.isFinite(ys[i])), y: ys.filter((v) => v > 0 && Number.isFinite(v)) });
    return { current: keep(withSurfaces), reference: keep(polarizersOnly) };
  }, [ER, n, m]);

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>two sheets, k<sub>2</sub>/k<sub>1</sub> = 1/ER: &nbsp;H(θ) = H<sub>0</sub> cos²θ + H<sub>90</sub> sin²θ, &nbsp;H<sub>0</sub> = (k<sub>1</sub>² + k<sub>2</sub>²)/2, H<sub>90</sub> = k<sub>1</sub>k<sub>2</sub></p>
        <p>an oblique ray through m surfaces keeps G and leaks L of its power into the crossed analyzer (Fresnel T<sub>p</sub>, T<sub>s</sub>); L ∝ NA⁴ at small NA, steeper above</p>
        <p>smallest visible retardance: sin²(Γ/2) = 1/ER<sub>sys</sub></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <InputSlider label="Polarizer extinction ratio, log₁₀ ER (each sheet, ER = k₁/k₂; a pair gives ≈ ER/2)" value={logERIn} onChange={setLogER} min={1} max={6} step={0.1} />
        <InputSlider label="Analyzer angle from crossed" value={angleIn} onChange={setAngle} min={-90} max={90} step={1} unit="°" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={200} max={2000} step="1" />
        <ValidatedNumberInput label="Condenser NA" value={condenserIn} onChange={setCondenser} min={0} max={0.95} step="0.05" />
        <ValidatedNumberInput label="Objective NA" value={objectiveIn} onChange={setObjective} min={0} max={0.95} step="0.05" />
        <ValidatedNumberInput label="Uncoated flat air–glass surfaces m in the cone" value={mIn} onChange={setM} min={0} max={8} step="1" />
        <ValidatedNumberInput label="Glass index n" value={nIn} onChange={setN} min={1} max={2.5} step="0.01" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        m counts the uncoated surfaces the cone crosses; a mounted slide in air has 2 (slide underside, cover-glass top). The illumination
        and the collected cone are limited by the smaller NA, so NA<sub>eff</sub> = {fix(NAeff, 2)}.
        Polarizer extinction ER = {fix(ER, 0)}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="System extinction ratio" tone="green" value={ratio(e.ER)} subtext={Number.isFinite(e.ER) ? `${fix(10 * Math.log10(e.ER), 1)} dB` : undefined} />
        <ResultCard label="Polarizers alone" value={ratio(sheetsOnly.ER)} subtext="(ER + 1/ER)/2" />
        <ResultCard label="Surfaces alone" tone="yellow" value={ratio(e.ERsurfaces)} subtext={e.ERsurfaces === Infinity ? "no leak: no surfaces or no cone" : "ideal polarizers, G/L"} />
        <ResultCard label="Smallest visible retardance" tone="purple" value={Number.isFinite(rMin) ? `${fix(rMin * 1e9, 2)} nm` : "—"} subtext={`at ${fix(lambda * 1e9, 0)} nm, specimen at 45°; signal = background`} />
        <ResultCard label="Crossed transmission" tone="orange" value={sci(e.crossed)} subtext="of the unpolarized source; lossless sheets (k₁ = 1)" />
        <ResultCard label="Parallel transmission" tone="cyan" value={sci(e.parallel)} subtext="of the unpolarized source; lossless sheets (k₁ = 1)" />
        <ResultCard label={`Transmission at ${fix(angle, 0)}° from crossed`} tone="blue" value={sci(atAngle)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmission against analyzer angle</h3>
          <ChartPanel layout={layout("Analyzer angle from crossed (°)", "Transmission")} data={[
            { x: byAngle.x, y: byAngle.y, type: "scatter", mode: "lines", name: "Transmission", line: { color: "#60a5fa", width: 2 } },
            { x: [angle], y: [atAngle], type: "scatter", mode: "markers", name: "Current", marker: { color: "#fbbf24", size: 9 } },
          ]} />
          <p className="text-sm text-gray-300 mt-2">Relative to the unpolarized source; 0° is crossed and ±90° is parallel. The floor at 0° is the system leak.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">System extinction ratio against NA</h3>
          <ChartPanel layout={layout("NA of the narrower of condenser and objective", "System extinction ratio")} data={[
            { x: byNA.current.x, y: byNA.current.y, type: "scatter", mode: "lines", name: `m = ${fix(m, 0)} surfaces`, line: { color: "#34d399", width: 2 } },
            { x: byNA.reference.x, y: byNA.reference.y, type: "scatter", mode: "lines", name: "m = 0 (polarizers only)", line: { color: "#9ca3af", dash: "dash" } },
            { x: [NAeff], y: [e.ER], type: "scatter", mode: "markers", name: "Current", marker: { color: "#fbbf24", size: 9 } },
          ]} />
          <p className="text-sm text-gray-300 mt-2">The leak from oblique rays grows as NA⁴ at small NA and faster above: once it exceeds the polarizers&apos; own leak, the surfaces set the extinction ratio.</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">Uncoated flat surfaces turn the polarization of oblique rays (Inoué &amp; Hyde 1957); lens surfaces are not modelled.</p>
    </>
  );
}
