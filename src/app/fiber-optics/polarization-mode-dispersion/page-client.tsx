"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MEAN_DGD_BIT_FRACTION, MEAN_TO_RMS, dgdExceedanceProbability, dgdPdf, meanDgd, pmdLimitedLength,
} from "../../../physics/fiber-optics/polarization-mode-dispersion";

const PS_SQRT_KM = 1e-12 / Math.sqrt(1e3); // ps/√km → s/√m
const CHART_RATES_GBPS = [2.5, 10, 40, 100];
const MINUTES_PER_YEAR = 365.25 * 24 * 60;

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);

/** Outage time per year for a probability, in readable units. */
function fmtOutage(p: number) {
  const minutes = p * MINUTES_PER_YEAR;
  if (minutes >= 60 * 24) return `${fmt(minutes / 60 / 24)} days/year`;
  if (minutes >= 60) return `${fmt(minutes / 60)} h/year`;
  if (minutes >= 1) return `${fmt(minutes)} min/year`;
  return `${fmt(minutes * 60)} s/year`;
}

export default function PMDPage() {
  const [pmdCoeff, setPmdCoeff] = useURLState("pmdCoeff", 0.5); // ps/√km
  const [length, setLength] = useURLState("length", 100); // km
  const [bitRate, setBitRate] = useURLState("bitRate", 10); // Gb/s
  const [maxToMean, setMaxToMean] = useURLState("maxToMean", 3); // max DGD / mean DGD

  const calc = useMemo(() => {
    const mean = meanDgd(pmdCoeff * PS_SQRT_KM, length * 1e3);
    const bitPeriod = 1 / (bitRate * 1e9);
    const pOut = dgdExceedanceProbability(maxToMean * mean, mean);
    return {
      mean_ps: mean * 1e12,
      rms_ps: (mean / MEAN_TO_RMS) * 1e12,
      meanOverT: mean / bitPeriod,
      maxDgd_ps: maxToMean * mean * 1e12,
      maxOverT: (maxToMean * mean) / bitPeriod,
      pOut,
      maxLength_km: pmdLimitedLength(pmdCoeff * PS_SQRT_KM, bitRate * 1e9) / 1e3,
    };
  }, [pmdCoeff, length, bitRate, maxToMean]);

  const distributionData = useMemo(() => {
    const mean = calc.mean_ps;
    const xMax = Math.max(5, maxToMean + 0.5) * mean;
    const x = Array.from({ length: 201 }, (_, i) => (i * xMax) / 200);
    // dgdPdf is scale-free: in ps in, 1/ps out.
    const pdf = x.map((xi) => dgdPdf(xi, mean));
    const peak = Math.max(...pdf);
    return [
      { x, y: pdf, type: "scatter", mode: "lines", name: "Maxwellian PDF", line: { color: "#60a5fa", width: 2 } },
      { x: [mean, mean], y: [0, peak], type: "scatter", mode: "lines", name: "Mean DGD", line: { color: "#fbbf24", width: 1.5, dash: "dash" } },
      { x: [calc.maxDgd_ps, calc.maxDgd_ps], y: [0, peak], type: "scatter", mode: "lines", name: `${maxToMean} × mean`, line: { color: "#f87171", width: 1.5, dash: "dash" } },
    ];
  }, [calc.mean_ps, calc.maxDgd_ps, maxToMean]);

  const distanceData = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);
    const traces: Record<string, unknown>[] = CHART_RATES_GBPS.map((rate) => ({
      x: distances,
      y: distances.map((d) => meanDgd(pmdCoeff * PS_SQRT_KM, d * 1e3) * rate * 1e9),
      type: "scatter", mode: "lines", name: `${rate} Gb/s`, line: { width: 1.5 },
    }));
    traces.push({
      x: [distances[0], distances[distances.length - 1]], y: [MEAN_DGD_BIT_FRACTION, MEAN_DGD_BIT_FRACTION],
      type: "scatter", mode: "lines", name: "0.1 rule", line: { color: "#f87171", width: 1, dash: "dash" },
    });
    return traces;
  }, [pmdCoeff]);

  const withinRule = calc.meanOverT <= MEAN_DGD_BIT_FRACTION;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="PMD coefficient (ps/√km)" value={pmdCoeff} onChange={setPmdCoeff} min={0.001} max={10} step="0.01" />
        <ValidatedNumberInput label="Link length (km)" value={length} onChange={setLength} min={0.1} max={50000} />
        <ValidatedNumberInput label="Bit rate (Gb/s)" value={bitRate} onChange={setBitRate} min={0.1} max={1000} step="0.1" />
        <ValidatedNumberInput label="Design max DGD (× mean)" value={maxToMean} onChange={setMaxToMean} min={1} max={8} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Mean DGD (PMD value)" value={`${fmt(calc.mean_ps)} ps`} tone="blue" subtext="⟨Δτ⟩ = PMD · √L" />
        <ResultCard label="RMS DGD" value={`${fmt(calc.rms_ps)} ps`} tone="purple" subtext="⟨Δτ²⟩^½ = ⟨Δτ⟩ / 0.921" />
        <ResultCard
          label="Mean DGD / bit period"
          value={fmt(calc.meanOverT)}
          tone={withinRule ? "green" : "red"}
          subtext={withinRule ? "within the ≤ 0.1 rule of thumb" : "exceeds the ≤ 0.1 rule of thumb"}
        />
        <ResultCard label="PMD-limited length" value={`${fmt(calc.maxLength_km)} km`} tone="yellow" subtext={`mean DGD ≤ 0.1 bit period at ${bitRate} Gb/s`} />
        <ResultCard
          label={`Max DGD (${maxToMean} × mean)`}
          value={`${fmt(calc.maxDgd_ps)} ps`}
          tone="orange"
          subtext={`${fmt(calc.maxOverT)} bit periods`}
        />
        <ResultCard
          label="Probability DGD exceeds it"
          value={fmt(calc.pOut)}
          tone="gray"
          subtext={`≈ ${fmtOutage(calc.pOut)}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">DGD Distribution (Maxwellian)</h3>
          <ChartPanel data={distributionData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "DGD (ps)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "Probability density (1/ps)", color: "#9ca3af", gridcolor: "#374151" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
            legend: { x: 0.6, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Mean DGD / Bit Period vs Distance</h3>
          <ChartPanel data={distanceData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "Mean DGD / bit period", color: "#9ca3af", gridcolor: "#374151" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
            legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">⟨Δτ⟩ = PMD·√L,   f(Δτ) = √(2/π) Δτ²/σ³ · exp(−Δτ²/2σ²),   σ = ⟨Δτ⟩√(π/8)</p>
          <p className="font-mono">P(DGD &gt; Δτ) = erfc(u/√2) + √(2/π) u e^(−u²/2),   u = Δτ/σ</p>
          <p>
            The PMD coefficient is the mean DGD per √length (ITU-T G.650.2). In a long, randomly coupled fibre the
            instantaneous DGD is Maxwellian (Poole 1988), with ⟨Δτ⟩ ≈ 0.921 × the rms DGD; it exceeds 3⟨Δτ⟩ with
            probability 4.2 × 10⁻⁵, about 22 minutes a year.
          </p>
          <p>
            Rule of thumb, not a standard: keep ⟨Δτ⟩ ≤ 0.1 bit period, so the DGD stays below 0.3 bit period except for
            that fraction of the time. For multilevel formats use the symbol period; coherent receivers compensate
            first-order PMD digitally. Not modelled: second-order PMD, component PMD and the penalty itself.
            Modern G.652.D cable specifies PMD<sub>Q</sub> ≤ 0.2 ps/√km; old fibre can exceed 1 ps/√km.
          </p>
        </div>
      </div>
    </>
  );
}
