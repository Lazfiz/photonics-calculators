"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { doublingLawRatio, localDoublingTemperature } from "../../../physics/detectors/dark-current";
import { VARSHNI } from "../../../physics/materials/bandgap";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtE = (x: number, unit: string) => (Number.isFinite(x) ? `${x.toExponential(2)} ${unit}` : "—");
const T_REF_C = 25;
const KELVIN = 273.15;

export default function DarkCurrentPage() {
  const [darkCurrent25Raw, setDarkCurrent25] = useURLState("darkCurrent25", 0.1);
  const [tempFactorRaw, setTempFactor] = useURLState("tempFactor", 6);
  const [tempMinRaw, setTempMin] = useURLState("tempMin", -80);
  const [tempMaxRaw, setTempMax] = useURLState("tempMax", 40);
  const [readNoiseRaw, setReadNoise] = useURLState("readNoise", 5);
  const [exposureTimeRaw, setExposureTime] = useURLState("exposureTime", 1);
  const darkCurrent25 = clamp(darkCurrent25Raw, 1e-6, 1e9, 0.1); // e⁻/pixel/s
  const doublingT = clamp(tempFactorRaw, 2, 20, 6); // K
  const readNoise = clamp(readNoiseRaw, 0, 1e4, 5); // e⁻ rms
  const exposureTime = clamp(exposureTimeRaw, 1e-6, 1e5, 1); // s
  const tA = clamp(tempMinRaw, -150, 150, -80);
  const tB = clamp(tempMaxRaw, -150, 150, 40);
  const tempMin = Math.min(tA, tB);
  const tempMax = tA === tB ? tA + 1 : Math.max(tA, tB);

  const darkCurrentAtT = (Tc: number) => darkCurrent25 * doublingLawRatio(Tc + KELVIN, T_REF_C + KELVIN, doublingT);
  // Dark shot noise √(D·t) equals the read noise where D(T)·t = σ_r².
  const crossoverTemp = T_REF_C + doublingT * Math.log2((readNoise * readNoise) / (darkCurrent25 * exposureTime));
  const dcAtMin = darkCurrentAtT(tempMin);
  const dcAtMax = darkCurrentAtT(tempMax);
  const siGenTd = localDoublingTemperature(T_REF_C + KELVIN, VARSHNI.si, "generation");
  const siDiffTd = localDoublingTemperature(T_REF_C + KELVIN, VARSHNI.si, "diffusion");

  const n = 121;
  const temps = Array.from({ length: n }, (_, i) => tempMin + (i * (tempMax - tempMin)) / (n - 1));
  const chartData = [
    { x: temps, y: temps.map(darkCurrentAtT), type: "scatter" as const, mode: "lines" as const, name: "Dark current (e⁻/s)", line: { color: "#f87171" }, yaxis: "y" },
    { x: temps, y: temps.map(T => darkCurrentAtT(T) * exposureTime), type: "scatter" as const, mode: "lines" as const, name: "Dark e⁻ per exposure", line: { color: "#60a5fa" }, yaxis: "y2" },
    { x: temps, y: temps.map(T => Math.sqrt(darkCurrentAtT(T) * exposureTime)), type: "scatter" as const, mode: "lines" as const, name: "Dark shot noise (e⁻)", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ...(readNoise > 0
      ? [{ x: [tempMin, tempMax], y: [readNoise, readNoise], type: "scatter" as const, mode: "lines" as const, name: "Read noise (e⁻)", line: { color: "#fbbf24", dash: "dot" }, yaxis: "y2" }]
      : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Dark Current at 25 °C (e⁻/pixel/s)" value={darkCurrent25Raw} onChange={setDarkCurrent25} min={1e-6} max={1e9} step="0.01" />
        <ValidatedNumberInput label="Doubling Temperature T_d (K)" value={tempFactorRaw} onChange={setTempFactor} min={2} max={20} step="0.5" />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoiseRaw} onChange={setReadNoise} min={0} max={1e4} step="0.5" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTimeRaw} onChange={setExposureTime} min={1e-6} max={1e5} step="0.1" />
        <ValidatedNumberInput label="Coldest Temperature (°C)" value={tempMinRaw} onChange={setTempMin} min={-150} max={150} step="5" />
        <ValidatedNumberInput label="Warmest Temperature (°C)" value={tempMaxRaw} onChange={setTempMax} min={-150} max={150} step="5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label={`Dark @ ${tempMin} °C`} value={fmtE(dcAtMin, "e⁻/s")} tone="blue" />
        <ResultCard label={`Dark @ ${tempMax} °C`} value={fmtE(dcAtMax, "e⁻/s")} tone="red" />
        <ResultCard label={`Ratio (${tempMax} / ${tempMin} °C)`} value={Number.isFinite(dcAtMax / dcAtMin) ? `×${(dcAtMax / dcAtMin).toExponential(1)}` : "—"} tone="yellow" />
        <ResultCard
          label="Dark noise = read noise at"
          value={Number.isFinite(crossoverTemp) && crossoverTemp >= tempMin && crossoverTemp <= tempMax ? `${crossoverTemp.toFixed(1)} °C` : "Outside range"}
          tone="purple"
          subtext="Colder than this, read noise dominates"
        />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono">D(T) = D₂₅ · 2^((T − 25 °C) / T_d) &nbsp; σ_dark = √(D · t)</p>
        <p>
          The doubling law is the local form of the n_i scaling. For silicon at 25 °C (Varshni E_g(T)) it gives T_d ≈{" "}
          {siGenTd.toFixed(1)} K for depletion generation current and {siDiffTd.toFixed(1)} K for diffusion current; CCD and
          CMOS data sheets usually quote 5–9 K.
        </p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Dark Current (e⁻/pixel/s)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "Electrons (e⁻)", gridcolor: "#374151", overlaying: "y", side: "right", type: "log" } }} />
    </>
  );
}
