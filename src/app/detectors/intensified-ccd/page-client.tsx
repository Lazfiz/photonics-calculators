"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stackedGain } from "../../../physics/detectors/electron-multiplier";
import { intensifiedSnr, intensifierNoiseFactor, phosphorGain } from "../../../physics/detectors/photoemission";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

// P43 (Gd₂O₂S:Tb): energy efficiency ≈ 0.15, peak 545 nm. P46 (YAG:Ce) gives 95 photons per electron where P43 gives
// 200 (Stanford Computer Optics), so η ≈ 0.15 × 95/200. Decay to 10 %: 1.5 ms and 0.2 µs (same source).
const PHOSPHORS = {
  p43: { label: "P43 (Gd₂O₂S:Tb)", efficiency: 0.15, peak_nm: 545, decay: "1.5 ms to 10 %" },
  p46: { label: "P46 (YAG:Ce)", efficiency: 0.071, peak_nm: 550, decay: "0.2 µs to 10 %" },
} as const;
type Phosphor = keyof typeof PHOSPHORS;
const PHOSPHOR_IDS = Object.keys(PHOSPHORS) as Phosphor[];

// Defaults: 10 photons per pixel, an MCP at 10³ and a fiber taper passing 10 %, so the CCD stays below a 10⁵ e⁻ well.

