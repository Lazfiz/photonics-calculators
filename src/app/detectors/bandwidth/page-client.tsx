"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { h, k_B } from "../../../physics/constants";
import { johnsonNoise, ktcNoise, shotNoiseCurrent } from "../../../physics/detectors/noise";
import { rcBandwidth, rcFilteredNoise } from "../../../physics/detectors/photodiode-rc";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function BandwidthPage() {
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1e6);
  const [capacitanceRaw, setCapacitancePF] = useURLState("capacitance", 10);
  const [loadRRaw, setLoadR] = useURLState("feedbackR", 1e3); // key kept for old links: the load resistor R_L
  const [photoCurrentRaw, setPhotoCurrent] = useURLState("photoCurrent", 1e-6);
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300);
  const bandwidth = clamp(bandwidthRaw, 1, 1e12, 1e6);
  const capacitance = clamp(capacitanceRaw, 0.01, 1e6, 10) * 1e-12; // pF → F
  const loadR = clamp(loadRRaw, 1, 1e12, 1e3);
  const photoCurrent = clamp(photoCurrentRaw, 0, 1, 1e-6);
  const temperature = clamp(temperatureRaw, 0, 1000, 300);

  // Photodiode on a load R_L: both noise currents see the impedance R_L ∥ C_j, a first-order low-pass at f_c.
  const fc = rcBandwidth(loadR, capacitance);
  const johnsonDensity = johnsonNoise(loadR, temperature, 1).v ** 2; // 4k_B·T·R, V²/Hz at f ≪ f_c
  const shotDensity = (shotNoiseCurrent(photoCurrent, 1) * loadR) ** 2; // 2q·I·R², V²/Hz at f ≪ f_c
  const noiseAt = (B: number) => {
    const vJ = Math.sqrt(rcFilteredNoise(johnsonDensity, fc, B));
    const vS = Math.sqrt(rcFilteredNoise(shotDensity, fc, B));
    return { vJ, vS, vT: Math.hypot(vJ, vS) };
  };
  const { vJ: vJohnson, vS: vShot, vT: vTotal } = noiseAt(bandwidth);
  const kTC = ktcNoise(capacitance, temperature).v;

  const bws = Array.from({ length: 200 }, (_, i) => 1e3 * Math.pow(1e8, i / 199)); // 1 kHz to 100 GHz
  const curves = bws.map(noiseAt);
  const chartData = [
    { x: bws, y: curves.map(n => n.vJ), type: "scatter" as const, mode: "lines" as const, name: "Johnson (R_L)", line: { color: "#f87171" } },
    { x: bws, y: curves.map(n => (n.vS > 0 ? n.vS : null)), type: "scatter" as const, mode: "lines" as const, name: "Shot", line: { color: "#34d399" } },
    { x: bws, y: curves.map(n => n.vT), type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#60a5fa" } },
    { x: bws, y: bws.map(B => Math.sqrt(johnsonDensity * B)), type: "scatter" as const, mode: "lines" as const, name: "√(4kTR·Δf), no RC roll-off", line: { color: "#9ca3af", dash: "dot" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Measurement Bandwidth Δf (Hz)" value={bandwidthRaw} onChange={setBandwidth} min={1} max={1e12} />
        <ValidatedNumberInput label="Junction Capacitance (pF)" value={capacitanceRaw} onChange={setCapacitancePF} min={0.01} max={1e6} />
        <ValidatedNumberInput label="Load Resistance R_L (Ω)" value={loadRRaw} onChange={setLoadR} min={1} max={1e12} />
        <ValidatedNumberInput label="Photocurrent (A)" value={photoCurrentRaw} onChange={setPhotoCurrent} min={0} max={1} step="1e-7" />
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={0} max={1000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="RC 3dB Bandwidth" value={fc.toExponential(3) + " Hz"} tone="blue" subtext="1/(2π·R_L·C_j)" />
        <ResultCard label="Johnson Noise (V rms)" value={vJohnson.toExponential(3)} tone="red" />
        <ResultCard label="Shot Noise (V rms)" value={vShot.toExponential(3)} tone="green" />
        <ResultCard label="Total Noise (V rms)" value={vTotal.toExponential(3)} tone="yellow" />
        <ResultCard label="Johnson Limit √(kT/C)" value={kTC.toExponential(3) + " V"} tone="purple" subtext="Δf → ∞, independent of R_L" />
      </div>
      {photoCurrent * loadR > 0.3 && (
        <p className="mb-6 text-sm text-yellow-400">
          Signal voltage I·R_L above 0.3 V: beyond the unbiased photovoltaic range; reverse bias not modelled.
        </p>
      )}
      {Math.min(bandwidth, fc) > 0.1 * k_B * temperature / h && (
        <p className="mb-6 text-sm text-yellow-400">
          Noise band above 0.1·k_B·T/h: classical Johnson density; quantum (hf ≳ k_BT) correction not modelled.
        </p>
      )}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>Photodiode on a load resistor R_L; the output voltage across R_L ∥ C_j is low-passed at f_c = 1/(2π·R_L·C_j)</p>
        <p>v²_Johnson = 4·k·T·R_L · f_c·atan(Δf/f_c) → k·T/C_j for Δf ≫ f_c</p>
        <p>v²_Shot = 2·q·I·R_L² · f_c·atan(Δf/f_c)</p>
        <p>Below f_c the noise grows as √Δf; above it, widening the measurement band adds no more noise (or signal).</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Measurement Bandwidth Δf (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Output Noise Voltage (V rms)", type: "log", gridcolor: "#374151" } }} />
    </>
  );
}
