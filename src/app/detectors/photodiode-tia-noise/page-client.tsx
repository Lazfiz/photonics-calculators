"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { noiseEquivalentPower, responsivity as responsivityOf } from "../../../physics/detectors/noise";
import { tiaBandwidth, tiaButterworthCf, tiaFilteredNoise, tiaSpotNoise, type TiaNoiseInputs } from "../../../physics/detectors/tia";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtHz = (f: number) => (!Number.isFinite(f) ? "—" : f >= 1e9 ? `${(f / 1e9).toFixed(2)} GHz` : f >= 1e6 ? `${(f / 1e6).toFixed(2)} MHz` : `${(f / 1e3).toFixed(2)} kHz`);

export default function PhotodiodeTiaNoisePage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 530);
  const [qeRaw, setQe] = useURLState("qe", 0.9);
  const [inputNoiseCurrentRaw, setInputNoiseCurrent] = useURLState("inputNoiseCurrent", 5); // fA/√Hz
  const [inputNoiseVoltageRaw, setInputNoiseVoltage] = useURLState("inputNoiseVoltage", 5); // nV/√Hz
  const [inputCapRaw, setInputCap] = useURLState("inputCapacitance", 10); // pF
  const [gbwRaw, setGbw] = useURLState("gbw", 1000); // MHz
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 100); // MHz
  const [feedbackResistanceRaw, setFeedbackResistance] = useURLState("feedbackResistance", 1); // MΩ
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300); // K
  const wavelength_nm = clamp(wavelengthRaw, 200, 20000, 530);
  const qe = clamp(qeRaw, 0.01, 1, 0.9);
  const iN = clamp(inputNoiseCurrentRaw, 0, 1e6, 5) * 1e-15;
  const eN = clamp(inputNoiseVoltageRaw, 0, 1e4, 5) * 1e-9;
  const inputC = clamp(inputCapRaw, 0.01, 1e5, 10) * 1e-12;
  const gbw = clamp(gbwRaw, 1e-3, 1e5, 1000) * 1e6;
  const band = clamp(bandwidthRaw, 1e-6, 1e5, 100) * 1e6;
  const rf = clamp(feedbackResistanceRaw, 1e-6, 1e6, 1) * 1e6;
  const temperature = clamp(temperatureRaw, 0, 1000, 300);

  const responsivity = responsivityOf(qe, wavelength_nm * 1e-9);
  const amp = (feedbackR: number): TiaNoiseInputs => ({ currentNoise: iN, voltageNoise: eN, feedbackR, inputC, temperature });
  // Noise weighted by the Butterworth TIA response up to the post-filter B; F is the noise-equivalent bandwidth.
  const atRf = (feedbackR: number) => {
    const fTia = tiaBandwidth(gbw, feedbackR, inputC);
    const { terms, enbw: F } = tiaFilteredNoise(amp(feedbackR), fTia, band);
    const iRms = Math.sqrt(terms.total * F);
    return { fTia, F, terms, iRms, nep: noiseEquivalentPower(iRms, responsivity) };
  };
  const { fTia, F, terms, iRms, nep } = atRf(rf);
  const cf = tiaButterworthCf(gbw, rf, inputC);
  const parts = [
    { name: "amplifier i_n", v: terms.current },
    { name: "Johnson of R_f", v: terms.johnson },
    { name: "e_n/R_f", v: terms.voltage },
    { name: "e_n·2πf·C_S", v: terms.capacitive },
  ];
  const dominant = parts.reduce((a, b) => (b.v > a.v ? b : a));

  const freqs = Array.from({ length: 200 }, (_, i) => 100 * Math.pow(Math.max(fTia, 1e3) / 100, i / 199));
  const spot = freqs.map(f => tiaSpotNoise(amp(rf), f));
  const toFa = (x: number) => (x > 0 ? Math.sqrt(x) * 1e15 : null);
  const densityChart = [
    { x: freqs, y: spot.map(s => toFa(s.current)), type: "scatter", mode: "lines", name: "i_n", line: { color: "#f87171" } },
    { x: freqs, y: spot.map(s => toFa(s.johnson)), type: "scatter", mode: "lines", name: "Johnson (R_f)", line: { color: "#fbbf24" } },
    { x: freqs, y: spot.map(s => toFa(s.voltage)), type: "scatter", mode: "lines", name: "e_n/R_f", line: { color: "#60a5fa" } },
    { x: freqs, y: spot.map(s => toFa(s.capacitive)), type: "scatter", mode: "lines", name: "e_n·2πf·C_S", line: { color: "#a78bfa" } },
    { x: freqs, y: spot.map(s => toFa(s.total)), type: "scatter", mode: "lines", name: "Total", line: { color: "#34d399", dash: "dash" } },
  ];

  const gains = Array.from({ length: 200 }, (_, i) => 1e3 * Math.pow(1e5, i / 199)); // 1 kΩ to 100 MΩ
  const sweep = gains.map(atRf);
  const rfChart = [
    { x: gains, y: sweep.map(s => s.nep), type: "scatter", mode: "lines", name: "NEP (W)", line: { color: "#34d399" } },
    { x: gains, y: sweep.map(s => s.F), type: "scatter", mode: "lines", name: "Noise bandwidth ENBW (Hz)", line: { color: "#60a5fa", dash: "dash" }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="10" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQe} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="i_n (fA/√Hz)" value={inputNoiseCurrentRaw} onChange={setInputNoiseCurrent} min={0} max={1e6} step="0.5" />
        <ValidatedNumberInput label="e_n (nV/√Hz)" value={inputNoiseVoltageRaw} onChange={setInputNoiseVoltage} min={0} max={1e4} step="0.5" />
        <ValidatedNumberInput label="Input Capacitance C_S = C_d + C_amp (pF)" value={inputCapRaw} onChange={setInputCap} min={0.01} max={1e5} step="1" />
        <ValidatedNumberInput label="Op-amp GBW (MHz)" value={gbwRaw} onChange={setGbw} min={1e-3} max={1e5} step="100" />
        <ValidatedNumberInput label="Post-filter Bandwidth B (MHz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-6} max={1e5} step="10" />
        <ValidatedNumberInput label="R_f (MΩ)" value={feedbackResistanceRaw} onChange={setFeedbackResistance} min={1e-6} max={1e6} step="0.1" />
        <ValidatedNumberInput label="R_f Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={0} max={1000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Responsivity" value={`${(responsivity * 1e3).toFixed(2)} mA/W`} tone="blue" />
        <ResultCard label="TIA Bandwidth" value={fmtHz(fTia)} tone="cyan" subtext={`√(GBW/2πR_f·C_S); Butterworth C_f = ${Number.isFinite(cf) ? `${(cf * 1e12).toPrecision(3)} pF` : "—"}`} />
        <ResultCard label="Noise Bandwidth (ENBW)" value={fmtHz(F)} tone={band > fTia ? "orange" : "purple"} subtext={band > fTia ? "Set by the TIA roll-off (B > f_TIA); the e_n·C noise peaks near f_TIA" : "Set by the post-filter B"} />
        <ResultCard label="Input Noise Current" value={`${iRms.toExponential(3)} A rms`} tone="yellow" subtext={`Dominant: ${dominant.name}; ${(Math.sqrt(terms.total) * 1e15).toFixed(1)} fA/√Hz band average`} />
        <ResultCard label="NEP (in the noise band)" value={`${nep.toExponential(3)} W`} tone="green" subtext={`Output noise ${(iRms * rf * 1e3).toPrecision(3)} mV rms`} />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>f_TIA = √(GBW / (2π·R_f·C_S)) for a Butterworth (Q = 0.707) response</p>
        <p>i²(f) = i_n² + 4kT/R_f + (e_n/R_f)² + (e_n·2πf·C_S)²</p>
        <p>i²_rms = ∫₀ᴮ i²(f) / (1 + (f/f_TIA)⁴) df  (Butterworth response, brick-wall post-filter B)</p>
        <p>B ≫ f_TIA: ENBW = 1.11·f_TIA, and the e_n·C term weighs (e_n·2π·C_S)²·1.11·f_TIA³</p>
        <p>NEP = i_rms / ℛ. Photocurrent and dark-current shot noise are left out.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={densityChart} layout={{ xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Input noise density (fA/√Hz)", type: "log", gridcolor: "#374151" } }} title="Noise Density up to f_TIA" />
        <ChartPanel data={rfChart} layout={{ xaxis: { title: "R_f (Ω)", gridcolor: "#374151", type: "log" }, yaxis: { title: "NEP (W)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "Noise band (Hz)", overlaying: "y", side: "right", type: "log" } }} title="NEP and Bandwidth vs Feedback R" />
      </div>
    </>
  );
}
