"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { shotNoiseCurrent } from "../../../physics/detectors/noise";

const fmt = (x: number, digits = 5) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function ShotNoisePage() {
  const [photocurrentRaw, setPhotocurrent] = useURLState("photocurrent", 1e-6); // A
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1e6); // Hz
  const photocurrent = clamp(photocurrentRaw, 0, 10, 1e-6);
  const bandwidth = clamp(bandwidthRaw, 1e-3, 1e12, 1e6);

  const chartData = useMemo(() => {
    const currents = Array.from({ length: 200 }, (_, i) => 1e-12 * Math.pow(1e10, i / 199)); // 1 pA to 10 mA
    return [
      { x: currents, y: currents.map(I => shotNoiseCurrent(I, bandwidth)), type: "scatter" as const, mode: "lines" as const, name: "Shot noise current", line: { color: "#f87171" }, yaxis: "y" },
      { x: currents, y: currents.map(I => I / shotNoiseCurrent(I, bandwidth)), type: "scatter" as const, mode: "lines" as const, name: "SNR (amplitude)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [bandwidth]);

  const iShot = shotNoiseCurrent(photocurrent, bandwidth);
  const snrVal = photocurrent / iShot; // = √(I/(2qB)); NaN at I = 0 shows "—"
  const snrPower = snrVal * snrVal;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Photocurrent (A)" value={photocurrentRaw} onChange={setPhotocurrent} step="1e-9" min={0} max={10} />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-3} max={1e12} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Shot noise current √(2qIB) = <span className="text-blue-400 font-mono">{iShot.toExponential(4)} A</span></p>
        <p className="text-gray-300">SNR (amplitude) = <span className="text-blue-400 font-mono">{fmt(snrVal)}</span></p>
        <p className="text-gray-300">SNR (power) I/(2qB) = <span className="text-blue-400 font-mono">{fmt(snrPower)}</span></p>
        <p className="text-sm text-gray-500 mt-2">Shot-noise limit only: thermal and amplifier noise are left out. NEP = noise current / responsivity (see the NEP calculator).</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Photocurrent (A)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise Current (A)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR (amplitude)", type: "log", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
