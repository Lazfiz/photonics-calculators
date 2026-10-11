"use client";

import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix, stokesProblem } from "../../../components/polarization-format";
import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalIndices, crystalRange, type CrystalId } from "../../../physics/materials/uniaxial-data";
import { applyMueller, muellerDepolarizer } from "../../../physics/polarization/mueller";
import {
  muellerRetarderSpectral, plateRetardances, retardanceForVisibility, spectralVisibility, wavenumberBand, type SpectrumShape,
} from "../../../physics/polarization/spectral-depolarization";
import { type Stokes, degreeOfPolarization } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const isCrystal = (v: string): v is CrystalId => (CRYSTAL_IDS as readonly string[]).includes(v);
const tab = (on: boolean) => `text-sm px-4 py-2 rounded ${on ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`;
const PRESETS: { label: string; S: Stokes }[] = [
  { label: "Horizontal", S: [1, 1, 0, 0] }, { label: "Vertical", S: [1, -1, 0, 0] }, { label: "+45°", S: [1, 0, 1, 0] },
  { label: "Right circular", S: [1, 0, 0, 1] }, { label: "Elliptical", S: [1, 0.6, 0.48, 0.64] }, { label: "Unpolarized", S: [1, 0, 0, 0] },
];
/** Depolarizer d from -1/3 (the physical limit, rounded inward to a slider step) to 1. */
const D_MIN = -0.333;
const layout = (x: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: "Output degree of polarization", gridcolor: "#374151", range: [0, 1] },
  margin: { t: 20, r: 20, b: 60, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
});

