"use client";

import Link from "next/link";
import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtNum, fmtPower, fmtTime, LIMIT_COLORS, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetySuiteLinks from "../../../components/laser-safety-suite-links";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  exposureLimit, eyeLimits, limitingAperture, limitMaxPower, T_MAX, T_MIN,
} from "../../../physics/laser-safety/eye-exposure-limits";

const wavelengthPresets = [355, 532, 905, 1064, 1550, 10600]; // nm
const exposurePresets = [1e-9, 1e-6, 1e-3, 0.25, 10, 100, 3e4]; // s

const linkClass = "underline hover:text-white";

export default function MPEPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 532); // nm
  const [exposureRaw, setExposure] = useURLState("exposure", 0.25); // s

  // URL values aren't range-checked: clamp the time; outside 180 nm – 1 mm there are no limits and the page says so.
  const exposure = Math.min(Math.max(exposureRaw, T_MIN), T_MAX);
  const lambda = wavelength * 1e-9;

  // ICNIRP 2013 eye limits for a point source: src/physics/laser-safety/eye-exposure-limits.ts. SI inside.
  const limits = useMemo(() => eyeLimits(lambda), [lambda]);
  // The limits in force at t (the photochemical one starts at 10 s).
  const rows = useMemo(
    () =>
      limits
        .map((limit) => {
          const H = exposureLimit(limit, exposure);
          return { limit, D: limitingAperture(limit, exposure), H, pMax: limitMaxPower(limit, 0, exposure) };
        })
        .filter((r) => Number.isFinite(r.H)),
    [limits, exposure],
  );
  // The lowest radiant exposure is the MPE of a beam wider than the apertures; for a narrow beam the apertures differ,
  // so the lowest power decides.
  const mpe = rows.reduce<(typeof rows)[number] | null>((m, r) => (!m || r.H < m.H ? r : m), null);
  const narrow = rows.reduce<(typeof rows)[number] | null>((m, r) => (!m || r.pMax < m.pMax ? r : m), null);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 271 }, (_, i) => T_MIN * Math.pow(T_MAX / T_MIN, i / 270));
    const traces: Record<string, unknown>[] = limits.map((limit) => ({
      ...finiteXY(times, times.map((t) => exposureLimit(limit, t))),
      type: "scatter", mode: "lines", name: LIMIT_LABELS[limit.kind],
      line: { color: LIMIT_COLORS[limit.kind] },
    }));
    if (mpe && mpe.H > 0) {
      traces.push({ x: [exposure], y: [mpe.H], type: "scatter", mode: "markers", name: "MPE at t", marker: { color: "#f87171", size: 10 } });
    }
    return traces;
  }, [limits, mpe, exposure]);

  const presetClass = (active: boolean, tone: string) =>
    `rounded-full border px-3 py-1 text-sm transition ${active ? tone : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`;

  return (
    <>
      <LaserSafetyDisclaimer />

      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button key={preset} type="button" onClick={() => setWavelength(preset)} className={presetClass(wavelength === preset, "border-blue-400 bg-blue-500/15 text-blue-200")}>
            {preset} nm
          </button>
        ))}
        {exposurePresets.map((preset) => (
          <button key={preset} type="button" onClick={() => setExposure(preset)} className={presetClass(exposure === preset, "border-purple-400 bg-purple-500/15 text-purple-200")}>
            {fmtTime(preset)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposure} onChange={setExposure} min={1e-9} max={30000} step="any" />
      </div>

      {mpe && narrow ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <ResultCard label="MPE, radiant exposure" value={`${fmtNum(mpe.H)} J/m²`} tone="blue" subtext={`${fmtNum(mpe.H / 10)} mJ/cm²`} />
            <ResultCard label="MPE, irradiance H/t" value={`${fmtNum(mpe.H / exposure)} W/m²`} tone="yellow" subtext={`${fmtNum(mpe.H / exposure / 10)} mW/cm², for a constant exposure`} />
            <ResultCard label="Lowest limit" value={LIMIT_LABELS[mpe.limit.kind]} tone="red" subtext={`Averaged over ${(mpe.D * 1e3).toFixed(2)} mm`} />
            <ResultCard label="Max power, narrow beam" value={fmtPower(narrow.pMax)} tone="green" subtext={`All of it inside the aperture; ${LIMIT_LABELS[narrow.limit.kind].toLowerCase()}`} />
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-2 pr-4 font-normal">Limit at t</th>
                  <th className="py-2 pr-4 font-normal">Aperture (mm)</th>
                  <th className="py-2 pr-4 font-normal">H (J/m²)</th>
                  <th className="py-2 pr-4 font-normal">H/t (W/m²)</th>
                  <th className="py-2 font-normal">Max power, narrow beam</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.limit.kind} className="border-b border-gray-900">
                    <td className="py-2 pr-4">{LIMIT_LABELS[r.limit.kind]}</td>
                    <td className="py-2 pr-4">{(r.D * 1e3).toFixed(2)}</td>
                    <td className="py-2 pr-4">{fmtNum(r.H)}</td>
                    <td className="py-2 pr-4">{fmtNum(r.H / exposure)}</td>
                    <td className="py-2">{fmtPower(r.pMax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              Every limit listed applies; the photochemical limit starts at 10 s. The max power is for a beam narrower than the aperture and holds for every
              exposure up to t (a limit can step down at a joint, e.g. at 10 s). For a given beam size see{" "}
              <Link href="/laser-safety/exposure-duration" className={linkClass}>exposure duration</Link>.
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <ChartPanel
              data={chartData}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#9ca3af" },
                xaxis: { title: "Exposure time (s)", gridcolor: "#374151", type: "log" },
                yaxis: { title: "Radiant exposure H (J/m²)", gridcolor: "#374151", type: "log" },
                margin: { t: 30, r: 30, b: 50, l: 70 },
                legend: { orientation: "h", y: -0.2 },
              }}
            />
            <p className="text-xs text-gray-500 mt-2">Each limit as a radiant exposure against the exposure time, 1 ns to 30 000 s.</p>
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-6">The eye limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Maximum permissible exposure of the eye from the ICNIRP 2013 limits (Health Phys. 105:271, Tables 3, 5 and 8)
        for a point source (intrabeam viewing of a collimated beam, C_E = 1) and one exposure of duration t: a CW beam
        on for t, or a single pulse. Each limit is a radiant exposure at the cornea, averaged over its aperture: 7 mm for
        the retina, 3.5 mm for the anterior eye, 1 mm growing to 3.5 mm at 10 s in the UV and from 1.4 µm to 100 µm, and
        11 mm beyond. From 400 to 600 nm the thermal and photochemical limits both apply. From 1150 nm C_C raises the
        retinal limit, and towards 1400 nm the anterior-eye limit (twice the skin limit) is the lower one. IEC 60825-1:2014 builds its
        emission limits on the same values, except in the UV (see{" "}
        <Link href="/laser-safety/ansi-iec-comparison" className={linkClass}>MPE vs AEL</Link>). Not covered here: pulse
        trains (<Link href="/laser-safety/pulsed-mpe" className={linkClass}>pulsed MPE</Link>), extended sources (
        <Link href="/laser-safety/extended-source" className={linkClass}>extended source</Link>), the skin (
        <Link href="/laser-safety/skin-mpe" className={linkClass}>skin MPE</Link>), and ICNIRP&apos;s advice to use the
        actual irradiance of beams under 1 mm.
      </p>

      <LaserSafetySuiteLinks currentHref="/laser-safety/mpe" />
    </>
  );
}
