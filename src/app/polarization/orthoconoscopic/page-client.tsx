"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { CrystalNote, isCrystalId } from "../../../components/crystal-select";
import { fix } from "../../../components/polarization-format";
import { useURLState } from "../../../hooks/use-url-state";
import { cssRgb } from "../../../physics/cie-colour";
import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalIndices, crystalRange, type CrystalId } from "../../../physics/materials/uniaxial-data";
import {
  type ChainRetarder, interferenceColour, michelLevyColour, retarderChainColour, retarderChainTransmission,
} from "../../../physics/polarization/interference-colours";
import { retardanceFromPath } from "../../../physics/polarization/retarders";
import { sectionRetardance, sectionSlowAxis } from "../../../physics/polarization/uniaxial";

const DEG = Math.PI / 180;
const RED_PLATE = 550e-9; // first-order red plate: a full wave at 550 nm, slow axis at +45°
const STRIP_CELLS = 300;
const STRIP_MAX_NM = 2000;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

/** Section retardance R(λ), m; the index data are held at the edge of their fit range outside it. */
function retardanceAt(id: CrystalId, theta: number, d: number, lambda: number): number {
  const [lo, hi] = crystalRange(id);
  const { no, ne } = crystalIndices(id, clamp(lambda, lo, hi));
  return sectionRetardance(no, ne, theta, d);
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

export default function OrthoscopicPage() {
  const [crystalIn, setCrystal] = useURLState("crystal", "quartz");
  const [axisIn, setAxis] = useURLState("axis", 90);
  const [thicknessIn, setThickness] = useURLState("thickness", 30);
  const [rotationIn, setRotation] = useURLState("rotation", 30);
  const [polarsIn, setPolars] = useURLState("polars", "crossed");
  const [accessoryIn, setAccessory] = useURLState("accessory", "none");

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const id: CrystalId = isCrystalId(crystalIn) ? crystalIn : "quartz";
  const theta = clamp(axisIn, 0, 90) * DEG;
  const d = clamp(thicknessIn, 1, 100) * 1e-6;
  const rho = clamp(rotationIn, 0, 360) * DEG;
  const crossed = polarsIn !== "parallel";
  const red = accessoryIn === "red";
  const [rangeLo, rangeHi] = crystalRange(id);
  const outsideRange = rangeLo > 380e-9 || rangeHi < 780e-9;
  const A = crossed ? Math.PI / 2 : 0;

  const { no, ne } = crystalIndices(id, clamp(550e-9, ...crystalRange(id)));
  const positive = ne > no;
  const R550 = retardanceAt(id, theta, d, 550e-9);
  const dnEff = R550 / d;

  const colour = useMemo(() => {
    const R = (l: number) => retardanceAt(id, theta, d, l);
    const slow = sectionSlowAxis(no, ne, rho);
    return red
      ? retarderChainColour(0, A, [{ R: (l) => R(l), axis: slow }, { R: () => RED_PLATE, axis: Math.PI / 4 }])
      : interferenceColour((l) => R(l), 0, slow, A);
  }, [id, theta, d, rho, no, ne, red, A]);

  const strip = useMemo(
    () => Array.from({ length: STRIP_CELLS }, (_, i) => cssRgb(michelLevyColour(((i / (STRIP_CELLS - 1)) * STRIP_MAX_NM) * 1e-9))),
    [],
  );

  const curve = useMemo(() => {
    const gamma = retardanceFromPath(retardanceAt(id, theta, d, 550e-9), 550e-9);
    const stage = Array.from({ length: 361 }, (_, i) => i);
    const T = stage.map((deg) => {
      const chain: ChainRetarder[] = [{ gamma, axis: sectionSlowAxis(no, ne, deg * DEG) }];
      if (red) chain.push({ gamma: retardanceFromPath(RED_PLATE, 550e-9), axis: Math.PI / 4 });
      return retarderChainTransmission(0, A, chain);
    });
    return { stage, T };
  }, [id, theta, d, no, ne, red, A]);

  const Tmin = Math.min(...curve.T), Tmax = Math.max(...curve.T);
  const flat = Tmax - Tmin < 1e-9;
  // Crossed: extinction with an axis on a polarizer. Parallel: T = 1 − sin²2ρ sin²(Γ/2) is lowest with the axes at
  // 45°, and reaches 0 only for a half-wave section. The red plate is a full wave at 550 nm and leaves both unchanged.
  const darkest = flat ? "any ρ" : crossed ? "ρ = 0°, 90°, 180°, 270°" : "ρ = 45°, 135°, 225°, 315°";
  const darkNote = flat
    ? `T = ${fix(Tmax, 3)} at 550 nm, independent of ρ`
    : crossed
      ? (red ? "section axis parallel to a polarizer: only the red plate's magenta remains" : "slow axis parallel to a polarizer: T = 0 at any retardance")
      : `minimum T = ${fix(Tmin, 3)} at 550 nm, not an extinction unless the section is a half wave`;
  const rhoDeg = Math.round(rho / DEG) % 360;
  const markerX = Math.min(100, (R550 * 1e9 / STRIP_MAX_NM) * 100);
  const orderLabel = (nm: number) => (nm === 0 ? "0" : `${nm} nm (order ${nm / 550})`);

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>1/n(θ)² = cos²θ/n<sub>o</sub>² + sin²θ/n<sub>e</sub>², &nbsp;R(λ) = |n(θ<sub>c</sub>) − n<sub>o</sub>|(λ)·d</p>
        <p>section at 45°: crossed T(λ) = sin²(πR/λ), parallel 1 − sin²(πR/λ); colour = D65-weighted spectrum → CIE 1931 → sRGB</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
        <Toggle label="Polars" value={crossed ? "crossed" : "parallel"} options={[["crossed", "Crossed"], ["parallel", "Parallel"]]} onChange={setPolars} />
        <Toggle label="Accessory" value={red ? "red" : "none"} options={[["none", "None"], ["red", "First-order red plate (550 nm, +45°)"]]} onChange={setAccessory} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Crystal</span>
          <select value={id} onChange={(e) => setCrystal(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {CRYSTAL_IDS.map((c) => <option key={c} value={c}>{UNIAXIAL_CRYSTALS[c].name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Section thickness d (µm)" value={thicknessIn} onChange={setThickness} min={1} max={100} step="1" />
        <InputSlider label="Optic axis from normal θc" value={axisIn} onChange={setAxis} min={0} max={90} step={1} unit="°" />
        <InputSlider label="Stage rotation ρ" value={rotationIn} onChange={setRotation} min={0} max={360} step={1} unit="°" />
      </div>
      <CrystalNote material={id} lambda={550e-9} />
      {outsideRange && <p className="text-sm text-amber-400 mb-4">The Sellmeier fit for this crystal covers {Math.round(rangeLo * 1e9)}–{Math.round(rangeHi * 1e9)} nm: the colour calculation holds the indices at the edge value outside that range.</p>}
      <p className="text-sm text-gray-400 mb-6">θc = 90° puts the optic axis in the section plane (maximum retardance); θc = 0° looks along the axis (none). ρ is the azimuth of the section&apos;s e-wave vibration direction from the polarizer (E–W).</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:col-span-2" role="group" aria-label={`Interference colour, R = ${fix(R550 * 1e9, 0)} nm`}>
          <p className="text-sm text-gray-400 mb-2">Interference colour{red ? " with the red plate" : ""}, {crossed ? "crossed" : "parallel"} polars</p>
          <div className="h-24 rounded border border-gray-700" style={{ backgroundColor: cssRgb(colour) }} aria-hidden="true" />
          <p className="text-sm text-gray-300 mt-2">R = {fix(R550 * 1e9, 0)} nm, order R/550 nm = {fix(R550 / 550e-9, 2)} &nbsp;(at ρ = {rhoDeg}°)</p>
        </div>
        <ResultCard label="n_o / n_e at 550 nm" value={`${fix(no, 4)} / ${fix(ne, 4)}`} subtext={`${positive ? "positive" : "negative"} crystal, Δn = ${fix(ne - no, 4)}`} />
        <ResultCard label="Δn_eff at 550 nm" tone="green" value={fix(dnEff, 5)} subtext={`|n(${fix(theta / DEG, 0)}°) − n_o|`} />
        <ResultCard label="Retardance R at 550 nm" tone="yellow" value={`${fix(R550 * 1e9, 1)} nm`} subtext={`interference order ${fix(R550 / 550e-9, 2)}`} />
        <ResultCard label={crossed ? "Extinction positions" : "Darkest positions"} tone="purple" value={darkest} subtext={darkNote} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmission at 550 nm against stage rotation</h3>
          <ChartPanel
            data={[
              { x: curve.stage, y: curve.T, type: "scatter", mode: "lines", name: "T(ρ)", line: { color: "#60a5fa", width: 2 } },
              { x: [rhoDeg], y: [curve.T[rhoDeg]], type: "scatter", mode: "markers", name: "Current ρ", marker: { color: "#fbbf24", size: 9 } },
            ]}
            layout={{
              paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
              xaxis: { title: "Stage rotation ρ (°)", gridcolor: "#374151" }, yaxis: { title: "Transmission T", gridcolor: "#374151" },
              margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300,
            }}
          />
          <p className="text-sm text-gray-300 mt-2">
            {crossed
              ? "Four extinctions per turn, where the section's slow axis is parallel to a polarizer."
              : "With parallel polars T = 1 where an axis is parallel to the polarizer; the four minima are at 45° to it."}
            {red ? " The red plate is a full wave at 550 nm, so it doesn't change this curve; it changes the colours." : ""}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-3">Michel-Lévy colours, crossed polars, section at 45°</h3>
          <div className="relative pt-5">
            <div className="flex h-12 rounded overflow-hidden border border-gray-700" role="img" aria-label={`Interference colours for retardances from 0 to ${STRIP_MAX_NM} nm; the marker is at ${fix(R550 * 1e9, 0)} nm`}>
              {strip.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
            </div>
            <span className="absolute top-0 -translate-x-1/2 text-yellow-400 text-sm leading-none" style={{ left: `${markerX}%` }} aria-hidden="true">▼</span>
            <div className="relative h-10 mt-1 text-xs text-gray-400">
              {[0, 550, 1100, 1650].map((nm) => (
                <span key={nm} className={`absolute whitespace-nowrap ${nm === 0 ? "" : "-translate-x-1/2"}`} style={{ left: `${(nm / STRIP_MAX_NM) * 100}%` }}>{orderLabel(nm)}</span>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-300 mt-2">Marker: this section at R = {fix(R550 * 1e9, 0)} nm{R550 * 1e9 > STRIP_MAX_NM ? " (beyond the strip)" : ""}. Each strip colour comes from the full spectrum, not from a table.</p>
        </div>
      </div>
    </>
  );
}
