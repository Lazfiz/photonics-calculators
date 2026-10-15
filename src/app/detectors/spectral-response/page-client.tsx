"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { siliconAbsorption } from "../../../physics/materials/silicon-absorption";
import { photodiodeQe } from "../../../physics/detectors/photodiode-qe";
import { quantumEfficiencyFromResponsivity, responsivity } from "../../../physics/detectors/responsivity";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

/** First wavelength (linear interpolation) where y crosses `level`, scanning from index `from` in steps of `dir`. */
function crossing(x: number[], y: number[], from: number, dir: 1 | -1, level: number): number {
  for (let i = from; i + dir >= 0 && i + dir < y.length; i += dir) {
    const a = y[i];
    const b = y[i + dir];
    if (a >= level && b < level) return x[i] + ((a - level) / (a - b)) * (x[i + dir] - x[i]);
  }
  return NaN;
}

export default function SpectralResponsePage() {
  const [WRaw, setW] = useURLState("thickness", 20); // µm
  const [LRaw, setL] = useURLState("diffusionLength", 100); // µm
  const [RRaw, setR] = useURLState("reflectance", 0.05);
  const [measRaw, setMeas] = useURLState("measuredResponsivity", 0.6); // A/W
  const [measWlRaw, setMeasWl] = useURLState("measuredWavelength", 900); // nm
  const W = clamp(WRaw, 0.5, 500, 20);
  const L = clamp(LRaw, 0, 1000, 100);
  const R = clamp(RRaw, 0, 0.5, 0.05);
  const meas = clamp(measRaw, 0, 10, 0.6);
  const measWl = clamp(measWlRaw, 200, 2000, 900);

  const qeAt = (nm: number) =>
    photodiodeQe({ alpha: siliconAbsorption(nm * 1e-9), reflectance: R, depletionWidth: W * 1e-6, diffusionLength: L * 1e-6 });

  const wl = Array.from({ length: 241 }, (_, i) => 250 + i * 5);
  const qe = wl.map(qeAt);
  const resp = wl.map((w, i) => responsivity(qe[i], w * 1e-9));
  const peakIndex = resp.reduce((best, r, i) => (r > resp[best] ? i : best), 0);
  const peak = resp[peakIndex];
  const halfShort = crossing(wl, resp, peakIndex, -1, peak / 2);
  const halfLong = crossing(wl, resp, peakIndex, 1, peak / 2);

  const measQe = quantumEfficiencyFromResponsivity(meas, measWl * 1e-9);
  const impossible = measQe > 1;

  const chartData = [
    { x: wl, y: resp, type: "scatter", mode: "lines", name: "Silicon model ℛ (A/W)", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
    { x: wl, y: wl.map((w) => responsivity(1, w * 1e-9)), type: "scatter", mode: "lines", name: "η = 1 limit (A/W)", line: { color: "#9ca3af", width: 1, dash: "dash" }, yaxis: "y" },
    { x: wl, y: qe.map((v) => v * 100), type: "scatter", mode: "lines", name: "QE (%)", line: { color: "#f87171", width: 2, dash: "dot" }, yaxis: "y2" },
    { x: [measWl], y: [meas], type: "scatter", mode: "markers", name: "Datasheet value", marker: { color: impossible ? "#ef4444" : "#22c55e", size: 9 }, yaxis: "y" },
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Silicon photodiode model</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Depletion width W (µm)" value={WRaw} onChange={setW} min={0.5} max={500} step="1" />
        <ValidatedNumberInput label="Substrate diffusion length L (µm, 0 = none)" value={LRaw} onChange={setL} min={0} max={1000} step="10" />
        <ValidatedNumberInput label="Surface reflectance R" value={RRaw} onChange={setR} min={0} max={0.5} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Peak responsivity" value={`${fmt(peak)} A/W`} tone="blue" subtext={`at ${wl[peakIndex]} nm, QE ${fmt(qe[peakIndex] * 100, 1)}%`} />
        <ResultCard label="Half-response band" value={`${fmt(halfShort, 0)}–${fmt(halfLong, 0)} nm`} tone="green" subtext="ℛ ≥ ℛ_peak/2" />
        <ResultCard label="Responsivity @ 650 nm" value={`${fmt(responsivity(qeAt(650), 650e-9))} A/W`} tone="yellow" subtext={`QE ${fmt(qeAt(650) * 100, 1)}%`} />
      </div>

      <h2 className="text-lg font-semibold mb-3">Check a datasheet value</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Responsivity (A/W)" value={measRaw} onChange={setMeas} min={0} max={10} step="0.01" />
        <ValidatedNumberInput label="at wavelength (nm)" value={measWlRaw} onChange={setMeasWl} min={200} max={2000} step="1" />
        <ResultCard
          label="Implied quantum efficiency"
          value={Number.isFinite(measQe) ? `${(measQe * 100).toFixed(1)}%` : "—"}
          tone={impossible ? "red" : "green"}
          subtext={impossible ? "η > 100%: impossible without internal gain (APD, PMT)" : `η = 1 limit ${fmt(responsivity(1, measWl * 1e-9))} A/W`}
        />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>ℛ(λ) = η(λ)·q·λ/(h·c), η(λ) = (1 − R)·[1 − e^(−α·W)/(1 + α·L)] (Gärtner), α(λ) of silicon at 300 K (Green 2008)</p>
        <p>η = ℛ·h·c/(q·λ): a value above 100% means the datasheet number includes gain or is wrong.</p>
        <p>
          The model has no dead layer or AR-coating spectrum, so it overstates the blue response of most commercial
          photodiodes; the long-wavelength edge follows from silicon&apos;s absorption and the collection depth W + L.
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Responsivity (A/W)", gridcolor: "#374151" },
        yaxis2: { title: "QE (%)", gridcolor: "#374151", overlaying: "y", side: "right", range: [0, 100] },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true,
      }} />
    </>
  );
}