export default function IntensifiedCCDPage() {
  const [signalRaw, setSignalPhotons] = useURLState("signalPhotons", 10);
  const [qeRaw, setQe] = useURLState("qe", 0.35);
  const [mcpGainRaw, setMcpGain] = useURLState("mcpGain", 1e3);
  const [platesRaw, setPlates] = useURLState("plates", 1);
  const [mcpNoiseRaw, setMcpNoise] = useURLState("mcpNoise", 2);
  const [screenRaw, setScreenVoltage] = useURLState("screenVoltage", 5); // kV
  const [phosphorRaw, setPhosphor] = useURLState("phosphor", "p43");
  const [couplingRaw, setFiberCoupling] = useURLState("fiberCoupling", 0.1);
  const [ccdQeRaw, setCcdQE] = useURLState("ccdQE", 0.5);
  const [readRaw, setCcdReadNoise] = useURLState("ccdReadNoise", 5);
  const [wellRaw, setFullWell] = useURLState("fullWell", 1e5);
  const [bareQeRaw, setBareQe] = useURLState("bareQe", 0.5);
  const [bgRaw, setBackgroundRate] = useURLState("backgroundRate", 1e6); // photons/pixel/s
  const [gateRaw, setGate] = useURLState("gate", 100); // ns

  const signal = clamp(signalRaw, 0, 1e7, 10);
  const qe = clamp(qeRaw, 0, 1, 0.35);
  const mcpGain = clamp(mcpGainRaw, 1, 1e6, 1e3);
  const plates = Math.round(clamp(platesRaw, 1, 2, 1));
  const mcpNoise = clamp(mcpNoiseRaw, 1, 5, 2);
  const screen_kV = clamp(screenRaw, 1, 10, 5);
  const phosphorId: Phosphor = PHOSPHOR_IDS.find((p) => p === phosphorRaw) ?? "p43";
  const coupling = clamp(couplingRaw, 0.01, 1, 0.1);
  const ccdQe = clamp(ccdQeRaw, 0.01, 1, 0.5);
  const read = clamp(readRaw, 0, 100, 5);
  const fullWell = clamp(wellRaw, 1e3, 1e7, 1e5);
  const bareQe = clamp(bareQeRaw, 0, 1, 0.5);
  const bgRate = clamp(bgRaw, 0, 1e12, 1e6);
  const gate_ns = clamp(gateRaw, 1, 1e9, 100);
  const ph = PHOSPHORS[phosphorId];

  const photoelectrons = signal * qe;
  const background = bgRate * gate_ns * 1e-9 * qe;
  const photonsPerElectron = phosphorGain(ph.efficiency, screen_kV * 1e3, ph.peak_nm * 1e-9);
  const transfer = photonsPerElectron * coupling * ccdQe; // CCD e⁻ per MCP output electron
  const gain = stackedGain(mcpGain, plates);
  const ge = gain * transfer;
  const noiseFactor = intensifierNoiseFactor(mcpNoise, ge);
  const snr = intensifiedSnr(photoelectrons, background, ge, noiseFactor, read);
  const output = photoelectrons * ge;
  const saturated = !(output + background * ge <= fullWell);
  const highGainLimit = photoelectrons / Math.sqrt((photoelectrons + background) * mcpNoise);
  const bareSignal = signal * bareQe;
  const bareSnr = bareSignal / Math.sqrt(bareSignal + read ** 2);
  const snrAt = (g: number, bg: number) => intensifiedSnr(photoelectrons, bg, g * transfer, intensifierNoiseFactor(mcpNoise, g * transfer), read);

  const gains = Array.from({ length: 121 }, (_, i) => 10 ** ((i / 20) * plates)); // 1 to 10⁶ per plate
  const gainChart = [
    { x: gains, y: gains.map((g) => snrAt(g, background)), type: "scatter" as const, mode: "lines" as const, name: "ICCD", line: { color: "#34d399" } },
    { x: [gains[0], gains[gains.length - 1]], y: [bareSnr, bareSnr], type: "scatter" as const, mode: "lines" as const, name: "Bare CCD, same photons", line: { color: "#60a5fa", dash: "dash" } },
    { x: [gains[0], gains[gains.length - 1]], y: [highGainLimit, highGainLimit], type: "scatter" as const, mode: "lines" as const, name: "High-gain limit", line: { color: "#fbbf24", dash: "dot" } },
  ];
  const gates = Array.from({ length: 121 }, (_, i) => 10 ** (i / 20)); // 1 ns to 1 ms
  const gateChart = [
    { x: gates, y: gates.map((t) => snrAt(gain, bgRate * t * 1e-9 * qe)), type: "scatter" as const, mode: "lines" as const, name: "SNR (pulse inside the gate)", line: { color: "#f87171" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal (photons/pixel per gate)" value={signalRaw} onChange={setSignalPhotons} min={0} max={1e7} step="1" />
        <ValidatedNumberInput label="Photocathode QE" value={qeRaw} onChange={setQe} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="MCP Gain per Plate" value={mcpGainRaw} onChange={setMcpGain} min={1} max={1e6} />
        <ValidatedNumberInput label="MCP Plates" value={platesRaw} onChange={setPlates} min={1} max={2} step="1" />
        <ValidatedNumberInput label="MCP Noise Factor F" value={mcpNoiseRaw} onChange={setMcpNoise} min={1} max={5} step="0.1" />
        <ValidatedNumberInput label="Screen Voltage (kV)" value={screenRaw} onChange={setScreenVoltage} min={1} max={10} step="0.5" />
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
          <label className="block text-xs text-gray-400" htmlFor="phosphor">Phosphor</label>
          <select id="phosphor" value={phosphorId} onChange={(e) => setPhosphor(e.target.value)} className="mt-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white">
            {PHOSPHOR_IDS.map((k) => <option key={k} value={k}>{PHOSPHORS[k].label}</option>)}
          </select>
        </div>
        <ValidatedNumberInput label="Fiber/Lens Coupling" value={couplingRaw} onChange={setFiberCoupling} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="CCD QE at the Phosphor Peak" value={ccdQeRaw} onChange={setCcdQE} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="CCD Read Noise (e⁻)" value={readRaw} onChange={setCcdReadNoise} min={0} max={100} step="0.5" />
        <ValidatedNumberInput label="CCD Full Well (e⁻)" value={wellRaw} onChange={setFullWell} min={1e3} max={1e7} />
        <ValidatedNumberInput label="Bare CCD QE at the Signal λ" value={bareQeRaw} onChange={setBareQe} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Background (photons/pixel/s)" value={bgRaw} onChange={setBackgroundRate} min={0} max={1e12} />
        <ValidatedNumberInput label="Gate Width (ns)" value={gateRaw} onChange={setGate} min={1} max={1e9} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Photoelectrons" value={fix(photoelectrons)} tone="blue" subtext={`+ ${fmt(background)} background in the gate`} />
        <ResultCard label="Phosphor Gain" value={`${fix(photonsPerElectron, 1)} photons/e⁻`} tone="cyan" subtext={`η·qV/E_ph at ${ph.peak_nm} nm; decay ${ph.decay}`} />
        <ResultCard label="CCD e⁻ per Photoelectron" value={fmt(ge)} tone="green" subtext={`MCP ${fmt(gain)} × ${fix(transfer, 1)} e⁻ per MCP electron`} />
        <ResultCard label="Output Signal" value={`${fmt(output)} e⁻`} tone={saturated ? "orange" : "yellow"} subtext={saturated ? "Signal + background exceed the full well: lower the gain" : "Below the full well, if all of it lands in one pixel"} />
        <ResultCard label="Noise Factor" value={fix(noiseFactor, 4)} tone="gray" subtext="F_MCP + 1/G_e (phosphor and coupling)" />
        <ResultCard label="ICCD SNR" value={fix(snr)} tone="purple" subtext={`High-gain limit N_pe/√((N_pe + N_bg)·F) = ${fix(highGainLimit)}`} />
        <ResultCard label="Bare CCD SNR" value={fix(bareSnr)} tone="orange" subtext="Same photons at the bare QE, no gate, no background" />
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-400 font-mono space-y-1">
        <p>N<sub>pe</sub> = N<sub>ph</sub>·QE<sub>pc</sub>; phosphor g = η·qV/(hc/λ)</p>
        <p>G<sub>e</sub> = G<sub>MCP</sub>·g·η<sub>coupling</sub>·QE<sub>CCD</sub> (CCD e⁻ per photoelectron)</p>
        <p>F = F<sub>MCP</sub> + 1/G<sub>e</sub> (cascade: Poisson phosphor, binomial coupling)</p>
        <p>SNR = N<sub>pe</sub>·G<sub>e</sub> / √((N<sub>pe</sub> + N<sub>bg</sub>)·G<sub>e</sub>²·F + σ<sub>read</sub>²)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={gainChart} layout={{ xaxis: { title: `Total MCP Gain (${plates} plate${plates > 1 ? "s" : ""})`, gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="SNR vs MCP Gain" />
        <ChartPanel data={gateChart} layout={{ xaxis: { title: "Gate Width (ns)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="SNR vs Gate Width" />
      </div>
    </>
  );
}
