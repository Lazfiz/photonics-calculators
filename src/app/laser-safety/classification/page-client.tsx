"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { AEL_LABELS, CLASS_TONES, fmtNum, fmtPower, fmtTime, segmentedLine } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { axisDiameterAt } from "../../../physics/laser-safety/hazard-distance";
import {
  classifyCw, condition1Modelled, condition3Distance, cwClassLimit, type AelClass, type ClassOptions,
} from "../../../physics/laser-safety/laser-classes";

const NAMES: Record<AelClass, string> = { "1": "Class 1 (1M)", "2": "Class 2 (2M)", "3R": "Class 3R", "3B": "Class 3B" };
const COLORS: Record<AelClass, string> = { "1": "#4ade80", "2": "#facc15", "3R": "#fb923c", "3B": "#f87171" };

export default function ClassificationPage() {
  const [power, setPower] = useURLState("power", 10); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 1); // mm, 1/e² at the output (waist)
  const [divergence, setDivergence] = useURLState("divergence", 1); // mrad, 1/e² full angle
  const [alphaMrad, setAlphaMrad] = useURLState("alpha", 1.5); // mrad
  const [longTerm, setLongTerm] = useURLState("longTerm", 0);
  const [telescopes, setTelescopes] = useURLState("telescopes", 1); // 1: Condition 1 applies
  const [euA11, setEuA11] = useURLState("euA11", 0);

  // SI inside; classes from src/physics/laser-safety/laser-classes.ts.
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0) * 1e-3;
  const beam = useMemo(() => ({ d: Math.max(beamDia, 1e-3) * 1e-3, phi: Math.max(divergence, 0) * 1e-3 }), [beamDia, divergence]);
  const opts: ClassOptions & { condition1: boolean } = useMemo(
    () => ({
      alpha: Math.min(Math.max(alphaMrad, 0), 100) * 1e-3,
      longTermViewing: longTerm === 1,
      euA11: euA11 === 1,
      condition1: telescopes === 1,
    }),
    [alphaMrad, longTerm, euA11, telescopes],
  );
  const result = useMemo(() => classifyCw(lambda, P, beam, opts), [lambda, P, beam, opts]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 401 }, (_, i) => 180 * Math.pow(20000 / 180, i / 400));
    const traces: Record<string, unknown>[] = (["1", "2", "3R", "3B"] as const).flatMap((cls) =>
      segmentedLine(
        wls,
        wls.map((nm) => {
          const l = nm * 1e-9;
          return cwClassLimit(cls, l, axisDiameterAt(beam.d, beam.phi, condition3Distance(l), "gaussian"), opts).power;
        }),
        NAMES[cls],
        { color: COLORS[cls] },
      ),
    );
    if (P > 0) traces.push({ x: [wavelength], y: [P], type: "scatter", mode: "markers", name: "This laser", marker: { color: "#e5e7eb", size: 9 } });
    return traces;
  }, [beam, opts, P, wavelength]);

  const selectClass = "mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white";
  const c1Applies = opts.condition1 && condition1Modelled(lambda);
  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="CW power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the output, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Divergence, 1/e² full angle (mrad)" value={divergence} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Apparent source α (mrad)" value={alphaMrad} onChange={setAlphaMrad} min={0} max={100} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Time base above 400 nm</span>
          <select value={longTerm} onChange={(e) => setLongTerm(Number(e.target.value))} className={selectClass}>
            <option value={0}>100 s</option>
            <option value={1}>30 000 s (intended long-term viewing)</option>
          </select>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <input type="checkbox" className="mt-1" checked={telescopes === 1} onChange={(e) => setTelescopes(e.target.checked ? 1 : 0)} />
          <span className="text-sm text-gray-300">
            Telescopes or binoculars foreseeable (apply Condition 1). Untick only for indoor-only products.
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <input type="checkbox" className="mt-1" checked={euA11 === 1} onChange={(e) => setEuA11(e.target.checked ? 1 : 0)} />
          <span className="text-sm text-gray-300">EU: EN 60825-1:2014/A11:2021 skin AEL at 1250–1400 nm</span>
        </label>
      </div>

      {result.laserClass ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard label="Class (IEC 60825-1:2014)" value={`Class ${result.laserClass}`} tone={CLASS_TONES[result.laserClass]} />
            <ResultCard
              label="Beam at the naked-eye stop (Condition 3)"
              value={`${fmtNum(result.diameter3 * 1e3)} mm`}
              subtext={condition3Distance(lambda) > 0 ? "100 mm from the waist" : "at the output"}
              tone="cyan"
            />
            <ResultCard
              label="Beam at the telescope stop (Condition 1)"
              value={result.diameter1 !== null ? `${fmtNum(result.diameter1 * 1e3)} mm` : "not applied"}
              subtext={result.diameter1 !== null ? "50 mm stop, 2 m from the waist" : condition1Modelled(lambda) ? "indoor-only product" : "modelled at 400–1400 nm only"}
              tone="cyan"
            />
          </div>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-left">
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Max CW power, naked eye</th>
                  <th className="py-2 pr-4">Max CW power, telescope</th>
                  <th className="py-2 pr-4">Set by</th>
                  <th className="py-2">Time base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {result.checks.map((c) => (
                  <tr key={c.cls}>
                    <td className="py-2 pr-4 font-medium" style={{ color: COLORS[c.cls] }}>{NAMES[c.cls]}</td>
                    <td className="py-2 pr-4">{Number.isFinite(c.condition3.power) ? fmtPower(c.condition3.power) : "—"}</td>
                    <td className="py-2 pr-4">{c.condition1 && Number.isFinite(c.condition1.power) ? fmtPower(c.condition1.power) : "—"}</td>
                    <td className="py-2 pr-4">{c.condition3.limiting ? AEL_LABELS[c.condition3.limiting] : "not defined here"}</td>
                    <td className="py-2">{fmtTime(c.condition3.timeBase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              Largest power of this beam within each class. 1M or 2M: within Class 1 or 2 for the naked eye but not
              through a telescope{c1Applies ? "" : " (not assessed here)"}, and within Class 3B for both.
            </p>
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-8">IEC 60825-1 covers 180 nm to 1 mm.</p>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Max CW power (W)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Largest CW power of this beam in each class, naked eye (Condition 3), 180 nm to 20 µm; the marker is this
          laser. Class 2 exists at 400–700 nm only, Class 3R from 302.5 nm.
        </p>
      </div>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          The class is the lowest one whose accessible emission limits (AEL) the beam meets. For Classes 1, 1M, 2, 2M
          and 3R the AEL is the eye&apos;s exposure limit times the area of the measurement stop: 7 mm at 400–1400 nm,
          the corneal stop (1 → 3.5 mm) in the infrared, IEC&apos;s 1 mm stop in the UV. Class 2 is C₆ × 1 mW (visible
          only), Class 3R five times Class 1 or 2, Class 3B 0.5 W (less in the UV). Each beam is measured as the power
          inside the stop: naked eye 100 mm from the beam waist (Condition 3), telescope with a 50 mm stop at 2 m
          (Condition 1). From 1250 to 1400 nm IEC caps Classes 1 and 3R at 0.5 W instead of ICNIRP&apos;s anterior-eye
          limit; in the EU the amendment A11 also caps them at the skin limit, about 0.1 W.
        </p>
        <p>
          The AELs are rebuilt from the limits they come from (ICNIRP 2013 from 400 nm), so they differ from the
          standard&apos;s tables by its rounding to two figures (up to 4 %), and a power that close to a class boundary needs the
          tables. Not covered: pulsed and modulated lasers (pulse trains, N^−0.25), scanning beams, Class 1C,
          Condition 1 outside 400–1400 nm, the extended-source field of view. Classification for a product needs the
          full procedure of IEC 60825-1, with measurements.
        </p>
      </div>
    </>
  );
}
