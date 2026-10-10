"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { intervalStats } from "../../../physics/math";
import { biaxialStrainEnergy, deflectionFromCurvature, delaminationThickness, stoneyCurvature } from "../../../physics/thin-film/stoney";
import { quarterWaveStackReflectance, stackResponse } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");

export default function HardCoatingPage() {
  const [nCoat, setNCoat] = useURLState("nCoat", 2.1);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [thickness, setThickness] = useURLState("thickness", 200);
  // Stress in MPa, tensile > 0 (the usual thin-film sign). New key: the old "stressGPa" had the sign the other way.
  const [stressMPa, setStressMPa] = useURLState("stressMPa", -500);
  const [Ef, setEf] = useURLState("Ef", 150);
  const [nuF, setNuF] = useURLState("nuF", 0.25);
  const [toughness, setToughness] = useURLState("toughness", 5);
  const [Es, setEs] = useURLState("Es", 72);
  const [nuS, setNuS] = useURLState("nuS", 0.22);
  const [tSubMm, setTSubMm] = useURLState("tSub", 1);
  const [diamMm, setDiamMm] = useURLState("diam", 25);

  const opticsValid = nCoat > 0 && nSub > 0 && thickness >= 0 && designWl >= 200 && designWl <= 5000;
  const mechValid = Ef > 0 && Es > 0 && nuF < 0.5 && nuF >= 0 && nuS < 0.5 && nuS >= 0 && toughness > 0 && tSubMm > 0 && diamMm > 0;
  const lambda0 = designWl * NM;
  const d = thickness * NM;

  const optics = useMemo(() => {
    if (!opticsValid) return null;
    const coated = (lam: number) => stackResponse({ incident: 1, layers: [{ n: nCoat, thickness: d }], substrate: { n: nSub } }, lam).R;
    const bare = ((nSub - 1) / (nSub + 1)) ** 2;
    const halfWave = designWl / (2 * nCoat);
    const order = Math.max(1, Math.round(thickness / halfWave));
    return {
      R0: coated(lambda0),
      bare,
      vis: intervalStats(coated, 400 * NM, 700 * NM, 300),
      qw: quarterWaveStackReflectance(1, [nCoat], nSub),
      halfWave,
      nearestAbsentee: order * halfWave,
      x: Array.from({ length: 601 }, (_, i) => 300 + i),
      coated,
    };
  }, [opticsValid, nCoat, nSub, d, designWl, thickness, lambda0]);

  const spectrum = useMemo(() => (optics ? optics.x.map((w) => optics.coated(w * NM)) : null), [optics]);

  const mech = useMemo(() => {
    if (!mechValid) return null;
    const sigma = stressMPa * 1e6, E_f = Ef * 1e9, E_s = Es * 1e9, tS = tSubMm * 1e-3;
    const kappa = stoneyCurvature(sigma, d, E_s, nuS, tS);
    return {
      kappa,
      bow: deflectionFromCurvature(kappa, (diamMm * 1e-3) / 2),
      U: biaxialStrainEnergy(sigma, d, E_f, nuF),
      tc: delaminationThickness(toughness, sigma, E_f, nuF),
    };
  }, [mechValid, stressMPa, Ef, Es, nuF, nuS, tSubMm, diamMm, toughness, d]);

  const highIndex = nCoat * nCoat > nSub;

  return (
    <>
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Optics</h3>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label={<>n<sub>coating</sub></>} value={nCoat} onChange={setNCoat} min={1} max={4} step="0.01" />
        <ValidatedNumberInput label="Thickness (nm)" value={thickness} onChange={setThickness} min={0} max={20000} step="1" />
        <ValidatedNumberInput label="Design wavelength λ₀ (nm)" value={designWl} onChange={setDesignWl} min={200} max={5000} step="1" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={4} step="0.01" />
      </div>
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Stress and adhesion</h3>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Film stress σ (MPa, tensile > 0, compressive < 0)" value={stressMPa} onChange={setStressMPa} min={-10000} max={10000} step="10" />
        <ValidatedNumberInput label="Interface toughness Γ (J/m²)" value={toughness} onChange={setToughness} min={0.01} max={1000} step="0.1" />
        <ValidatedNumberInput label={<>Film modulus E<sub>f</sub> (GPa)</>} value={Ef} onChange={setEf} min={1} max={1200} step="1" />
        <ValidatedNumberInput label={<>Film Poisson ratio ν<sub>f</sub></>} value={nuF} onChange={setNuF} min={0} max={0.49} step="0.01" />
        <ValidatedNumberInput label={<>Substrate modulus E<sub>s</sub> (GPa)</>} value={Es} onChange={setEs} min={1} max={1200} step="1" />
        <ValidatedNumberInput label={<>Substrate Poisson ratio ν<sub>s</sub></>} value={nuS} onChange={setNuS} min={0} max={0.49} step="0.01" />
        <ValidatedNumberInput label="Substrate thickness (mm)" value={tSubMm} onChange={setTSubMm} min={0.01} max={100} step="0.1" />
        <ValidatedNumberInput label="Substrate diameter (mm)" value={diamMm} onChange={setDiamMm} min={1} max={1000} step="1" />
      </div>

      {!opticsValid && <p className="text-yellow-400 text-sm mb-4">Optics: set positive indices, a thickness ≥ 0 and λ₀ in 200–5000 nm.</p>}
      {!mechValid && <p className="text-yellow-400 text-sm mb-4">Stress: set positive moduli, toughness and sizes, and Poisson ratios in 0–0.49.</p>}

      {optics && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">R at λ₀ (coated face)</p>
            <p className="text-2xl font-bold text-blue-400">{pct(optics.R0)}</p>
            <p className="text-sm text-gray-500 mt-1">Uncoated: {pct(optics.bare)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Mean R, 400–700 nm</p>
            <p className="text-2xl font-bold text-green-400">{pct(optics.vis.mean)}</p>
            <p className="text-sm text-gray-500 mt-1">Range {pct(optics.vis.min)} – {pct(optics.vis.max)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Nearest absentee thickness</p>
            <p className="text-2xl font-bold text-amber-400">{optics.nearestAbsentee.toFixed(1)} nm</p>
            <p className="text-sm text-gray-500 mt-1">Multiples of λ₀/(2n) = {optics.halfWave.toFixed(1)} nm keep R(λ₀) at the uncoated value</p>
          </div>
        </div>
      )}

      {mech && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Substrate bow over the diameter</p>
            <p className="text-2xl font-bold text-blue-400">{Number.isFinite(mech.bow) ? `${(Math.abs(mech.bow) * 1e6).toFixed(3)} µm` : "—"}</p>
            <p className="text-sm text-gray-500 mt-1">
              {mech.kappa === 0 ? "Flat" : `Radius ${(1 / Math.abs(mech.kappa)).toFixed(1)} m, film side ${mech.kappa > 0 ? "concave (tensile)" : "convex (compressive)"}`}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Stored elastic energy U</p>
            <p className="text-2xl font-bold text-green-400">{mech.U.toPrecision(3)} J/m²</p>
            <p className="text-sm text-gray-500 mt-1">(1 − ν<sub>f</sub>)σ²t/E<sub>f</sub>; Γ = {toughness} J/m²</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Thickness where U = Γ</p>
            <p className={`text-2xl font-bold ${thickness * NM < mech.tc ? "text-green-400" : "text-red-400"}`}>
              {Number.isFinite(mech.tc) ? `${(mech.tc * 1e6).toPrecision(3)} µm` : "∞ (no stress)"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {thickness * NM < mech.tc ? "Thinner: it cannot delaminate, whatever its flaws" : "Thicker: it can delaminate from a flaw"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300 text-xs">
          Optics: one lossless layer on the substrate (exact transfer matrix, normal incidence, back face ignored). A quarter wave gives
          R = ((n<sub>s</sub> − n²)/(n<sub>s</sub> + n²))² = {optics ? pct(optics.qw) : "—"} at λ₀, which is{" "}
          {highIndex ? "a reflectance maximum (n > √n_s): a high-index hard coat is not an AR coat" : "an AR minimum (n < √n_s)"}; a half
          wave is absentee. Thick hard coats ripple, so their mean R over the band is what counts. Stress: Stoney&apos;s equation gives the
          substrate curvature 6σt(1 − ν<sub>s</sub>)/(E<sub>s</sub>t<sub>s</sub>²) (film ≪ substrate, small bow); the bow is the sagitta over
          the radius. A debond can&apos;t release more energy per area than the film stores, so a film thinner than t<sub>c</sub> = ΓE
          <sub>f</sub>/((1 − ν<sub>f</sub>)σ²) can&apos;t delaminate (Hutchinson &amp; Suo 1991); above it, compressive films buckle and
          tensile films crack from flaws, at thicknesses that depend on flaw size. Hardness and scratch resistance aren&apos;t modelled.
        </p>
      </div>

      {spectrum && optics && (
        <ChartPanel title="Reflectance of the coated face" data={[
          { x: optics.x, y: spectrum, type: "scatter", mode: "lines", name: "Coated", line: { color: "#f87171" } },
          { x: [300, 900], y: [optics.bare, optics.bare], type: "scatter", mode: "lines", name: "Uncoated", line: { color: "#9ca3af", dash: "dash" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R", gridcolor: "#374151", rangemode: "tozero" },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
