"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { scoreWavelengths } from "../../../physics/free-space-comms/wavelength-selection";

const COLORS = ["#f43f5e", "#fb923c", "#facc15", "#06b6d4"];
const clamp = (x: number, lo: number, hi: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : lo);
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const fmtPower = (P: number) => (P >= 0.1 ? `${fmt(P)} W` : `${fmt(P * 1e3)} mW`);

export default function WavelengthSelectionPage() {
  const [rangeRaw, setRange] = useURLState("range", 1); // km
  const [visibilityRaw, setVisibility] = useURLState("visibility", 2); // km
  const [eyePriority, setEyePriority] = useURLState("eye", 1);
  const range = clamp(rangeRaw, 0.01, 50);
  const visibility = clamp(visibilityRaw, 0.05, 100);
  const prioritiseEyes = eyePriority !== 0;

  const scores = useMemo(() => {
    const weights = { eyeSafety: prioritiseEyes ? 0.3 : 0.05, atmosphere: 0.35, components: 0.2, cost: 0.15 };
    return scoreWavelengths(range * 1e3, visibility * 1e3, weights).map((s, i) => ({
      ...s, name: `${Math.round(s.lambda * 1e9)} nm`, color: COLORS[i],
    }));
  }, [range, visibility, prioritiseEyes]);
  const ranked = useMemo(() => [...scores].sort((a, b) => b.total - a.total), [scores]);
  const best = ranked[0];

  const plotData = useMemo(() => {
    const categories = ["Eye safety", "Atmosphere", "Components", "Cost"];
    return scores.map((s) => ({
      r: [s.eyeSafety, s.atmosphere, s.components, s.cost, s.eyeSafety],
      theta: [...categories, categories[0]],
      type: "scatterpolar" as const, fill: "toself", name: s.name,
      line: { color: s.color },
    }));
  }, [scores]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Range (km)" value={range} onChange={setRange} min={0.01} max={50} step="0.1" />
        <ValidatedNumberInput label="Visibility (km)" value={visibility} onChange={setVisibility} min={0.05} max={100} step="0.1" />
        <label className="flex items-center gap-2 text-sm text-gray-300 sm:mt-7">
          <input type="checkbox" checked={prioritiseEyes} onChange={(e) => setEyePriority(e.target.checked ? 1 : 0)} className="rounded" />
          Prioritise eye safety
        </label>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-1">Ranking</h3>
          <div className="text-2xl font-bold text-green-400 mb-3">{best && Number.isFinite(best.total) ? best.name : "—"}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400">
                <tr className="text-left">
                  <th className="py-1 pr-3 font-normal">λ</th>
                  <th className="py-1 pr-3 font-normal">Class 1 limit</th>
                  <th className="py-1 pr-3 font-normal">Atm. loss</th>
                  <th className="py-1 font-normal">Score</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((s) => (
                  <tr key={s.name} className={s === best ? "text-green-400 font-semibold" : "text-gray-300"}>
                    <td className="py-1 pr-3">{s.name}</td>
                    <td className="py-1 pr-3">{fmtPower(s.classOneLimit)}</td>
                    <td className="py-1 pr-3">{fmt(s.lossDb)} dB</td>
                    <td className="py-1">{Number.isFinite(s.total) ? `${s.total.toFixed(0)}/100` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={plotData} layout={{
            polar: { radialaxis: { visible: true, range: [0, 100], color: "#9ca3af", gridcolor: "#374151" } },
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            margin: { t: 30, r: 20, b: 20, l: 20 }, font: { color: "#9ca3af", size: 10 },
            legend: { x: 0.5, y: -0.1, orientation: "h", font: { size: 10 } },
            showlegend: true,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">How the scores are made</h3>
        <p>
          <strong>Eye safety</strong>: the IEC 60825-1:2014 Class 1 limit for a CW point source over 100 s, on a log
          scale from 0 (0.1 mW) to 100 (1 W). At 1310 nm the correction C₇ ≈ 259 lifts the retinal limit to about 0.5 W,
          above the 9.6 mW corneal limit at 1550 nm; 850 and 1064 nm reach the retina. A wide FSO beam can carry more power
          than these figures within the same class.
        </p>
        <p>
          <strong>Atmosphere</strong>: 100 − 5 × the link loss in dB, from Rayleigh scattering plus Kim&apos;s visibility
          law (as on the atmospheric-loss calculator).
        </p>
        <p>
          <strong>Components</strong> and <strong>cost</strong> are fixed editorial ratings. The weights are 0.3 for eye
          safety (0.05 when it isn&apos;t prioritised), 0.35 atmosphere, 0.2 components and 0.15 cost; the total is
          divided by their sum.
        </p>
        <p className="text-gray-500">
          A qualitative guide: link margin, receiver sensitivity, background light and turbulence also set the choice.
        </p>
      </div>
    </>
  );
}
