"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtNum, fmtPower, LIMIT_LABELS } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { apertureIrradiance, eyeLimits, limitMaxPower, T_MAX, T_MIN, type EyeLimitKind } from "../../../physics/laser-safety/eye-exposure-limits";
import {
  pupilPower, PUPIL_DIAMETER, retinalGain, retinalImageDiameter, retinalIrradiance,
} from "../../../physics/laser-safety/retinal-image";

export default function RetinalHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 532); // nm
  const [power, setPower] = useURLState("power", 10); // mW
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 2); // mm, 1/e²
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 0.25); // s
  const [pupil, setPupil] = useURLState("pupil", 7); // mm

  // Retinal image: src/physics/laser-safety/retinal-image.ts; ICNIRP 2013 limits: eye-exposure-limits.ts. SI inside.
  const lambda = Math.min(Math.max(wavelength, 400), 1399.999) * 1e-9;
  const P = Math.max(power, 0) * 1e-3;
  const d = Math.max(beamDiam, 0.01) * 1e-3;
  const D = Math.min(Math.max(pupil, 1), 9) * 1e-3;
  const t = Math.min(Math.max(exposureTime, T_MIN), T_MAX);

  const r = useMemo(() => {
    const s = retinalImageDiameter(lambda, d, D);
    let governing: { kind: EyeLimitKind; pMax: number } | null = null;
    const retinal = eyeLimits(lambda).filter((l) => l.kind === "retinalThermal" || l.kind === "retinalPhotochemical");
    for (const l of retinal) {
      const pMax = limitMaxPower(l, d, t);
      if (!governing || pMax < governing.pMax) governing = { kind: l.kind, pMax };
    }
    return {
      s,
      pIn: pupilPower(P, d, D),
      eRetina: retinalIrradiance(P, d, s, D),
      eCornea: apertureIrradiance(P, d, PUPIL_DIAMETER),
      governing,
    };
  }, [lambda, P, d, D, t]);

  const chartData = useMemo(() => {
    const ds = Array.from({ length: 201 }, (_, i) => 0.02 * Math.pow(1000, i / 200)); // mm
    const eR = ds.map((x) => retinalIrradiance(P, x * 1e-3, retinalImageDiameter(lambda, x * 1e-3, D), D));
    const sz = ds.map((x) => retinalImageDiameter(lambda, x * 1e-3, D) * 1e6);
    return [
      { ...finiteXY(ds, eR), type: "scatter", mode: "lines", name: "Retinal irradiance (W/m²)", line: { color: "#f87171" } },
      { ...finiteXY(ds, sz), type: "scatter", mode: "lines", name: "Image diameter (µm)", line: { color: "#60a5fa", dash: "dash" } },
      { x: [d * 1e3], y: [r.eRetina], type: "scatter", mode: "markers", name: "Your beam", marker: { color: "#fbbf24", size: 9 } },
    ];
  }, [P, lambda, D, d, r.eRetina]);

  const ratio = r.governing ? P / r.governing.pMax : NaN;

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-5 mb-8">
        <ValidatedNumberInput label="Wavelength (nm, 400–1400)" value={wavelength} onChange={setWavelength} min={400} max={1399} step="any" />
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={beamDiam} onChange={setBeamDiam} min={0.01} step="any" />
        <ValidatedNumberInput label="Exposure Time (s)" value={exposureTime} onChange={setExposureTime} min={1e-9} max={30000} step="any" />
        <ValidatedNumberInput label="Pupil Diameter (mm)" value={pupil} onChange={setPupil} min={1} max={9} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ResultCard label="Power into the eye" value={fmtPower(r.pIn)} subtext={`${fmtNum((r.pIn / P) * 100)} % through the pupil`} tone="yellow" />
        <ResultCard label="Retinal image diameter" value={`${fmtNum(r.s * 1e6)} µm`} subtext="no smaller than 25.5 µm" tone="cyan" />
        <ResultCard label="Retinal irradiance" value={`${fmtNum(r.eRetina)} W/m²`} subtext={`${fmtNum(r.eRetina * 1e-4)} W/cm², before absorption`} tone="red" />
        <ResultCard label="Corneal irradiance (7 mm)" value={`${fmtNum(r.eCornea)} W/m²`} subtext={`gain ${fmtNum(r.eRetina / r.eCornea)}× (${fmtNum(retinalGain(r.s))}× at a 7 mm pupil)`} tone="blue" />
      </div>
      {r.governing && (
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <ResultCard label="Max power within the retinal limits" value={fmtPower(r.governing.pMax)} subtext={LIMIT_LABELS[r.governing.kind]} tone="green" />
          <ResultCard label="Power / max power" value={`${fmtNum(ratio)}× ${ratio > 1 ? "(exceeds)" : "(within)"}`} tone={ratio > 1 ? "red" : "green"} />
        </div>
      )}

      <p className="text-sm text-gray-400 mb-8">
        How much of the beam reaches the retina and how small the eye focuses it. The eye is a 17 mm lens that
        accommodates to the beam: a TEM₀₀ beam of 1/e² diameter d (capped by the pupil) focuses to 4λf/(πd), but
        aberrations and eye movements keep the image at 25.5 µm or more (α_min = 1.5 mrad × 17 mm), which ICNIRP 2013
        (Health Phys. 105:271) assumes for every laser beam. A thin beam diverges more and makes a larger image. The
        retinal irradiance spreads the pupil power evenly over the image and ignores absorption in the eye, so it is an
        upper bound; ICNIRP puts the gain over the corneal irradiance at about 100 000. The limits are what to compare
        with: ICNIRP&apos;s retinal limits (thermal, and photochemical from 10 s at 400–600 nm) for a point source, as
        corneal exposure over 7 mm. A smaller pupil lowers the retinal irradiance but not the limits: ICNIRP allows no
        credit for a pupil under 7 mm.
      </p>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Beam diameter at the cornea, 1/e² (mm)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "W/m² or µm", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
        <p className="text-xs text-gray-500 mt-2">
          Retinal irradiance and image diameter against beam diameter for this power and pupil: thin beams diffract to a
          larger image, wide beams are cut by the pupil.
        </p>
      </div>
    </>
  );
}
