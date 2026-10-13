"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  beatLength, crossPolarizedRatio, dgdPerLength, fibreCrosstalkDb, lengthToRatio, ratioFromDb, ratioToDb,
} from "../../../physics/fiber-optics/fiber-birefringence";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
// Text for a result, or a dash when the model has no finite value.
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const dbText = (x: number) => (Number.isNaN(x) ? "—" : x === Infinity ? "∞ dB" : x === -Infinity ? "−∞ dB" : `${x.toFixed(2)} dB`);
const lengthText = (L: number) => (L >= 1000 ? `${(L / 1000).toPrecision(4)} km` : `${L.toPrecision(4)} m`);

// Typical orders of magnitude (beat lengths of a few mm at 1550 nm); use the datasheet values of your fibre.
const PRESETS = [
  { id: "panda", label: "PANDA (stress rods)", B: 3.5, h: 1e-6 },
  { id: "bowtie", label: "Bow-tie (stress sectors)", B: 5, h: 5e-7 },
  { id: "ecore", label: "Elliptical core", B: 1, h: 1e-5 },
];

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function PMFiberCalculator() {
  const [bRaw, setB] = useURLState("birefringence", 3.5); // ×10⁻⁴
  const [hRaw, setH] = useURLState("hParameter", 1e-6); // 1/m
  const [lambdaRaw, setLambda] = useURLState("wavelength", 1550); // nm
  const [lengthRaw, setLength] = useURLState("fiberLength", 1000); // m
  const [erRaw, setEr] = useURLState("extinctionRatio", 30); // dB, input
  const [targetRaw, setTarget] = useURLState("targetPER", 20); // dB

  const B = clamp(bRaw, 0.01, 20) * 1e-4;
  const h = clamp(hRaw, 0, 1e-2);
  const lambda = clamp(lambdaRaw, 400, 2000) * 1e-9;
  const L = clamp(lengthRaw, 0, 1e6);
  const er = clamp(erRaw, 0, 60);
  const target = clamp(targetRaw, 0.1, 60);

  const loadPreset = (id: string) => {
    const p = PRESETS.find((q) => q.id === id);
    if (!p) return;
    setB(p.B);
    setH(p.h);
  };

  const calc = useMemo(() => {
    const eps0 = ratioFromDb(er);
    const outRatio = crossPolarizedRatio(eps0, h, L);
    const LMax = Math.max(10 * L, 10000);
    const xs: number[] = [], ys: (number | null)[] = [];
    for (let i = 0; i <= 200; i++) {
      const z = (LMax * i) / 200;
      const v = ratioToDb(crossPolarizedRatio(eps0, h, z));
      xs.push(z);
      ys.push(Number.isFinite(v) ? v : null);
    }
    return {
      L_B: beatLength(B, lambda),
      // Stress birefringence barely depends on λ, so the group value ≈ the phase value.
      dgd: dgdPerLength(B),
      outDb: ratioToDb(outRatio),
      fibreXt: fibreCrosstalkDb(h, L),
      Ltarget: lengthToRatio(eps0, ratioFromDb(target), h),
      xs, ys, LMax,
    };
  }, [B, h, lambda, L, er, target]);

  return (
    <>
      <div className="mb-6">
        <label htmlFor="preset" className="block text-sm font-medium mb-2">Load typical values</label>
        <select id="preset" value="" onChange={(e) => loadPreset(e.target.value)}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          <option value="" disabled>Choose a fibre type…</option>
          {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          Presets fill B and h with typical orders of magnitude. Datasheets give a beat length (B = λ/L_B) and a
          crosstalk XT over a length L (h = artanh(10^(−|XT|/10))/L); use those for your fibre.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Birefringence B (×10⁻⁴)" value={bRaw} onChange={setB} min={0.01} max={20} step="any" />
        <ValidatedNumberInput label="h-Parameter (1/m)" value={hRaw} onChange={setH} min={0} max={0.01} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setLambda} min={400} max={2000} step="any" />
        <ValidatedNumberInput label="Fiber Length (m)" value={lengthRaw} onChange={setLength} min={0} max={1000000} step="any" />
        <ValidatedNumberInput label="Input PER (dB)" value={erRaw} onChange={setEr} min={0} max={60} step="any" />
        <ValidatedNumberInput label="Required PER (dB)" value={targetRaw} onChange={setTarget} min={0.1} max={60} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card label="Beat Length" value={show(calc.L_B, () => `${(calc.L_B * 1e3).toPrecision(4)} mm`)} sub="L_B = λ/B" tone="text-blue-400" />
        <Card label="DGD per Length" value={show(calc.dgd, () => `${(calc.dgd * 1e12).toPrecision(4)} ps/m`)} sub="B/c: group ≈ phase B in stress fibres; overstates e-core fibre ≈ 3×" tone="text-gray-200" />
        <Card label="Fibre Crosstalk" value={dbText(calc.fibreXt)}
          sub="10 log tanh(hL), for a perfect launch" tone="text-gray-200" />
        <Card label="Output PER" value={dbText(calc.outDb)}
          sub={`from ${er} dB in; exact coupled-power solution`} tone={calc.outDb >= target ? "text-green-400" : "text-red-400"} />
        <Card label={`Length to ${target} dB`} value={calc.Ltarget === Infinity ? "never" : show(calc.Ltarget, () => (calc.Ltarget === 0 ? "already below" : lengthText(calc.Ltarget)))}
          sub={h === 0 ? "h = 0: no coupling" : "ln(r₀/r_t)/(2h)"} tone="text-yellow-400" />
        <Card label="Meets Requirement" value={calc.outDb >= target ? "Yes" : "No"} sub={`output ${dbText(calc.outDb)} vs ${target} dB`}
          tone={calc.outDb >= target ? "text-green-400" : "text-red-400"} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>dPx/dz = −h(Px − Py), dPy/dz = h(Px − Py)</p>
          <p>Py/Px = (1 − r)/(1 + r), r = e^(−2hL)(1 − ε₀)/(1 + ε₀), ε₀ = 10^(−PER_in/10)</p>
          <p>ε₀ = 0: Py/Px = tanh(hL); small values add: ε ≈ ε₀ + hL</p>
          <p>L_B = λ/B, DGD = B/c</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Random coupling between the two polarization modes along the fibre (Noda, Okamoto and Sasaki 1986). h depends
          on the coating, cabling, bends and temperature, so take it from the datasheet or a measurement. Ignored:
          splice and connector misalignment (an angle θ adds ≈ tan²θ), polarization-dependent loss, and coherent
          (non-random) coupling at stress points.
        </p>
      </div>

      <ChartPanel data={[
        { x: calc.xs, y: calc.ys, type: "scatter", mode: "lines", name: "Output PER", line: { color: "#3b82f6", width: 2 } },
        ...(Number.isFinite(calc.outDb) ? [{ x: [L], y: [calc.outDb], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#22c55e", size: 10 } }] : []),
        { x: [0, calc.LMax], y: [target, target], type: "scatter", mode: "lines", name: "Required PER", line: { color: "#ef4444", width: 1, dash: "dash" } },
      ]} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
        yaxis: { title: "PER (dB)", gridcolor: "#374151" },
        legend: { x: 0.6, y: 0.99 },
        margin: { t: 30 },
      }} />
      <p className="text-xs text-gray-400 mt-2">Chart: output polarization extinction ratio against fibre length, with the required PER as a dashed line.</p>
    </>
  );
}
