"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  biaxialStrain, biaxialStrainEnergy, curvatureFromDeflection, stoneyStress, thermalMismatchStress,
} from "../../../physics/thin-film/stoney";

// Stoney's thin-film assumption, as a rule of thumb for the warning.
const MAX_THICKNESS_RATIO = 0.1;

const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e6 ? x.toPrecision(digits) : x.toExponential(3);
const kind = (sigma: number) => (sigma > 0 ? "tensile" : sigma < 0 ? "compressive" : "zero");

export default function StressMeasurementPage() {
  // Substrate
  const [radius, setRadius] = useURLState("radius", 25); // mm, radius over which the deflection is measured
  const [substrateThickness, setSubstrateThickness] = useURLState("substrateThickness", 0.5); // mm
  const [youngsModulus, setYoungsModulus] = useURLState("youngsModulus", 70); // GPa
  const [poissonRatio, setPoissonRatio] = useURLState("poissonRatio", 0.22);
  const [alphaSub, setAlphaSub] = useURLState("alphaSub", 9); // ppm/K
  // Film
  const [thickness, setThickness] = useURLState("thickness", 100); // nm
  const [filmModulus, setFilmModulus] = useURLState("filmModulus", 70); // GPa
  const [filmPoisson, setFilmPoisson] = useURLState("filmPoisson", 0.17);
  const [alphaFilm, setAlphaFilm] = useURLState("alphaFilm", 0.5); // ppm/K
  // Measurement
  const [deflectionBefore, setDeflectionBefore] = useURLState("deflectionBeforeUm", 0); // µm
  const [deflection, setDeflection] = useURLState("deflectionUm", 1); // µm, + = film side concave
  const [depositionTemp, setDepositionTemp] = useURLState("depositionTemp", 200); // °C
  const [temperature, setTemperature] = useURLState("temperature", 25); // °C

  const results = useMemo(() => {
    const a = radius * 1e-3;
    const tf = thickness * 1e-9;
    const ts = substrateThickness * 1e-3;
    const Es = youngsModulus * 1e9;
    const Ef = filmModulus * 1e9;
    const thermalAt = (T: number) => thermalMismatchStress(Ef, filmPoisson, alphaSub * 1e-6, alphaFilm * 1e-6, T, depositionTemp);

    const kappaBefore = curvatureFromDeflection(deflectionBefore * 1e-6, a);
    const kappaAfter = curvatureFromDeflection(deflection * 1e-6, a);
    const deltaKappa = kappaAfter - kappaBefore;
    const stress = stoneyStress(deltaKappa, tf, Es, poissonRatio, ts);
    const thermal = thermalAt(temperature);
    return {
      deltaKappa,
      stress,
      thermal,
      intrinsic: stress - thermal,
      thermalAt,
      forcePerWidth: stress * tf,
      strain: biaxialStrain(stress, Ef, filmPoisson),
      energy: biaxialStrainEnergy(stress, tf, Ef, filmPoisson),
      thicknessRatio: tf / ts,
    };
  }, [radius, thickness, substrateThickness, youngsModulus, poissonRatio, filmModulus, filmPoisson, alphaSub, alphaFilm,
    deflectionBefore, deflection, depositionTemp, temperature]);

  const temperatureData = useMemo(() => {
    const tMin = Math.min(-50, temperature);
    const tMax = Math.max(depositionTemp, temperature) + 50;
    const temps = Array.from({ length: 101 }, (_, i) => tMin + (i * (tMax - tMin)) / 100);
    const thermal = temps.map((T) => results.thermalAt(T) / 1e6);
    return [
      { x: temps, y: thermal.map((s) => s + results.intrinsic / 1e6), type: "scatter", mode: "lines", name: "Total (intrinsic + thermal)", line: { color: "#f87171", width: 2 } },
      { x: temps, y: thermal, type: "scatter", mode: "lines", name: "Thermal mismatch", line: { color: "#60a5fa", width: 1.5, dash: "dash" } },
      { x: [temperature], y: [results.stress / 1e6], type: "scatter", mode: "markers", name: "Measured", marker: { color: "#fbbf24", size: 8 } },
    ];
  }, [results, temperature, depositionTemp]);

  const R = Math.abs(1 / results.deltaKappa);

  return (
    <>
      <h3 className="text-lg font-semibold mb-3">Substrate</h3>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Measurement radius a (mm)" value={radius} onChange={setRadius} min={0.1} max={1000} step="0.5" />
        <ValidatedNumberInput label={<>Thickness t<sub>s</sub> (mm)</>} value={substrateThickness} onChange={setSubstrateThickness} min={0.001} max={100} step="0.05" />
        <ValidatedNumberInput label={<>Young&apos;s modulus E<sub>s</sub> (GPa)</>} value={youngsModulus} onChange={setYoungsModulus} min={0.1} max={1500} step="1" />
        <ValidatedNumberInput label={<>Poisson&apos;s ratio ν<sub>s</sub></>} value={poissonRatio} onChange={setPoissonRatio} min={0} max={0.5} step="0.01" />
        <ValidatedNumberInput label={<>Expansion α<sub>s</sub> (ppm/K)</>} value={alphaSub} onChange={setAlphaSub} min={-10} max={50} step="0.1" />
      </div>
      <h3 className="text-lg font-semibold mb-3">Film</h3>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label={<>Thickness t<sub>f</sub> (nm)</>} value={thickness} onChange={setThickness} min={0.1} max={1e6} step="1" />
        <ValidatedNumberInput label={<>Young&apos;s modulus E<sub>f</sub> (GPa)</>} value={filmModulus} onChange={setFilmModulus} min={0.1} max={1500} step="1" />
        <ValidatedNumberInput label={<>Poisson&apos;s ratio ν<sub>f</sub></>} value={filmPoisson} onChange={setFilmPoisson} min={0} max={0.5} step="0.01" />
        <ValidatedNumberInput label={<>Expansion α<sub>f</sub> (ppm/K)</>} value={alphaFilm} onChange={setAlphaFilm} min={-10} max={50} step="0.1" />
      </div>
      <h3 className="text-lg font-semibold mb-3">Measurement</h3>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Center deflection before (µm)" value={deflectionBefore} onChange={setDeflectionBefore} min={-10000} max={10000} step="0.1" />
        <ValidatedNumberInput label="Center deflection after (µm)" value={deflection} onChange={setDeflection} min={-10000} max={10000} step="0.1" />
        <ValidatedNumberInput label="Deposition temp (°C)" value={depositionTemp} onChange={setDepositionTemp} min={-273} max={2000} step="10" />
        <ValidatedNumberInput label="Measurement temp (°C)" value={temperature} onChange={setTemperature} min={-273} max={2000} step="1" />
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Deflection is the bow of the center relative to the edge of the measured radius; positive means the film side is
        concave, which a tensile film produces.
      </p>

      {results.thicknessRatio >= MAX_THICKNESS_RATIO && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          t<sub>f</sub>/t<sub>s</sub> = {fmt(results.thicknessRatio, 3)}: Stoney assumes a film much thinner than the
          substrate, so the stress shown is only approximate.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard
          label="Film stress"
          value={`${fmt(results.stress / 1e6)} MPa`}
          tone={results.stress > 0 ? "red" : "green"}
          subtext={kind(results.stress)}
        />
        <ResultCard label="Thermal mismatch stress" value={`${fmt(results.thermal / 1e6)} MPa`} tone="blue" subtext={`${kind(results.thermal)}, at ${temperature} °C`} />
        <ResultCard label="Intrinsic stress" value={`${fmt(results.intrinsic / 1e6)} MPa`} tone="purple" subtext={kind(results.intrinsic)} />
        <ResultCard
          label="Curvature change Δκ"
          value={`${fmt(results.deltaKappa)} m⁻¹`}
          tone="gray"
          subtext={Number.isFinite(R) ? `R = ${R >= 1e4 ? `${fmt(R / 1000)} km` : `${fmt(R)} m`}` : "R = ∞ (flat)"}
        />
        <ResultCard label="Force per width (σ·t)" value={`${fmt(results.forcePerWidth)} N/m`} tone="yellow" />
        <ResultCard
          label="Film strain"
          value={`${fmt(results.strain * 1e6)} µε`}
          tone="cyan"
          subtext={`Stored energy ${fmt(results.energy * 1e3)} mJ/m²`}
        />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Film Stress vs Temperature</h3>
        <ChartPanel data={temperatureData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Temperature (°C)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Stress (MPa, tensile > 0)", gridcolor: "#374151", color: "#9ca3af" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
        }} />
        <p className="text-sm text-gray-400 mt-2">
          The intrinsic stress is assumed constant; the thermal part changes linearly with temperature (constant α, E, ν).
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">σ<sub>f</sub> = E<sub>s</sub> t<sub>s</sub>² Δκ / (6 (1 − ν<sub>s</sub>) t<sub>f</sub>),   κ = 2h / (a² + h²)</p>
          <p className="font-mono">σ<sub>th</sub> = E<sub>f</sub>/(1 − ν<sub>f</sub>) · (α<sub>s</sub> − α<sub>f</sub>)(T − T<sub>dep</sub>),   σ<sub>intrinsic</sub> = σ<sub>f</sub> − σ<sub>th</sub></p>
          <p className="font-mono">ε = σ<sub>f</sub>(1 − ν<sub>f</sub>)/E<sub>f</sub>,   U = σ<sub>f</sub>² t<sub>f</sub> (1 − ν<sub>f</sub>)/E<sub>f</sub></p>
          <p>
            Stoney&apos;s equation with the substrate&apos;s biaxial modulus (Stoney 1909; Janssen et al., Thin Solid Films 517,
            1858, 2009), using the change of curvature between the two deflection measurements (spherical cap). Thermal
            mismatch for a film on a much thicker substrate (Freund &amp; Suresh, Thin Film Materials, 2003).
          </p>
          <p>
            Textbook approximation: t<sub>f</sub> ≪ t<sub>s</sub>, deflection small compared with t<sub>s</sub>, uniform
            equibiaxial stress, isotropic substrate. For Si(001) wafers, E = 130 GPa and ν = 0.28 give the biaxial modulus
            E/(1 − ν) ≈ 180 GPa.
          </p>
        </div>
      </div>
    </>
  );
}
