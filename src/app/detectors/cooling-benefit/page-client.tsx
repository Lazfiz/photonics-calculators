"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { darkCurrentRatio } from "../../../physics/detectors/dark-current";
import { INGAAS_LATTICE_MATCHED_X, VARSHNI, ingaasBandGap, varshniBandGap } from "../../../physics/materials/bandgap";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtE = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const fmtF = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "—");
const KELVIN = 273.15;
const T_REF = 25 + KELVIN;

export default function CoolingBenefitPage() {
  const [egSiRaw, setEgSi] = useURLState("egSi", 1.12);
  const [siGapRaw, setSiGap] = useURLState("siGap", "varshni");
  const [egInGaAsRaw, setEgInGaAs] = useURLState("egInGaAs", 0.75);
  const [inGaAsGapRaw, setInGaAsGap] = useURLState("ingaasGap", "vurgaftman");
  const [darkCurrent25SiRaw, setDarkCurrent25Si] = useURLState("darkCurrent25Si", 0.1);
  const [darkCurrent25InGaAsRaw, setDarkCurrent25InGaAs] = useURLState("darkCurrent25InGaAs", 1000);
  const [signalRaw, setSignal] = useURLState("signal", 1000);
  const [readNoiseRaw, setReadNoise] = useURLState("readNoise", 3);
  const [exposureTimeRaw, setExposureTime] = useURLState("exposureTime", 1);
  const [coolTempRaw, setCoolTemp] = useURLState("coolTemp", -40);
  const egSi = clamp(egSiRaw, 0.1, 6, 1.12);
  const siVarshni = siGapRaw === "varshni";
  const egInGaAs = clamp(egInGaAsRaw, 0.1, 6, 0.75);
  const inGaAsVurgaftman = inGaAsGapRaw === "vurgaftman";
  const darkCurrent25Si = clamp(darkCurrent25SiRaw, 1e-6, 1e9, 0.1); // e⁻/pixel/s
  const darkCurrent25InGaAs = clamp(darkCurrent25InGaAsRaw, 1e-6, 1e9, 1000);
  const signal = clamp(signalRaw, 0, 1e9, 1000); // e⁻ per exposure
  const readNoise = clamp(readNoiseRaw, 0, 1e4, 3); // e⁻ rms
  const exposureTime = clamp(exposureTimeRaw, 1e-6, 1e5, 1); // s
  const coolTemp = clamp(coolTempRaw, -150, 25, -40); // °C

  const siGapAt = (T: number) => (siVarshni ? varshniBandGap(T, VARSHNI.si) : egSi);
  // Si: depletion generation current ∝ n_i. InGaAs: diffusion current ∝ n_i².
  const siDark = (Tc: number) => darkCurrent25Si * darkCurrentRatio(Tc + KELVIN, T_REF, siGapAt(Tc + KELVIN), "generation", siGapAt(T_REF));
  const inGaAsGapAt = (T: number) => (inGaAsVurgaftman ? ingaasBandGap(INGAAS_LATTICE_MATCHED_X, T) : egInGaAs);
  const inGaAsDark = (Tc: number) => darkCurrent25InGaAs * darkCurrentRatio(Tc + KELVIN, T_REF, inGaAsGapAt(Tc + KELVIN), "diffusion", inGaAsGapAt(T_REF));
  const snr = (dark: number) => {
    const noise = Math.sqrt(signal + dark * exposureTime + readNoise * readNoise);
    return noise > 0 ? signal / noise : NaN;
  };

  const n = 141;
  const temps = Array.from({ length: n }, (_, i) => -100 + i);
  const chartData = [
    { x: temps, y: temps.map(siDark), type: "scatter" as const, mode: "lines" as const, name: "Si dark", line: { color: "#60a5fa" }, yaxis: "y" },
    { x: temps, y: temps.map(inGaAsDark), type: "scatter" as const, mode: "lines" as const, name: "InGaAs dark", line: { color: "#fb923c" }, yaxis: "y" },
    { x: temps, y: temps.map(T => snr(siDark(T))), type: "scatter" as const, mode: "lines" as const, name: "Si SNR", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y2" },
    { x: temps, y: temps.map(T => snr(inGaAsDark(T))), type: "scatter" as const, mode: "lines" as const, name: "InGaAs SNR", line: { color: "#fb923c", dash: "dash" }, yaxis: "y2" },
  ];

  const siReduction = darkCurrent25Si / siDark(coolTemp);
  const inGaAsReduction = darkCurrent25InGaAs / inGaAsDark(coolTemp);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block text-sm text-gray-300">
          <span className="mb-1 block">Si band gap</span>
          <select value={siVarshni ? "varshni" : "fixed"} onChange={e => setSiGap(e.target.value)} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white">
            <option value="fixed">Fixed E_g (enter; the 0 K gap fits E_g(T) best)</option>
            <option value="varshni">Varshni E_g(T)</option>
          </select>
        </label>
        {siVarshni ? (
          <p className="text-sm text-gray-400 self-end pb-2">Si E_g: {siGapAt(T_REF).toFixed(3)} eV at 25 °C, {siGapAt(coolTemp + KELVIN).toFixed(3)} eV at {coolTemp} °C</p>
        ) : (
          <ValidatedNumberInput label="Si Band Gap (eV)" value={egSiRaw} onChange={setEgSi} min={0.1} max={6} step="0.01" />
        )}
        <label className="block text-sm text-gray-300">
          <span className="mb-1 block">InGaAs band gap</span>
          <select value={inGaAsVurgaftman ? "vurgaftman" : "fixed"} onChange={e => setInGaAsGap(e.target.value)} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white">
            <option value="fixed">Fixed E_g (enter; the 0 K gap fits E_g(T) best)</option>
            <option value="vurgaftman">In₀.₅₃Ga₀.₄₇As E_g(T) (Vurgaftman)</option>
          </select>
        </label>
        {inGaAsVurgaftman ? (
          <p className="text-sm text-gray-400 self-end pb-2">InGaAs E_g: {inGaAsGapAt(T_REF).toFixed(3)} eV at 25 °C, {inGaAsGapAt(coolTemp + KELVIN).toFixed(3)} eV at {coolTemp} °C</p>
        ) : (
          <ValidatedNumberInput label="InGaAs Band Gap (eV)" value={egInGaAsRaw} onChange={setEgInGaAs} min={0.1} max={6} step="0.01" />
        )}
        <ValidatedNumberInput label="Cooling Target (°C)" value={coolTempRaw} onChange={setCoolTemp} min={-150} max={25} step="5" />
        <ValidatedNumberInput label="Si Dark @ 25 °C (e⁻/s)" value={darkCurrent25SiRaw} onChange={setDarkCurrent25Si} min={1e-6} max={1e9} step="0.01" />
        <ValidatedNumberInput label="InGaAs Dark @ 25 °C (e⁻/s)" value={darkCurrent25InGaAsRaw} onChange={setDarkCurrent25InGaAs} min={1e-6} max={1e9} step="10" />
        <ValidatedNumberInput label="Signal (e⁻ per exposure)" value={signalRaw} onChange={setSignal} min={0} max={1e9} step="100" />
        <ValidatedNumberInput label="Read Noise (e⁻ rms)" value={readNoiseRaw} onChange={setReadNoise} min={0} max={1e4} step="0.5" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTimeRaw} onChange={setExposureTime} min={1e-6} max={1e5} step="0.1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Si Dark Reduction" value={`×${fmtE(siReduction, 1)}`} tone="blue" subtext={`${fmtE(siDark(coolTemp))} e⁻/s at ${coolTemp} °C`} />
        <ResultCard label="InGaAs Dark Reduction" value={`×${fmtE(inGaAsReduction, 1)}`} tone="orange" subtext={`${fmtE(inGaAsDark(coolTemp))} e⁻/s at ${coolTemp} °C; pure diffusion, an upper bound`} />
        <ResultCard label="Si SNR (25 °C → cooled)" value={`${fmtF(snr(siDark(25)))} → ${fmtF(snr(siDark(coolTemp)))}`} tone="green" />
        <ResultCard label="InGaAs SNR (25 °C → cooled)" value={`${fmtF(snr(inGaAsDark(25)))} → ${fmtF(snr(inGaAsDark(coolTemp)))}`} tone="yellow" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>Si (depletion generation): I ∝ n_i ∝ T^(3/2) · exp(−E_g/2k_BT)</p>
        <p>InGaAs (diffusion-limited): I ∝ n_i² ∝ T³ · exp(−E_g/k_BT)</p>
        <p>SNR = S / √(S + I_dark·t + σ_read²)</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Temperature (°C)", gridcolor: "#374151" }, yaxis: { title: "Dark Current (e⁻/s)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} />
    </>
  );
}
