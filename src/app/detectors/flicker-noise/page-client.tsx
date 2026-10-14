"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { q } from "../../../physics/constants";
import { flickerPsd, flickerRms, flickerShotCorner, shotNoiseCurrent } from "../../../physics/detectors/noise";

const fmtE = (x: number, unit: string) => (Number.isFinite(x) ? `${x.toExponential(4)} ${unit}` : "—");
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function FlickerNoisePage() {
  const [kfRaw, setKf] = useURLState("kf", 1e-24);
  const [currentRaw, setCurrent] = useURLState("current", 1e-6);
  const [alphaRaw, setAlpha] = useURLState("alpha", 1);
  const [fLowRaw, setFLow] = useURLState("fLow", 1);
  const [fHighRaw, setFHigh] = useURLState("fHigh", 1e6);
  const kf = clamp(kfRaw, 0, 1, 1e-24);
  const current = clamp(currentRaw, 1e-15, 10, 1e-6);
  const alpha = clamp(alphaRaw, 0.5, 3, 1);
  const fLow = clamp(fLowRaw, 1e-9, 1e12, 1);
  const fHigh = clamp(fHighRaw, 1e-9, 1e12, 1e6);

  const shotPsd = 2 * q * current; // A²/Hz
  const cornerFreq = flickerShotCorner(kf, current, alpha);
  const flickerNoiseRms = flickerRms(kf, current, alpha, fLow, fHigh);
  const shotRms = fHigh > fLow ? shotNoiseCurrent(current, fHigh - fLow) : NaN;
  const totalRms = Math.hypot(flickerNoiseRms, shotRms);

  const chartData = useMemo(() => {
    // Span the band and the corner, at most 16 decades.
    const hi = Math.log10(Math.max(fHigh, fLow) * 10);
    const lo = Math.max(hi - 16, Math.log10(Math.min(fLow, cornerFreq > 0 ? cornerFreq : fLow) / 10));
    const freqs = Array.from({ length: 200 }, (_, i) => 10 ** (lo + ((hi - lo) * i) / 199));
    return [
      { x: freqs, y: freqs.map(f => flickerPsd(kf, current, alpha, f)), type: "scatter" as const, mode: "lines" as const, name: "1/f PSD", line: { color: "#f87171" } },
      { x: freqs, y: freqs.map(() => shotPsd), type: "scatter" as const, mode: "lines" as const, name: "Shot noise 2qI", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [kf, current, alpha, fLow, fHigh, cornerFreq, shotPsd]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="K_f (A^(2−α))" value={kfRaw} onChange={setKf} step="1e-25" min={0} max={1} />
        <ValidatedNumberInput label="Current (A)" value={currentRaw} onChange={setCurrent} step="1e-7" min={1e-15} max={10} />
        <ValidatedNumberInput label="Exponent α" value={alphaRaw} onChange={setAlpha} step="0.1" min={0.5} max={3} />
        <ValidatedNumberInput label="f_low (Hz)" value={fLowRaw} onChange={setFLow} min={1e-9} max={1e12} />
        <ValidatedNumberInput label="f_high (Hz)" value={fHighRaw} onChange={setFHigh} min={1e-9} max={1e12} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="1/f Noise (rms)" value={fmtE(flickerNoiseRms, "A")} tone="blue" />
        <ResultCard label="Shot Noise in Band (rms)" value={fmtE(shotRms, "A")} tone="green" />
        <ResultCard label="Total (rms)" value={fmtE(totalRms, "A")} tone="red" />
        <ResultCard label="1/f–Shot Corner" value={fmtE(cornerFreq, "Hz")} tone="yellow" />
      </div>
      {!(fHigh > fLow) && <p className="text-amber-400 text-sm mb-4">f_high must be above f_low.</p>}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>σ_1/f = √(K_f · I^α · ln(f_high/f_low)) — the same noise in every decade</p>
        <p>f_c = K_f · I^α / (2qI) — where the 1/f density meets the shot noise of I</p>
        <p>σ_shot = √(2qI · (f_high − f_low)), σ_total = √(σ_1/f² + σ_shot²)</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "PSD (A²/Hz)", type: "log", gridcolor: "#374151" } }} />
    </>
  );
}
