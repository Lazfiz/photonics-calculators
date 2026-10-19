"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stokesWavelength } from "../../../physics/spectroscopy/raman";
import {
  sersEnhancement, silverPermittivity, silverSphereResonance, sphereFieldEnhancement,
} from "../../../physics/spectroscopy/sers";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const sci = (x: number) => (Number.isFinite(x) ? x.toPrecision(3) : "—");
const fix = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const perCm = 100; // 1 cm⁻¹ in 1/m
const WL_MIN = 300, WL_MAX = 1500;

export default function SurfaceEnhancedRamanPage() {
  const [laserRaw, setLaser] = useURLState("laserWavelength", 405);
  const [shiftRaw, setShift] = useURLState("ramanShift", 1000);
  const [radiusRaw, setRadius] = useURLState("radius", 10);
  const [distanceRaw, setDistance] = useURLState("distance", 0);
  const [nRaw, setN] = useURLState("mediumIndex", 1.33);

  const laserNm = clamp(laserRaw, WL_MIN, WL_MAX, 405);
  const shiftCm = clamp(shiftRaw, 0, 4000, 1000);
  const radiusNm = clamp(radiusRaw, 2, 100, 10);
  const distanceNm = clamp(distanceRaw, 0, 50, 0);
  const nm = clamp(nRaw, 1, 2, 1.33);
  const epsM = nm * nm;
  const a = radiusNm * 1e-9, d = distanceNm * 1e-9;

  const lambdaL = laserNm * 1e-9;
  const lambdaR = stokesWavelength(lambdaL, shiftCm * perCm);
  const epsL = silverPermittivity(lambdaL);
  const epsR = silverPermittivity(lambdaR);
  const field = sphereFieldEnhancement(epsL, epsM, a, d);
  const ef = sersEnhancement(epsL, epsR, epsM, a, d);
  const resonanceNm = silverSphereResonance(epsM) * 1e9;
  const sizeParameter = (2 * Math.PI * nm * a) / lambdaL;
  const quasistaticOk = sizeParameter <= Math.PI / 10; // diameter ≤ λ/(10 n)

  const efAt = (lambda: number, dist: number) =>
    sersEnhancement(silverPermittivity(lambda), silverPermittivity(stokesWavelength(lambda, shiftCm * perCm)), epsM, a, dist);
  const round = (y: number) => Number(y.toPrecision(4));
  const wls = Array.from({ length: 301 }, (_, i) => 300 + 2 * i);
  const spectrum = wls.map((w) => ({ w, e: efAt(w * 1e-9, d) }));
  const spectrumSeries = [
    { name: "EF at the pole (max)", color: "#60a5fa", points: spectrum.map(({ w, e }) => ({ x: w, y: round(e.max) })) },
    { name: "EF averaged over the surface", color: "#34d399", points: spectrum.map(({ w, e }) => ({ x: w, y: round(e.average) })) },
    ...(laserNm <= 900 ? [{ name: "Current", color: "#fbbf24", showPoints: true, points: [{ x: laserNm, y: round(ef.max) }, { x: laserNm, y: round(ef.average) }] }] : []),
  ];
  const dists = Array.from({ length: 101 }, (_, i) => 0.2 * i);
  const decay = dists.map((x) => ({ x, e: efAt(lambdaL, x * 1e-9) }));
  const decaySeries = [
    { name: "EF at the pole (max)", color: "#60a5fa", points: decay.map(({ x, e }) => ({ x, y: round(e.max) })) },
    { name: "EF averaged over the surface", color: "#34d399", points: decay.map(({ x, e }) => ({ x, y: round(e.average) })) },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser wavelength λ_L (nm)" value={laserRaw} onChange={setLaser} min={WL_MIN} max={WL_MAX} />
        <ValidatedNumberInput label="Raman shift (cm⁻¹)" value={shiftRaw} onChange={setShift} min={0} max={4000} />
        <ValidatedNumberInput label="Silver sphere radius a (nm)" value={radiusRaw} onChange={setRadius} min={2} max={100} />
        <ValidatedNumberInput label="Molecule distance from the surface d (nm)" value={distanceRaw} onChange={setDistance} min={0} max={50} step="0.1" />
        <ValidatedNumberInput label="Surrounding medium index n_m" value={nRaw} onChange={setN} min={1} max={2} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <ResultCard label="SERS EF, molecule at the pole" value={sci(ef.max)} tone="blue" subtext="|E_L/E₀|² · |E_R/E₀|², maximum on the sphere" />
        <ResultCard label="SERS EF, surface average" value={sci(ef.average)} tone="green" subtext="Molecules spread evenly over the sphere" />
        <ResultCard label="Local intensity |E/E₀|² at λ_L" value={`${sci(field.pole)} (pole)`} tone="yellow" subtext={`${sci(field.equator)} at the equator`} />
        <ResultCard label="Raman (Stokes) wavelength λ_R" value={`${fix(lambdaR * 1e9, 2)} nm`} tone="purple" />
        <ResultCard label="Silver ε at λ_L / λ_R" value={`${fix(epsL.re, 2)} + ${fix(epsL.im, 2)}i`} tone="gray" subtext={`${fix(epsR.re, 2)} + ${fix(epsR.im, 2)}i at λ_R (Yang et al. 2015)`} />
        <ResultCard label="Dipole resonance (Re ε = −2ε_m)" value={`${fix(resonanceNm, 1)} nm`} tone="orange" subtext={`Quasistatic, in n_m = ${fix(nm, 2)}`} />
      </div>
      {!quasistaticOk && (
        <p className="mb-4 text-sm text-amber-300" role="status">
          The diameter {fix(2 * radiusNm, 0)} nm exceeds λ/(10 n_m) = {fix(laserNm / (10 * nm), 0)} nm (size parameter{" "}
          {fix(sizeParameter, 2)}). Retardation and radiation damping then red-shift, broaden and weaken the real
          resonance, so these quasistatic values are too high near it; use Mie theory.
        </p>
      )}
      <p className="mb-8 text-sm text-gray-400">
        The enhancement factor of an isolated sphere is set by silver&apos;s permittivity and the medium, not by the
        radius: the radius only sets how fast the field decays away from the surface, as (a/(a + d))³ in the field.
        Gaps between particles (hot spots) give far larger but very local enhancements, which this model does not cover.
      </p>

      <SimpleLineChart title="Enhancement factor vs laser wavelength (Raman shift fixed)" xLabel="Laser wavelength (nm)" yLabel="SERS EF" yScale="log" series={spectrumSeries} />
      <div className="mt-6">
        <SimpleLineChart title={`Enhancement factor vs distance from the surface at ${fix(laserNm, 0)} nm`} xLabel="Distance d (nm)" yLabel="SERS EF" yScale="log" series={decaySeries} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">g = (ε − ε_m)/(ε + 2ε_m), s = (a/(a + d))³</p>
        <p className="font-mono text-yellow-400">|E/E₀|² = |1 + 2gs|² cos²θ + |1 − gs|² sin²θ</p>
        <p className="font-mono text-green-400">EF ≈ |E(λ_L)/E₀|² · |E(λ_R)/E₀|² (the |E|⁴ approximation)</p>
        <p className="font-mono text-green-400">⟨EF⟩ = A_L A_R/5 + 8 B_L B_R/15 + 2(A_L B_R + B_L A_R)/15, A = |1 + 2gs|², B = |1 − gs|²</p>
        <p>
          A metal sphere much smaller than the wavelength acts as a dipole. Near the resonance, where Re ε = −2ε_m, the
          field at its poles grows by about 6ε_m/Im ε, and the Raman signal of a molecule there grows by about the
          square of the intensity enhancement, once at the laser and once at the Raman wavelength. Chemical (charge-transfer)
          enhancement adds to this and is not modelled. Silver data: Yang et al. (2015), template-stripped
          films; colloids and thin films are lossier, and spheres below about 10 nm add surface damping.
        </p>
      </div>
    </>
  );
}
