"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtNum, fmtPower, LIMIT_COLORS, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  apertureIrradiance, exposureLimit, eyeLimits, limitingAperture, limitMaxPower, T_MAX, T_MIN,
} from "../../../physics/laser-safety/eye-exposure-limits";

export default function InfraredHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 10600); // nm
  const [power, setPower] = useURLState("power", 10); // W
  const [beamDiameter, setBeamDiameter] = useURLState("beamDiameter", 5); // mm, 1/e²
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // s

  // ICNIRP 2013 eye limits: src/physics/laser-safety/eye-exposure-limits.ts. SI inside.
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0);
  const d = Math.max(beamDiameter, 0) * 1e-3;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);

  const rows = useMemo(
    () =>
      eyeLimits(lambda).map((limit) => {
        const H = exposureLimit(limit, t);
        const D = limitingAperture(limit, t);
        const pMax = limitMaxPower(limit, d, t);
        return { limit, H, D, E: apertureIrradiance(P, d, D), pMax };
      }),
    [lambda, P, d, t],
  );
  const governing = rows.reduce<(typeof rows)[number] | null>((g, r) => (!g || r.pMax < g.pMax ? r : g), null);
  const ratio = governing ? P / governing.pMax : NaN;

  const chartData = useMemo(() => {
    const times = Array.from({ length: 271 }, (_, i) => T_MIN * Math.pow(T_MAX / T_MIN, i / 270));
    const traces: Record<string, unknown>[] = rows.map(({ limit }) => ({
      ...finiteXY(times, times.map((x) => limitMaxPower(limit, d, x))),
      type: "scatter", mode: "lines", name: LIMIT_LABELS[limit.kind], line: { color: LIMIT_COLORS[limit.kind] },
    }));
    if (P > 0) {
      traces.push({ x: [T_MIN, T_MAX], y: [P, P], type: "scatter", mode: "lines", name: "Beam power", line: { color: "#f87171", dash: "dash" } });
    }
    if (governing && Number.isFinite(governing.pMax)) {
      traces.push({ x: [t], y: [governing.pMax], type: "scatter", mode: "markers", name: "t", marker: { color: "#f87171", size: 9 } });
    }
    return traces;
  }, [rows, d, P, t, governing]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={beamDiameter} onChange={setBeamDiameter} min={0.01} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
      </div>

      {governing ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <ResultCard label="Governing limit" value={LIMIT_LABELS[governing.limit.kind]} tone="yellow" />
            <ResultCard label="Max power for this time" value={fmtPower(governing.pMax)} tone="green" />
            <ResultCard label="Power / max power" value={`${fmtNum(ratio)}× ${ratio > 1 ? "(exceeds)" : "(within)"}`} tone={ratio > 1 ? "red" : "green"} />
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-2 pr-4 font-normal">Limit</th>
                  <th className="py-2 pr-4 font-normal">Aperture (mm)</th>
                  <th className="py-2 pr-4 font-normal">H at t (J/m²)</th>
                  <th className="py-2 pr-4 font-normal">H/t (W/m²)</th>
                  <th className="py-2 pr-4 font-normal">Beam over aperture (W/m²)</th>
                  <th className="py-2 font-normal">Max power</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.limit.kind} className="border-b border-gray-900">
                    <td className="py-2 pr-4">{LIMIT_LABELS[r.limit.kind]}</td>
                    <td className="py-2 pr-4">{(r.D * 1e3).toFixed(2)}</td>
                    <td className="py-2 pr-4">{fmtNum(r.H)}</td>
                    <td className="py-2 pr-4">{fmtNum(r.H / t)}</td>
                    <td className="py-2 pr-4">{fmtNum(r.E)}</td>
                    <td className="py-2">{Number.isFinite(r.pMax) ? fmtPower(r.pMax) : "not yet in force"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              The photochemical limit applies from 10 s; before that only the thermal limit does.
            </p>
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Exposure limits for the eye from ICNIRP 2013 (Health Phys. 105:271, Tables 3, 5, 7 and 8) for a point source and
        one exposure of 1 ns to 30 000 s, at every wavelength from 180 nm to 1 mm. In the UV and from 1400 nm the cornea
        absorbs the beam: 1 mm aperture below 0.35 s, growing to 3.5 mm at 10 s (11 mm from 100 µm). From 400 to 1400 nm
        the eye focuses it on the retina, averaged over 7 mm (the pupil), with C_A raising the limit up to 5× in the
        near IR and C_C from 1150 nm, where twice the skin limit also protects the cornea and lens (3.5 mm). The beam is
        a round Gaussian centred on each aperture; the max power is the largest that stays within the limit at every
        duration up to t. A smaller pupil does not raise the limits. Not covered: pulse trains, extended sources, and
        ICNIRP&apos;s advice to use the actual irradiance of beams under 1 mm.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Exposure Time (s)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Max power (W)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Largest power of this beam within each limit, against exposure time. The beam is within the limits up to the
          time its power line meets the lowest curve.
        </p>
      </div>
    </>
  );
}
