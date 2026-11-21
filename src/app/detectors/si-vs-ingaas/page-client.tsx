"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  INGAAS_WINDOWS, ingaasReferenceQe, pinSnr, siPinQe, siVsIngaasSummary, type IngaasWindow,
} from "../../../physics/detectors/si-vs-ingaas";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : "—");
const fmtE = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const fmtSnr = (x: number) => (!Number.isFinite(x) ? "—" : x >= 1e4 ? x.toExponential(2) : x.toFixed(1));

export default function SiVsInGaAsPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550);
  const [powerRaw, setPower] = useURLState("powerDbm", -40);
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300);
  const [areaRaw, setArea] = useURLState("area", 1);
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1);
  const [ampNoiseRaw, setAmpNoise] = useURLState("ampNoise", 1);
  const [windowRaw, setWindow] = useURLState("window", "inp");
  const wavelength_nm = clamp(wavelengthRaw, 400, 1800, 1550);
  const powerW = 10 ** (clamp(powerRaw, -90, 10, -40) / 10) * 1e-3;
  const T = clamp(temperatureRaw, 250, 350, 300); // K
  const area = clamp(areaRaw, 0.001, 100, 1) * 1e-6; // m²
  const bandwidth = clamp(bandwidthRaw, 1e-6, 1e4, 1) * 1e6; // Hz
  const ampNoise = clamp(ampNoiseRaw, 0, 100, 1) * 1e-12; // A/√Hz
  const cap: IngaasWindow = INGAAS_WINDOWS.find((w) => w === windowRaw) ?? "inp";

  const ingaasQe = (lambda: number) => ingaasReferenceQe(lambda, T, cap);
  const lambda = wavelength_nm * 1e-9;
  const { siQe: si, ingaasQe: ingaas, siResponsivity, ingaasResponsivity, siDark, ingaasDark, siSnr, ingaasSnr, inpEdge, niRatio } = siVsIngaasSummary({
    lambda, power: powerW, T, area, bandwidth, ampNoise, window: cap,
  });
  const snr = (qe: number, lam: number, dark: number) => pinSnr(qe, lam, dark, powerW, ampNoise, bandwidth);
  const edge_nm = inpEdge * 1e9;

  const wl = Array.from({ length: 281 }, (_, i) => 400 + i * 5);
  const siSpectrum = wl.map((w) => siPinQe(w * 1e-9));
  const ingaasSpectrum = wl.map((w) => ingaasQe(w * 1e-9));
  const qeTraces = [
    { x: wl, y: siSpectrum.map((v) => v * 100), type: "scatter", mode: "lines", name: "Si p-i-n", line: { color: "#60a5fa", width: 2 } },
    { x: wl, y: ingaasSpectrum.map((v) => v * 100), type: "scatter", mode: "lines", name: "InGaAs p-i-n", line: { color: "#fb923c", width: 2 } },
    { x: [wavelength_nm, wavelength_nm], y: [0, 100], type: "scatter", mode: "lines", name: `λ = ${wavelength_nm} nm`, line: { color: "#22c55e", dash: "dash" } },
  ];
  // Log axis: SNR 0 (no absorption) is skipped by the chart.
  const snrTraces = [
    { x: wl, y: wl.map((w, i) => snr(siSpectrum[i], w * 1e-9, siDark)), type: "scatter", mode: "lines", name: "Si SNR", line: { color: "#60a5fa", width: 2 } },
    { x: wl, y: wl.map((w, i) => snr(ingaasSpectrum[i], w * 1e-9, ingaasDark)), type: "scatter", mode: "lines", name: "InGaAs SNR", line: { color: "#fb923c", width: 2 } },
  ];
  const zeroReason = (qe: number, isIngaas: boolean) =>
    qe !== 0 ? undefined : isIngaas && cap === "inp" && lambda <= edge_nm * 1e-9 ? "absorbed in the InP window" : "beyond the cutoff";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={400} max={1800} step="10" />
        <ValidatedNumberInput label="Optical Power (dBm)" value={powerRaw} onChange={setPower} min={-90} max={10} step="1" />
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={250} max={350} step="5" />
        <ValidatedNumberInput label="Detector Area (mm²)" value={areaRaw} onChange={setArea} min={0.001} max={100} step="0.1" />
        <ValidatedNumberInput label="Bandwidth (MHz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-6} max={1e4} step="1" />
        <ValidatedNumberInput label="Amplifier Noise (pA/√Hz)" value={ampNoiseRaw} onChange={setAmpNoise} min={0} max={100} step="0.1" />
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-gray-300">
        <span>InGaAs window:</span>
        {INGAAS_WINDOWS.map((w) => (
          <button key={w} onClick={() => setWindow(w)} className={`rounded-full border px-3 py-1 transition ${cap === w ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {w === "inp" ? `InP cap (standard, opaque below ${edge_nm.toFixed(0)} nm)` : "None (visible-extended)"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Si QE" value={pct(si)} tone="blue" subtext={zeroReason(si, false) ?? `ℛ = ${siResponsivity.toFixed(3)} A/W`} />
        <ResultCard label="InGaAs QE" value={pct(ingaas)} tone="orange" subtext={zeroReason(ingaas, true) ?? `ℛ = ${ingaasResponsivity.toFixed(3)} A/W`} />
        <ResultCard label="Si SNR" value={fmtSnr(siSnr)} tone="green" subtext={`dark ${fmtE(siDark)} A`} />
        <ResultCard label="InGaAs SNR" value={fmtSnr(ingaasSnr)} tone="yellow" subtext={`dark ${fmtE(ingaasDark)} A`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>SNR = I_s/√((2q·(I_s + I_dark) + i_amp²)·B), I_s = ℛ·P, I_dark = q·n_i·W·A/τ_g (reverse bias)</p>
        <p>
          <strong className="text-blue-400">Si:</strong>{" "}Green&apos;s 300 K absorption, W = 20 µm, L = 100 µm, R = 5 %,
          τ_g = 1 ms; the absorption edge does not move with temperature.
        </p>
        <p>
          <strong className="text-orange-400">InGaAs:</strong> In₀.₅₃Ga₀.₄₇As, d = 3 µm fully depleted, R = 2 %, τ_g = 100 µs;
          the cutoff follows the band gap (1682 nm at 300 K). Ideal collection: real devices lose part of the light short
          of 1.1 µm in the contact layers. The InP cap is taken as opaque above its band gap.
        </p>
        <p>
          Dark current is generation in the depletion region only. InGaAs has n_i {niRatio.toFixed(niRatio < 100 ? 1 : 0)}× that of Si at {T} K, so its dark current is
          higher per unit volume; above room temperature diffusion current, left out here, often dominates.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={qeTraces} layout={{
          title: { text: "Quantum efficiency", font: { size: 12 } },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "QE (%)", gridcolor: "#374151", range: [0, 100] },
        }} />
        <ChartPanel data={snrTraces} layout={{
          title: { text: `SNR at ${(10 * Math.log10(powerW * 1e3)).toFixed(0)} dBm`, font: { size: 12 } },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151", type: "log" },
        }} />
      </div>
    </>
  );
}
