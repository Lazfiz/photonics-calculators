"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { prnuPattern, sensorNoise, shotPrnuCrossover } from "../../../physics/detectors/sensor-noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const db = (snr: number) => (snr > 0 ? 20 * Math.log10(snr) : NaN);

const MAP_SIZE = 80;
const PATTERN = prnuPattern(MAP_SIZE);
const INDEX = Array.from({ length: MAP_SIZE }, (_, i) => i);

export default function UniformityPage() {
  const [signalRaw, setMeanSignal] = useURLState("meanSignal", 50000); // e⁻ above dark
  const [darkRaw, setDarkSignal] = useURLState("darkSignal", 100); // e⁻
  const [prnuRaw, setPrnuPercent] = useURLState("prnuPercent", 1.0); // %
  const [dsnuRaw, setDsnu] = useURLState("dsnu", 2); // e⁻ rms
  const [readRaw, setReadNoise] = useURLState("readNoise", 5); // e⁻ rms

  const meanSignal = clamp(signalRaw, 0, 1e7, 50000);
  const darkSignal = clamp(darkRaw, 0, 1e7, 100);
  const prnu = clamp(prnuRaw, 0, 20, 1) / 100;
  const dsnu = clamp(dsnuRaw, 0, 10000, 2);
  const readNoise = clamp(readRaw, 0, 1000, 5);

  const n = sensorNoise({ signal: meanSignal, dark: darkSignal, read: readNoise, prnu, dsnu });
  const snr = n.total > 0 ? meanSignal / n.total : NaN;
  const snrFlat = n.temporal > 0 ? meanSignal / n.temporal : NaN;
  const crossover = shotPrnuCrossover(prnu);

  // Map of the photo response S·(1 + PRNU·pattern): its spatial rms is PRNU·S by construction.
  const z = PATTERN.map(row => row.map(v => meanSignal * (1 + prnu * v)));
  const values = z.flat();
  const mapMean = values.reduce((s, v) => s + v, 0) / values.length;
  const mapRms = Math.sqrt(values.reduce((s, v) => s + (v - mapMean) ** 2, 0) / (values.length - 1));
  const mapData = [{ x: INDEX, y: INDEX, z, type: "heatmap" as const, colorscale: "Viridis", name: "Signal (e⁻)" }];

  // One frame of a flat field spreads by σ_total; averaging many frames leaves σ_spatial.
  const span = 4 * (n.total > 0 ? n.total : 1);
  const xs = Array.from({ length: 201 }, (_, i) => meanSignal - span + (2 * span * i) / 200);
  const gaussian = (sigma: number) => xs.map(x => (sigma > 0 ? Math.exp(-0.5 * ((x - meanSignal) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)) : NaN));
  const histogramData = [
    { x: xs, y: gaussian(n.total), type: "scatter" as const, mode: "lines" as const, name: "One frame (temporal + spatial)", line: { color: "#60a5fa" } },
    { x: xs, y: gaussian(n.spatial), type: "scatter" as const, mode: "lines" as const, name: "Frame average (spatial only)", line: { color: "#fbbf24" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Mean photo signal (e⁻, above dark)" value={signalRaw} onChange={setMeanSignal} min={0} max={10000000} step="1000" />
        <ValidatedNumberInput label="Dark signal (e⁻)" value={darkRaw} onChange={setDarkSignal} min={0} max={10000000} step="10" />
        <ValidatedNumberInput label="PRNU (% of mean signal)" value={prnuRaw} onChange={setPrnuPercent} min={0} max={20} step="0.1" />
        <ValidatedNumberInput label="DSNU (e⁻ rms)" value={dsnuRaw} onChange={setDsnu} min={0} max={10000} step="0.5" />
        <ValidatedNumberInput label="Read noise (e⁻ rms)" value={readRaw} onChange={setReadNoise} min={0} max={1000} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ResultCard label="Total noise (one frame)" value={`${fix(n.total)} e⁻`} subtext={`SNR ${fix(snr, 1)} (${fix(db(snr), 1)} dB)`} tone="red" />
        <ResultCard label="Spatial noise" value={`${fix(n.spatial)} e⁻`} subtext={`PRNU·S ${fix(n.prnu, 1)} e⁻, DSNU ${fix(n.dsnu, 1)} e⁻`} tone="yellow" />
        <ResultCard label="Temporal noise" value={`${fix(n.temporal)} e⁻`} subtext={`shot √(S + D) ${fix(Math.hypot(n.shot, n.darkShot))} e⁻, read ${fix(n.read, 1)} e⁻`} tone="blue" />
        <ResultCard label="SNR after flat-field correction" value={`${fix(snrFlat, 1)}`} subtext={`${fix(db(snrFlat), 1)} dB: the spatial terms removed`} tone="green" />
        <ResultCard label="Shot = PRNU at" value={Number.isFinite(crossover) ? `${fix(crossover, 0)} e⁻` : "—"} subtext={Number.isFinite(crossover) ? "S = 1/PRNU²; PRNU dominates above" : "no PRNU"} tone="purple" />
        <ResultCard label="Map rms (below)" value={`${fix(mapRms, 1)} e⁻`} subtext="spatial standard deviation of the map = PRNU·S" tone="gray" />
      </div>

      <p className="text-gray-400 text-sm mb-6">
        σ_total² = S + D + σ_read² + DSNU² + (PRNU·S)² (EMVA 1288 Eq. 48). The map shows the photo response only: white
        pixel-to-pixel PRNU plus a shading gradient, scaled to the PRNU you enter.
      </p>

      <ChartPanel data={mapData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "x (pixel)", gridcolor: "#374151" },
        yaxis: { title: "y (pixel)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true
      }} className="w-full mb-6" />

      <ChartPanel data={histogramData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pixel value (e⁻)", gridcolor: "#374151" },
        yaxis: { title: "Probability density (1/e⁻)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
