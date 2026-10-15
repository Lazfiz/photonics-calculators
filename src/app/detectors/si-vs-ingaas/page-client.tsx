"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { generationCurrent, siliconIntrinsicDensity } from "../../../physics/detectors/dark-current";
import { ingaasIntrinsicDensity, ingaasPinQe, inpWindowEdge } from "../../../physics/detectors/ingaas";
import { photodiodeSnr } from "../../../physics/detectors/noise";
import { photodiodeQe } from "../../../physics/detectors/photodiode-qe";
import { responsivity } from "../../../physics/detectors/responsivity";
import { SILICON_LAMBDA_MAX, siliconAbsorption } from "../../../physics/materials/silicon-absorption";

// Reference devices (illustrative, not products). Si p-i-n: collecting width W, substrate diffusion length L,
// AR-coated front R, generation lifetime τ_g. InGaAs p-i-n: In₀.₅₃Ga₀.₄₇As fully depleted absorber d behind an InP cap.
const SI = { W: 20e-6, L: 100e-6, R: 0.05, tauG: 1e-3 };
const INGAAS = { x: 0.53, d: 3e-6, R: 0.02, tauG: 100e-6 };
const WINDOWS = ["inp", "none"] as const;
type Window = (typeof WINDOWS)[number];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : "—");
const fmtE = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const fmtSnr = (x: number) => (!Number.isFinite(x) ? "—" : x >= 1e4 ? x.toExponential(2) : x.toFixed(1));

// Si absorption is Green's 300 K table; beyond 1450 nm silicon is transparent (k < 1e-13), so its QE is 0.
const siQe = (lambda: number) =>
  lambda > SILICON_LAMBDA_MAX
    ? 0
    : photodiodeQe({ alpha: siliconAbsorption(lambda), reflectance: SI.R, depletionWidth: SI.W, diffusionLength: SI.L });

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
  const cap: Window = WINDOWS.find((w) => w === windowRaw) ?? "inp";

  const ingaasQe = (lambda: number) =>
    ingaasPinQe(lambda, { x: INGAAS.x, T, thickness: INGAAS.d, reflectance: INGAAS.R, inpWindow: cap === "inp" });
  const siDark = generationCurrent(siliconIntrinsicDensity(T), SI.W, area, SI.tauG);
  const ingaasDark = generationCurrent(ingaasIntrinsicDensity(INGAAS.x, T), INGAAS.d, area, INGAAS.tauG);
  const snr = (qe: number, lambda: number, dark: number) => photodiodeSnr(responsivity(qe, lambda) * powerW, dark, ampNoise, bandwidth);

  const lambda = wavelength_nm * 1e-9;
  const si = siQe(lambda);
  const ingaas = ingaasQe(lambda);
  const siSnr = snr(si, lambda, siDark);
  const ingaasSnr = snr(ingaas, lambda, ingaasDark);
  const edge_nm = inpWindowEdge(T) * 1e9;

  const wl = Array.from({ length: 281 }, (_, i) => 400 + i * 5);
  const siSpectrum = wl.map((w) => siQe(w * 1e-9));
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
        {WINDOWS.map((w) => (
          <button key={w} onClick={() => setWindow(w)} className={`rounded-full border px-3 py-1 transition ${cap === w ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {w === "inp" ? `InP cap (standard, opaque below ${edge_nm.toFixed(0)} nm)` : "None (visible-extended)"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Si QE" value={pct(si)} tone="blue" subtext={zeroReason(si, false) ?? `ℛ = ${responsivity(si, lambda).toFixed(3)} A/W`} />
        <ResultCard label="InGaAs QE" value={pct(ingaas)} tone="orange" subtext={zeroReason(ingaas, true) ?? `ℛ = ${responsivity(ingaas, lambda).toFixed(3)} A/W`} />
        <ResultCard label="Si SNR" value={fmtSnr(siSnr)} tone="green" subtext={`dark ${fmtE(siDark)} A`} />
        <ResultCard label="InGaAs SNR" value={fmtSnr(ingaasSnr)} tone="yellow" subtext={`dark ${fmtE(ingaasDark)} A`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>SNR = I_s/√((2q·(I_s + I_dark) + i_amp²)·B), I_s = ℛ·P, I_dark = q·n_i·W·A/τ_g (reverse bias)</p>
        <p>
          <strong className="text-blue-400">Si:</strong> Green&apos;s 300 K absorption, W = 20 µm, L = 100 µm, R = 5 %,
          τ_g = 1 ms; the absorption edge does not move with temperature.
        </p>
        <p>
          <strong className="text-orange-400">InGaAs:</strong> In₀.₅₃Ga₀.₄₇As, d = 3 µm fully depleted, R = 2 %, τ_g = 100 µs;
          the cutoff follows the band gap (1682 nm at 300 K). Ideal collection: real devices lose part of the light short
          of 1.1 µm in the contact layers. The InP cap is taken as opaque above its band gap.
        </p>
        <p>
          Dark current is generation in the depletion region only. InGaAs has n_i 65× that of Si, so its dark current is
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
