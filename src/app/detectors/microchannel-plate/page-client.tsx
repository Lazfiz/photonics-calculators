"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  channelGain, channelStrikes, channelYieldPerStrike, hexagonalPitch, maximumChannelGain, optimumLdRatio,
  saturatedChannelGain, stackedGain,
} from "../../../physics/detectors/electron-multiplier";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");

// Defaults: A = 0.2 V^−1/2 and V₀ = 1 eV from J. L. Wiza, Nucl. Instrum. Methods 162, 587 (1979), eq. (1)–(2); a
// 10 µm, L/d = 50 chevron at 1 kV per plate; QE 25 % as in the Hamamatsu PMT handbook's worked example.
export default function MicrochannelPlatePage() {
  const [numPlatesRaw, setNumPlates] = useURLState("numPlates", 2);
  const [diameterRaw, setChannelDiameter] = useURLState("channelDiameter", 10); // µm
  const [lengthRaw, setChannelLength] = useURLState("channelLength", 0.5); // mm
  const [oarRaw, setOpenAreaRatio] = useURLState("openAreaRatio", 0.6);
  const [voltageRaw, setAppliedVoltage] = useURLState("appliedVoltage", 1000); // V per plate
  const [aRaw, setYieldConstant] = useURLState("yieldConstant", 0.2); // V^-1/2
  const [v0Raw, setEmissionEnergy] = useURLState("emissionEnergy", 1); // eV
  const [qeRaw, setQe] = useURLState("qe", 0.25);

  const numPlates = Math.round(clamp(numPlatesRaw, 1, 3, 2));
  const diameter_um = clamp(diameterRaw, 2, 100, 10);
  const length_mm = clamp(lengthRaw, 0.05, 5, 0.5);
  const oar = clamp(oarRaw, 0.05, 0.9, 0.6);
  const voltage = clamp(voltageRaw, 200, 2000, 1000);
  const A = clamp(aRaw, 0.05, 1, 0.2);
  const V0 = clamp(v0Raw, 0.1, 10, 1);
  const qe = clamp(qeRaw, 0, 1, 0.25);

  const ld = (length_mm * 1000) / diameter_um;
  const strikes = channelStrikes(voltage, ld, V0);
  const yieldPerStrike = channelYieldPerStrike(voltage, ld, A, V0);
  const plateGain = channelGain(voltage, ld, A, V0);
  const stackGain = stackedGain(plateGain, numPlates);
  const limit = saturatedChannelGain(diameter_um * 1e-6);
  const saturated = !(stackGain <= limit); // an overflowing stack (NaN) is saturated too
  const outOfRange = strikes < 2 || yieldPerStrike > 4 || plateGain < 1;
  const phdNote = numPlates === 1
    ? saturated
      ? "Above the one-channel space-charge limit; ion feedback limits a straight-channel plate to 10³–10⁵ first"
      : "Unsaturated, excess noise factor ≈ 2; ion feedback limits a straight-channel plate to 10³–10⁵"
    : saturated
      ? "Stack product above the one-channel limit: the rear plate begins to saturate. Charge spreads over several rear channels, so Wiza reports (1–4)×10⁷ peak gain and 60–170 % FWHM for chevrons"
      : "Unsaturated, excess noise factor ≈ 2";
  const ldOpt = optimumLdRatio(voltage, A, V0);
  const gainOpt = maximumChannelGain(voltage, A);
  const pitch_um = hexagonalPitch(diameter_um * 1e-6, oar) * 1e6;
  const detection = qe * oar;

  const volts = Array.from({ length: 151 }, (_, i) => 500 + i * 10);
  const single = volts.map((v) => channelGain(v, ld, A, V0));
  const stack = single.map((g) => stackedGain(g, numPlates));
  const chartData = [
    { x: volts, y: single, type: "scatter" as const, mode: "lines" as const, name: "Single plate", line: { color: "#60a5fa" } },
    { x: volts, y: stack, type: "scatter" as const, mode: "lines" as const, name: `${numPlates} plates, unsaturated`, line: { color: "#f87171" } },
    { x: [volts[0], volts[volts.length - 1]], y: [limit, limit], type: "scatter" as const, mode: "lines" as const, name: "One-channel space-charge limit", line: { color: "#fbbf24", dash: "dash" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Plates" value={numPlatesRaw} onChange={setNumPlates} min={1} max={3} step="1" />
        <ValidatedNumberInput label="Channel Diameter (µm)" value={diameterRaw} onChange={setChannelDiameter} min={2} max={100} step="1" />
        <ValidatedNumberInput label="Channel Length (mm)" value={lengthRaw} onChange={setChannelLength} min={0.05} max={5} step="0.05" />
        <ValidatedNumberInput label="Open Area Ratio" value={oarRaw} onChange={setOpenAreaRatio} min={0.05} max={0.9} step="0.01" />
        <ValidatedNumberInput label="Voltage per Plate (V)" value={voltageRaw} onChange={setAppliedVoltage} min={200} max={2000} step="50" />
        <ValidatedNumberInput label="Yield Constant A (V^-1/2), δ = A·√V_c" value={aRaw} onChange={setYieldConstant} min={0.05} max={1} step="0.01" />
        <ValidatedNumberInput label="Secondary Emission Energy V₀ (eV)" value={v0Raw} onChange={setEmissionEnergy} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Photocathode QE" value={qeRaw} onChange={setQe} min={0} max={1} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="L/d Ratio α" value={ld.toFixed(1)} tone="blue" subtext={`${strikes.toFixed(1)} wall strikes, δ = ${yieldPerStrike.toFixed(3)} per strike`} />
        <ResultCard label="Single-Plate Gain" value={fmt(plateGain)} tone={outOfRange ? "orange" : "green"}
          subtext={outOfRange ? "Outside the model's range (fewer than 2 strikes, δ > 4 or G < 1)" : "(A·V/(2α√V₀))^(4V₀α²/V)"} />
        <ResultCard label={`Total Gain, ${numPlates} Plate${numPlates > 1 ? "s" : ""}`} value={fmt(stackGain)} tone={saturated ? "orange" : "green"}
          subtext={saturated ? "Unsaturated product, above the one-channel space-charge limit" : "Below the one-channel space-charge limit"} />
        <ResultCard label="Space-Charge Limit (one channel)" value={fmt(limit)} tone="yellow" subtext="10⁸ × d / 1 mm" />
        <ResultCard label="Optimum L/d at This Voltage" value={ldOpt.toFixed(1)} tone="purple" subtext={`Peak single-plate gain ${fmt(gainOpt)}`} />
        <ResultCard label="Channel Pitch (hexagonal)" value={Number.isFinite(pitch_um) ? `${pitch_um.toFixed(2)} µm` : "—"} tone="cyan" subtext="Sets the resolution of a single plate" />
        <ResultCard label="Detection Efficiency" value={`${(detection * 100).toFixed(1)} %`} tone="gray" subtext="QE × open area (electrons that miss a channel are lost)" />
        <ResultCard label="Pulse-Height Distribution" value={numPlates > 1 && saturated ? "Quasi-Gaussian" : "Near-exponential"} tone="red" subtext={phdNote} />
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>α = L/d; wall strikes n = 4V₀α²/V; yield per strike δ = A·√V_c = A·V/(2α√V₀)</p>
        <p>G<sub>plate</sub> = δ<sup>n</sup> = (A·V/(2α√V₀))^(4V₀α²/V)</p>
        <p>α<sub>opt</sub> = A·V/(2√(e·V₀)), G<sub>max</sub> = exp(A²V/(2e))</p>
        <p>G<sub>sat</sub> ≈ 10⁸ × d/1 mm (space charge at the channel output)</p>
        <p>Pitch p = d·√(π/(2√3·OAR)); η = QE × OAR</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Voltage per Plate (V)", gridcolor: "#374151" },
        yaxis: { title: "Gain", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
