"use client";

import { useMemo } from "react";
import { fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import { EYE_SITES, multipleWavelengthExposure, type EyeSite } from "../../../physics/laser-safety/multiple-wavelength";

const SITE_LABELS: Record<EyeSite, string> = { retina: "Retina", anteriorEye: "Anterior eye (cornea and lens)" };
const LINE_COLORS = ["#60a5fa", "#34d399", "#f87171", "#fbbf24", "#c084fc", "#f472b6", "#22d3ee", "#a3e635"];

const parseList = (s: string) =>
  s
    .split(/[,;\s]+/)
    .filter((x) => x.trim() !== "")
    .map(Number);

export default function MultipleWavelengthPage() {
  const [wavelengths, setWavelengths] = useURLState("wavelengths", "450, 520, 638, 1550"); // nm
  const [powers, setPowers] = useURLState("powers", "0.4, 0.4, 0.4, 10"); // mW
  const [beamDia, setBeamDia] = useURLState("beamDia", 1); // mm, 1/e², shared by every line
  const [exposure, setExposure] = useURLState("exposure", 0.25); // s

  // ICNIRP 2013 eye limits and its multiple-wavelength rule: src/physics/laser-safety/multiple-wavelength.ts. SI inside.
  const wls = useMemo(() => parseList(wavelengths), [wavelengths]);
  const pws = useMemo(() => parseList(powers), [powers]);
  const d = Math.max(beamDia, 0) * 1e-3;
  const t = Math.min(Math.max(exposure, T_MIN), T_MAX);

  const listError =
    wls.length === 0
      ? "Enter at least one wavelength."
      : wls.length !== pws.length
        ? `${wls.length} wavelengths but ${pws.length} powers: give one power per wavelength.`
        : wls.some((x) => !(x >= 180 && x <= 1e6))
          ? "Every wavelength must lie between 180 nm and 1 mm (1 000 000 nm)."
          : pws.some((x) => !(x >= 0))
            ? "Powers must be numbers ≥ 0."
            : null;

  const result = useMemo(
    () => (listError ? null : multipleWavelengthExposure(wls.map((nm, i) => ({ lambda: nm * 1e-9, P: pws[i] * 1e-3 })), d, t)),
    [listError, wls, pws, d, t],
  );
  const valid = result !== null && !Number.isNaN(result.ratio);
  const exceeds = valid && result.ratio > 1;
  const scale = valid ? Math.max(1.25, result.ratio * 1.05) : 1.25;

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelengths (nm, comma-separated)</span>
          <input
            type="text"
            value={wavelengths}
            onChange={(e) => setWavelengths(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
          />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Powers (mW, same order)</span>
          <input
            type="text"
            value={powers}
            onChange={(e) => setPowers(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
          />
        </label>
        <ValidatedNumberInput label="Beam diameter at the eye, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0} step="any" />
        <div>
          <ValidatedNumberInput label="Exposure time (s)" value={exposure} onChange={setExposure} min={1e-9} max={30000} step="any" />
          <p className="text-xs text-gray-500 mt-2">
            0.25 s (the blink reflex) only protects against visible beams; use 10 s or more when a line is invisible.
          </p>
        </div>
      </div>

      {listError ? <p className="text-amber-300 mb-8">{listError}</p> : null}

      {valid ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {EYE_SITES.map((site) => (
              <ResultCard
                key={site}
                label={`${SITE_LABELS[site]}: sum of shares`}
                value={fmtNum(result.sites[site])}
                tone={result.sites[site] > 1 ? "red" : "green"}
                subtext={result.sites[site] > 1 ? "Exceeds the limits" : "Within the limits"}
              />
            ))}
            <ResultCard
              label="Whole beam"
              value={exceeds ? "Exceeds the limits" : "Within the limits"}
              tone={exceeds ? "red" : "green"}
              subtext={
                exceeds
                  ? `Attenuate every line by ${fmtNum(result.ratio)}× (OD ${Math.log10(result.ratio).toFixed(2)}) at least`
                  : `Largest sum ${fmtNum(result.ratio)}`
              }
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 space-y-4">
            {EYE_SITES.map((site) => (
              <div key={site}>
                <p className="text-sm text-gray-300 mb-1">{SITE_LABELS[site]}</p>
                <div
                  className="relative h-6 rounded bg-gray-950 overflow-hidden flex"
                  role="img"
                  aria-label={`${SITE_LABELS[site]}: the lines' shares add to ${fmtNum(result.sites[site])} of the limit`}
                >
                  {result.lines.map((line, i) =>
                    line.sites[site] > 0 ? (
                      <div
                        key={i}
                        title={`${wls[i]} nm: ${fmtNum(line.sites[site])}`}
                        style={{ width: `${(Math.min(line.sites[site], scale) / scale) * 100}%`, background: LINE_COLORS[i % LINE_COLORS.length] }}
                      />
                    ) : null,
                  )}
                  <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-white" style={{ left: `${(1 / scale) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              {wls.map((nm, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: LINE_COLORS[i % LINE_COLORS.length] }} />
                  {nm} nm
                </span>
              ))}
              <span className="text-gray-300">white dashed line: the limit (sum = 1)</span>
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-2 pr-4 font-normal">λ (nm)</th>
                  <th className="py-2 pr-4 font-normal">Power</th>
                  <th className="py-2 pr-4 font-normal">Limit</th>
                  <th className="py-2 pr-4 font-normal">Largest power alone</th>
                  <th className="py-2 font-normal">Share (P / largest)</th>
                </tr>
              </thead>
              <tbody>
                {result.lines.map((line, i) =>
                  line.limits.map((l, j) => (
                    <tr key={`${i}-${l.kind}`} className={j === line.limits.length - 1 ? "border-b border-gray-800" : ""}>
                      <td className="py-1 pr-4">{j === 0 ? wls[i] : ""}</td>
                      <td className="py-1 pr-4">{j === 0 ? fmtPower(line.P) : ""}</td>
                      <td className="py-1 pr-4">{LIMIT_LABELS[l.kind]}</td>
                      <td className="py-1 pr-4">{l.pMax === Infinity ? "applies from 10 s" : fmtPower(l.pMax)}</td>
                      <td className={`py-1 ${l.share > 1 ? "text-red-400" : ""}`}>{fmtNum(l.share)}</td>
                    </tr>
                  )),
                )}
                <tr className="text-gray-400">
                  <td className="py-2 pr-4" colSpan={2}>Same limit, all lines</td>
                  <td className="py-2" colSpan={3}>
                    {Object.entries(result.limits)
                      .map(([kind, sum]) => `${LIMIT_LABELS[kind as keyof typeof LIMIT_LABELS]}: ${fmtNum(sum)}`)
                      .join(" · ")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          ICNIRP 2013 (Health Phys. 105:271, p. 279): wavelengths absorbed in the same tissue add; wavelengths absorbed in
          different tissues, such as the retina and the cornea, are assessed independently. Each line&apos;s share of a
          limit is its power over the largest power that stays within that limit for every exposure up to t, averaged
          over the limit&apos;s aperture (7 mm for the retina; 1–3.5 mm for the cornea; 3.5 mm for the anterior-segment
          limit at 1150–1400 nm). A line&apos;s share of a tissue is its largest share there (one line&apos;s thermal and
          blue-light retinal limits are met separately); the shares then add over the lines, and each tissue&apos;s sum
          must stay at or below 1.
        </p>
        <p>
          All lines are taken as one co-aligned beam of the diameter above, viewed for the same time. The retinal limits
          are for a point source (the conservative case). Not modelled: skin, pulses and pulse trains.
        </p>
      </div>
    </>
  );
}
