"use client";

import { useCallback, useMemo } from "react";
import { fmtDistance, fmtEnergy, fmtNum, fmtPower, fmtTime, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import HazardRatioChart from "../../../components/hazard-ratio-chart";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import PulseTrainTable from "../../../components/pulse-train-table";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { effectiveDiameterAt } from "../../../physics/laser-safety/hazard-distance";
import { lidarSafety } from "../../../physics/laser-safety/lidar-safety";
import { pulseTrainLimits } from "../../../physics/laser-safety/pulse-train";
import { scannedPulseLimits, type ScannedPulseLevel } from "../../../physics/laser-safety/scanned-pulse-train";

const RULE_NAMES = { 1: "single pulse", 2: "average power", 3: "C_P × single pulse" } as const;
const LEVEL_NAMES: Record<ScannedPulseLevel, string> = {
  pulse: "pulses within a pass",
  pass: "passes",
  reduced: "C_P over all passes",
  stationary: "no stricter than a stationary beam",
};
const presets: readonly [number, string][] = [[905, "905 nm diode"], [1550, "1550 nm fibre"]];
const selectClass = "mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white";
const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition ${on ? "border-red-400 bg-red-500/15 text-red-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`;

export default function LidarSafetyPage() {
  const [pulseEnergyRaw, setPulseEnergy] = useURLState("pulseEnergy", 10, { min: 0 }); // µJ
  const [repRateRaw, setRepRate] = useURLState("repRate", 200, { min: 0 }); // kHz
  const [pulseWidthRaw, setPulseWidth] = useURLState("pulseWidth", 5, { min: 1e-4 }); // ns
  const [wavelength, setWavelength] = useURLState("wavelength", 905, { min: 180, max: 1000000 }); // nm
  const [beamDiaRaw, setBeamDia] = useURLState("beamDia", 3, { min: 0.001 }); // mm, 1/e²
  const [divergenceRaw, setDivergence] = useURLState("divergence", 3, { min: 0 }); // mrad, 1/e² full angle
  const [rangeRaw, setRange] = useURLState("scanRange", 10, { min: 0 }); // m, where the eye is
  const [exposureRaw, setExposure] = useURLState("exposureTime", 10, { min: 1e-13, max: 30000 }); // s
  const [mode, setMode] = useURLState("mode", "stationary");
  const [scanAngleRaw, setScanAngle] = useURLState("scanAngle", 360, { min: 0.01, max: 360 }); // °, full angle
  const [scanRateRaw, setScanRate] = useURLState("scanRate", 10, { min: 0.001 }); // Hz
  const [direction, setDirection] = useURLState("scanDirection", "one");

  // URL values aren't range-checked: lidarSafety clamps them. SI inside; physics in
  // src/physics/laser-safety/lidar-safety.ts (dispatch), pulse-train.ts and scanned-pulse-train.ts.
  const lambda = wavelength * 1e-9;
  const scanned = mode === "scanned";
  const both = direction === "both";
  const lid = useMemo(
    () =>
      lidarSafety({
        lambda,
        pulseEnergy: pulseEnergyRaw * 1e-6,
        prf: repRateRaw * 1e3,
        pulseDuration: pulseWidthRaw * 1e-9,
        beamDiameter: beamDiaRaw * 1e-3,
        divergence: divergenceRaw * 1e-3,
        range: rangeRaw,
        exposure: exposureRaw,
        scanned,
        scanAngle: (scanAngleRaw * Math.PI) / 180,
        scanRate: scanRateRaw,
        bothDirections: both,
      }),
    [lambda, pulseEnergyRaw, repRateRaw, pulseWidthRaw, beamDiaRaw, divergenceRaw, rangeRaw, exposureRaw, scanned, scanAngleRaw, scanRateRaw, both],
  );
  const { Q, prf, tau, T, d, range, overlap, beam, train, pulses, scanAt, dEye, atEye, covered, ratioOut, nohd, nohdFinite } = lid;
  const { scanOn, scanEye, rSearch, nohdScan, nohdScanFinite, ratioEye, binding } = lid;
  const scanEyeOk = scanEye !== null && scanEye.status === "ok";

  const ratios = useCallback(
    (r: number) => {
      const dr = effectiveDiameterAt(beam, r);
      if (scanOn && r > 0) {
        const s = scannedPulseLimits(lambda, dr, pulses, scanAt(r));
        if (s.status === "ok") return s.limits.map((l) => ({ kind: l.kind, ratio: Q / l.qMax }));
      }
      return pulseTrainLimits(lambda, dr, train).limits.map((l) => ({ kind: l.kind, ratio: Q / l.qMax }));
    },
    [lambda, beam, train, Q, scanOn, pulses, scanAt],
  );
  const shown = scanOn ? nohdScan : nohd;
  const shownFinite = scanOn ? nohdScanFinite : nohdFinite;
  const rMin0 = shownFinite ? Math.max(shown * 1e-3, 0.01) : 0.01;
  const rMin = range > 0 ? Math.min(rMin0, range / 3) : rMin0;
  const rMax0 = nohdFinite ? Math.max(nohd * 10, rMin0 * 10) : 1000;
  const rMax = Math.max(rMax0, range * 3, 1);
  const markers = useMemo(() => {
    const m: { r: number; y?: number; label: string }[] = [];
    if (scanOn && nohdScanFinite) m.push({ r: nohdScan, label: "NOHD (scanned)" });
    if (nohdFinite) m.push({ r: nohd, label: scanOn ? "NOHD (stationary)" : "NOHD" });
    if (range > 0 && Number.isFinite(ratioEye) && ratioEye > 0) m.push({ r: range, y: ratioEye, label: "Viewing distance" });
    return m;
  }, [scanOn, nohdScanFinite, nohdScan, nohdFinite, nohd, range, ratioEye]);

  const nohdText = (r: number) => (r === Infinity ? "∞ (the beam doesn't spread)" : r === 0 ? "0 — within at the window" : fmtDistance(r));

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map(([nm, name]) => (
          <button key={nm} type="button" onClick={() => setWavelength(nm)} className={chip(wavelength === nm)}>
            {name}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Pulse energy (µJ)" value={pulseEnergyRaw} onChange={setPulseEnergy} min={0} step="any" />
        <ValidatedNumberInput label="Repetition rate (kHz, 0 = one pulse)" value={repRateRaw} onChange={setRepRate} min={0} step="any" />
        <ValidatedNumberInput label="Pulse duration (ns)" value={pulseWidthRaw} onChange={setPulseWidth} min={1e-4} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the window, 1/e² (mm)" value={beamDiaRaw} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Full-angle divergence, 1/e² (mrad)" value={divergenceRaw} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Viewing distance (m)" value={rangeRaw} onChange={setRange} min={0} step="any" />
        <ValidatedNumberInput label="Exposure time (s)" value={exposureRaw} onChange={setExposure} min={1e-13} max={30000} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Beam</span>
          <select value={scanned ? "scanned" : "stationary"} onChange={(e) => setMode(e.target.value)} className={selectClass}>
            <option value="stationary">Stationary (worst case, scanner failure)</option>
            <option value="scanned">Scanned across the eye</option>
          </select>
        </label>
        {scanned ? (
          <>
            <ValidatedNumberInput label="Scan angle, full (°; 360 = rotating)" value={scanAngleRaw} onChange={setScanAngle} min={0.01} max={360} step="any" />
            <ValidatedNumberInput label="Scan rate (sweeps, periods or turns per s)" value={scanRateRaw} onChange={setScanRate} min={0.001} step="any" />
            <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
              <span className="text-sm text-gray-300">Scan pattern (rotating, polygon, sawtooth: one; triangle: both)</span>
              <select value={both ? "both" : "one"} onChange={(e) => setDirection(e.target.value)} className={selectClass}>
                <option value="one">One direction</option>
                <option value="both">Both directions</option>
              </select>
            </label>
          </>
        ) : null}
      </div>

      {overlap ? (
        <p className="text-amber-300 mb-4">The pulses overlap: the repetition rate times the pulse duration is above 1.</p>
      ) : !covered ? (
        <p className="text-amber-300 mb-4">The eye limits cover 180 nm to 1 mm.</p>
      ) : (
        <>
          {scanned && prf === 0 ? (
            <p className="text-amber-300 mb-4">A scanned lidar needs a repetition rate: one pulse is the stationary case below.</p>
          ) : null}
          {scanOn && !scanEyeOk ? (
            <p className="text-amber-300 mb-4">
              {range === 0
                ? "At the window the beam doesn't sweep across the eye: it is treated as stationary."
                : scanEye?.status === "noClearance"
                  ? `At ${fmtDistance(range)} the sweep is ${fmtDistance(scanAt(range).sweep)} long, less than the pupil plus the ${fmtNum(dEye * 1e3)} mm beam: the beam never leaves the eye, so it is treated as stationary.`
                  : "The exposure is shorter than one pass: the beam is treated as stationary."}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <ResultCard label="Average power" value={fmtPower(Q * prf)} tone="blue" subtext={`Peak power E/τ: ${fmtPower(Q / tau)}`} />
            {scanOn ? (
              <ResultCard
                label="NOHD (scanned)"
                value={nohdScan >= rSearch ? `> ${fmtDistance(rSearch)}` : nohdText(nohdScan)}
                tone={nohdScan === 0 ? "green" : "red"}
                subtext={`Stationary beam (scanner failure): ${nohdText(nohd)}`}
              />
            ) : (
              <ResultCard
                label="NOHD (stationary beam)"
                value={nohdText(nohd)}
                tone={nohd === 0 ? "green" : "red"}
                subtext={`Exposures up to ${fmtNum(T)} s, beam a + rφ`}
              />
            )}
            <ResultCard
              label={`At ${fmtDistance(range)}: pulse / max`}
              value={`${fmtNum(ratioEye)}×`}
              tone={ratioEye > 1 ? "red" : "green"}
              subtext={
                scanEyeOk
                  ? `Max ${fmtEnergy(scanEye.qMax)} per pulse (${scanEye.limiting ? LIMIT_LABELS[scanEye.limiting] : ""}, ${scanEye.level ? LEVEL_NAMES[scanEye.level] : ""})`
                  : `Max ${fmtEnergy(atEye.qMax)} per pulse (${atEye.limiting ? LIMIT_LABELS[atEye.limiting] : ""}, ${atEye.rule ? RULE_NAMES[atEye.rule] : ""})`
              }
            />
            <ResultCard
              label="Eyewear OD at the window"
              value={ratioOut > 1 ? fmtNum(Math.log10(ratioOut)) : "0 (within)"}
              tone={ratioOut > 1 ? "red" : "green"}
              subtext={`Stationary beam ${fmtNum(d * 1e3)} mm; at ${fmtDistance(range)} it is ${fmtNum(dEye * 1e3)} mm`}
            />
          </div>
          {scanEyeOk ? (
            <>
              <p className="text-sm text-gray-300 mb-2">
                Each level for an eye at the viewing distance: the beam crosses it at {fmtNum(scanAt(range).speed)} m/s,
                {` ${fmtNum((scanAt(range).speed / prf) * 1e3)} mm`} between pulses
                {binding ? `; a pass over the ${binding.pass.actual ? "beam's peak" : `${fmtNum(binding.pass.aperture * 1e3)} mm aperture`} lasts ${fmtTime(binding.pass.passDuration)}, ${binding.pass.passes.toLocaleString("en-US")} passes in ${fmtNum(T)} s` : ""}.
              </p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="py-2 pr-4">Limit</th>
                      <th className="py-2 pr-4">Pulses within a pass</th>
                      <th className="py-2 pr-4">Passes (average power)</th>
                      <th className="py-2 pr-4">C_P over all passes</th>
                      <th className="py-2 pr-4">Max per pulse</th>
                      <th className="py-2 pr-4">Your pulse / max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanEye.limits.map((l) => {
                      const cell = (on: boolean) => `py-2 pr-4 ${on ? "font-semibold text-white" : ""}`;
                      return (
                        <tr key={l.kind} className="border-b border-gray-900">
                          <td className="py-2 pr-4">{LIMIT_LABELS[l.kind]}</td>
                          <td className={cell(l.level === "pulse")}>
                            {fmtEnergy(l.within.qMax)} <span className="text-gray-500">(rule {l.within.rule})</span>
                          </td>
                          <td className={cell(l.level === "pass")}>
                            {fmtEnergy(l.passPerPulse)} <span className="text-gray-500">(ρ {fmtNum(l.ripple)})</span>
                          </td>
                          <td className={cell(l.level === "reduced")}>
                            {Number.isFinite(l.reduced) ? (
                              <>
                                {fmtEnergy(l.reduced)} <span className="text-gray-500">(C_P {fmtNum(l.cp)}, n {l.cpCount.toLocaleString("en-US")})</span>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2 pr-4">{fmtEnergy(l.qMax)}</td>
                          <td className={`py-2 pr-4 ${Q > l.qMax ? "text-red-300" : "text-green-300"}`}>{fmtNum(Q / l.qMax)}×</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">
                  Energies per pulse in the beam. Pulses within a pass: the rules for the pulses inside one pass, each taken
                  centred on the aperture. Passes: each pass over the aperture is one pulse of the average power; ρ is the most
                  the pulses&apos; positions can add to it. C_P: the retinal limit&apos;s rule 3, counting, in every pass within
                  T₂, the pulses whose 1/e² beam overlaps the 7 mm aperture. Max per pulse is the least of the three, but never
                  below the stationary beam&apos;s limit, which a scanned beam can&apos;t exceed.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-300 mb-2">Each rule for an eye at the viewing distance:</p>
              <PulseTrainTable result={atEye} value={Q} />
            </>
          )}
        </>
      )}

      <div className="text-sm text-gray-400 mb-8 space-y-2">
        <p>
          A lidar beam is a pulse train: the ICNIRP 2013 repetitive-pulse rules hold each pulse to the single-pulse limit,
          every group of pulses (up to the whole exposure) to the limit for the time it spans, and on the retina each
          pulse to C_P times the single-pulse limit. At 905 nm and hundreds of kHz the average-power rule binds; at
          1550 nm the cornea absorbs the beam and its limit (1 mm aperture below 0.35 s, growing to 3.5 mm at 10 s) is
          far higher, which is why 1550 nm lidars can emit much more. 10 s is ICNIRP&apos;s exposure for unintended viewing
          in the near infrared.
        </p>
        <p>
          The stationary beam is the worst case (no scanned window carries more), and what a scanner failure leaves. A scanning lidar sweeps the beam across
          the eye: each pass is a group of pulses, and the passes repeat at the scan rate. The scanned mode holds the
          pulses three ways: the pulses inside one pass as a short stationary train, each pass as one pulse of the average
          power (ICNIRP: scanning beams are repetitive-pulse exposures), and on the retina C_P counting the pulses within
          T₂ whose beam overlaps the pupil. It takes the eye on the centre of the scan line, focused on the scanner (a still retinal image, the most
          restrictive case), and the scan speed at the viewing distance. Checked against a sum over every window of the actual
          pulse energies, it is conservative by 1.0–1.6× (up to 2×; more for a narrow beam on the cornea). NOHD is the farthest distance where the beam (1/e² diameter a + rφ) still
          exceeds a rule, on the averaging apertures (7 mm on the retina). A beam under 1 mm (1/e diameter, d/√2 for the
          1/e² d) is held to its peak on the cornea below 0.35 s (ICNIRP 2013 Table 5 note c). Not modelled: several
          beams (multi-channel lidars) or raster lines crossing the eye, the scan&apos;s turning points, optical aids
          (binoculars lengthen the NOHD), atmospheric attenuation, the IEC 60825-1 class of the product.
        </p>
      </div>

      {covered && !overlap ? (
        <div className="bg-gray-900 rounded-lg p-4">
          <HazardRatioChart ratios={ratios} rMin={rMin} rMax={rMax} markers={markers} />
          <p className="text-xs text-gray-500 mt-2">
            Pulse energy over the largest allowed energy per pulse against distance, for each eye limit, as the beam widens
            {scanOn ? " and sweeps faster" : ""}. The beam is within the limits where every line is below the dashed line;
            the NOHD is where the highest crosses it.
          </p>
        </div>
      ) : null}
    </>
  );
}
