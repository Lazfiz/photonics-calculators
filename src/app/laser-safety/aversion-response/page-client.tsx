"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { AVERSION_TIME, aversionLimit } from "../../../physics/laser-safety/aversion-response";

/** IEC 60825-1 Class 2 accessible emission limit, mW (the 0.25 s limit, rounded). */
const CLASS_2_MW = 1;

/** Fixed decimals, or "—" if x is not a number. */
const fmt = (x: number | undefined, digits: number) => (x !== undefined && Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function AversionResponsePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 632); // nm

  // ICNIRP 2013 retinal limit at the blink time: src/physics/laser-safety/aversion-response.ts. SI inside.
  const lambda = wavelength * 1e-9;
  const result = useMemo(() => aversionLimit(lambda), [lambda]);

  // Unit conversions for display only: 1 J/m² = 0.1 mJ/cm², 1 W/m² = 0.1 mW/cm².
  const H_mJcm2 = result ? result.radiantExposure * 0.1 : undefined;
  const E_mWcm2 = result ? result.irradiance * 0.1 : undefined;
  const P_mW = result ? result.maxPower * 1e3 : undefined;
  const aperture_mm = result ? result.aperture * 1e3 : undefined;

  const chartData = useMemo(() => {
    // Exposure time 0.01 – 10 s on a log axis, 12 points per decade.
    const times = Array.from({ length: 37 }, (_, i) => 0.01 * Math.pow(10, i / 12));
    const points = times
      .map((t) => ({ t, p: (aversionLimit(lambda, t)?.maxPower ?? NaN) * 1e3 }))
      .filter((q) => Number.isFinite(q.p) && q.p > 0);
    if (points.length === 0) return null;
    const atAversion = aversionLimit(lambda, AVERSION_TIME);
    const traces: Record<string, unknown>[] = [
      { x: points.map((q) => q.t), y: points.map((q) => q.p), type: "scatter", mode: "lines", name: `Maximum power at ${wavelength} nm`, line: { color: "#60a5fa" } },
      { x: [points[0].t, points[points.length - 1].t], y: [CLASS_2_MW, CLASS_2_MW], type: "scatter", mode: "lines", name: "Class 2 limit (1 mW)", line: { color: "#f87171", dash: "dash" } },
    ];
    if (atAversion) {
      traces.push({ x: [AVERSION_TIME], y: [atAversion.maxPower * 1e3], type: "scatter", mode: "markers", name: "0.25 s", marker: { color: "#facc15", size: 10 } });
    }
    return traces;
  }, [lambda, wavelength]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm, visible 400–700)" value={wavelength} onChange={setWavelength} min={400} max={700} step="any" />
      </div>

      {result === null && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-4 text-sm text-yellow-200">
          No aversion response is assumed outside 400–700 nm: an invisible beam does not make you blink, so the 0.25 s
          limit does not apply to it. Enter a visible wavelength.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Radiant Exposure Limit at t = {AVERSION_TIME} s</p>
          <p className="text-3xl font-bold text-blue-400">{fmt(H_mJcm2, 3)} mJ/cm²</p>
          <p className="text-sm text-gray-500 mt-1">λ = {wavelength} nm, retinal thermal limit</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Irradiance Limit (mW/cm²)</p>
          <p className="text-3xl font-bold text-green-400">{fmt(E_mWcm2, 3)}</p>
          <p className="text-sm text-gray-500 mt-1">Averaged over a {fmt(aperture_mm, 0)} mm aperture</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Maximum Power into a {fmt(aperture_mm, 0)} mm Pupil</p>
          <p className="text-3xl font-bold text-purple-400">{fmt(P_mW, 3)} mW</p>
          <p className="text-sm text-gray-500 mt-1">
            {P_mW !== undefined ? `${fmt((100 * P_mW) / CLASS_2_MW, 1)} % of the Class 2 value` : "Visible only (400–700 nm)"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Class 2 Power Limit (IEC 60825-1)</p>
          <p className="text-3xl font-bold text-amber-400">{CLASS_2_MW.toFixed(1)} mW</p>
          <p className="text-sm text-gray-500 mt-1">Visible only (400–700 nm)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        {chartData ? (
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Exposure Time (s)", type: "log", gridcolor: "#374151" },
            yaxis: { title: "Maximum Power into 7 mm (mW)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
            legend: { x: 0.01, y: 0.01, bgcolor: "rgba(0,0,0,0)" },
          }} />
        ) : (
          <p className="text-sm text-gray-400">Enter a visible wavelength (400–700 nm) to see the chart.</p>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>t<sub>aversion</sub> = 0.25 s (blink reflex, visible light only)</p>
          <p>H = 18 · t<sup>0.75</sup> J/m² (400–700 nm, 5 µs – 10 s; ICNIRP 2013 Table 5, C<sub>A</sub> = 1)</p>
          <p>E = H / t</p>
          <p>P<sub>max</sub> = E · π (D/2)², D = 7 mm</p>
          <p>Class 2 limit: P ≤ 1 mW (IEC 60825-1, relies on the aversion response)</p>
        </div>
        <div className="text-gray-400 text-sm space-y-2 mt-4">
          <p>
            Only visible light (400–700 nm) gets an aversion response. An invisible beam does not make you blink, so
            0.25 s does not apply to it: use the actual exposure duration instead.
          </p>
          <p>
            For the retinal limit the 7 mm aperture applies whatever the beam size: ICNIRP allows no reduction for a beam
            narrower than the pupil, so the beam diameter and divergence do not change the limit. In the visible the
            thermal limit has no wavelength dependence (C<sub>A</sub> = 1), so the curve is the same from 400 to 700 nm up
            to 10 s; the photochemical (blue-light) limit starts at 10 s.
          </p>
        </div>
      </div>
    </>
  );
}
