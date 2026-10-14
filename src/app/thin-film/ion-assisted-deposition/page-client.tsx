"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { IAD_MATERIALS, iadParameters, type IadMaterialId } from "../../../physics/thin-film/ion-assisted-deposition";

const IDS = Object.keys(IAD_MATERIALS) as IadMaterialId[];
const isId = (s: string): s is IadMaterialId => Object.hasOwn(IAD_MATERIALS, s);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtExp = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toExponential(digits)}${unit}` : "—");

export default function IonAssistedDepositionPage() {
  const [materialParam, setMaterial] = useURLState("material", "SiO2");
  const [ionEnergy, setIonEnergy] = useURLState("ionEnergy", 300); // eV
  const [currentDensity, setCurrentDensity] = useURLState("ionCurrentDensity", 50); // µA/cm²
  const [depositionRate, setDepositionRate] = useURLState("depositionRate", 0.5); // nm/s
  const [ionMass, setIonMass] = useURLState("ionMass", 40); // u
  const [densityParam, setDensity] = useURLState("density", 0); // g/cm³, 0 = bulk value of the material

  const id: IadMaterialId = isId(materialParam) ? materialParam : "SiO2";
  const bulk = IAD_MATERIALS[id];
  // A quartz-crystal monitor reports r = mass rate / ρ_set, so ρ_set fixes the molecule arrival rate.
  const useBulk = densityParam === 0;
  const mat = useMemo(() => ({ ...bulk, rho: useBulk ? bulk.rho : densityParam * 1e3 }), [bulk, useBulk, densityParam]);
  const errors = [
    !(ionEnergy >= 0) && "the ion energy can't be negative",
    !(currentDensity >= 0) && "the ion current density can't be negative",
    !(depositionRate > 0) && "the deposition rate must be positive",
    !(ionMass > 0) && "the ion mass must be positive",
    !(densityParam >= 0) && "the density can't be negative",
  ].filter((e): e is string => typeof e === "string");
  const valid = errors.length === 0;

  // µA/cm² → A/m²: × 1e-6 × 1e4 = × 1e-2; nm/s → m/s: × 1e-9.
  const r = useMemo(
    () => (valid ? iadParameters(ionEnergy, ionMass, currentDensity * 1e-2, depositionRate * 1e-9, mat) : null),
    [valid, ionEnergy, ionMass, currentDensity, depositionRate, mat],
  );

  const sweepData = useMemo(() => {
    // Log axes: nothing to draw when the ion flux or energy is zero.
    if (!valid || currentDensity * ionEnergy === 0) return [];
    const hi = Math.max(2, 2 * depositionRate);
    const rates: number[] = [];
    const energies: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const rate = 0.025 * hi + (0.975 * hi * i) / 120; // nm/s
      const p = iadParameters(ionEnergy, ionMass, currentDensity * 1e-2, rate * 1e-9, mat);
      rates.push(rate);
      energies.push(p.energyPerMolecule);
    }
    return [
      // Ions per molecule is this curve divided by E, so it isn't drawn too.
      { x: rates, y: energies, type: "scatter" as const, mode: "lines" as const, name: "Energy per molecule", line: { color: "#60a5fa" } },
    ];
  }, [valid, ionEnergy, ionMass, currentDensity, depositionRate, mat]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Film material</span>
          <select value={id} onChange={(e) => setMaterial(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {IDS.map((k) => <option key={k} value={k}>{IAD_MATERIALS[k].name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Mean ion energy (eV; not the anode voltage)" value={ionEnergy} onChange={setIonEnergy} min={0} step="10" />
        <ValidatedNumberInput label="Ion current density at the substrate (µA/cm²)" value={currentDensity} onChange={setCurrentDensity} min={0} step="5" />
        <ValidatedNumberInput label="Deposition rate (nm/s)" value={depositionRate} onChange={setDepositionRate} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Ion mass (u; Ar⁺ 40, O₂⁺ 32)" value={ionMass} onChange={setIonMass} min={1} step="1" />
        <ValidatedNumberInput label="Density set in the rate monitor (g/cm³; 0 = bulk)" value={densityParam} onChange={setDensity} min={0} step="0.1" />
      </div>

      <p className="text-gray-500 mb-6 text-xs">
        {bulk.name}: M = {fmt(bulk.M * 1e3, 2)} g/mol, bulk ρ = {fmt(bulk.rho / 1e3, 2)} g/cm³ (crystalline for TiO₂, Al₂O₃), {bulk.atoms} atoms
        per formula unit. Singly charged ions; the current density is the one measured at the substrate (Faraday cup), not the
        source current. A Faraday cup misses the fast neutrals made by charge exchange, and a doubly charged ion counts twice.
      </p>

      {errors.length > 0 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">No result: {errors.join("; ")}.</p>
      )}

      {r && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <ResultCard label="Ions per arriving molecule" value={fmt(r.ratio, 3)} tone="yellow" subtext="ion-to-molecule arrival ratio" />
          <ResultCard label="Ion energy per molecule" value={fmt(r.energyPerMolecule, 1, " eV")} tone="green" subtext={`${fmt(r.energyPerAtom, 1, " eV")} per atom`} />
          <ResultCard label="Ion momentum per molecule" value={fmt(r.momentumPerMolecule, 1, " √(u·eV)")} tone="cyan" subtext="ratio × √(2 m_i E)" />
          <ResultCard label="Ion flux" value={fmtExp(r.ionFlux, 2, " m⁻² s⁻¹")} subtext="J / e" />
          <ResultCard label="Molecule arrival rate" value={fmtExp(r.moleculeFlux, 2, " m⁻² s⁻¹")} subtext={`r ρ N_A / M, ρ = ${fmt(mat.rho / 1e3, 2)} g/cm³${useBulk ? " (bulk)" : ""}`} />
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Model</p>
        <p>Φ<sub>i</sub> = J/e; Φ<sub>m</sub> = r ρ N<sub>A</sub>/M; ratio = Φ<sub>i</sub>/Φ<sub>m</sub></p>
        <p>E per molecule = ratio × E<sub>ion</sub>; momentum per molecule = ratio × √(2 m<sub>i</sub> E<sub>ion</sub>)</p>
        <p className="mt-2">
          IAD results (packing density, index, stress) are reported against these numbers, but how a film responds depends on the
          material, the ion species and the chamber, so the page doesn&apos;t predict them. Φ<sub>m</sub> needs the mass rate: with a
          quartz-crystal monitor that is the displayed rate times the density set in it, whatever the film&apos;s porosity. For a
          rate from measured thickness and time, enter the film&apos;s own density, which is below bulk for a porous film.
        </p>
      </div>

      {valid && currentDensity * ionEnergy === 0 && (
        <p className="mb-4 text-sm text-gray-400">No chart: with no ion current or zero ion energy every value is zero.</p>
      )}

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Deposition rate (nm/s)", gridcolor: "#374151" },
        yaxis: { title: "Energy per molecule (eV)", gridcolor: "#374151", type: "log" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
      }} />
    </>
  );
}
