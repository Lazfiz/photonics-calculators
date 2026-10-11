"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { fmtDistance, fmtNum, fmtPower, fmtTime, LIMIT_LABELS, segmentedLine } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import PulseTrainTable from "../../../components/pulse-train-table";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { exposureDuration, T_MAX } from "../../../physics/laser-safety/eye-exposure-limits";
import { axisDiameterAt } from "../../../physics/laser-safety/hazard-distance";
import { angularScan, scannedBeamLimits, stationaryMaxPower } from "../../../physics/laser-safety/scanned-beam";

const RULE_NAMES = { 1: "single pass", 2: "groups of passes (average)", 3: "C_P × single pass" } as const;
const selectClass = "mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white";

export default function ScanningMPEPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 532); // nm
  const [powerRaw, setPower] = useURLState("power", 5); // mW
  const [beamDiamRaw, setBeamDiam] = useURLState("beamDiam", 1); // mm, 1/e² at the scanner
  const [divergenceRaw, setDivergence] = useURLState("divergence", 1); // mrad, 1/e² full angle
  const [distanceRaw, setDistance] = useURLState("workingDistance", 100); // cm from the scan's pivot
  const [scanAngleRaw, setScanAngle] = useURLState("scanAngle", 30); // °, full angle
  const [scanRateRaw, setScanRate] = useURLState("scanRate", 100); // Hz
  const [direction, setDirection] = useURLState("scanDirection", "both");
  const [exposureRaw, setExposure] = useURLState("exposureTime", 0.25); // s
  const [alphaRaw, setAlpha] = useURLState("alpha", 1.5); // mrad

  // URL values aren't range-checked: clamp them here. SI inside; physics in src/physics/laser-safety/scanned-beam.ts.
  const lambda = wavelength * 1e-9;
  const P = Math.max(powerRaw, 0) * 1e-3;
  const d0 = Math.max(beamDiamRaw, 0) * 1e-3;
  const phi = Math.max(divergenceRaw, 0) * 1e-3;
  const r = Math.max(distanceRaw, 0.1) * 1e-2;
  const theta = (Math.min(Math.max(scanAngleRaw, 0.01), 360) * Math.PI) / 180;
  const f = Math.max(scanRateRaw, 1e-3);
  const both = direction !== "one";
  const T = Math.min(Math.max(exposureRaw, 1e-9), T_MAX);
  const alpha = Math.max(alphaRaw, 0) * 1e-3;
  const d = axisDiameterAt(d0, phi, r, "linear");

  const scan = useMemo(() => angularScan(theta, f, r, both, T), [theta, f, r, both, T]);
  const result = useMemo(() => scannedBeamLimits(lambda, d, scan, alpha), [lambda, d, scan, alpha]);
  const stationary = useMemo(() => stationaryMaxPower(lambda, d, T, alpha), [lambda, d, T, alpha]);
  const stopped = useMemo(() => exposureDuration(lambda, P, d, alpha), [lambda, P, d, alpha]);
  const covered = Number.isFinite(stationary);
  const ok = result.status === "ok" && Number.isFinite(result.pMax);
  const ratio = P / result.pMax;
  const binding = result.limits.find((l) => l.kind === result.limiting) ?? result.limits[0];

  const chartData = useMemo(() => {
    const lo = Math.min(0.01, r / 2);
    const hi = Math.max(100, 2 * r);
    const rs = Array.from({ length: 61 }, (_, i) => lo * Math.pow(hi / lo, i / 60));
    const dAt = (x: number) => axisDiameterAt(d0, phi, x, "linear");
    const scanned = rs.map((x) => scannedBeamLimits(lambda, dAt(x), angularScan(theta, f, x, both, T), alpha).pMax);
    const still = rs.map((x) => stationaryMaxPower(lambda, dAt(x), T, alpha));
    const cm = rs.map((x) => x * 100);
    const traces: Record<string, unknown>[] = [
      ...segmentedLine(cm, scanned, "Max power, scanned", { color: "#60a5fa", width: 3 }),
      ...segmentedLine(cm, still, "Max power, held still", { color: "#fbbf24", dash: "dot" }),
    ];
    if (P > 0) traces.push({ x: [cm[0], cm[cm.length - 1]], y: [P, P], type: "scatter", mode: "lines", name: "Your power", line: { color: "#f87171", dash: "dash" } });
    const here = result.pMax;
    if (Number.isFinite(here) && here > 0) {
      traces.push({ x: [r * 100], y: [here], type: "scatter", mode: "markers", name: "Your distance", marker: { color: "#f87171", size: 9 } });
    }
    return traces;
  }, [lambda, d0, phi, theta, f, both, T, alpha, P, r, result]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam power (mW)" value={powerRaw} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Beam diameter at the scanner, 1/e² (mm)" value={beamDiamRaw} onChange={setBeamDiam} min={0} step="any" />
        <ValidatedNumberInput label="Divergence, 1/e² full angle (mrad)" value={divergenceRaw} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Eye distance from the scanner (cm)" value={distanceRaw} onChange={setDistance} min={0.1} step="any" />
        <ValidatedNumberInput label="Scan angle, full (°)" value={scanAngleRaw} onChange={setScanAngle} min={0.01} max={360} step="any" />
        <ValidatedNumberInput label="Scan rate (sweeps or periods per s)" value={scanRateRaw} onChange={setScanRate} min={0.001} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Scan pattern</span>
          <select value={both ? "both" : "one"} onChange={(e) => setDirection(e.target.value)} className={selectClass}>
            <option value="both">Both directions (triangle): 2 passes per period</option>
            <option value="one">One direction (sawtooth, polygon): 1 pass per sweep</option>
          </select>
        </label>
        <ValidatedNumberInput label="Exposure time (s)" value={exposureRaw} onChange={setExposure} min={1e-9} max={30000} step="any" />
        <ValidatedNumberInput label="Apparent source α (mrad)" value={alphaRaw} onChange={setAlpha} min={0} step="any" />
      </div>

      {result.status === "noClearance" ? (
        <p className="text-amber-300 mb-4">
          At {fmtDistance(r)} the sweep is {fmtDistance(scan.sweep)} long, less than the 7 mm pupil plus the{" "}
          {fmtNum(d * 1e3)} mm beam: the beam never leaves the eye. Treat it as a stationary beam (below).
        </p>
      ) : !ok ? (
        <p className="text-amber-300 mb-4">
          {covered
            ? "The passes overlap or the exposure is shorter than one pass: treat the beam as stationary (below)."
            : "The eye limits cover 180 nm to 1 mm."}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <ResultCard
              label="Max beam power, scanned"
              value={fmtPower(result.pMax)}
              tone="yellow"
              subtext={`${result.limiting ? LIMIT_LABELS[result.limiting] : ""}, rule ${result.rule}: ${result.rule ? RULE_NAMES[result.rule] : ""}`}
            />
            <ResultCard
              label="Your power / max"
              value={`${fmtNum(ratio)}×`}
              tone={ratio > 1 ? "red" : "green"}
              subtext={ratio > 1 ? `Exceeds: eyewear OD ${fmtNum(Math.log10(ratio))} needed` : "Within every eye limit"}
            />
            <ResultCard
              label="Pass over the eye"
              value={fmtTime(binding.passDuration)}
              tone="blue"
              subtext={`${fmtNum(scan.speed)} m/s across ${fmtNum(binding.aperture * 1e3)} mm, ${binding.passes.toLocaleString("en-US")} passes in ${fmtNum(T)} s; beam ${fmtNum(d * 1e3)} mm`}
            />
            <ResultCard
              label="Scanning allows"
              value={`${fmtNum(result.pMax / stationary)}×`}
              tone="cyan"
              subtext={`the power of the beam held still on the eye for ${fmtNum(T)} s (${fmtPower(stationary)})`}
            />
          </div>
          <PulseTrainTable result={result} value={P} unit="pass" />
        </>
      )}

      {covered ? (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <ResultCard
            label="If the scan stops: limit reached after"
            value={fmtTime(stopped.tMax)}
            tone={stopped.tMax >= T ? "green" : "red"}
            subtext={
              stopped.tMax >= T
                ? `A stopped beam stays within the limits for ${fmtNum(T)} s.`
                : `${stopped.limiting ? LIMIT_LABELS[stopped.limiting] : "Exceeded"}: a scan-failure safeguard has to stop the emission within this time.`
            }
          />
          <ResultCard
            label="Max beam power, held still"
            value={fmtPower(stationary)}
            tone={P > stationary ? "red" : "green"}
            subtext={`For ${fmtNum(T)} s; yours is ${fmtNum(P / stationary)}× that.`}
          />
        </div>
      ) : null}

      <div className="text-sm text-gray-400 mb-8 space-y-2">
        <p>
          A beam that sweeps across the eye delivers one pulse each time it crosses the pupil, and ICNIRP 2013
          (Health Phys. 105:271, p. 287) applies its repetitive-pulse rules to it: (1) each pass within the limit for one
          pulse of its duration, (2) every group of passes within the limit for the time it spans, up to the whole
          exposure (the average power), (3) for the retinal thermal limit, each pass within C_P times the single-pass
          limit. The pass lasts from half power to half power through the aperture (W/v, about 7 mm/v for a beam narrower
          than the pupil); its energy is all the light that gets through. The cornea&apos;s 1 mm aperture sees a shorter
          pass than the retina&apos;s 7 mm one.
        </p>
        <p>
          The beam is taken to sweep through the centre of the pupil, with the eye on the centre of the scan line and
          focused on the scanner, so the retinal image stays put and every pass lands on the same spot (IEC 60825-1:2014&apos;s
          default evaluation of scanned emission; Schulmeister 2025). Speed ω·r at distance r from the pivot: ω = Θ·f for
          one direction, 2Θ·f for both. Use 0.25 s for an accidental glance at a visible beam and 10 s or more for
          invisible ones. Not modelled: the turning points of a scan (slower, with passes in pairs), sinusoidal and raster
          scans, pulsed lasers (each pass a group of pulses), and a moving retinal image, which is less restrictive.
        </p>
        <p>
          If the scanner stops, the beam is stationary: the first card below gives the time a stopped beam takes to
          exceed the limits, which bounds the reaction time of the scan-failure safeguard that IEC 60825-1 requires when
          the classification relies on the scan.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel
          data={chartData}
          layout={{
            xaxis: { title: "Distance from the scanner (cm)", type: "log", gridcolor: "#374151" },
            yaxis: { title: "Max beam power (W)", type: "log", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }}
        />
        <p className="text-xs text-gray-500 mt-2">
          Largest beam power against the distance of the eye from the scanner, scanned and held still, for this beam,
          scan and exposure. Closer in, the beam is slower and each pass longer, so the scanned limit falls; where the
          sweep no longer clears the pupil the scanned line stops.
        </p>
      </div>
    </>
  );
}
