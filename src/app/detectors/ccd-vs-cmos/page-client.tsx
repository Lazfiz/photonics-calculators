"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cameraSnr, dynamicRangeDb, EM_REGISTER_STAGES, emExcessNoiseFactorSq, emMaxSignal } from "../../../physics/detectors/camera-snr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

interface Sensor {
  name: string;
  readNoise: number; // e⁻ rms at the output amplifier
  darkCurrent: number; // e⁻/pix/s
  wellCapacity: number; // e⁻, pixel
  registerWell?: number; // e⁻, EM gain register
  pixelSize: number; // µm
  qe: number;
  frameRate: number; // full frame, fps
}

// Representative values. EMCCD: Andor iXon Ultra 897 specifications (17 MHz EM amplifier, −100 °C).
const SENSORS: Sensor[] = [
  { name: "CCD", readNoise: 3, darkCurrent: 0.001, wellCapacity: 100000, pixelSize: 15, qe: 0.95, frameRate: 10 },
  { name: "sCMOS", readNoise: 1.5, darkCurrent: 0.01, wellCapacity: 50000, pixelSize: 6.5, qe: 0.9, frameRate: 100 },
  { name: "Phone CMOS", readNoise: 2, darkCurrent: 5, wellCapacity: 6000, pixelSize: 1.2, qe: 0.65, frameRate: 60 },
  { name: "EMCCD", readNoise: 89, darkCurrent: 0.00011, wellCapacity: 180000, registerWell: 800000, pixelSize: 16, qe: 0.95, frameRate: 56 },
];
const sensorColors = ["text-blue-400", "text-green-400", "text-yellow-400", "text-purple-400"];
const plotColors = ["#60a5fa", "#34d399", "#fbbf24", "#c084fc"];

export default function CcdVsCmosPage() {
  const [photonsRaw, setPhotons] = useURLState("photons", 1000);
  const [exposureRaw, setExposureTime] = useURLState("exposureTime", 1);
  const [emGainRaw, setEmGain] = useURLState("emGain", 300);

  const photons = clamp(photonsRaw, 0, 1e7, 1000);
  const exposureTime = clamp(exposureRaw, 1e-6, 1e4, 1);
  const emGain = clamp(emGainRaw, 1, 1000, 300);

  const evaluate = (s: Sensor, nPhotons: number) => {
    const gain = s.registerWell ? emGain : 1;
    const signal = s.qe * nPhotons;
    const dark = s.darkCurrent * exposureTime;
    const maxSignal = s.registerWell ? emMaxSignal(s.wellCapacity, s.registerWell, gain) : s.wellCapacity;
    const excessNoiseFactorSq = s.registerWell ? emExcessNoiseFactorSq(gain, EM_REGISTER_STAGES) : 1;
    const saturated = signal + dark > maxSignal;
    return {
      signal,
      saturated,
      snr: saturated ? NaN : cameraSnr({ signal, dark, read: s.readNoise, gain, excessNoiseFactorSq }),
      floor: s.readNoise / gain,
      dynamicRange: dynamicRangeDb(maxSignal, s.readNoise / gain),
    };
  };

  const photonAxis = Array.from({ length: 241 }, (_, i) => 10 ** (i / 40));
  const chartData: Record<string, unknown>[] = SENSORS.map((s, idx) => ({
    x: photonAxis, y: photonAxis.map(n => evaluate(s, n).snr), type: "scatter" as const, mode: "lines" as const, name: s.name, line: { color: plotColors[idx] },
  }));
  chartData.push({ x: photonAxis, y: photonAxis.map(Math.sqrt), type: "scatter" as const, mode: "lines" as const, name: "Ideal (QE = 1, shot noise)", line: { color: "#9ca3af", dash: "dash" } });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal (photons/pixel)" value={photonsRaw} onChange={setPhotons} min={0} max={10000000} />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureRaw} onChange={setExposureTime} min={0.000001} max={10000} step="0.1" />
        <ValidatedNumberInput label="EMCCD Gain" value={emGainRaw} onChange={setEmGain} min={1} max={1000} step="10" />
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 border-b border-gray-800"><th className="py-2 text-left">Sensor</th><th className="py-2">Read Noise</th><th className="py-2">Dark</th><th className="py-2">FWC</th><th className="py-2">Pixel</th><th className="py-2">QE</th><th className="py-2">Signal</th><th className="py-2">SNR</th><th className="py-2">DR</th><th className="py-2">FPS</th></tr></thead>
          <tbody>
            {SENSORS.map((sensor, i) => {
              const r = evaluate(sensor, photons);
              return (
                <tr key={sensor.name} className="border-b border-gray-800/50">
                  <td className={`py-2 font-semibold ${sensorColors[i]}`}>{sensor.name}</td>
                  <td className="py-2 text-center">{sensor.registerWell ? `${sensor.readNoise} → ${r.floor.toFixed(3)}` : sensor.readNoise} e⁻</td>
                  <td className="py-2 text-center">{sensor.darkCurrent} e⁻/s</td>
                  <td className="py-2 text-center">{(sensor.wellCapacity / 1000).toFixed(0)}k{sensor.registerWell ? ` (reg. ${(sensor.registerWell / 1000).toFixed(0)}k)` : ""}</td>
                  <td className="py-2 text-center">{sensor.pixelSize} µm</td>
                  <td className="py-2 text-center">{(sensor.qe * 100).toFixed(0)}%</td>
                  <td className="py-2 text-center">{r.signal.toFixed(0)} e⁻</td>
                  <td className={`py-2 text-center font-bold ${sensorColors[i]}`}>{r.saturated ? "saturated" : Number.isFinite(r.snr) ? r.snr.toFixed(1) : "—"}</td>
                  <td className="py-2 text-center">{Number.isFinite(r.dynamicRange) ? r.dynamicRange.toFixed(1) : "—"} dB</td>
                  <td className="py-2 text-center">{sensor.frameRate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>S = QE·N_photons; SNR = S / √(F²·(S + D·t) + (σ_read/G)²)</p>
        <p>CCD, CMOS: G = 1, F² = 1. EMCCD: F² = 2(G − 1)·G^(−(N+1)/N) + 1/G, N = {EM_REGISTER_STAGES}</p>
        <p>DR = 20·log₁₀(S_max / (σ_read/G)); EMCCD S_max = min(pixel well, register well / G)</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Signal (photons/pixel)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151", type: "log" } }} />
    </>
  );
}
