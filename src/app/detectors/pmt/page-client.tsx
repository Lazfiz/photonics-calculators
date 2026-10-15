"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { q } from "../../../physics/constants";
import { analogSnr, dynodeExcessNoise, dynodeGain, uniformDynodes } from "../../../physics/detectors/electron-multiplier";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const DELTAS = [2.5, 3.0, 3.5, 4.0, 4.5];
const COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];

// Illustrative defaults: ten equal dynodes at δ = 3.5 (Hamamatsu calls δ ≈ 6 typical at higher interstage voltage),
// QE 25 % as in the handbook's worked example, and 1 nA anode dark current.
export default function PMTPage() {
  const [numDynodesRaw, setNumDynodes] = useURLState("numDynodes", 10);
  const [deltaRaw, setSecondaryEmission] = useURLState("secondaryEmission", 3.5);
  const [qeRaw, setQe] = useURLState("qe", 0.25);
  const [darkCurrentRaw, setDarkCurrent] = useURLState("darkCurrent", 1); // nA at the anode
  const [photonRateRaw, setPhotonRate] = useURLState("photonRate", 1e6); // photons/s
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 100); // MHz

  const numDynodes = Math.round(clamp(numDynodesRaw, 4, 14, 10));
  const delta = clamp(deltaRaw, 1.5, 6, 3.5);
  const qe = clamp(qeRaw, 0.01, 0.5, 0.25);
  const darkCurrent_nA = clamp(darkCurrentRaw, 0, 1e4, 1);
  const photonRate = clamp(photonRateRaw, 0, 1e12, 1e6);
  const bandwidth_MHz = clamp(bandwidthRaw, 1, 1e4, 100);

  const chain = uniformDynodes(delta, numDynodes);
  const gain = dynodeGain(chain);
  const enf = dynodeExcessNoise(chain);
  const signalElectrons = photonRate * qe;
  const signalCurrent = signalElectrons * q * gain;
  const darkElectrons = (darkCurrent_nA * 1e-9) / (q * gain); // anode dark current referred to the cathode
  const snr = analogSnr(signalElectrons, darkElectrons, bandwidth_MHz * 1e6, enf);

  const stages = Array.from({ length: 16 }, (_, j) => j + 1);
  const gainChart = DELTAS.map((d, i) => ({
    x: stages,
    y: stages.map((n) => dynodeGain(uniformDynodes(d, n))),
    type: "scatter" as const, mode: "lines" as const,
    name: `δ=${d}`,
    line: { color: COLORS[i] },
  }));

  // SNR vs δ with the cathode dark emission held at its present value: only F changes with δ.
  const deltaAxis = Array.from({ length: 100 }, (_, i) => 2 + i * 0.03);
  const snrAxis = deltaAxis.map((d) => analogSnr(signalElectrons, darkElectrons, bandwidth_MHz * 1e6, dynodeExcessNoise(uniformDynodes(d, numDynodes))));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Dynodes" value={numDynodesRaw} onChange={setNumDynodes} min={4} max={14} step="1" />
        <ValidatedNumberInput label="Secondary Emission Ratio (δ)" value={deltaRaw} onChange={setSecondaryEmission} min={1.5} max={6} step="0.1" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQe} min={0.01} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Anode Dark Current (nA)" value={darkCurrentRaw} onChange={setDarkCurrent} min={0} max={1e4} step="0.1" />
        <ValidatedNumberInput label="Photon Rate (photons/s)" value={photonRateRaw} onChange={setPhotonRate} min={0} max={1e12} step="1e5" />
        <ValidatedNumberInput label="Bandwidth (MHz)" value={bandwidthRaw} onChange={setBandwidth} min={1} max={1e4} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Gain (δⁿ)" value={fmt(gain)} tone="blue" />
        <ResultCard label="Signal Current" value={`${fmt(signalCurrent)} A`} tone="green" />
        <ResultCard label="Photoelectrons/s" value={fmt(signalElectrons)} tone="yellow" />
        <ResultCard label="Excess Noise Factor F" value={Number.isFinite(enf) ? enf.toFixed(4) : "—"} tone="purple" subtext={`δ/(δ−1) = ${(delta / (delta - 1)).toFixed(4)} for infinitely many stages`} />
        <ResultCard label="Dark Electrons/s at Cathode" value={fmt(darkElectrons)} tone="orange" subtext="Anode dark current / (e·G)" />
        <ResultCard label="SNR" value={Number.isFinite(snr) ? snr.toPrecision(3) : "—"} tone="cyan" subtext={Number.isFinite(snr) ? `${bandwidth_MHz} MHz bandwidth` : "No signal or dark electrons"} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Gain G = δ<sup>n</sup></p>
        <p>I<sub>signal</sub> = R<sub>ph</sub> · QE · e · G</p>
        <p>F = 1 + 1/δ + 1/δ<sup>2</sup> + … + 1/δ<sup>n</sup> → δ/(δ−1) (Poisson secondary emission at every dynode)</p>
        <p>SNR = R<sub>pe</sub> / √(2·B·(R<sub>pe</sub> + R<sub>dark</sub>)·F), with R<sub>dark</sub> = I<sub>dark</sub>/(e·G)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={gainChart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Gain vs Dynode Stages", font: { size: 12 } },
          xaxis: { title: "Dynode Stages", gridcolor: "#374151" },
          yaxis: { title: "Gain", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={[{ x: deltaAxis, y: snrAxis, type: "scatter" as const, mode: "lines" as const,
          name: "SNR", line: { color: "#34d399" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Secondary Emission Ratio", font: { size: 12 } },
          xaxis: { title: "δ (secondary emission)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
      </div>
    </>
  );
}
