"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  fresnelZone, friedParameter, lognormalFadeProbability, rytovVariance, scintillationIndex,
} from "../../../physics/free-space-comms/turbulence";

const presets = [
  { label: "weak", cn2: 1.7e-14 },
  { label: "moderate", cn2: 5e-14 },
  { label: "strong", cn2: 1.7e-13 },
];
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const chartLayout = (xTitle: string, yTitle: string, logY = false) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151" },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151", ...(logY ? { type: "log" } : {}) },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
});

export default function ScintillationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [distance, setDistance] = useURLState("distance", 1); // km
  const [cz, setCz] = useURLState("cz", 1.7e-14); // Cn², m^(−2/3)
  const [apertureDiameter, setApertureDiameter] = useURLState("apertureDiameter", 0.1); // m

  const results = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const L = distance * 1e3;
    const sigmaR2 = rytovVariance(cz, lambda, L);
    const sigmaI2Point = scintillationIndex(sigmaR2, lambda, L);
    const sigmaI2 = scintillationIndex(sigmaR2, lambda, L, apertureDiameter);
    return {
      sigmaR2, sigmaI2Point, sigmaI2,
      apertureFactor: sigmaI2 / sigmaI2Point,
      r0: friedParameter(cz, lambda, L),
      fresnel: fresnelZone(lambda, L),
      fade3: lognormalFadeProbability(10 ** -0.3, sigmaI2),
      fade10: lognormalFadeProbability(0.1, sigmaI2),
    };
  }, [wavelength, distance, cz, apertureDiameter]);

  const fadeData = useMemo(() => {
    const thresholds = Array.from({ length: 61 }, (_, i) => -30 + i * 0.5); // dB below the mean
    // Keep only probabilities a log axis can show (drop the deep tail below 1e-15).
    const curve = (s2: number) => {
      const pts = thresholds.map((t) => ({ x: t, y: lognormalFadeProbability(10 ** (t / 10), s2) })).filter((p) => p.y > 1e-15);
      return { x: pts.map((p) => p.x), y: pts.map((p) => p.y) };
    };
    return [
      { type: "scatter", mode: "lines", ...curve(results.sigmaI2Point), name: "Point receiver", line: { color: "#3b82f6", dash: "dash" } },
      { type: "scatter", mode: "lines", ...curve(results.sigmaI2), name: `D = ${apertureDiameter} m`, line: { color: "#ef4444", width: 2 } },
    ];
  }, [results.sigmaI2Point, results.sigmaI2, apertureDiameter]);

  const distanceData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const dMax = Math.max(3 * distance, 1);
    const ds = Array.from({ length: 100 }, (_, i) => ((i + 1) * dMax) / 100);
    const sr2 = ds.map((d) => rytovVariance(cz, lambda, d * 1e3));
    return [
      { type: "scatter", mode: "lines", x: ds, y: sr2, name: "σ_R² (Rytov)", line: { color: "#9ca3af", dash: "dot" } },
      { type: "scatter", mode: "lines", x: ds, y: ds.map((d, i) => scintillationIndex(sr2[i], lambda, d * 1e3)), name: "σ_I² point", line: { color: "#3b82f6", dash: "dash" } },
      { type: "scatter", mode: "lines", x: ds, y: ds.map((d, i) => scintillationIndex(sr2[i], lambda, d * 1e3, apertureDiameter)), name: `σ_I² D = ${apertureDiameter} m`, line: { color: "#22c55e", width: 2 } },
    ];
  }, [wavelength, distance, cz, apertureDiameter]);

  const regime = results.sigmaR2 < 0.3 ? "Weak" : results.sigmaR2 < 5 ? "Moderate" : "Strong";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        <ValidatedNumberInput label="Link Distance (km)" value={distance} onChange={setDistance} min={0.001} max={1000} step="0.1" />
        <ValidatedNumberInput label="Cn² (m⁻²ᐟ³)" value={cz} onChange={setCz} min={1e-18} max={1e-11} step="any" />
        <ValidatedNumberInput label="Aperture Diameter (m)" value={apertureDiameter} onChange={setApertureDiameter} min={0} max={10} step="any" />
      </div>
      <div role="group" aria-label="Turbulence presets" className="flex gap-2 mb-8">
        {presets.map((p) => (
          <button key={p.label} onClick={() => setCz(p.cn2)}
            className={`px-3 py-1 text-xs rounded border transition ${cz === p.cn2 ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-gray-700 hover:border-blue-500"}`}>
            {p.label} ({p.cn2.toExponential(1)})
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Rytov variance σ_R²" value={fmt(results.sigmaR2)} tone="blue" subtext={`${regime} fluctuations`} />
        <ResultCard label="Scintillation index σ_I² (point)" value={fmt(results.sigmaI2Point)} tone="purple" />
        <ResultCard label={`σ_I² with D = ${apertureDiameter} m`} value={fmt(results.sigmaI2)} tone="green"
          subtext={`aperture averaging factor ${fmt(results.apertureFactor)}`} />
        <ResultCard label="Fresnel zone √(L/k)" value={`${fmt(results.fresnel * 100)} cm`} tone="cyan" subtext="sets the aperture-averaging scale" />
        <ResultCard label="Fried parameter r₀" value={`${fmt(results.r0 * 100)} cm`} tone="gray" subtext="plane wave" />
        <ResultCard label="Fade probability" value={`${fmt(results.fade3)} / ${fmt(results.fade10)}`} tone="orange"
          subtext="P(I < ⟨I⟩ − 3 dB) / P(I < ⟨I⟩ − 10 dB), log-normal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Fade probability (log-normal)</h2>
          <ChartPanel data={fadeData} layout={chartLayout("Fade threshold below the mean (dB)", "P(I < threshold)", true)} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Scintillation vs distance</h2>
          <ChartPanel data={distanceData} layout={chartLayout("Distance (km)", "Variance", true)} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">σ_R² = 1.23 Cn² k^(7/6) L^(11/6),   d² = kD²/(4L)</p>
        <p className="font-mono">
          σ_I²(D) = exp[0.49σ_R²/(1 + 0.65d² + 1.11σ_R^(12/5))^(7/6) + 0.51σ_R²(1 + 0.69σ_R^(12/5))^(−5/6)/(1 + 0.90d² + 0.62d²σ_R^(12/5))] − 1
        </p>
        <p>
          Plane wave, Kolmogorov spectrum with zero inner scale (Andrews &amp; Phillips, <em>Laser Beam Propagation
          through Random Media</em>, 2nd ed., 2005). The expression covers weak to strong fluctuations: σ_I² ≈ σ_R²
          when weak, peaks above 1 in the focusing regime and saturates at 1. A receiver larger than the Fresnel zone
          averages the scintillation down.
        </p>
        <p>
          The fade probabilities assume log-normal irradiance with σ_ln² = ln(1 + σ_I²), P(I &lt; F⟨I⟩) =
          Φ((ln F + σ_ln²/2)/σ_ln). That holds in weak fluctuations; in moderate to strong turbulence the gamma-gamma
          distribution has heavier tails, so these values are optimistic there.
        </p>
      </div>
    </>
  );
}
