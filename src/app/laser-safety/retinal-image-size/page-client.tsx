"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { finiteXY, fmtDistance, fmtNum } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { ALPHA_MIN, correctionCE } from "../../../physics/laser-safety/eye-exposure-limits";
import { gaussianApparentSource, MAX_ACCOMMODATION } from "../../../physics/laser-safety/retinal-image";

const R_MIN = 1e-3; // m, chart range
const R_MAX = 100;

export default function RetinalImageSizePage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 808); // nm
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 0.4); // mm, 1/e² at the waist
  const [beamDivergence, setBeamDivergence] = useURLState("beamDivergence", 200); // mrad, 1/e² full angle
  const [viewingDistance, setViewingDistance] = useURLState("viewingDistance", 10); // cm from the waist to the eye

  // Embedded-Gaussian beam and an accommodating 17 mm eye: src/physics/laser-safety/retinal-image.ts. SI inside.
  const lambda = Math.max(wavelength, 1) * 1e-9;
  const d0 = Math.max(beamDiam, 1e-6) * 1e-3;
  const theta = Math.max(beamDivergence, 0) * 1e-3;
  const r = Math.max(viewingDistance, 0) * 1e-2;

  const s = useMemo(() => gaussianApparentSource(lambda, d0, theta, r), [lambda, d0, theta, r]);
  const valid = !Number.isNaN(s.alpha);
  const point = s.alpha <= ALPHA_MIN;
  const ce = correctionCE(s.alpha, 10);
  const belowDiffraction = (theta * Math.PI * d0) / (4 * lambda) < 1;

  const chartData = useMemo(() => {
    const rs = Array.from({ length: 201 }, (_, i) => R_MIN * Math.pow(R_MAX / R_MIN, i / 200));
    const alphas = rs.map((x) => gaussianApparentSource(lambda, d0, theta, x).alpha * 1e3);
    const line = finiteXY(rs, alphas);
    const here = finiteXY([r], [s.alpha * 1e3]);
    return [
      { ...line, type: "scatter", mode: "lines", name: "α", line: { color: "#60a5fa" } },
      { x: [R_MIN, R_MAX], y: [1.5, 1.5], type: "scatter", mode: "lines", name: "α_min", line: { color: "#fbbf24", dash: "dash" } },
      { x: [R_MIN, R_MAX], y: [100, 100], type: "scatter", mode: "lines", name: "α_max", line: { color: "#f87171", dash: "dot" } },
      { ...here, type: "scatter", mode: "markers", name: "Your eye", marker: { color: "#ffffff", size: 8 } },
    ];
  }, [lambda, d0, theta, r, s.alpha]);

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1400} step="any" />
        <ValidatedNumberInput label="Beam diameter at the waist, 1/e² (mm)" value={beamDiam} onChange={setBeamDiam} min={0.001} step="any" />
        <ValidatedNumberInput label="Divergence, 1/e² full angle (mrad)" value={beamDivergence} onChange={setBeamDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Distance from the waist to the eye (cm)" value={viewingDistance} onChange={setViewingDistance} min={0} step="any" />
      </div>
      {belowDiffraction ? (
        <p className="text-amber-300 text-sm mb-4">
          That divergence is below the diffraction limit 4λ/(πd₀) = {fmtNum((4 * lambda) / (Math.PI * d0) * 1e3)} mrad
          of a TEM₀₀ beam with this waist; it is taken as M² = 1.
        </p>
      ) : null}

      {valid ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <ResultCard
            label="Apparent source subtense α"
            value={`${fmtNum(s.alpha * 1e3)} mrad`}
            tone={point ? "green" : "orange"}
            subtext={
              point
                ? "Point source (α ≤ α_min = 1.5 mrad): the limits apply without C_E"
                : `Extended source: C_E = ${fmtNum(ce)} for exposures of 0.25 s or more`
            }
          />
          <ResultCard
            label="Retinal image diameter, 1/e²"
            value={`${fmtNum(s.retinalDiameter * 1e6)} µm`}
            tone="blue"
            subtext={`63 % (1/e) diameter ${fmtNum((s.retinalDiameter / Math.SQRT2) * 1e6)} µm`}
          />
          <ResultCard
            label="Beam at the eye, 1/e²"
            value={`${fmtNum(s.dCornea * 1e3)} mm`}
            tone="purple"
            subtext={s.dCornea > 7e-3 ? "Overfills a 7 mm pupil" : "Inside a 7 mm pupil"}
          />
          <ResultCard
            label="Wavefront curvature radius at the eye"
            value={s.curvature > 0 ? fmtDistance(1 / s.curvature) : "flat (∞)"}
            tone="cyan"
          />
          <ResultCard
            label="Accommodation used"
            value={`${fmtNum(s.accommodation)} D of ${MAX_ACCOMMODATION}`}
            tone={s.defocus > 0 ? "yellow" : "gray"}
            subtext={s.defocus > 0 ? `${fmtNum(s.defocus)} D left out of focus (the waist is nearer than 100 mm)` : "The eye brings the image to focus"}
          />
          <ResultCard label="Beam quality M²" value={fmtNum(s.M2)} tone="gray" />
        </div>
      ) : (
        <p className="text-amber-300 mb-6">Enter a positive wavelength and waist diameter.</p>
      )}

      {valid ? (
        <ChartPanel
          data={chartData}
          layout={{
            xaxis: { title: "Distance from the waist to the eye (m)", type: "log" },
            yaxis: { title: "Apparent source subtense α (mrad)", type: "log" },
          }}
          title="Apparent source against viewing distance"
        />
      ) : null}
      <p className="text-xs text-gray-500 mt-2 mb-6">
        The chart shows α against the distance from the waist (log scales), with α_min = 1.5 mrad and α_max = 100 mrad
        dashed. Nearer than 100 mm the eye can&apos;t focus and the blurred image grows.
      </p>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          The apparent source is the object the eye images to the smallest retinal spot within its accommodation range,
          100 mm to infinity (IEC 60825-1:2014). For a beam that is the waist: seen from r, the beam is (d₀/2)√(1 +
          (r/z<sub>R</sub>)²) wide with a wavefront of radius r(1 + (z<sub>R</sub>/r)²), z<sub>R</sub> = d₀/θ. The eye (a
          17 mm air-equivalent lens) adds up to 10 dioptres to cancel that curvature and images the waist; α is the 63 %
          image diameter over 17 mm, which far from the waist is d₀/(√2 r). A beam wider than the pupil is diffraction
          limited by the 7 mm pupil; a waist nearer than 100 mm stays out of focus.
        </p>
        <p>
          A TEM₀₀ (M² = 1) beam seen from r ≥ 100 mm has α ≤ √(λ/(πr)) (the largest when z<sub>R</sub> = r): at 100 mm
          1.42 mrad at 633 nm, so a point source in the visible, and at most 1.84 mrad at 1064 nm. Beams of poor quality
          (fibre-coupled diodes, multimode fibres, stacks) or a waist inside 100 mm give larger sources, which raises the retinal thermal limit by C<sub>E</sub> = α/α<sub>min</sub> (up to α<sub>max</sub>).
          Not modelled: aberrations of the eye (below 1.5 mrad they don&apos;t matter), a beam converging to a waist
          behind the eye.
        </p>
      </div>
    </>
  );
}
