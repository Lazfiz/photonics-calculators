"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtEnergy, fmtNum, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { eyeLimits, limitMaxPower, T_MAX, T_MIN, type EyeLimitKind } from "../../../physics/laser-safety/eye-exposure-limits";

const LASERS: readonly [number, string][] = [
  [355, "Nd:YAG ×3"], [532, "Nd:YAG ×2"], [905, "Diode (lidar)"], [1064, "Nd:YAG"], [1550, "Er fiber"],
  [2050, "Ho / Tm"], [10600, "CO₂"],
];

/** Largest single-pulse energy (J) of duration τ (s) and 1/e² diameter d (m) at λ (m), and the limit that sets it. */
function maxPulseEnergy(lambda: number, d: number, tau: number): { kind: EyeLimitKind; qMax: number } | null {
  let best: { kind: EyeLimitKind; qMax: number } | null = null;
  for (const l of eyeLimits(lambda)) {
    const qMax = limitMaxPower(l, d, tau) * tau;
    if (!best || qMax < best.qMax) best = { kind: l.kind, qMax };
  }
  return best;
}

export default function EyeSafeWavelengthPage() {
  const [pulseEnergy, setPulseEnergy] = useURLState("pulseEnergy", 100); // mJ
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 10); // ns
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 5); // mm, 1/e²

  // ICNIRP 2013 eye limits for one pulse: src/physics/laser-safety/eye-exposure-limits.ts. SI inside.
  const Q = Math.max(pulseEnergy, 0) * 1e-3;
  const tau = Math.min(Math.max(pulseWidth * 1e-9, T_MIN), T_MAX);
  const d = Math.max(beamDiam, 0.01) * 1e-3;

  const rows = useMemo(() => LASERS.map(([nm, name]) => ({ nm, name, m: maxPulseEnergy(nm * 1e-9, d, tau) })), [d, tau]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 501 }, (_, i) => 180 * Math.pow(20000 / 180, i / 500));
    const traces: Record<string, unknown>[] = [
      { ...finiteXY(wls, wls.map((nm) => maxPulseEnergy(nm * 1e-9, d, tau)?.qMax ?? NaN)), type: "scatter", mode: "lines", name: "Max pulse energy", line: { color: "#60a5fa" } },
    ];
    if (Q > 0) traces.push({ x: [180, 20000], y: [Q, Q], type: "scatter", mode: "lines", name: "Your pulse", line: { color: "#f87171", dash: "dash" } });
    return traces;
  }, [d, tau, Q]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pulse Energy (mJ)" value={pulseEnergy} onChange={setPulseEnergy} min={0} step="any" />
        <ValidatedNumberInput label="Pulse Width (ns)" value={pulseWidth} onChange={setPulseWidth} min={1} max={3e13} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={beamDiam} onChange={setBeamDiam} min={0.01} step="any" />
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-2 pr-4 font-normal">Laser</th>
              <th className="py-2 pr-4 font-normal">λ (nm)</th>
              <th className="py-2 pr-4 font-normal">Limited by</th>
              <th className="py-2 pr-4 font-normal">Max pulse energy</th>
              <th className="py-2 font-normal">Your pulse / max</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ nm, name, m }) => (
              <tr key={nm} className="border-b border-gray-900">
                <td className="py-2 pr-4">{name}</td>
                <td className="py-2 pr-4">{nm}</td>
                <td className="py-2 pr-4">{m ? LIMIT_LABELS[m.kind] : "—"}</td>
                <td className="py-2 pr-4">{m ? fmtEnergy(m.qMax) : "—"}</td>
                <td className={`py-2 ${m && Q / m.qMax > 1 ? "text-red-400" : "text-green-400"}`}>
                  {m ? `${fmtNum(Q / m.qMax)}× ${Q / m.qMax > 1 ? "(exceeds)" : "(within)"}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-400 mb-8">
        Why 1.4–2.6 µm is called &quot;eye-safe&quot;: up to 1400 nm the eye focuses the beam on the retina, so the
        single-pulse limit is a few mJ/m² over the 7 mm pupil (2 mJ/m² × C_A below 5 µs; 20 mJ/m² × C_C from 1050 nm
        below 13 µs). From 1400 nm water in the cornea absorbs the beam, nothing reaches the retina, and the limit is
        the corneal one: 10³ J/m² below 1 ms (10⁴ J/m² at 1.5–1.8 µm), averaged over 1 mm. That is 10⁴–10⁶ times more
        energy for the same beam. &quot;Eye-safe&quot; is relative: a pulse above the corneal limit still burns the
        cornea. Limits from ICNIRP 2013 (Health Phys. 105:271, Tables 3, 5 and 8) for one pulse of 1 ns to 30 000 s
        and a round Gaussian beam centred on the aperture. A pulse train needs the repetitive-pulse rules (average
        power and N^−0.25), which this page does not apply.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Single-pulse energy (J)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Largest energy of one pulse of this width and beam diameter within the eye limits, 180 nm to 20 µm.
        </p>
      </div>
    </>
  );
}
