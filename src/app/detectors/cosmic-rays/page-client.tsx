"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MEAN_SEC_ZENITH,
  SI_MEAN_PAIRS_PER_M,
  SI_PAIR_ENERGY,
  hitPixelFraction,
  mostProbableLoss,
  pathLength,
  pixelsPerTrack,
  projectedLength,
} from "../../../physics/detectors/cosmic-rays";
import { poissonQuantile } from "../../../physics/math";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const sci = (x: number) => (Number.isFinite(x) ? (x >= 1e4 ? x.toExponential(2) : x.toFixed(0)) : "—");

export default function CosmicRaysPage() {
  const [areaRaw, setSensorArea] = useURLState("sensorArea", 1); // cm²
  const [exposureRaw, setExposureTime] = useURLState("exposureTime", 1); // s
  const [fluxRaw, setFlux] = useURLState("flux", 1); // cm⁻² min⁻¹
  const [pixelRaw, setPixelSize] = useURLState("pixelSize", 10); // µm
  const [thicknessRaw, setThickness] = useURLState("thickness", 20); // µm sensitive layer
  const [zenithRaw, setZenithAngle] = useURLState("zenithAngle", 30); // degrees
  const [framesRaw, setNumFrames] = useURLState("numFrames", 100);

  const sensorArea = clamp(areaRaw, 0.01, 1000, 1);
  const exposureTime = clamp(exposureRaw, 0.001, 1e5, 1);
  const flux = clamp(fluxRaw, 0, 100, 1);
  const pixelSize = clamp(pixelRaw, 1, 100, 10);
  const thicknessUm = clamp(thicknessRaw, 1, 1000, 20);
  const zenithDeg = clamp(zenithRaw, 0, 85, 30);
  const numFrames = Math.round(clamp(framesRaw, 1, 1e6, 100));

  // SI inside: flux per m² per s, lengths in m.
  const fluxSi = (flux * 1e4) / 60;
  const area = sensorArea * 1e-4;
  const pitch = pixelSize * 1e-6;
  const thickness = thicknessUm * 1e-6;
  const zenith = (zenithDeg * Math.PI) / 180;

  const hits = fluxSi * area * exposureTime;
  const hits99 = poissonQuantile(0.99, hits);
  const path = pathLength(thickness, zenith);
  const meanCharge = path * SI_MEAN_PAIRS_PER_M;
  const mpvCharge = mostProbableLoss(path) / SI_PAIR_ENERGY;
  const projected = projectedLength(thickness, zenith);
  const pixelsHit = pixelsPerTrack(projected, pitch);
  const hitFraction = hitPixelFraction(hits, pixelsHit, area / pitch ** 2);

  const times = Array.from({ length: 201 }, (_, i) => (i / 200) * 10 * exposureTime);
  // 51 quantile points: each call sums Poisson tails, ≈ 15 ms at a mean of 1e9 hits.
  const quantileTimes = Array.from({ length: 51 }, (_, i) => (i / 50) * 10 * exposureTime);
  const hitsChart = [
    { x: times, y: times.map(t => fluxSi * area * t), type: "scatter" as const, mode: "lines" as const, name: "Expected hits", line: { color: "#60a5fa", width: 2 } },
    { x: quantileTimes, y: quantileTimes.map(t => poissonQuantile(0.99, fluxSi * area * t)), type: "scatter" as const, mode: "lines" as const, name: "99th percentile", line: { color: "#f87171", width: 2, dash: "dash" } },
  ];

  const thicknesses = Array.from({ length: 121 }, (_, i) => 10 ** (i / 40)); // 1 to 1000 µm
  const chargeChart = [
    { x: thicknesses, y: thicknesses.map(t => pathLength(t * 1e-6, zenith) * SI_MEAN_PAIRS_PER_M), type: "scatter" as const, mode: "lines" as const, name: "Mean (Bethe, minimum ionizing)", line: { color: "#fbbf24", width: 2 } },
    { x: thicknesses, y: thicknesses.map(t => mostProbableLoss(pathLength(t * 1e-6, zenith)) / SI_PAIR_ENERGY), type: "scatter" as const, mode: "lines" as const, name: "Most probable (Landau–Vavilov–Bichsel)", line: { color: "#34d399", width: 2, dash: "dash" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Sensor area (cm²)" value={areaRaw} onChange={setSensorArea} min={0.01} max={1000} step="0.1" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureRaw} onChange={setExposureTime} min={0.001} max={100000} step="0.1" />
        <ValidatedNumberInput label="Muon flux (cm⁻² min⁻¹)" value={fluxRaw} onChange={setFlux} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Pixel pitch (µm)" value={pixelRaw} onChange={setPixelSize} min={1} max={100} step="1" />
        <ValidatedNumberInput label="Sensitive thickness t (µm)" value={thicknessRaw} onChange={setThickness} min={1} max={1000} step="1" />
        <ValidatedNumberInput label="Zenith angle θ (°)" value={zenithRaw} onChange={setZenithAngle} min={0} max={85} step="5" />
        <ValidatedNumberInput label="Frames" value={framesRaw} onChange={setNumFrames} min={1} max={1000000} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Expected hits per frame" value={hits.toPrecision(3)} subtext={`99th percentile: ${hits99}`} tone="blue" />
        <ResultCard label="Path in the layer" value={`${(path * 1e6).toFixed(1)} µm`} subtext={`t/cos θ; cos²θ average ${(MEAN_SEC_ZENITH * thicknessUm).toFixed(1)} µm`} tone="purple" />
        <ResultCard label="Mean charge per track" value={`${sci(meanCharge)} e⁻`} subtext={`${(SI_MEAN_PAIRS_PER_M * 1e-6).toFixed(1)} e⁻/µm × path`} tone="red" />
        <ResultCard label="Most probable charge" value={`${sci(mpvCharge)} e⁻`} subtext={`${((mpvCharge / meanCharge) * 100).toFixed(0)} % of the mean`} tone="yellow" />
        <ResultCard label="Pixels per track" value={pixelsHit.toFixed(2)} subtext={`1 + 4ℓ/(πp), ℓ = t·tan θ = ${(projected * 1e6).toFixed(1)} µm`} tone="gray" />
        <ResultCard label="Pixels hit per frame" value={(hits * pixelsHit).toPrecision(3)} subtext={`${(hitFraction * 100).toPrecision(3)} % of the pixels: 1 − exp(−N·n/N_pix)`} tone="green" />
        <ResultCard label={`Hits in ${numFrames} frames`} value={(hits * numFrames).toPrecision(3)} tone="blue" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Sea level: about 1 muon cm⁻² min⁻¹ through a horizontal surface, zenith distribution ∝ cos²θ, mean energy ≈ 4 GeV (PDG).</p>
        <p>Hits per frame: Poisson with mean N = Φ·A·t. Path in the layer L = t/cos θ.</p>
        <p>Mean deposit: 3.876 MeV/cm ÷ 3.65 eV per pair = 106 e⁻/µm. The most probable deposit is lower and grows like ln L per µm: 23 000 e⁻ in 300 µm.</p>
      </div>
      <ChartPanel data={hitsChart} layout={{ xaxis: { title: "Exposure time (s)", gridcolor: "#374151" }, yaxis: { title: "Muon hits", gridcolor: "#374151" } }} />
      <h2 className="text-xl font-bold mt-8 mb-4">Charge per track vs thickness at {zenithDeg}°</h2>
      <ChartPanel data={chargeChart} layout={{ xaxis: { title: "Sensitive thickness (µm)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Charge per track (e⁻)", type: "log", gridcolor: "#374151" } }} />
    </>
  );
}
