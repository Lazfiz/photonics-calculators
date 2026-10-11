"use client";

import { useDeferredValue, useMemo } from "react";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { CrystalNote, isCrystalId } from "../../../components/crystal-select";
import { fix } from "../../../components/polarization-format";
import { useURLState } from "../../../hooks/use-url-state";
import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalIndices, crystalRange } from "../../../physics/materials/uniaxial-data";
import { type PrincipalIndices, conoscopicFigure, opticAxialAngle } from "../../../physics/polarization/conoscopy";
import RgbaCanvas from "../../../components/rgba-canvas";

const DEG = Math.PI / 180;
const SIZE = 121;
const BIAXIAL = "biaxial";
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-400 mr-1">{label}</span>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`text-sm px-4 py-2 rounded ${value === v ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

export default function ConoscopicPage() {
  const [crystalIn, setCrystal] = useURLState("crystal", "calcite");
  const [nAlphaIn, setNAlpha] = useURLState("nAlpha", 1.53);
  const [nBetaIn, setNBeta] = useURLState("nBeta", 1.68);
  const [nGammaIn, setNGamma] = useURLState("nGamma", 1.685);
  const [thicknessIn, setThickness] = useURLState("thickness", 100);
  const [tiltIn, setTilt] = useURLState("tilt", 0);
  const [rotationIn, setRotation] = useURLState("rotation", 0);
  const [naIn, setNa] = useURLState("na", 0.85);
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 589);
  const [lightIn, setLight] = useURLState("light", "mono");
  const [polarsIn, setPolars] = useURLState("polars", "crossed");

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const crystal = crystalIn === BIAXIAL || isCrystalId(crystalIn) ? crystalIn : "calcite";
  const id = isCrystalId(crystal) ? crystal : null;
  const light = lightIn === "white" ? "white" : "mono";
  const crossed = polarsIn !== "parallel";
  const lambda_nm = clamp(wavelengthIn, 380, 780);
  const lambda = lambda_nm * 1e-9;
  const d = clamp(thicknessIn, 1, 5000) * 1e-6;
  const tilt = clamp(tiltIn, 0, 60) * DEG;
  const rotation = clamp(rotationIn, 0, 360) * DEG;
  const NAin = clamp(naIn, 0.1, 1.3);

  // Uniaxial data: n_o, n_e at the wavelength clamped into the fit range, ordered as n_α ≤ n_β ≤ n_γ.
  const [lo, hi] = id ? crystalRange(id) : [0, 0];
  const { no, ne } = id ? crystalIndices(id, clamp(lambda, lo, hi)) : { no: NaN, ne: NaN };
  const indices: PrincipalIndices = id
    ? (ne > no ? [no, no, ne] : [ne, no, no])
    : [clamp(nAlphaIn, 1, 3), clamp(nBetaIn, 1, 3), clamp(nGammaIn, 1, 3)];
  const [n1, n2, n3] = indices;
  const valid = n1 > 0 && n1 <= n2 && n2 <= n3 && n1 < n3;
  const NA = valid ? Math.min(NAin, 0.98 * n1) : NaN;
  const axial = opticAxialAngle(indices);

  const params = useMemo(
    () => (valid ? { n1, n2, n3, tilt, rotation, d, lambda, NA, crossed, white: light === "white", id } : null),
    [valid, n1, n2, n3, tilt, rotation, d, lambda, NA, crossed, light, id],
  );
  const deferred = useDeferredValue(params);
  const figure = useMemo(() => {
    if (!deferred) return null;
    const { n1: a, n2: b, n3: c, tilt: t, rotation: r, d: thick, lambda: l0, NA: na, crossed: x, white, id: cid } = deferred;
    let dispersion: ((lambda: number) => number) | undefined;
    if (white && cid) {
      const [min, max] = crystalRange(cid);
      const B = (l: number) => {
        const n = crystalIndices(cid, clamp(l, min, max));
        return Math.abs(n.ne - n.no);
      };
      const B0 = B(l0);
      if (B0 > 0) dispersion = (l) => B(l) / B0;
    }
    const f = conoscopicFigure({
      indices: [a, b, c], orientation: { tilt: t, rotation: r }, d: thick, lambda: l0, NA: na,
      P: 0, A: x ? Math.PI / 2 : 0, mode: white ? "white" : "mono", dispersion,
    }, SIZE);
    return { ...f, lambda: l0, NA: na };
  }, [deferred]);

  const melatope = valid && !id ? n2 * Math.sin(axial.twoV / 2) : NaN;
  const invalidText = id ? "No index data at this wavelength." : "Enter n_α ≤ n_β ≤ n_γ with n_α < n_γ.";
  const orders = figure ? figure.maxR / figure.lambda : NaN;
  const whiteNote = id ? "Dispersion: retardance scales with |n_e − n_o|(λ) from the Sellmeier fit." : "No dispersion data: constant retardance.";

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>cos²V<sub>z</sub> = (n<sub>β</sub><sup>−2</sup> − n<sub>γ</sub><sup>−2</sup>)/(n<sub>α</sub><sup>−2</sup> − n<sub>γ</sub><sup>−2</sup>), &nbsp;2V = acute optic axial angle</p>
        <p>each pupil point ν = NA·r: k<sub>z</sub> = √(n(s)² − ν²) per eigenwave, &nbsp;Γ = k<sub>0</sub>d(k<sub>z,slow</sub> − k<sub>z,fast</sub>)</p>
        <p>crossed polars: T = sin²2(ψ − P) sin²(Γ/2); &nbsp;parallel: T = 1 − sin²2(ψ − P) sin²(Γ/2)</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
        <Toggle label="Light" value={light} options={[["mono", "Monochromatic"], ["white", "White (D65)"]]} onChange={setLight} />
        <Toggle label="Polars" value={crossed ? "crossed" : "parallel"} options={[["crossed", "Crossed"], ["parallel", "Parallel"]]} onChange={setPolars} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Crystal</span>
          <select value={crystal} onChange={(e) => setCrystal(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {CRYSTAL_IDS.map((c) => <option key={c} value={c}>Uniaxial: {UNIAXIAL_CRYSTALS[c].name}</option>)}
            <option value={BIAXIAL}>Biaxial (custom indices)</option>
          </select>
        </label>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={380} max={780} step="1" />
        <ValidatedNumberInput label="Plate thickness d (µm)" value={thicknessIn} onChange={setThickness} min={1} max={5000} step="1" />
        {!id && (
          <>
            <ValidatedNumberInput label={<>n<sub>α</sub> (smallest)</>} value={nAlphaIn} onChange={setNAlpha} min={1} max={3} step="0.001" />
            <ValidatedNumberInput label={<>n<sub>β</sub></>} value={nBetaIn} onChange={setNBeta} min={1} max={3} step="0.001" />
            <ValidatedNumberInput label={<>n<sub>γ</sub> (largest)</>} value={nGammaIn} onChange={setNGamma} min={1} max={3} step="0.001" />
          </>
        )}
        <InputSlider label="Tilt from the plate normal" value={tiltIn} onChange={setTilt} min={0} max={60} step={1} unit="°" />
        <InputSlider label="Stage rotation" value={rotationIn} onChange={setRotation} min={0} max={360} step={1} unit="°" />
        <InputSlider label="Conoscope NA" value={naIn} onChange={setNa} min={0.1} max={1.3} step={0.05} />
      </div>
      <CrystalNote material={crystal} lambda={lambda} />
      <p className="text-xs text-gray-500 -mt-4 mb-6">Tilt is that of the optic axis (uniaxial) or the acute bisectrix (biaxial); the stage rotation turns the tilt direction from x.</p>
      {valid && NA < NAin && <p className="text-sm text-yellow-400 mb-4">The NA is limited to 0.98 n<sub>α</sub> = {fix(NA, 3)}, the largest cone the plate accepts.</p>}
      {valid && NA > 1 && <p className="text-sm text-gray-400 mb-4">An NA above 1 needs immersion of index ≥ NA (oil, n ≈ 1.52) between the lenses and the plate.</p>}
      {!valid && <p className="text-sm text-red-400 mb-4" role="alert">{invalidText}</p>}

      {valid && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <ResultCard label="Optic sign" value={axial.sign === "+" ? "Positive (+)" : axial.sign === "−" ? "Negative (−)" : "—"}
              subtext={`n_α / n_β / n_γ = ${fix(n1, 4)} / ${fix(n2, 4)} / ${fix(n3, 4)}`} />
            <ResultCard label="Acute optic axial angle 2V" tone="green" value={id ? "0° (uniaxial)" : `${fix(axial.twoV / DEG, 1)}°`}
              subtext={id ? "the two optic axes coincide" : `V = ${fix(axial.twoV / 2 / DEG, 1)}°`} />
            <ResultCard label="Birefringence n_γ − n_α" tone="yellow" value={fix(n3 - n1, 4)} />
            <ResultCard label="Largest retardance in the field" tone="purple" value={figure ? `${fix(figure.maxR * 1e6, 2)} µm` : "—"}
              subtext={`${fix(orders, 1)} orders at ${fix(lambda_nm, 0)} nm; NA ${fix(NA, 2)}`} />
            {!id && (
              <ResultCard label="Melatope position ν = n_β sin V" tone="cyan" value={fix(melatope, 3)}
                subtext={`${melatope < NA ? "inside" : "outside"} the NA of ${fix(NA, 2)}${tilt > 0 ? "; value for no tilt, tilting moves it" : ""}`} />
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-3">Conoscopic figure, {crossed ? "crossed" : "parallel"} polars, {light === "white" ? "white light" : `${fix(lambda_nm, 0)} nm`}</h3>
            {figure && (
              <RgbaCanvas rgba={figure.rgba} size={SIZE} stale={deferred !== params}
                label={`Conoscopic figure of a ${fix(d * 1e6, 0)} micrometre plate with NA ${fix(NA, 2)} between ${crossed ? "crossed" : "parallel"} polarizers: ${axial.sign === "+" ? "positive" : "negative"} crystal, 2V ${id ? "0" : fix(axial.twoV / DEG, 1)} degrees`} />
            )}
            <p className="text-sm text-gray-300 mt-3">
              {crossed
                ? "Isochromes are lines of equal retardance; the dark isogyres are where the slow axis is parallel to a polarizer."
                : "Isochromes are lines of equal retardance, in complementary colours; with parallel polars the isogyres, where the slow axis is parallel to a polarizer, are bright."}
            </p>
            <p className="text-xs text-gray-500 mt-1">Polarizer P along x (E–W); the figure spans ±NA. {light === "white" ? whiteNote : ""}</p>
          </div>
        </>
      )}
    </>
  );
}
