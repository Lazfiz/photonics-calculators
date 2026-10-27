"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { darkCurrentRatio, type DarkCurrentMechanism } from "../../../physics/detectors/dark-current";
import { VARSHNI, varshniBandGap } from "../../../physics/materials/bandgap";
import { shotNoiseCurrent } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
/** Current in A with an SI prefix (fA … mA). */
const fmtA = (i: number) => {
  if (!Number.isFinite(i)) return "—";
  const units: [number, string][] = [[1e-3, "mA"], [1e-6, "µA"], [1e-9, "nA"], [1e-12, "pA"], [1e-15, "fA"]];
  for (const [scale, unit] of units) if (Math.abs(i) >= scale) return `${(i / scale).toPrecision(3)} ${unit}`;
  return `${(i / 1e-15).toExponential(2)} fA`;
};
const KELVIN = 273.15;
const T_REF = 25 + KELVIN;
const GAP_MODELS = ["fixed", "si", "ge"] as const;
type GapModel = (typeof GAP_MODELS)[number];

export default function DarkNoiseTemperaturePage() {
  const [darkCurrent25Raw, setDarkCurrent25] = useURLState("darkCurrent25", 0.5); // nA
  const [egRaw, setEg] = useURLState("eg", 1.12); // eV
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1); // Hz
  const [gapModelRaw, setGapModel] = useURLState("gapModel", "si");
  const [mechanismRaw, setMechanism] = useURLState("mechanism", "generation");
  const darkCurrent25 = clamp(darkCurrent25Raw, 1e-6, 1e6, 0.5) * 1e-9; // A
  const eg = clamp(egRaw, 0.1, 6, 1.12);
  const bandwidth = clamp(bandwidthRaw, 1e-3, 1e10, 1);
  const gapModel: GapModel = GAP_MODELS.find(m => m === gapModelRaw) ?? "si";
  const mechanism: DarkCurrentMechanism = mechanismRaw === "diffusion" ? "diffusion" : "generation";

  const gapAt = (T: number) => (gapModel === "fixed" ? eg : varshniBandGap(T, VARSHNI[gapModel]));
  const darkCurrentAtT = (Tc: number) => darkCurrent25 * darkCurrentRatio(Tc + KELVIN, T_REF, gapAt(Tc + KELVIN), mechanism, gapAt(T_REF));
  const darkNoiseAtT = (Tc: number) => shotNoiseCurrent(darkCurrentAtT(Tc), bandwidth);

  const n = 121;
  const temps = Array.from({ length: n }, (_, i) => -40 + (i * 120) / (n - 1));
  const chartData = [
    { x: temps, y: temps.map(T => darkCurrentAtT(T) * 1e9), type: "scatter", mode: "lines", name: "Dark current (nA)", line: { color: "#f87171", width: 2 }, yaxis: "y" },
    { x: temps, y: temps.map(T => darkNoiseAtT(T) * 1e15), type: "scatter", mode: "lines", name: "Shot noise (fA rms)", line: { color: "#60a5fa", width: 2 }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Dark Current at 25 °C (nA)" value={darkCurrent25Raw} onChange={setDarkCurrent25} min={1e-6} max={1e6} step="0.1" />
        <ValidatedNumberInput label="Noise Bandwidth (Hz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-3} max={1e10} step="1" />
        <label className="block text-sm text-gray-300">
          <span className="mb-1 block">Dark-current mechanism</span>
          <select value={mechanism} onChange={e => setMechanism(e.target.value)} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white">
            <option value="generation">Depletion generation (∝ n_i)</option>
            <option value="diffusion">Diffusion (∝ n_i²)</option>
          </select>
        </label>
        <label className="block text-sm text-gray-300">
          <span className="mb-1 block">Band gap</span>
          <select value={gapModel} onChange={e => setGapModel(e.target.value)} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white">
            <option value="fixed">Fixed E_g (enter below; Si ≈ 1.20 eV fits E_g(T))</option>
            <option value="si">Si, Varshni E_g(T)</option>
            <option value="ge">Ge, Varshni E_g(T)</option>
          </select>
        </label>
        {gapModel === "fixed" ? (
          <ValidatedNumberInput label="Band Gap E_g (eV)" value={egRaw} onChange={setEg} min={0.1} max={6} step="0.01" />
        ) : (
          <p className="text-sm text-gray-400 self-end pb-2">E_g(25 °C) = {gapAt(T_REF).toFixed(4)} eV, E_g(−40 °C) = {gapAt(-40 + KELVIN).toFixed(4)} eV</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Dark @ 25 °C" value={fmtA(darkCurrentAtT(25))} tone="blue" />
        <ResultCard label="Shot noise @ 25 °C" value={`${fmtA(darkNoiseAtT(25))} rms`} tone="yellow" subtext={`in ${bandwidth} Hz`} />
        <ResultCard label="Dark @ −40 °C" value={fmtA(darkCurrentAtT(-40))} tone="green" />
        <ResultCard label="Ratio (80 / −40 °C)" value={`×${(darkCurrentAtT(80) / darkCurrentAtT(-40)).toExponential(1)}`} tone="red" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>n_i ∝ T^(3/2) · exp(−E_g(T) / 2k_BT); &nbsp;I_dark ∝ n_i (generation) or n_i² (diffusion)</p>
        <p>E_g(T) = E_g(0) − αT² / (T + β) &nbsp;(Varshni)</p>
        <p>i_n = √(2q · I_dark · Δf)</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Dark Current (nA)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "Shot Noise (fA rms)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" } }} />
    </>
  );
}
