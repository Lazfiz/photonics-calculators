"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { blackbodyBandFraction, planckExitance } from "../../../physics/blackbody";
import { sigma_SB } from "../../../physics/constants";
import { opaqueEmittance, totalNormalEmittance, type CoatingLayer, type Substrate } from "../../../physics/thin-film/low-emissivity";

const NM = 1e-9;
const UM = 1e-6;
const METALS = ["Ag", "Al", "Cr"] as const;
type Metal = (typeof METALS)[number];
const isMetal = (s: string): s is Metal => (METALS as readonly string[]).includes(s);

const selectClass = "mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white";

export default function EmissivityControlPage() {
  const [sub, setSub] = useURLState("sub", "dielectric");
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [kSub, setKSub] = useURLState("kSub", 0);
  const [film, setFilm] = useURLState("film", "Ag");
  const [filmThick, setFilmThick] = useURLState("filmThick", 10);
  const [nCoat, setNCoat] = useURLState("nCoat", 2.0);
  const [coatThick, setCoatThick] = useURLState("coatThick", 40);
  const [temp, setTemp] = useURLState("temp", 300);
  const [bandLo, setBandLo] = useURLState("bandLo", 2.5);
  const [bandHi, setBandHi] = useURLState("bandHi", 50);

  const substrate = useMemo<Substrate>(() => (isMetal(sub) ? { material: sub } : { material: "dielectric", n: nSub, k: kSub }), [sub, nSub, kSub]);
  const coating = useMemo<CoatingLayer[]>(() => {
    const layers: CoatingLayer[] = [];
    if (coatThick > 0) layers.push({ material: "dielectric", n: nCoat, thickness: coatThick * NM });
    if (isMetal(film) && filmThick > 0) layers.push({ material: film, thickness: filmThick * NM });
    return layers;
  }, [film, filmThick, nCoat, coatThick]);

  const valid =
    (isMetal(sub) || (nSub > 0 && kSub >= 0)) && nCoat > 0 && filmThick >= 0 && coatThick >= 0 &&
    temp >= 50 && temp <= 3000 && bandLo >= 0.3 && bandHi > bandLo && bandHi <= 1000;

  const results = useMemo(() => {
    if (!valid) return null;
    const eps = totalNormalEmittance(coating, substrate, temp, bandLo * UM, bandHi * UM);
    const epsBare = totalNormalEmittance([], substrate, temp, bandLo * UM, bandHi * UM);
    const fraction = blackbodyBandFraction(bandLo * UM, bandHi * UM, temp);
    const blackInBand = fraction * sigma_SB * temp ** 4;
    return { eps, epsBare, fraction, emitted: eps * blackInBand, emittedBare: epsBare * blackInBand };
  }, [valid, coating, substrate, temp, bandLo, bandHi]);

  const spectrum = useMemo(() => {
    if (!valid) return null;
    const x = Array.from({ length: 241 }, (_, i) => bandLo * (bandHi / bandLo) ** (i / 240));
    const M = x.map((um) => planckExitance(um * UM, temp));
    const peak = M.reduce((a, b) => Math.max(a, b), 0);
    return {
      x,
      eps: x.map((um) => opaqueEmittance(coating, substrate, um * UM)),
      bare: x.map((um) => opaqueEmittance([], substrate, um * UM)),
      planck: M.map((m) => m / peak),
    };
  }, [valid, coating, substrate, temp, bandLo, bandHi]);

  const wm2 = (x: number) => (Number.isFinite(x) ? `${x.toFixed(x < 10 ? 2 : 1)} W/m²` : "—");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Opaque substrate</span>
          <select value={sub} onChange={(e) => setSub(e.target.value)} className={selectClass}>
            <option value="dielectric">Index n + iκ (glass, oxide, paint…)</option>
            <option value="Ag">Silver (Yang 2015)</option>
            <option value="Al">Aluminium (Rakić LD)</option>
            <option value="Cr">Chromium (Rakić LD)</option>
          </select>
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Metal film on it</span>
          <select value={isMetal(film) ? film : "none"} onChange={(e) => setFilm(e.target.value)} className={selectClass}>
            <option value="Ag">Silver</option>
            <option value="Al">Aluminium</option>
            <option value="Cr">Chromium</option>
            <option value="none">None</option>
          </select>
        </label>
        {!isMetal(sub) && (
          <>
            <ValidatedNumberInput label={<>Substrate n (thermal IR)</>} value={nSub} onChange={setNSub} min={0.01} max={10} step="0.01" />
            <ValidatedNumberInput label={<>Substrate κ (thermal IR)</>} value={kSub} onChange={setKSub} min={0} max={100} step="0.01" />
          </>
        )}
        <ValidatedNumberInput label="Metal film thickness (nm)" value={filmThick} onChange={setFilmThick} min={0} max={1000} step="1" />
        <ValidatedNumberInput label={<>Overcoat n (on top)</>} value={nCoat} onChange={setNCoat} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Overcoat thickness (nm)" value={coatThick} onChange={setCoatThick} min={0} max={10000} step="1" />
        <ValidatedNumberInput label="Surface temperature (K)" value={temp} onChange={setTemp} min={50} max={3000} step="1" />
        <ValidatedNumberInput label="Band from (µm)" value={bandLo} onChange={setBandLo} min={0.3} max={1000} step="0.1" />
        <ValidatedNumberInput label="Band to (µm)" value={bandHi} onChange={setBandHi} min={0.3} max={1000} step="1" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set positive indices (κ ≥ 0), non-negative thicknesses, 50–3000 K and a band within 0.3–1000 µm.</p>}

      {results && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Normal emittance ε<sub>n</sub>, coated</p>
            <p className="text-2xl font-bold text-red-400">{results.eps.toFixed(3)}</p>
            <p className="text-sm text-gray-500 mt-1">Bare substrate: {results.epsBare.toFixed(3)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Emitted in the band</p>
            <p className="text-2xl font-bold text-amber-400">{wm2(results.emitted)}</p>
            <p className="text-sm text-gray-500 mt-1">Bare: {wm2(results.emittedBare)} (ε<sub>n</sub> · F · σT⁴, normal-emittance estimate)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Blackbody power in the band</p>
            <p className="text-2xl font-bold text-blue-400">{(results.fraction * 100).toFixed(1)} %</p>
            <p className="text-sm text-gray-500 mt-1">of σT⁴ = {wm2(sigma_SB * temp ** 4)} at {temp} K</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300 text-xs">
          Kirchhoff&apos;s law: at each wavelength and direction a surface emits as well as it absorbs, ε(λ) = A(λ). The substrate is
          taken as opaque (it absorbs everything the coating lets into it), so A = 1 − R and ε<sub>n</sub> is the Planck-weighted 1 − R
          at normal incidence over the band. That holds for metals and for glass or oxides thick enough to absorb in the thermal IR; for a
          substrate that is transparent there (Si or Ge at 10 µm, say) light passes through instead, ε is lower and this page overstates
          it. A thin metal film is the low-e layer: its free electrons reflect the thermal IR. The overcoat is lossless with a constant
          index; real oxides absorb in parts of the thermal IR, which adds emittance. Ag uses the n, k Yang et al. (2015) measured on
          template-stripped silver (a matched Drude term beyond 24.9 µm), Al and Cr the Rakić et al. (1998) Lorentz–Drude model; real
          films, thin ones above all, emit more. Hemispherical emittance, which radiative heat
          loss uses, differs from ε<sub>n</sub>: higher for metals, lower for dielectrics.
        </p>
      </div>

      {spectrum && (
        <ChartPanel title="Spectral emittance" data={[
          { x: spectrum.x, y: spectrum.eps, type: "scatter", mode: "lines", name: "ε, coated", line: { color: "#f87171" } },
          { x: spectrum.x, y: spectrum.bare, type: "scatter", mode: "lines", name: "ε, bare", line: { color: "#9ca3af", dash: "dash" } },
          { x: spectrum.x, y: spectrum.planck, type: "scatter", mode: "lines", name: `Planck, ${temp} K`, line: { color: "#fbbf24", dash: "dot" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (µm)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "ε, Planck (peak = 1)", gridcolor: "#374151", range: [0, 1.02] },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
