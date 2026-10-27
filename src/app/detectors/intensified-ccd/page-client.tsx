"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stackedGain } from "../../../physics/detectors/electron-multiplier";
import { gaussianSpotShares, intensifiedSnr, intensifierNoiseFactor, PHOSPHOR_SCREENS, phosphorEfficiency, phosphorGain } from "../../../physics/detectors/photoemission";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

type Phosphor = keyof typeof PHOSPHOR_SCREENS;
const PHOSPHOR_IDS = Object.keys(PHOSPHOR_SCREENS) as Phosphor[];

// Defaults: 10 photons per pixel, an MCP at 10³ and a fiber taper passing 10 %. Andor iStar DH334T (iStar CCD
// specifications): 5 e⁻ read noise at 50 kHz, 100 000 e⁻ pixel well, smallest resolvable FWHM ≈ 2 CCD pixels (note 6).
// Noise factor K_f = 1.6 (amplitude): Dussault & Hoess, Laser Focus World 40(9) (2004), 1.3 < F < 2.2 for ICCD and EMCCD.

export default function IntensifiedCCDPage() {
  const [signalRaw, setSignalPhotons] = useURLState("signalPhotons", 10);
  const [qeRaw, setQe] = useURLState("qe", 0.35);
  const [mcpGainRaw, setMcpGain] = useURLState("mcpGain", 1e3);
  const [platesRaw, setPlates] = useURLState("plates", 1);
  const [kfRaw, setKf] = useURLState("kf", 1.6);
  const [screenRaw, setScreenVoltage] = useURLState("screenVoltage", 5); // kV
  const [phosphorRaw, setPhosphor] = useURLState("phosphor", "p43");
  const [couplingRaw, setFiberCoupling] = useURLState("fiberCoupling", 0.1);
  const [ccdQeRaw, setCcdQE] = useURLState("ccdQE", 0.5);
  const [readRaw, setCcdReadNoise] = useURLState("ccdReadNoise", 5);
  const [wellRaw, setFullWell] = useURLState("fullWell", 1e5);
  const [spotRaw, setSpot] = useURLState("spotFwhm", 2); // CCD pixels
  const [bareQeRaw, setBareQe] = useURLState("bareQe", 0.5);
  const [bgRaw, setBackgroundRate] = useURLState("backgroundRate", 1e6); // photons/pixel/s
  const [gateRaw, setGate] = useURLState("gate", 100); // ns

  const signal = clamp(signalRaw, 0, 1e7, 10);
  const qe = clamp(qeRaw, 0, 1, 0.35);
  const mcpGain = clamp(mcpGainRaw, 1, 1e6, 1e3);
  const plates = Math.round(clamp(platesRaw, 1, 2, 1));
  const kf = clamp(kfRaw, 1, 5, 1.6);
  const mcpNoise = kf ** 2; // variance factor
  const screen_kV = clamp(screenRaw, 3, 10, 5); // the ∝ V phosphor scaling fails near the film's dead voltage
  const phosphorId: Phosphor = PHOSPHOR_IDS.find((p) => p === phosphorRaw) ?? "p43";
  const coupling = clamp(couplingRaw, 0.01, 1, 0.1);
  const ccdQe = clamp(ccdQeRaw, 0.01, 1, 0.5);
  const read = clamp(readRaw, 0, 100, 5);
  const fullWell = clamp(wellRaw, 1e3, 1e7, 1e5);
  const spotFwhm = clamp(spotRaw, 0, 20, 2);
  const bareQe = clamp(bareQeRaw, 0, 1, 0.5);
  const bgRate = clamp(bgRaw, 0, 1e12, 1e6);
  const gate_ns = clamp(gateRaw, 1, 1e9, 100);
  const ph = PHOSPHOR_SCREENS[phosphorId];

  const photoelectrons = signal * qe;
  const background = bgRate * gate_ns * 1e-9 * qe;
  const efficiency = phosphorEfficiency(ph.photonsAt5kV, 5e3, ph.peak);
  const photonsPerElectron = phosphorGain(efficiency, screen_kV * 1e3, ph.peak);
  const transfer = photonsPerElectron * coupling * ccdQe; // CCD e⁻ per MCP output electron
  const gain = stackedGain(mcpGain, plates);
  const ge = gain * transfer;
  const spot = gaussianSpotShares(spotFwhm);
  const noisePixels = 1 / spot.sumSquares;
  const noiseFactor = intensifierNoiseFactor(mcpNoise, ge);
  const snr = intensifiedSnr(photoelectrons, background, ge, mcpNoise, read, spot);
  const output = photoelectrons * ge;
  const evenFieldFull = !(output + background * ge <= fullWell);
  const eventPeak = ge * spot.peak; // mean centre-pixel charge of one photoelectron
  const eventFull = !(eventPeak <= fullWell);
  const highGainLimit = photoelectrons / Math.sqrt((photoelectrons + spot.footprint * background) * mcpNoise);
  const bareSignal = signal * bareQe;
  const bareSnr = bareSignal / Math.sqrt(bareSignal + read ** 2);
  const snrAt = (g: number, bg: number) => intensifiedSnr(photoelectrons, bg, g * transfer, mcpNoise, read, spot);

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
        <ValidatedNumberInput label="Intensifier Noise Factor K_f (SNR_in/SNR_out)" value={kfRaw} onChange={setKf} min={1} max={5} step="0.1" />
        <ValidatedNumberInput label="Screen Voltage (kV)" value={screenRaw} onChange={setScreenVoltage} min={3} max={10} step="0.5" />
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
          <label className="block text-xs text-gray-400" htmlFor="phosphor">Phosphor</label>
          <select id="phosphor" value={phosphorId} onChange={(e) => setPhosphor(e.target.value)} className="mt-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white">
            {PHOSPHOR_IDS.map((k) => <option key={k} value={k}>{PHOSPHOR_SCREENS[k].label}</option>)}
          </select>
        </div>
        <ValidatedNumberInput label="Fiber/Lens Coupling" value={couplingRaw} onChange={setFiberCoupling} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="CCD QE at the Phosphor Peak" value={ccdQeRaw} onChange={setCcdQE} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="CCD Read Noise (e⁻)" value={readRaw} onChange={setCcdReadNoise} min={0} max={100} step="0.5" />
        <ValidatedNumberInput label="CCD Full Well (e⁻)" value={wellRaw} onChange={setFullWell} min={1e3} max={1e7} />
        <ValidatedNumberInput label="Event Spot FWHM on the CCD (pixels)" value={spotRaw} onChange={setSpot} min={0} max={20} step="0.1" />
        <ValidatedNumberInput label="Bare CCD QE at the Signal λ" value={bareQeRaw} onChange={setBareQe} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Background (photons/pixel/s)" value={bgRaw} onChange={setBackgroundRate} min={0} max={1e12} />
        <ValidatedNumberInput label="Gate Width (ns)" value={gateRaw} onChange={setGate} min={1} max={1e9} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Photoelectrons" value={fix(photoelectrons)} tone="blue" subtext={`+ ${fmt(background)} background in the gate`} />
        <ResultCard label="Phosphor Gain" value={`${fix(photonsPerElectron, 1)} photons/e⁻`} tone="cyan" subtext={`${ph.photonsAt5kV} at 5 kV ∝ V (effective η = ${fix(efficiency, 3)} at ${fix(ph.peak * 1e9, 0)} nm); decay ${ph.decay}`} />
        <ResultCard label="CCD e⁻ per Photoelectron" value={fmt(ge)} tone="green" subtext={`MCP ${fmt(gain)} × ${fix(transfer, 1)} e⁻ per MCP electron`} />
        <ResultCard label="Output Signal per Pixel" value={`${fmt(output)} e⁻`} tone={evenFieldFull || eventFull ? "orange" : "yellow"} subtext={evenFieldFull ? "Signal + background exceed the full well in an even field: lower the gain" : eventFull ? `One photoelectron puts ${fmt(eventPeak)} e⁻ in its centre pixel, above the full well: lower the gain` : `Even field. One photoelectron puts ${fmt(eventPeak)} e⁻ (mean; ${fix(spot.peak * 100, 1)} %) in its centre pixel`} />
        <ResultCard label="Noise Factor F" value={fix(noiseFactor, 4)} tone="gray" subtext={`K_f² + 1/G_e (variance; phosphor and coupling)`} />
        <ResultCard label="ICCD SNR per Element" value={fix(snr)} tone="purple" subtext={`Photoelectrons of one pixel area, read through the spot: read noise of N_eff = ${fix(noisePixels, 1)} pixels, background of κ = ${fix(spot.footprint, 2)}. High-gain limit ${fix(highGainLimit)}`} />
        <ResultCard label="Bare CCD SNR" value={fix(bareSnr)} tone="orange" subtext="Same photons at the bare QE, no gate, no background" />
      </div>

      {gain > 1e7 && (
        <p className="mb-6 text-sm text-yellow-400">
          MCP stack gain {fmt(gain)} is above the ≈ 10⁷ chevron saturation level (Wiza 1979); the model doesn&apos;t saturate.
        </p>
      )}

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-400 font-mono space-y-1">
        <p>N<sub>pe</sub> = N<sub>ph</sub>·QE<sub>pc</sub>; phosphor g = η·qV/(hc/λ)</p>
        <p>G<sub>e</sub> = G<sub>MCP</sub>·g·η<sub>coupling</sub>·QE<sub>CCD</sub> (CCD e⁻ per photoelectron)</p>
        <p>F = K<sub>f</sub>² + 1/G<sub>e</sub> (cascade: Poisson phosphor, binomial coupling)</p>
        <p>SNR = N<sub>pe</sub>·G<sub>e</sub> / √(N<sub>pe</sub>·G<sub>e</sub>²·F + κ·N<sub>bg</sub>·G<sub>e</sub>²·K<sub>f</sub>² + N<sub>eff</sub>·σ<sub>read</sub>²), N<sub>eff</sub> = 1/Σh², κ = Σ(h⋆h)²/(Σh²)² (1/G<sub>e</sub> terms weighted by the spot)</p>
        <p>K<sub>f</sub> is a data-sheet value at working gain; the gain chart holds it fixed down to unity gain.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={gainChart} layout={{ xaxis: { title: `Total MCP Gain (${plates} plate${plates > 1 ? "s" : ""})`, gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="SNR vs MCP Gain" />
        <ChartPanel data={gateChart} layout={{ xaxis: { title: "Gate Width (ns)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="SNR vs Gate Width" />
      </div>
    </>
  );
}
