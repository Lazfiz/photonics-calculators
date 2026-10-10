"use client";

import Link from "next/link";
import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtEnergy, fmtNum, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { T_MAX, type EyeLimitKind } from "../../../physics/laser-safety/eye-exposure-limits";
import { pulseTrainLimits, type PulseRule, type PulseTrain } from "../../../physics/laser-safety/pulse-train";

const LASERS: readonly [number, string][] = [
  [355, "Nd:YAG ×3"], [532, "Nd:YAG ×2"], [905, "Diode (lidar)"], [1064, "Nd:YAG"], [1550, "Er fiber"],
  [2050, "Ho / Tm"], [10600, "CO₂"],
];

const RULE_NAMES: Record<PulseRule, string> = { 1: "single pulse", 2: "average", 3: "C_P" };

/** Largest energy per pulse (J) of a train in a beam of 1/e² diameter d (m) at λ (m), the limit and the rule that set it. */
function maxPulseEnergy(lambda: number, d: number, train: PulseTrain): { kind: EyeLimitKind; rule: PulseRule; qMax: number } | null {
  const r = pulseTrainLimits(lambda, d, train);
  return r.limiting && r.rule ? { kind: r.limiting, rule: r.rule, qMax: r.qMax } : null;
}

export default function EyeSafeWavelengthPage() {
  const [pulseEnergy, setPulseEnergy] = useURLState("pulseEnergy", 100); // mJ
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 10); // ns
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 5); // mm, 1/e²
  const [prfRaw, setPrf] = useURLState("prf", 10); // Hz, 0 = one pulse
  const [exposureRaw, setExposure] = useURLState("exposureTime", 10); // s

  // ICNIRP 2013 eye limits and repetitive-pulse rules: src/physics/laser-safety/pulse-train.ts. SI inside.
  const Q = Math.max(pulseEnergy, 0) * 1e-3;
  const tau = Math.min(Math.max(pulseWidth, 1e-4), T_MAX * 1e9) * 1e-9;
  const d = Math.max(beamDiam, 0.01) * 1e-3;
  const prf = Math.max(prfRaw, 0);
  const T = Math.min(Math.max(exposureRaw, tau), T_MAX);
  const overlap = prf * tau > 1;
  const train = useMemo(() => ({ duration: tau, prf: overlap ? 0 : prf, exposure: T }), [tau, prf, overlap, T]);
  const single = useMemo(() => ({ duration: tau, prf: 0, exposure: tau }), [tau]);

  const rows = useMemo(() => LASERS.map(([nm, name]) => ({ nm, name, m: maxPulseEnergy(nm * 1e-9, d, train) })), [d, train]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 301 }, (_, i) => 180 * Math.pow(20000 / 180, i / 300));
    const traces: Record<string, unknown>[] = [
      { ...finiteXY(wls, wls.map((nm) => maxPulseEnergy(nm * 1e-9, d, train)?.qMax ?? NaN)), type: "scatter", mode: "lines", name: "Max energy per pulse", line: { color: "#60a5fa" } },
    ];
    if (train.prf > 0) {
      traces.push({ ...finiteXY(wls, wls.map((nm) => maxPulseEnergy(nm * 1e-9, d, single)?.qMax ?? NaN)), type: "scatter", mode: "lines", name: "One pulse", line: { color: "#fbbf24", dash: "dot" } });
    }
    if (Q > 0) traces.push({ x: [180, 20000], y: [Q, Q], type: "scatter", mode: "lines", name: "Your pulse", line: { color: "#f87171", dash: "dash" } });
    return traces;
  }, [d, train, single, Q]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ValidatedNumberInput label="Pulse Energy (mJ)" value={pulseEnergy} onChange={setPulseEnergy} min={0} step="any" />
        <ValidatedNumberInput label="Pulse Width (ns)" value={pulseWidth} onChange={setPulseWidth} min={1e-4} max={3e13} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={beamDiam} onChange={setBeamDiam} min={0.01} step="any" />
        <ValidatedNumberInput label="Repetition rate (Hz, 0 = one pulse)" value={prfRaw} onChange={setPrf} min={0} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureRaw} onChange={setExposure} min={1e-13} max={30000} step="any" />
      </div>
      {overlap ? <p className="text-amber-300 mb-4">The pulses overlap (repetition rate × pulse width above 1), so only one pulse is evaluated.</p> : null}

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-2 pr-4 font-normal">Laser</th>
              <th className="py-2 pr-4 font-normal">λ (nm)</th>
              <th className="py-2 pr-4 font-normal">Limited by</th>
              <th className="py-2 pr-4 font-normal">Max energy per pulse</th>
              <th className="py-2 font-normal">Your pulse / max</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ nm, name, m }) => (
              <tr key={nm} className="border-b border-gray-900">
                <td className="py-2 pr-4">{name}</td>
                <td className="py-2 pr-4">{nm}</td>
                <td className="py-2 pr-4">{m ? `${LIMIT_LABELS[m.kind]} (${RULE_NAMES[m.rule]})` : "—"}</td>
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
        cornea. A train lowers the limit per pulse: ICNIRP&apos;s repetitive-pulse rules hold every group of pulses to the
        limit for the time it spans (the average power) and, on the retina, reduce the single-pulse limit by C_P; the
        &quot;Limited by&quot; column names the rule that binds. Above 1400 nm only the single-pulse and average rules apply,
        so at higher repetition rates the corneal average limit takes over. Limits from ICNIRP 2013 (Health Phys.
        105:271, Tables 3, 5 and 8, repetitive pulses p. 287, with the sub-ns rows) and a round Gaussian beam centred on
        the aperture; the{" "}
        <Link href="/laser-safety/pulsed-mpe" className="underline hover:text-white">pulsed MPE page</Link> shows the rules in detail.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Energy per pulse (J)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Largest energy per pulse of this width, repetition rate and beam within the eye limits, 180 nm to 20 µm; dotted: one pulse.
        </p>
      </div>
    </>
  );
}
