"use client";

import { useMemo } from "react";
import { AEL_LABELS, CLASS_TONES, fmtNum, fmtPower } from "../../../components/eye-limit-labels";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { classifyCw, escapingBeam, type ClassCheck } from "../../../physics/laser-safety/laser-classes";

/** Largest power of the beam within a class under every applied condition, W. */
const classMax = (c: ClassCheck) => Math.min(c.condition3.power, c.condition1?.power ?? Infinity);

export default function EnclosureClassPage() {
  const [laserPower, setLaserPower] = useURLState("laserPower", 5000, { min: 0 }); // mW inside the enclosure
  const [wavelength, setWavelength] = useURLState("wavelength", 1064, { min: 180, max: 1000000 }); // nm
  const [beamDia, setBeamDia] = useURLState("beamDia", 2, { min: 0.001 }); // mm, 1/e² at the opening
  const [divergence, setDivergence] = useURLState("divergence", 1, { min: 0 }); // mrad, 1/e² full angle
  const [apertureSize, setApertureSize] = useURLState("apertureSize", 5, { min: 0 }); // mm, opening diameter
  const [windowOD, setWindowOD] = useURLState("windowOD", 4, { min: 0 }); // optical density over the opening

  // SI inside; classes from src/physics/laser-safety/laser-classes.ts.
  const lambda = wavelength * 1e-9;
  const P = Math.max(laserPower, 0) * 1e-3;
  const d = Math.max(beamDia, 1e-3) * 1e-3;
  const phi = Math.max(divergence, 0) * 1e-3;
  const D = Math.max(apertureSize, 0) * 1e-3;
  const od = Math.max(windowOD, 0);

  // The opening passes the centred Gaussian's share 1 − exp(−2D²/d²) in a beam no wider than D; the window × 10^−OD.
  const throughOpening = escapingBeam(P, d, D, 0).power;
  const { power: accessible, d: dOut } = escapingBeam(P, d, D, od);
  const r = useMemo(() => classifyCw(lambda, accessible, { d: dOut, phi }), [lambda, accessible, dOut, phi]);
  const [c1, , c3R] = r.checks;
  const odFor = (c: ClassCheck) => Math.max(0, Math.log10(throughOpening / classMax(c)));

  return (
    <>
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser power inside (mW)" value={laserPower} onChange={setLaserPower} min={0} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1000000} step="any" />
        <ValidatedNumberInput label="Beam diameter at the opening, 1/e² (mm)" value={beamDia} onChange={setBeamDia} min={0.001} step="any" />
        <ValidatedNumberInput label="Divergence, 1/e² full angle (mrad)" value={divergence} onChange={setDivergence} min={0} step="any" />
        <ValidatedNumberInput label="Opening diameter (mm)" value={apertureSize} onChange={setApertureSize} min={0} step="any" />
        <ValidatedNumberInput label="Window or filter OD over the opening" value={windowOD} onChange={setWindowOD} min={0} step="any" />
      </div>

      {r.laserClass ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <ResultCard
              label="Accessible emission"
              value={fmtPower(accessible)}
              subtext={`${fmtPower(throughOpening)} through the opening, × 10^−${fmtNum(od)}`}
              tone="cyan"
            />
            <ResultCard label="Class of the product (IEC 60825-1:2014)" value={`Class ${r.laserClass}`} tone={CLASS_TONES[r.laserClass]} />
            <ResultCard
              label="Class 1 limit for this beam"
              value={fmtPower(classMax(c1))}
              subtext={
                c1.condition1 && c1.condition1.power < c1.condition3.power
                  ? "through binoculars (Condition 1)"
                  : c1.condition3.limiting
                    ? `${AEL_LABELS[c1.condition3.limiting]}, time base ${fmtNum(c1.condition3.timeBase)} s`
                    : undefined
              }
              tone="green"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <ResultCard
              label="OD the opening needs for Class 1"
              value={`OD ${odFor(c1).toFixed(2)}`}
              subtext={odFor(c1) > od ? `${fmtNum(odFor(c1) - od)} more than now` : "met"}
              tone={odFor(c1) > od ? "red" : "green"}
            />
            <ResultCard
              label="OD for Class 3R"
              value={Number.isFinite(classMax(c3R)) ? `OD ${odFor(c3R).toFixed(2)}` : "no Class 3R here"}
              tone="orange"
            />
          </div>
        </>
      ) : (
        <p className="text-amber-300 mb-8">IEC 60825-1 covers 180 nm to 1 mm.</p>
      )}

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          A product that encloses a stronger laser is classified by what a person can reach outside it, the accessible
          emission (IEC 60825-1:2014). Here that is the beam escaping through one opening, attenuated by a window or
          filter over it; the product class follows from the class limits for that beam: for the naked eye a stop
          100 mm away at 302.5 nm – 4 µm and at the opening elsewhere (7 mm at 400–1400 nm; the corneal stop in the
          infrared, 1 mm in the UV), and for binoculars a 50 mm stop at 2 m (modelled at 400–1400 nm), over a 100 s
          time base (30 000 s in the UV). A Class 1 product keeps the emission below the
          Class 1 limit in normal operation; panels that open onto the stronger beam need safety interlocks, or tools
          to remove them and warning labels (IEC 60825-1).
        </p>
        <p>
          The opening passes the centred Gaussian beam&apos;s share 1 − exp(−2D²/d²). The escaping beam is classed as a
          Gaussian no wider than the opening, since all of its power lies within it: conservative near the opening, as
          a clipped beam diffracts more, which lowers the hazard only far from it. Not modelled:
          scattered and diffuse leakage, several openings, pulses, and whether the window or guard survives the beam
          (IEC 60825-4 tests laser guards).
        </p>
      </div>
    </>
  );
}
