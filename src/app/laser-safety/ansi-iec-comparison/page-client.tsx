"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { AEL_LABELS, fmtEnergy, fmtNum, fmtPower, fmtTime, LIMIT_LABELS, segmentedLine } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { T_MAX, T_MIN } from "../../../physics/laser-safety/eye-exposure-limits";
import { aelEnergy, cwClassLimit, exposureLimitEnergy } from "../../../physics/laser-safety/laser-classes";

export default function AnsiIecComparisonPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 355); // nm
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 100); // s

  // SI inside. Exposure limit: ICNIRP 2013; Class 1 AEL: IEC 60825-1:2014 rebuilt (laser-classes.ts).
  const lambda = wavelength * 1e-9;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);

  const r = useMemo(() => {
    const mpe = exposureLimitEnergy(lambda, t);
    const ael = aelEnergy("1", lambda, t);
    return { mpe, ael, cw: cwClassLimit("1", lambda, 0) };
  }, [lambda, t]);
  const valid = Number.isFinite(r.mpe.energy) && Number.isFinite(r.ael.energy);
  const ratio = r.ael.energy / r.mpe.energy;
  const mpeArea = (Math.PI * r.mpe.aperture * r.mpe.aperture) / 4;

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 401 }, (_, i) => 180 * Math.pow(20000 / 180, i / 400));
    const traces: Record<string, unknown>[] = [
      ...segmentedLine(wls, wls.map((nm) => exposureLimitEnergy(nm * 1e-9, t).energy), "Exposure limit (ICNIRP)", { color: "#60a5fa" }),
      ...segmentedLine(wls, wls.map((nm) => aelEnergy("1", nm * 1e-9, t).energy), "Class 1 AEL (IEC)", { color: "#f472b6", dash: "dash" }),
    ];
    return traces;
  }, [t]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Exposure or emission duration (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
      </div>

      {valid ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard
              label="Exposure limit (MPE), ICNIRP 2013"
              value={`${fmtNum(r.mpe.energy / mpeArea)} J/m²`}
              subtext={`${r.mpe.kind ? LIMIT_LABELS[r.mpe.kind] : ""}; averaged over ${fmtNum(r.mpe.aperture * 1e3)} mm, ${fmtNum(r.mpe.energy / mpeArea / t)} W/m²`}
              tone="blue"
            />
            <ResultCard
              label="The same as energy through that aperture"
              value={fmtEnergy(r.mpe.energy)}
              subtext={`${fmtPower(r.mpe.energy / t)} for ${fmtTime(t)}`}
              tone="cyan"
            />
            <ResultCard
              label="Class 1 AEL, IEC 60825-1:2014"
              value={fmtEnergy(r.ael.energy)}
              subtext={`${r.ael.kind ? AEL_LABELS[r.ael.kind] : ""}; through ${fmtNum(r.ael.stop * 1e3)} mm`}
              tone="purple"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <ResultCard
              label="AEL / exposure limit (as energy)"
              value={`${fmtNum(ratio)}×`}
              subtext={Math.abs(ratio - 1) < 1e-6 ? "the AEL is the limit times the stop area" : "the product limit differs from the exposure limit here"}
              tone={Math.abs(ratio - 1) < 1e-6 ? "green" : "yellow"}
            />
            <ResultCard
              label="Class 1 AEL for a CW laser"
              value={fmtPower(r.cw.power)}
              subtext={`over the time base, ${fmtTime(r.cw.timeBase)}; all of the beam inside the stop`}
              tone="purple"
            />
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-8">The limits cover 180 nm to 1 mm.</p>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Energy through the aperture (J)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          The exposure limit and the Class 1 AEL for this duration, as energy through their apertures, 180 nm to 20 µm
          (log scales). They coincide except in the UV and from about 1300 to 1400 nm.
        </p>
      </div>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          Two kinds of limit: the maximum permissible exposure (MPE) protects a person and is an irradiance or radiant
          exposure at the eye, averaged over an aperture (ICNIRP 2013, the MPE annex of IEC 60825-1, ANSI Z136.1). The
          accessible emission limit (AEL) classifies a product and is a power or energy through a measurement stop
          (IEC 60825-1). For Classes 1, 1M, 2, 2M and 3R the AEL is the MPE times the stop&apos;s area, so from 400 nm the
          two curves are mostly one. They part where IEC chose otherwise. In the UV it keeps its own values (a
          continuous C₂ = 10^(0.2(λ − 295)) J/m² at 302.5–315 nm, 10 W/m² after 10³ s at 315–400 nm) over a 1 mm stop
          at every duration, against ICNIRP&apos;s 1 nm steps and 1 → 3.5 mm aperture. From 1150 to 1400 nm ICNIRP limits
          an eye-only exposure to twice the skin limit as well, which is lower than the retinal limit from about
          1300 nm; IEC leaves that out of the classes and caps Classes 1 and 3R at the Class 3B AEL, 0.5 W through 7 mm,
          from 1250 nm.
        </p>
        <p>
          A product also has a time base (100 s for Class 1 above 400 nm, 30 000 s in the UV): the CW AEL is the power
          that meets the AEL for every duration up to it.
        </p>
        <p>
          ANSI Z136.1-2014 is harmonised with ICNIRP and IEC in most cases. Schulmeister (2017) notes two differences:
          ANSI extends the corneal limits below 1400 nm as the 1200–1400 nm dual limit, and it raised the corneal
          limits up to 1500 nm for exposures under 10 s (by a factor of 3 below 1 ms). ANSI&apos;s tables are not public,
          so its values aren&apos;t computed here.
        </p>
      </div>
    </>
  );
}
