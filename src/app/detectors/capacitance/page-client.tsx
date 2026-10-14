"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { GRADING_EXPONENT, junctionCapacitance, rcBandwidth } from "../../../physics/detectors/photodiode-rc";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const PROFILES = ["abrupt", "graded", "custom"] as const;
type Profile = (typeof PROFILES)[number];
const LABELS: Record<Profile, string> = { abrupt: "Abrupt (m = 1/2)", graded: "Linearly graded (m = 1/3)", custom: "Custom m" };

export default function CapacitancePage() {
  const [zeroBiasCapRaw, setZeroBiasCap] = useURLState("zeroBiasCap", 10);
  const [builtInVoltageRaw, setBuiltInVoltage] = useURLState("builtInVoltage", 0.6);
  const [reverseBiasRaw, setReverseBias] = useURLState("reverseBias", 5);
  const [profileRaw, setProfile] = useURLState("grading", "abrupt");
  const [customMRaw, setCustomM] = useURLState("m", 0.75);
  const [loadResistanceRaw, setLoadResistance] = useURLState("loadResistance", 50);
  const [seriesResistanceRaw, setSeriesResistance] = useURLState("seriesResistance", 10);
  const profile: Profile = PROFILES.find(p => p === profileRaw) ?? "abrupt";
  const zeroBiasCap = clamp(zeroBiasCapRaw, 0.01, 1e6, 10); // pF
  const builtInVoltage = clamp(builtInVoltageRaw, 0.05, 5, 0.6);
  const reverseBias = clamp(reverseBiasRaw, 0, 1000, 5);
  const customM = clamp(customMRaw, 0.05, 3, 0.75);
  const loadResistance = clamp(loadResistanceRaw, 1, 1e9, 50);
  const seriesResistance = clamp(seriesResistanceRaw, 0, 1e6, 10);

  const m = profile === "custom" ? customM : GRADING_EXPONENT[profile];
  const capacitance = junctionCapacitance(zeroBiasCap, reverseBias, builtInVoltage, m); // pF
  const totalResistance = loadResistance + seriesResistance;
  const rcBw = rcBandwidth(totalResistance, capacitance * 1e-12);
  const rcTime = totalResistance * capacitance * 1e-12 * 1e9; // ns

  const vMax = Math.max(20, reverseBias);
  const vr = Array.from({ length: 201 }, (_, i) => (i * vMax) / 200);
  const curves: { name: string; m: number; color: string }[] = [
    { name: LABELS.abrupt, m: GRADING_EXPONENT.abrupt, color: "#60a5fa" },
    { name: LABELS.graded, m: GRADING_EXPONENT.graded, color: "#34d399" },
    ...(profile === "custom" ? [{ name: `Custom (m = ${customM})`, m: customM, color: "#f87171" }] : []),
  ];
  const capVsBias = curves.map(cv => ({ x: vr, y: vr.map(v => junctionCapacitance(zeroBiasCap, v, builtInVoltage, cv.m)), type: "scatter" as const, mode: "lines" as const, name: cv.name, line: { color: cv.color, width: 2 } }));
  const bwVsBias = [{ x: vr, y: vr.map(v => rcBandwidth(totalResistance, junctionCapacitance(zeroBiasCap, v, builtInVoltage, m) * 1e-12) / 1e6), type: "scatter" as const, mode: "lines" as const, name: "RC Bandwidth", line: { color: "#fbbf24", width: 2 } }];

  return (
    <>
      <div role="group" aria-label="Doping profile" className="flex flex-wrap gap-2 mb-6">
        {PROFILES.map(p => (
          <button key={p} onClick={() => setProfile(p)} className={`px-4 py-2 rounded text-sm font-medium ${profile === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{LABELS[p]}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Zero-Bias Cap (pF)" value={zeroBiasCapRaw} onChange={setZeroBiasCap} min={0.01} max={1e6} step="0.5" />
        <ValidatedNumberInput label="Built-in Voltage (V)" value={builtInVoltageRaw} onChange={setBuiltInVoltage} min={0.05} max={5} step="0.05" />
        <ValidatedNumberInput label="Reverse Bias (V)" value={reverseBiasRaw} onChange={setReverseBias} min={0} max={1000} step="0.5" />
        {profile === "custom" && <ValidatedNumberInput label="Grading Exponent m" value={customMRaw} onChange={setCustomM} min={0.05} max={3} step="0.05" />}
        <ValidatedNumberInput label="Load R (Ω)" value={loadResistanceRaw} onChange={setLoadResistance} min={1} max={1e9} step="10" />
        <ValidatedNumberInput label="Series R (Ω)" value={seriesResistanceRaw} onChange={setSeriesResistance} min={0} max={1e6} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Junction Capacitance" value={`${capacitance.toPrecision(4)} pF`} tone="green" />
        <ResultCard label="RC Bandwidth" value={rcBw > 1e9 ? `${(rcBw / 1e9).toFixed(2)} GHz` : `${(rcBw / 1e6).toFixed(1)} MHz`} tone="blue" />
        <ResultCard label="RC Time Constant" value={`${rcTime.toFixed(2)} ns`} tone="yellow" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={capVsBias} layout={{ xaxis: { title: "Reverse Bias (V)", gridcolor: "#374151" }, yaxis: { title: "C_j (pF)", gridcolor: "#374151" } }} title="Capacitance vs Bias" />
        <ChartPanel data={bwVsBias} layout={{ xaxis: { title: "Reverse Bias (V)", gridcolor: "#374151" }, yaxis: { title: "f_3dB (MHz)", gridcolor: "#374151" } }} title="Bandwidth vs Bias" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1">
        <p>C_j = C_j0 / (1 + V_R/V_bi)^m</p>
        <p>f_3dB = 1 / (2π·(R_L + R_s)·C_j)</p>
        <p>Depletion approximation; ignores package and stray capacitance, and the transit-time limit.</p>
      </div>
    </>
  );
}