export default function DepolarizationPage() {
  const [modeIn, setMode] = useURLState("mode", "depolarizer");
  const [dIn, setD] = useURLState("d", 0.5);
  const [crystalIn, setCrystal] = useURLState("crystal", "quartz");
  const [thicknessIn, setThickness] = useURLState("thickness", 5);
  const [lambdaIn, setLambda] = useURLState("wavelength", 550);
  const [bandIn, setBand] = useURLState("bandwidth", 10);
  const [shapeIn, setShape] = useURLState("shape", "flat");
  const [axisIn, setAxis] = useURLState("axis", 0);
  const [s0In, setS0] = useURLState("s0", 1);
  const [s1In, setS1] = useURLState("s1", 0);
  const [s2In, setS2] = useURLState("s2", 1);
  const [s3In, setS3] = useURLState("s3", 0);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const spectral = modeIn === "retarder";
  const d = clamp(dIn, D_MIN, 1);
  const id: CrystalId = isCrystal(crystalIn) ? crystalIn : "quartz";
  const [rangeLo, rangeHi] = crystalRange(id);
  const lambdaMin_nm = Math.ceil(rangeLo * 1.001e9), lambdaMax_nm = Math.floor(rangeHi * 0.999e9);
  const lambda0_nm = clamp(lambdaIn, lambdaMin_nm, lambdaMax_nm);
  // The model takes Δn linear in wavenumber across the band; keep the band within half the centre wavelength.
  const bandMax_nm = Math.min(2000, 0.5 * lambda0_nm);
  const dLambda_nm = clamp(bandIn, 0.001, bandMax_nm);
  const thickness_mm = clamp(thicknessIn, 0.01, 200);
  const shape: SpectrumShape = shapeIn === "gaussian" ? "gaussian" : "flat";
  const axis_deg = clamp(axisIn, -180, 180);
  const s0 = clamp(s0In, 0.001, 10), s1 = clamp(s1In, -10, 10), s2 = clamp(s2In, -10, 10), s3 = clamp(s3In, -10, 10);
  const Sin: Stokes = [s0, s1, s2, s3];
  const problem = stokesProblem(Sin);

  // SI at the physics boundary; Δn(λ) = |n_e − n_o| from the Sellmeier fits.
  const lambda0 = lambda0_nm * 1e-9;
  const dn = (lam: number) => { const n = crystalIndices(id, lam); return Math.abs(n.ne - n.no); };
  const { phase, group } = plateRetardances(thickness_mm * 1e-3, dn, lambda0);
  const { sigma0, dSigma } = wavenumberBand(lambda0, dLambda_nm * 1e-9);
  const axis = axis_deg * DEG;
  const M = spectral ? muellerRetarderSpectral(phase, group, sigma0, dSigma, shape, axis) : muellerDepolarizer(d);
  const Sout = applyMueller(M, Sin);
  const dopIn = degreeOfPolarization(Sin), dopOut = degreeOfPolarization(Sout);
  const visibility = spectralVisibility(group, dSigma, shape);
  const groupBirefringence = group / (thickness_mm * 1e-3);
  const halfThickness_mm = groupBirefringence > 0 ? (retardanceForVisibility(0.5, dSigma, shape) / groupBirefringence) * 1e3 : NaN;

  const chart = (() => {
    const dop = (m: number[][]) => degreeOfPolarization(applyMueller(m, [s0, s1, s2, s3]));
    const n = 200;
    if (!spectral) {
      const x = Array.from({ length: n }, (_, i) => Math.min(1, -1 / 3 + ((4 / 3) * i) / (n - 1)));
      return [
        { x, y: x.map((v) => dop(muellerDepolarizer(v))), type: "scatter", mode: "lines", name: "Output DOP", line: { color: "#60a5fa", width: 2 } },
        { x: [d], y: [dop(muellerDepolarizer(d))], type: "scatter", mode: "markers", name: "Current d", line: { color: "#facc15" }, marker: { color: "#facc15", size: 8 } },
      ];
    }
    // Phase and group retardance scale linearly with thickness.
    const at = (k: number) => dop(muellerRetarderSpectral(phase * k, group * k, sigma0, dSigma, shape, axis));
    const x = Array.from({ length: n }, (_, i) => (4 * thickness_mm * i) / (n - 1));
    return [
      { x, y: x.map((t) => at(t / thickness_mm)), type: "scatter", mode: "lines", name: "Output DOP", line: { color: "#60a5fa", width: 2 } },
      { x: [thickness_mm], y: [at(1)], type: "scatter", mode: "markers", name: "Current thickness", line: { color: "#facc15" }, marker: { color: "#facc15", size: 8 } },
    ];
  })();

  const sv = (n: number) => fix(n, 4);
  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>depolarizer: M = diag(1, d, d, d), physical for −1/3 ≤ d ≤ 1; DOP<sub>out</sub> = |d| · DOP<sub>in</sub></p>
        <p>broadband light through a retarder: ⟨e<sup>iΓ</sup>⟩ = V e<sup>iΓ₀</sup>, &nbsp;flat in wavenumber V = sinc(π R<sub>g</sub> Δσ), &nbsp;Gaussian V = exp(−(π R<sub>g</sub> Δσ)² / (4 ln 2))</p>
        <p>R<sub>g</sub> = d (Δn − λ dΔn/dλ), &nbsp;Δσ = 1/(λ₀ − Δλ/2) − 1/(λ₀ + Δλ/2)</p>
      </div>

      <div role="group" aria-label="Mode" className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setMode("depolarizer")} aria-pressed={!spectral} className={tab(!spectral)}>Depolarizer</button>
        <button onClick={() => setMode("retarder")} aria-pressed={spectral} className={tab(spectral)}>Broadband light through a retarder</button>
      </div>

      {!spectral ? (
        <div className="mb-4 max-w-xl">
          <InputSlider label="Depolarizer d (DOP scales by |d|)" value={d} onChange={setD} min={D_MIN} max={1} step={0.001} />
          <p className="text-xs text-gray-500 mt-1">Physical for d from −1/3 (the slider stops at −0.333) to 1: d = 1 passes the light unchanged, d = 0 is an ideal depolarizer, and d &lt; 0 also turns the polarized part into the orthogonal state.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Crystal</span>
            <select value={id} onChange={(e) => setCrystal(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
              {CRYSTAL_IDS.map((c) => <option key={c} value={c}>{UNIAXIAL_CRYSTALS[c].name}</option>)}
            </select>
          </label>
          <ValidatedNumberInput label="Plate thickness d (mm)" value={thickness_mm} onChange={setThickness} min={0.01} max={200} step="0.1" />
          <ValidatedNumberInput label={`Centre wavelength λ₀ (nm, ${lambdaMin_nm}–${lambdaMax_nm})`} value={lambda0_nm} onChange={setLambda} min={lambdaMin_nm} max={lambdaMax_nm} step="1" />
          <ValidatedNumberInput label={`Bandwidth Δλ (nm, full width, ≤ ${fix(bandMax_nm, 0)})`} value={dLambda_nm} onChange={setBand} min={0.001} max={bandMax_nm} step="0.5" />
          <ValidatedNumberInput label="Fast-axis azimuth (°)" value={axis_deg} onChange={setAxis} min={-180} max={180} step="1" />
          <div role="group" aria-label="Spectrum shape" className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShape("flat")} aria-pressed={shape === "flat"} className={tab(shape === "flat")}>Flat in wavenumber</button>
            <button onClick={() => setShape("gaussian")} aria-pressed={shape === "gaussian"} className={tab(shape === "gaussian")}>Gaussian (FWHM)</button>
          </div>
        </div>
      )}

      <h3 className="text-sm text-gray-400 mb-2">Input Stokes vector</h3>
      <div role="group" aria-label="Input presets" className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((p) => (
          <button key={p.label} className={tab(p.S.every((v, i) => Math.abs(v - Sin[i]) < 1e-9))}
            onClick={() => { setS0(p.S[0]); setS1(p.S[1]); setS2(p.S[2]); setS3(p.S[3]); }}>{p.label}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="S₀" value={Sin[0]} onChange={setS0} min={0.001} max={10} step="0.01" />
        <ValidatedNumberInput label="S₁" value={Sin[1]} onChange={setS1} min={-10} max={10} step="0.01" />
        <ValidatedNumberInput label="S₂" value={Sin[2]} onChange={setS2} min={-10} max={10} step="0.01" />
        <ValidatedNumberInput label="S₃" value={Sin[3]} onChange={setS3} min={-10} max={10} step="0.01" />
      </div>

      {problem ? (
        <p role="alert" className="text-sm text-yellow-400 mb-6">{problem}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <ResultCard label="Output Stokes vector" value={`(${Sout.map(sv).join(", ")})`} tone="blue" />
            <ResultCard label="Degree of polarization" value={`${fix(dopIn, 4)} → ${fix(dopOut, 4)}`} tone="green" />
            {spectral && (
              <>
                <ResultCard label="Phase retardance R" value={`${fix(phase * 1e6, 2)} µm`} tone="yellow" subtext={`${fix(phase / lambda0, 2)} waves at λ₀`} />
                <ResultCard label="Group retardance R_g" value={`${fix(group * 1e6, 2)} µm`} tone="yellow" subtext={`${fix(group / lambda0, 2)} waves at λ₀`} />
                <ResultCard label="Fringe visibility |V|" value={fix(Math.abs(visibility), 4)} tone="purple" subtext={visibility < 0 ? `V = ${fix(visibility, 4)}: the averaged retardance is shifted by λ/2` : "of the retardance across the band"} />
                <ResultCard label="Thickness for V = 0.5" value={Number.isFinite(halfThickness_mm) ? `${fix(halfThickness_mm, 3)} mm` : "—"} tone="orange" subtext="same band, same crystal" />
              </>
            )}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-2">{spectral ? "Output DOP against plate thickness" : "Output DOP against d"}</h3>
            <ChartPanel data={chart} layout={layout(spectral ? "Plate thickness (mm)" : "Depolarizer d")} />
            <p className="text-xs text-gray-500 mt-2">
              {spectral
                ? "The curve is the output degree of polarization for the input above; the marker is the plate thickness set above. Light polarized along the fast or slow axis is not depolarized. The model is exact for a non-dispersive plate; for a crystal it takes the slope of Δn(λ) at λ₀ across the band."
                : "Output DOP of the input above for every physical d; the marker is the current d."}
            </p>
          </div>
        </>
      )}
    </>
  );
}
