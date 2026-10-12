"use client";

import { useDeferredValue, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { fix } from "../../../components/polarization-format";
import { useURLState } from "../../../hooks/use-url-state";
import { cssRgb, srgbEncode } from "../../../physics/cie-colour";
import {
  type ChainPlate, type ChainRetarder, analyzerOfMinimum, chainTransmissionSlope, retarderChainColour, retarderChainTransmission,
  senarmontRetardance,
} from "../../../physics/polarization/interference-colours";
import { C_NBK7, kirschMaxRetardance, kirschRetardanceField } from "../../../physics/polarization/photoelasticity";
import RgbaCanvas from "../../../components/rgba-canvas";

const DEG = Math.PI / 180;
const FULL_WAVE = 550e-9;
const C_DEFAULT = Number((C_NBK7 / 1e-12).toFixed(2)); // TPa⁻¹
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const GREY_HOLE = [107, 114, 128] as const;

/** A compensator plate: retardance R (m) and slow-axis azimuth (rad). */
interface Comp { R: number; axis: number }
/** Sample then compensator, as retardances Γ = 2πR/λ at one wavelength. */
function chainOf(lambda: number, R: number, axis: number, comp: Comp | null): ChainRetarder[] {
  const chain = [{ gamma: (2 * Math.PI * R) / lambda, axis }];
  if (comp) chain.push({ gamma: (2 * Math.PI * comp.R) / lambda, axis: comp.axis });
  return chain;
}
/** Sample then compensator as constant retardances, for the white-light colour. */
function platesOf(R: number, axis: number, comp: Comp | null): ChainPlate[] {
  const plates: ChainPlate[] = [{ R: () => R, axis }];
  if (comp) plates.push({ R: () => comp.R, axis: comp.axis });
  return plates;
}

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

const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300,
});

