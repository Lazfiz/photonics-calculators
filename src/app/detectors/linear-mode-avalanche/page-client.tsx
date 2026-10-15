"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, h, q } from "../../../physics/constants";
import { APD_K_TABLE, apdReceiver, excessNoiseFactor, optimumGain } from "../../../physics/detectors/apd";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (Number.isFinite(x) && x > 0 ? x.toExponential(digits) : "—");
const MATERIALS = ["si", "ingaas", "ge", "custom"] as const;
const M_MAX = 1e4;

export default function LinearModeAPDPage() {
  const [gainRaw, setGain] = useURLState("gain", 100);
  const [materialRaw, setMaterial] = useURLState("material", "si");
  const [kRaw, setIonizationRatio] = useURLState("ionizationRatio", 0.02);
  const [qeRaw, setQuantumEff] = useURLState("quantumEff", 0.8);
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 100e6);
  const [darkRaw, setDarkCurrent] = useURLState("darkCurrent", 5e-11);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 800);
  const [powerRaw, setIncidentPower] = useURLState("incidentPower", 1e-9);
  const [loadRaw, setLoadResistance] = useURLState("loadResistance", 1000);
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300);

  const material = MATERIALS.find((m) => m === materialRaw) ?? "si";
  const gain = clamp(gainRaw, 1, M_MAX, 100);
  const k = material === "custom" ? clamp(kRaw, 0, 1, 0.02) : APD_K_TABLE.find((m) => m.id === material)!.k;
  const qe = clamp(qeRaw, 0, 1, 0.8);
  const bandwidth = clamp(bandwidthRaw, 1, 1e11, 100e6);
  const darkCurrent = clamp(darkRaw, 0, 1e-3, 5e-11);
  const wavelength_nm = clamp(wavelengthRaw, 200, 2000, 800);
  const power = clamp(powerRaw, 0, 1, 1e-9);
  const loadResistance = clamp(loadRaw, 1, 1e9, 1000);
  const temperature = clamp(temperatureRaw, 1, 500, 300);

  // Unity-gain responsivity ℛ₀ = η·q·λ/(h·c), A/W.
  const resp = (qe * q * wavelength_nm * 1e-9) / (h * c);
  const receiver = { photocurrent: power * resp, darkCurrent, k, bandwidth, loadResistance, temperature };
  const F = excessNoiseFactor(gain, k);
  const r = apdReceiver(receiver, gain);
  const darkShot = 2 * q * darkCurrent * gain * gain * F * bandwidth;
  const totalNoise = Math.sqrt(r.shot + r.thermal);
  // NEP at the operating gain, from the noise with no light: √(dark shot + thermal)/(M·ℛ₀).
  const nep = Math.sqrt(darkShot + r.thermal) / (gain * resp);
  const mOpt = optimumGain(receiver);
  const mOptShown = Math.min(mOpt, M_MAX);
  const snrOpt = apdReceiver(receiver, mOptShown).snr;
  const dB = (x: number) => (x > 0 ? `${(10 * Math.log10(x)).toFixed(2)} dB` : "—");

  // 300 gains from 1 to 10⁴ on a log grid.
  const gains = Array.from({ length: 300 }, (_, i) => 10 ** ((4 * i) / 299));
  const curves = gains.map((g) => apdReceiver(receiver, g));
  const currentChart = [
    { x: gains, y: curves.map((p) => p.signal), type: "scatter" as const, mode: "lines" as const, name: "Signal M·I_p (A)", line: { color: "#60a5fa", width: 2 } },
    { x: gains, y: curves.map((p) => Math.sqrt(p.shot)), type: "scatter" as const, mode: "lines" as const, name: "Shot noise (A rms)", line: { color: "#f87171", width: 2 } },
    { x: gains, y: curves.map((p) => Math.sqrt(p.thermal)), type: "scatter" as const, mode: "lines" as const, name: "Thermal noise (A rms)", line: { color: "#fbbf24", width: 2, dash: "dash" as const } },
  ];
  const snrMax = Math.max(...curves.map((p) => p.snr).filter(Number.isFinite));
  const snrChart = [
    { x: gains, y: curves.map((p) => p.snr), type: "scatter" as const, mode: "lines" as const, name: "SNR", line: { color: "#34d399", width: 2 } },
    { x: [mOptShown, mOptShown], y: [0, snrMax], type: "scatter" as const, mode: "lines" as const, name: `M_opt = ${mOptShown.toFixed(1)}`, line: { color: "#9ca3af", width: 1, dash: "dot" as const } },
    { x: gains, y: gains.map((g) => excessNoiseFactor(g, k)), type: "scatter" as const, mode: "lines" as const, name: "F(M)", line: { color: "#a78bfa", width: 2, dash: "dash" as const }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Gain M" value={gainRaw} onChange={setGain} min={1} max={M_MAX} step="10" />
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <label htmlFor="material" className="block text-sm text-gray-300 mb-2">Multiplication Material (k)</label>
          <select id="material" value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {APD_K_TABLE.map((m) => (
              <option key={m.id} value={m.id}>{m.label} (k = {m.k})</option>
            ))}
            <option value="custom">Custom k</option>
          </select>
          {material === "custom" && (
            <ValidatedNumberInput label="k" value={kRaw} onChange={setIonizationRatio} min={0} max={1} step="0.01" />
          )}
        </div>
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="10" />
        <ValidatedNumberInput label="Incident Power (W)" value={powerRaw} onChange={setIncidentPower} min={0} max={1} step="1e-12" />
        <ValidatedNumberInput label="Bulk Dark Current, unmultiplied (A)" value={darkRaw} onChange={setDarkCurrent} min={0} max={1e-3} step="1e-11" />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidthRaw} onChange={setBandwidth} min={1} max={1e11} step="1e6" />
        <ValidatedNumberInput label="Load Resistance (Ω)" value={loadRaw} onChange={setLoadResistance} min={1} max={1e9} step="100" />
        <ValidatedNumberInput label="Load Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={1} max={500} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label={`Excess Noise F(M = ${gain})`} value={F.toFixed(3)} tone="purple" />
        <ResultCard label="SNR (electrical)" value={r.snr.toPrecision(4)} tone="green" subtext={dB(r.snr)} />
        <ResultCard label="Optimum Gain M_opt" value={mOpt > M_MAX ? `> ${M_MAX}` : Number.isFinite(mOpt) ? mOpt.toFixed(1) : "—"} tone="yellow" />
        <ResultCard label="SNR at M_opt" value={Number.isFinite(snrOpt) ? snrOpt.toPrecision(4) : "—"} tone="blue" subtext={dB(snrOpt)} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Responsivity ℛ₀ = <span className="text-blue-400 font-mono">{(resp * 1e3).toFixed(2)} mA/W</span> (M = 1)</p>
        <p className="text-gray-300">Primary photocurrent = <span className="text-blue-400 font-mono">{fmt(receiver.photocurrent)} A</span>, multiplied = <span className="text-blue-400 font-mono">{fmt(r.signal)} A</span></p>
        <p className="text-gray-300">Multiplied dark current = <span className="text-blue-400 font-mono">{fmt(darkCurrent * gain)} A</span></p>
        <p className="text-gray-300">Shot noise = <span className="text-blue-400 font-mono">{fmt(Math.sqrt(r.shot))} A</span>, thermal noise = <span className="text-blue-400 font-mono">{fmt(Math.sqrt(r.thermal))} A</span>, total = <span className="text-blue-400 font-mono">{fmt(totalNoise)} A</span> rms</p>
        <p className="text-gray-300">NEP (no light) = <span className="text-yellow-400 font-mono">{fmt(nep)} W</span> = <span className="text-yellow-400 font-mono">{fmt(nep / Math.sqrt(bandwidth))} W/√Hz</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>ℛ₀ = η·q·λ / (h·c),  I_p = ℛ₀·P</p>
        <p>F(M) = k·M + (1 − k)·(2 − 1/M)  [McIntyre 1966]</p>
        <p>σ² = 2q·(I_p + I_d)·M²·F(M)·B + 4k_B·T·B / R</p>
        <p>SNR = (M·I_p)² / σ²  [Personick 1977]</p>
        <p>M_opt: k·M³ + (1 − k)·M = 4k_B·T / [q·R·(I_p + I_d)]</p>
      </div>

      <ChartPanel data={snrChart} layout={{
        xaxis: { title: "Gain M", type: "log", gridcolor: "#374151" },
        yaxis: { title: "SNR (electrical)", gridcolor: "#374151" },
        yaxis2: { title: "F(M)", gridcolor: "#374151", overlaying: "y", side: "right" },
      }} title="SNR and Excess Noise vs Gain" />
      <ChartPanel data={currentChart} layout={{
        xaxis: { title: "Gain M", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Current (A)", type: "log", gridcolor: "#374151" },
      }} title="Signal and Noise Currents vs Gain" />
    </>
  );
}
