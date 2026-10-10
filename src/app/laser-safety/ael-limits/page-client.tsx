"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { AEL_LABELS, fmtEnergy, fmtNum, fmtPower, fmtTime, segmentedLine } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import { aelEnergy, cwClassLimit, type AelClass, type ClassOptions } from "../../../physics/laser-safety/laser-classes";

const CLASSES: { cls: AelClass; name: string; color: string }[] = [
  { cls: "1", name: "Class 1 / 1M", color: "#4ade80" },
  { cls: "2", name: "Class 2 / 2M", color: "#facc15" },
  { cls: "3R", name: "Class 3R", color: "#fb923c" },
  { cls: "3B", name: "Class 3B", color: "#f87171" },
];

export default function AELLimitsPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 633); // nm
  const [emissionDuration, setEmissionDuration] = useURLState("emissionDuration", 1e-8); // s
  const [alphaMrad, setAlphaMrad] = useURLState("alpha", 1.5); // mrad
  const [longTerm, setLongTerm] = useURLState("longTerm", 0); // 1: intended long-term viewing
  const [euA11, setEuA11] = useURLState("euA11", 0); // 1: EN 60825-1 A11 skin AEL

  // SI inside; AELs from src/physics/laser-safety/laser-classes.ts (IEC 60825-1:2014 rebuilt from its limits).
  const lambda = wavelength * 1e-9;
  const t = Math.min(Math.max(emissionDuration, T_MIN), T_MAX);
  const opts: ClassOptions = useMemo(
    () => ({ alpha: Math.min(Math.max(alphaMrad, 0), 100) * 1e-3, longTermViewing: longTerm === 1, euA11: euA11 === 1 }),
    [alphaMrad, longTerm, euA11],
  );
  const inRange = wavelength >= 180 && wavelength <= 1e6;

  const rows = useMemo(
    () => CLASSES.map((c) => ({ ...c, pulse: aelEnergy(c.cls, lambda, t, opts), cw: cwClassLimit(c.cls, lambda, 0, opts) })),
    [lambda, t, opts],
  );

  const chartData = useMemo(() => {
    const ts = Array.from({ length: 241 }, (_, i) => T_MIN * Math.pow(T_MAX / T_MIN, i / 240));
    const traces: Record<string, unknown>[] = CLASSES.flatMap((c) =>
      segmentedLine(ts, ts.map((x) => aelEnergy(c.cls, lambda, x, opts).energy), c.name, { color: c.color }),
    );
    const marks = rows.filter((r) => Number.isFinite(r.pulse.energy));
    if (marks.length) {
      traces.push({ x: marks.map(() => t), y: marks.map((r) => r.pulse.energy), type: "scatter", mode: "markers", name: "t", marker: { color: "#e5e7eb", size: 8 } });
    }
    return traces;
  }, [lambda, t, opts, rows]);

  const selectClass = "mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white";
  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Emission duration (s)" value={emissionDuration} onChange={setEmissionDuration} min={1e-9} max={30000} step="any" />
        <ValidatedNumberInput label="Apparent source α (mrad)" value={alphaMrad} onChange={setAlphaMrad} min={0} max={100} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Time base above 400 nm</span>
          <select value={longTerm} onChange={(e) => setLongTerm(Number(e.target.value))} className={selectClass}>
            <option value={0}>100 s</option>
            <option value={1}>30 000 s (intended long-term viewing)</option>
          </select>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <input type="checkbox" className="mt-1" checked={euA11 === 1} onChange={(e) => setEuA11(e.target.checked ? 1 : 0)} />
          <span className="text-sm text-gray-300">
            EU: EN 60825-1:2014/A11:2021 skin AEL at 1250–1400 nm
          </span>
        </label>
      </div>

      {inRange ? (
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="py-2 pr-4">Class</th>
                <th className="py-2 pr-4">One emission of {fmtTime(t)}</th>
                <th className="py-2 pr-4">CW (power through the stop)</th>
                <th className="py-2">Set by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((r) => (
                <tr key={r.cls}>
                  <td className="py-2 pr-4 font-medium" style={{ color: r.color }}>{r.name}</td>
                  <td className="py-2 pr-4">
                    {Number.isFinite(r.pulse.energy) ? `${fmtEnergy(r.pulse.energy)} through ${fmtNum(r.pulse.stop * 1e3)} mm` : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {Number.isFinite(r.cw.power) ? `${fmtPower(r.cw.power)} (time base ${fmtTime(r.cw.timeBase)})` : "not defined here"}
                  </td>
                  <td className="py-2">{r.cw.limiting ? AEL_LABELS[r.cw.limiting] : "—"}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-4 font-medium text-purple-400">Class 4</td>
                <td className="py-2 pr-4" colSpan={3}>Anything above Class 3B</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-amber-300 mb-8">IEC 60825-1 covers 180 nm to 1 mm.</p>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Emission duration (s)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "AEL (J through the stop)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          AEL of one emission against its duration, 1 ns to 30 000 s, at this wavelength, as energy through the stop
          (log scales). Class 2 exists only at 400–700 nm and Class 3R only from 302.5 nm.
        </p>
      </div>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          An accessible emission limit (AEL) is the most a product may emit through a measurement stop: the eye&apos;s
          exposure limit times the stop&apos;s area for Classes 1, 1M, 2, 2M and 3R, fixed values for 3B. Here they are
          rebuilt from those limits (ICNIRP 2013 from 400 nm; IEC&apos;s own UV values over a 1 mm stop below), so they
          differ from IEC 60825-1:2014&apos;s tables by its rounding to two figures: Class 1 at 633 nm is 0.385 mW here,
          3.9×10⁻⁴ W in the table. Class 2 is the Class 1 AEL below 0.25 s and C₆ × 1 mW from 0.25 s; Class 3R is five
          times Class 1 (Class 2 at 400–700 nm). From 1250 to 1400 nm Classes 1 and 3R are also capped at the Class 3B
          AEL, 0.5 W through 7 mm; the EU amendment A11 adds the skin limit through 1 → 3.5 mm (0.1 W from 0.35 s).
        </p>
        <p>
          For a CW laser the product has to meet each AEL for every emission duration up to its time base: 0.25 s for
          Classes 2, 2M and 3R in the visible, 100 s above 400 nm (30 000 s if long-term viewing is intended), 30 000 s
          in the UV. The CW column is that power with all of the beam inside the stop; a wider beam may emit more (see
          the classification page). Not covered: pulse trains (the N^−0.25 rule and pulse grouping), Class 1C.
        </p>
      </div>
    </>
  );
}
