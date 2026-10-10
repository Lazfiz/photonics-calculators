"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { CLASS_TONES, fmtDistance, fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { apertureIrradiance } from "../../../physics/laser-safety/eye-exposure-limits";
import { effectiveDiameterAt, nominalOcularHazardDistance, roundBeam } from "../../../physics/laser-safety/hazard-distance";
import { classifyCw } from "../../../physics/laser-safety/laser-classes";
import { ICAO_LEVELS, peakIrradiance, rangeToIrradiance } from "../../../physics/laser-safety/visual-interference";

export default function GreenLaserPointerPage() {
  const [power, setPower] = useURLState("power", 5); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 532); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 1.5); // mm, 1/e² at the output
  const [divergence, setDivergence] = useURLState("divergence", 1.2); // mrad, 1/e² full angle
  const [distance, setDistance] = useURLState("distance", 10); // m

  // SI inside. Class: laser-classes.ts (IEC 60825-1:2014); NOHD: hazard-distance.ts (ICNIRP 2013); dazzle: ICAO levels.
  const lambda = wavelength * 1e-9;
  const P = Math.max(power, 0) * 1e-3;
  const d = Math.max(beamDia, 1e-3) * 1e-3;
  const phi = Math.max(divergence, 0) * 1e-3;
  const r = Math.max(distance, 0);
  const visible = wavelength >= 400 && wavelength <= 700;
  // A visible beam is assumed to be looked away from within 0.25 s; an invisible one gets 10 s (ANSI Z136.1).
  const tEye = visible ? 0.25 : 10;

  const beam = useMemo(() => roundBeam(d, phi), [d, phi]);
  const cls = useMemo(() => classifyCw(lambda, P, { d, phi }), [lambda, P, d, phi]);
  const nohd = useMemo(() => nominalOcularHazardDistance(lambda, P, beam, tEye), [lambda, P, beam, tEye]);
  const dAtR = effectiveDiameterAt(beam, r);
  const peakAtR = peakIrradiance(P, dAtR);
  const pupilAtR = apertureIrradiance(P, dAtR, 7e-3);
  const dazzle = {
    sensitive: rangeToIrradiance(P, beam, ICAO_LEVELS.sensitive),
    critical: rangeToIrradiance(P, beam, ICAO_LEVELS.critical),
    laserFree: rangeToIrradiance(P, beam, ICAO_LEVELS.laserFree),
  };
  const valid = cls.laserClass !== null && !Number.isNaN(nohd.distance);

  const chartData = useMemo(() => {
    const far = Number.isFinite(dazzle.laserFree) && dazzle.laserFree > 0 ? dazzle.laserFree * 3 : 1e4;
    const rs = Array.from({ length: 200 }, (_, i) => Math.pow(10, -1 + (i * Math.log10(far * 10)) / 199));
    const toUw = (E: number) => E * 100; // W/m² → µW/cm²
    const line = (E: number, name: string, color: string) => ({
      x: [rs[0], rs[rs.length - 1]], y: [toUw(E), toUw(E)], type: "scatter", mode: "lines", name, line: { color, dash: "dash" },
    });
    const traces: Record<string, unknown>[] = [
      { x: rs, y: rs.map((x) => toUw(peakIrradiance(P, effectiveDiameterAt(beam, x)))), type: "scatter", mode: "lines", name: "Peak irradiance", line: { color: "#4ade80" } },
      line(ICAO_LEVELS.sensitive, "Flash-blind", "#f87171"),
      line(ICAO_LEVELS.critical, "Glare", "#fbbf24"),
      line(ICAO_LEVELS.laserFree, "Distraction", "#60a5fa"),
    ];
    return P > 0 ? traces : [];
  }, [P, beam, dazzle.laserFree]);

  const fmtRange = (x: number) => (x === 0 ? "below it at the output" : fmtDistance(x));
  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the output, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Divergence, 1/e² full angle (mrad)" value={divergence} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Viewing distance (m)" value={distance} onChange={setDistance} min={0} step="any" />
      </div>

      {valid && cls.laserClass ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard
              label="Class (IEC 60825-1:2014)"
              value={`Class ${cls.laserClass}`}
              tone={CLASS_TONES[cls.laserClass]}
              subtext={visible ? "Class 2 up to 1 mW, 3R up to 5 mW, 3B up to 0.5 W (visible CW)" : "invisible: no blink reflex"}
            />
            <ResultCard
              label={`NOHD (eye exposure ${tEye} s)`}
              value={nohd.distance === 0 ? "0 — within the limit at the output" : fmtDistance(nohd.distance)}
              subtext={nohd.limiting ? LIMIT_LABELS[nohd.limiting] : undefined}
              tone="red"
            />
            <ResultCard
              label={`At ${fmtDistance(r)}`}
              value={`${fmtNum(pupilAtR * 0.1)} mW/cm² over 7 mm`}
              subtext={`beam ${fmtNum(dAtR * 1e3)} mm; ${fmtPower(pupilAtR * Math.PI * 12.25e-6)} into a 7 mm pupil`}
              tone="cyan"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <ResultCard label="Flash-blindness (100 µW/cm²) out to" value={fmtRange(dazzle.sensitive)} tone="orange" />
            <ResultCard label="Glare (5 µW/cm²) out to" value={fmtRange(dazzle.critical)} tone="yellow" />
            <ResultCard label="Distraction (50 nW/cm²) out to" value={fmtRange(dazzle.laserFree)} tone="blue" />
          </div>
          <p className="text-sm text-gray-400 mb-8">
            Peak irradiance at {fmtDistance(r)}: {fmtNum(peakAtR * 100)} µW/cm².
          </p>
        </>
      ) : (
        <p className="text-amber-300 mb-8">The limits cover 180 nm to 1 mm.</p>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (m)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (µW/cm²)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Peak irradiance of the beam against distance (log scales) and the ICAO levels for flash-blindness, glare and
          distraction.
        </p>
      </div>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          Class: a visible CW pointer is Class 2 up to 1 mW (the blink reflex limits the exposure to 0.25 s), Class 3R
          up to 5 mW and Class 3B up to 0.5 W, measured through a 7 mm stop 100 mm from the beam and a 50 mm stop at 2 m
          for binoculars (IEC 60825-1:2014). Many countries allow only Class 1 or 2 pointers for sale.
        </p>
        <p>
          NOHD: the distance beyond which the beam stays within the ICNIRP 2013 eye limit for 0.25 s, averaged over
          7 mm, with the beam spreading as d + rφ (the standards&apos; formula). Dazzle: the beam blinds and dazzles far
          beyond the NOHD. The distances are where its peak irradiance falls to the ICAO flight-zone levels (Annex 11,
          Doc 9815): 100 µW/cm² (no flash-blindness), 5 µW/cm² (no glare), 50 nW/cm² (no visual disruption).
          The FAA also weights the irradiance by the eye&apos;s sensitivity; not done here.
        </p>
        <p>
          Not modelled: the infrared that cheap DPSS pointers can leak (808 and 1064 nm, often unfiltered, which can
          raise the class), atmospheric loss and scintillation.
        </p>
      </div>
    </>
  );
}