export default function BirefringenceImagingPage() {
  const [PIn, setP] = useURLState("polarizer", 0);
  const [AIn, setA] = useURLState("analyzer", 90);
  const [RsIn, setRs] = useURLState("retardance", 100);
  const [phiIn, setPhi] = useURLState("axis", 45);
  const [lambdaIn, setLambda] = useURLState("wavelength", 546);
  const [compIn, setComp] = useURLState("compensator", "none");
  const [cRIn, setCR] = useURLState("compRetardance", 137.5);
  const [cAxisIn, setCAxis] = useURLState("compAxis", 0);
  const [SIn, setS] = useURLState("stress", 10);
  const [aIn, setHole] = useURLState("hole", 1);
  const [dIn, setThick] = useURLState("thickness", 10);
  const [CIn, setC] = useURLState("stressOptic", C_DEFAULT);
  const [lightIn, setLight] = useURLState("light", "mono");

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const P = clamp(PIn, 0, 180) * DEG, A = clamp(AIn, 0, 180) * DEG;
  const Rs = clamp(RsIn, 0, 2000) * 1e-9, phi = clamp(phiIn, 0, 180) * DEG;
  const lambda_nm = clamp(lambdaIn, 200, 2000), lambda = lambda_nm * 1e-9;
  const kind = ["qwp", "full", "custom"].includes(compIn) ? compIn : "none";
  const compR = kind === "qwp" ? lambda / 4 : kind === "full" ? FULL_WAVE : clamp(cRIn, 0, 2000) * 1e-9;
  const compAxis = kind === "full" ? Math.PI / 4 : kind === "qwp" ? P : clamp(cAxisIn, 0, 180) * DEG;
  const hasComp = kind !== "none";
  const white = lightIn === "white";

  const compOf = (): Comp | null => (hasComp ? { R: compR, axis: compAxis } : null);
  const chain = chainOf(lambda, Rs, phi, compOf());
  const T = retarderChainTransmission(P, A, chain);
  const slope = chainTransmissionSlope(P, A, chain, 0);
  const sampleColour = useMemo(
    () => retarderChainColour(P, A, platesOf(Rs, phi, hasComp ? { R: compR, axis: compAxis } : null)),
    [P, A, Rs, phi, hasComp, compR, compAxis],
  );

  // Sénarmont: λ/4 slow axis along P; the analyzer minimum and, for φ = P ± 45°, the retardance it reads.
  const senarmont = useMemo(() => {
    if (kind !== "qwp") return null;
    const m = analyzerOfMinimum(P, chainOf(lambda, Rs, phi, { R: lambda / 4, axis: P }));
    return { A: m.A, T: m.T, R: senarmontRetardance(P, phi, m.A, lambda) };
  }, [kind, lambda, Rs, phi, P]);

  const waves = Math.max(2, Math.ceil(Rs / lambda));
  const byRetardance = useMemo(() => {
    const comp: Comp | null = hasComp ? { R: compR, axis: compAxis } : null;
    const x = Array.from({ length: 400 }, (_, i) => (i / 399) * waves);
    return { x, y: x.map((w) => retarderChainTransmission(P, A, chainOf(lambda, w * lambda, phi, comp))) };
  }, [P, A, phi, lambda, waves, hasComp, compR, compAxis]);
  const byAnalyzer = useMemo(() => {
    const comp: Comp | null = hasComp ? { R: compR, axis: compAxis } : null;
    const c = chainOf(lambda, Rs, phi, comp);
    const x = Array.from({ length: 361 }, (_, i) => i / 2);
    return { x, y: x.map((deg) => retarderChainTransmission(P, deg * DEG, c)) };
  }, [P, Rs, phi, lambda, hasComp, compR, compAxis]);

  const S = clamp(SIn, 0.1, 1000) * 1e6, a = clamp(aIn, 0.1, 100) * 1e-3, d = clamp(dIn, 0.1, 100) * 1e-3, C = clamp(CIn, 0.01, 100) * 1e-12;
  const stressParams = useMemo(
    () => ({ S, a, d, C, P, A, lambda, white, hasComp, compR, compAxis }),
    [S, a, d, C, P, A, lambda, white, hasComp, compR, compAxis],
  );
  const deferred = useDeferredValue(stressParams);
  const image = useMemo(() => {
    const p = deferred;
    const comp: Comp | null = p.hasComp ? { R: p.compR, axis: p.compAxis } : null;
    const N = p.white ? 101 : 121;
    const field = kirschRetardanceField(p.S, p.a, p.C, p.d, N, 4 * p.a);
    const rgba = new Uint8ClampedArray(N * N * 4);
    for (let k = 0; k < N * N; k++) {
      const R = field.R[k];
      let rgb: readonly number[];
      if (!Number.isFinite(R)) rgb = GREY_HOLE;
      else {
        const az = field.azimuth[k];
        if (p.white) rgb = retarderChainColour(p.P, p.A, platesOf(R, az, comp)).map((v) => 255 * v);
        else {
          const g = 255 * srgbEncode(retarderChainTransmission(p.P, p.A, chainOf(p.lambda, R, az, comp)));
          rgb = [g, g, g];
        }
      }
      rgba.set([Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2]), 255], 4 * k);
    }
    return { rgba, N, maxR: kirschMaxRetardance(p.S, p.C, p.d), lambda: p.lambda };
  }, [deferred]);

  const optionsComp: [string, string][] = [["none", "None"], ["qwp", "λ/4 at λ, axis ∥ polarizer (Sénarmont)"], ["full", "Full wave 550 nm, axis 45°"], ["custom", "Custom"]];
  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>polarizer P → sample (R<sub>s</sub>, slow axis φ) → compensator → analyzer A; &nbsp;Γ = 2πR/λ</p>
        <p>Stokes vector turned by each retarder; &nbsp;T = ½(1 + S<sub>1</sub> cos 2A + S<sub>2</sub> sin 2A)</p>
        <p>one plate: T = cos²(A − P) − sin 2(φ − P) sin 2(φ − A) sin²(Γ/2)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <InputSlider label="Polarizer angle P" value={PIn} onChange={setP} min={0} max={180} step={1} unit="°" />
        <InputSlider label="Analyzer angle A" value={AIn} onChange={setA} min={0} max={180} step={1} unit="°" />
        <InputSlider label="Sample slow axis φ" value={phiIn} onChange={setPhi} min={0} max={180} step={1} unit="°" />
        <ValidatedNumberInput label="Sample retardance R_s (nm)" value={RsIn} onChange={setRs} min={0} max={2000} step="1" />
        <ValidatedNumberInput label="Wavelength λ (nm)" value={lambdaIn} onChange={setLambda} min={200} max={2000} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Compensator</span>
          <select value={kind} onChange={(e) => setComp(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {optionsComp.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
          </select>
        </label>
        {kind === "custom" && (
          <>
            <ValidatedNumberInput label="Compensator retardance (nm)" value={cRIn} onChange={setCR} min={0} max={2000} step="0.5" />
            <ValidatedNumberInput label="Compensator slow axis (°)" value={cAxisIn} onChange={setCAxis} min={0} max={180} step="1" />
          </>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-6">Angles are counter-clockwise looking into the beam from the x axis (E–W). Every axis is a slow axis.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Transmitted intensity" value={fix(T, 4)} subtext="fraction of the light behind the polarizer" />
        <ResultCard label="Sensitivity dI/dΓ" tone="green" value={`${fix(slope, 4)} /rad`} subtext={`${fix((slope * 2 * Math.PI) / lambda_nm, 5)} per nm of sample retardance`} />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4" role="group" aria-label={`White-light colour of the sample at ${fix(Rs * 1e9, 0)} nm`}>
          <p className="text-sm text-gray-400 mb-2">White-light colour of the sample</p>
          <div className="h-10 rounded border border-gray-700" style={{ backgroundColor: cssRgb(sampleColour) }} aria-hidden="true" />
          <p className="text-sm text-gray-500 mt-1">R<sub>s</sub> = {fix(Rs * 1e9, 0)} nm, constant over the spectrum</p>
        </div>
        {kind === "qwp" && (
          <ResultCard label="Sénarmont: analyzer angle of minimum" tone="yellow"
            value={senarmont && Number.isFinite(senarmont.A) ? `${fix(senarmont.A / DEG, 1)}°` : "—"}
            subtext={!senarmont || !Number.isFinite(senarmont.A)
              ? "no minimum: circular light"
              : Number.isFinite(senarmont.R)
                ? `turned ${fix((senarmont.R / lambda) * 180, 1)}° from crossed: R = λΔθ/180° = ${fix(senarmont.R * 1e9, 1)} nm (mod λ)`
                : `T = ${fix(senarmont.T, 4)}; not a Sénarmont setting, which needs φ = P ± 45°`} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-10">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Intensity against sample retardance</h3>
          <ChartPanel layout={layout("Sample retardance (waves)", "Intensity")} data={[
            { x: byRetardance.x, y: byRetardance.y, type: "scatter", mode: "lines", name: "I(R_s)", line: { color: "#60a5fa", width: 2 } },
            { x: [Rs / lambda], y: [T], type: "scatter", mode: "markers", name: "Current", marker: { color: "#fbbf24", size: 9 } },
          ]} />
          <p className="text-sm text-gray-300 mt-2">Retardance in waves of λ = {fix(lambda_nm, 0)} nm; the marker is the current sample.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Intensity against analyzer angle</h3>
          <ChartPanel layout={layout("Analyzer angle A (°)", "Intensity")} data={[
            { x: byAnalyzer.x, y: byAnalyzer.y, type: "scatter", mode: "lines", name: "I(A)", line: { color: "#34d399", width: 2 } },
            { x: [A / DEG], y: [T], type: "scatter", mode: "markers", name: "Current", marker: { color: "#fbbf24", size: 9 } },
          ]} />
          <p className="text-sm text-gray-300 mt-2">The minimum sits where the analyzer is perpendicular to the long axis of the emerging polarization ellipse.</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Photoelastic example: plate with a hole in tension (Kirsch)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <ValidatedNumberInput label="Remote stress S (MPa)" value={SIn} onChange={setS} min={0.1} max={1000} step="1" />
        <ValidatedNumberInput label="Hole radius a (mm)" value={aIn} onChange={setHole} min={0.1} max={100} step="0.1" />
        <ValidatedNumberInput label="Plate thickness d (mm)" value={dIn} onChange={setThick} min={0.1} max={100} step="0.5" />
        <ValidatedNumberInput label="Stress-optic coefficient C (TPa⁻¹)" value={CIn} onChange={setC} min={0.01} max={100} step="0.01" />
      </div>
      <p className="text-xs text-gray-500 mb-4">C = {C_DEFAULT} TPa⁻¹ is N-BK7 (Schott). The image uses the polarizer, analyzer, wavelength and compensator above; the field spans ±4a.</p>
      <div className="mb-4"><Toggle label="Light" value={white ? "white" : "mono"} options={[["mono", `Monochromatic, ${fix(lambda_nm, 0)} nm`], ["white", "White (D65)"]]} onChange={setLight} /></div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <RgbaCanvas rgba={image.rgba} size={image.N} stale={deferred !== stressParams}
          label={`Photoelastic image of a plate with a circular hole under tension along x, ${white ? "white light" : "monochromatic light"}; largest retardance ${fix(image.maxR * 1e9, 0)} nanometres`} />
        <p className="text-sm text-gray-300 mt-3">Infinite plate (Kirsch 1898); slow axis along σ₁ for C &gt; 0. Tension acts along x; the grey disc is the hole.</p>
        <p className="text-xs text-gray-500 mt-1">Largest retardance in the field: 3SCd = {fix(image.maxR * 1e9, 0)} nm = {fix(image.maxR / image.lambda, 2)} waves at {fix(image.lambda * 1e9, 0)} nm, on the hole edge across the load.</p>
      </div>
    </>
  );
}
