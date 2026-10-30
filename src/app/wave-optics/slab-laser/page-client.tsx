"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  fourLevelGain, fourLevelSlopeEfficiency, fourLevelThreshold, laserOutput, roundTripLoss, saturationIntensity,
} from "../../../physics/wave-optics/laser-resonator";
import { slabTemperatureRise, slabThermalLens, totalInternalReflection, zigzagAngle } from "../../../physics/wave-optics/slab-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const DEG = 180 / Math.PI;

export default function SlabLaserPage() {
  const [widthRaw, setWidth] = useURLState("slabWidth", 10); // mm
  const [thicknessRaw, setThickness] = useURLState("slabHeight", 2); // mm, cooled direction
  const [lengthRaw, setLength] = useURLState("slabLength", 50); // mm
  const [bouncesRaw, setBounces] = useURLState("bounces", 8);
  const [nRaw, setN] = useURLState("n_crystal", 1.82);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1064); // nm
  const [pumpWavelengthRaw, setPumpWavelength] = useURLState("pumpWavelength", 808); // nm
  const [pumpRaw, setPump] = useURLState("pump", 200); // W absorbed
  const [etaPRaw, setEtaP] = useURLState("etaP", 0.8);
  const [rOcRaw, setROc] = useURLState("R_oc", 0.9);
  const [scatterRaw, setScatter] = useURLState("alpha_scatter", 0.002); // 1/cm
  const [sigmaRaw, setSigma] = useURLState("sigma", 2.8); // 1e-19 cm²
  const [tauRaw, setTau] = useURLState("tau", 230); // µs
  const [heatRaw, setHeat] = useURLState("heatFraction", 0.32);
  const [kappaRaw, setKappa] = useURLState("kappa", 14); // W/(m K)
  const [dndTRaw, setDndT] = useURLState("dndT", 7.3); // 1e-6/K

  const W = clamp(widthRaw, 0.1, 1000, 10) * 1e-3;
  const t = clamp(thicknessRaw, 0.05, 100, 2) * 1e-3;
  const L = clamp(lengthRaw, 1, 2000, 50) * 1e-3;
  const N = Math.round(clamp(bouncesRaw, 1, 1000, 8));
  const n = clamp(nRaw, 1.01, 4, 1.82);
  const lambda = clamp(wavelengthRaw, 300, 5000, 1064) * 1e-9;
  const lambdaP = clamp(pumpWavelengthRaw, 200, 5000, 808) * 1e-9;
  const pump = clamp(pumpRaw, 0, 1e6, 200);
  const etaP = clamp(etaPRaw, 0.01, 1, 0.8);
  const R_oc = clamp(rOcRaw, 0.01, 0.9999, 0.9);
  const scatter = clamp(scatterRaw, 0, 10, 0.002) * 100; // 1/m
  const sigma = clamp(sigmaRaw, 1e-4, 1e4, 2.8) * 1e-23; // m²
  const tau = clamp(tauRaw, 1e-3, 1e6, 230) * 1e-6;
  const heat = clamp(heatRaw, 0, 1, 0.32);
  const kappa = clamp(kappaRaw, 0.1, 2000, 14);
  const dndT = clamp(dndTRaw, -100, 100, 7.3) * 1e-6;

  const theta = zigzagAngle(L, t, N);
  const tir = totalInternalReflection(theta, n);
  const pathLength = L / Math.cos(theta);
  // Uniform inversion over the slab volume W t L, integrated along the zigzag L/cos θ: area A = W t cos θ.
  const area = W * t * Math.cos(theta);
  const internal = scatter * pathLength;
  const delta = roundTripLoss(1, R_oc, internal);
  const pTh = fourLevelThreshold(delta, lambdaP, sigma, tau, area, etaP);
  const pSat = saturationIntensity(lambda, sigma, tau) * area;
  const output = (p: number) => laserOutput(fourLevelGain(p, lambdaP, sigma, tau, area, etaP), 1, R_oc, internal, pSat);
  const pOut = output(pump);
  const slope = fourLevelSlopeEfficiency(lambda, lambdaP, 1, R_oc, internal, area, area, etaP);

  const Q = (heat * pump) / (W * t * L); // W/m³
  const dTCentre = slabTemperatureRise(Q, t, kappa);
  const lens = slabThermalLens(Q, kappa, dndT, L);

  const pMax = Math.max(2 * pump, 1.5 * (Number.isFinite(pTh) ? pTh : 0), 1);
  const powerCurve = Array.from({ length: 121 }, (_, i) => {
    const p = (pMax * i) / 120;
    return { x: round6(p), y: round6(output(p)) };
  }).filter((p) => tir && Number.isFinite(p.y));
  const powerSeries = [
    { name: "Output power", color: "#60a5fa", points: powerCurve },
    { name: "This pump", color: "#facc15", showPoints: true, points: tir && Number.isFinite(pOut) ? [{ x: round6(pump), y: round6(pOut) }] : [] },
  ];

  const profile = Number.isFinite(dTCentre)
    ? Array.from({ length: 101 }, (_, i) => {
        const y = (-t / 2) * (1 - (2 * i) / 100);
        return { x: round6(y * 1e3), y: round6(slabTemperatureRise(Q, t, kappa, Math.max(-t / 2, Math.min(t / 2, y)))) };
      })
    : [];
  const profileSeries = [{ name: "Temperature rise above the faces", color: "#f87171", points: profile }];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Slab and resonator</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Slab width W (mm)" value={widthRaw} onChange={setWidth} min={0.1} max={1000} step="any" />
        <ValidatedNumberInput label="Slab thickness t (mm, cooled faces)" value={thicknessRaw} onChange={setThickness} min={0.05} max={100} step="any" />
        <ValidatedNumberInput label="Slab length L (mm)" value={lengthRaw} onChange={setLength} min={1} max={2000} step="any" />
        <ValidatedNumberInput label="Thickness crossings N" value={bouncesRaw} onChange={setBounces} min={1} max={1000} step="1" />
        <ValidatedNumberInput label="Crystal index n" value={nRaw} onChange={setN} min={1.01} max={4} step="any" />
        <ValidatedNumberInput label="Output coupler reflectance (HR = 1)" value={rOcRaw} onChange={setROc} min={0.01} max={0.9999} step="any" />
        <ValidatedNumberInput label="Scatter loss (1/cm)" value={scatterRaw} onChange={setScatter} min={0} max={10} step="any" />
        <ValidatedNumberInput label="Absorbed pump power (W)" value={pumpRaw} onChange={setPump} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="Pump efficiency η_p (absorbed → upper level)" value={etaPRaw} onChange={setEtaP} min={0.01} max={1} step="any" />
      </div>
      <h2 className="text-lg font-semibold mb-3">Gain medium (defaults: Nd:YAG)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={5000} step="any" />
        <ValidatedNumberInput label="Pump wavelength λ_p (nm)" value={pumpWavelengthRaw} onChange={setPumpWavelength} min={200} max={5000} step="any" />
        <ValidatedNumberInput label="Emission cross-section σ (10⁻¹⁹ cm²)" value={sigmaRaw} onChange={setSigma} min={1e-4} max={1e4} step="any" />
        <ValidatedNumberInput label="Upper-level lifetime τ (µs)" value={tauRaw} onChange={setTau} min={1e-3} max={1e6} step="any" />
        <ValidatedNumberInput label="Heat fraction of the absorbed pump" value={heatRaw} onChange={setHeat} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Thermal conductivity κ (W/(m K))" value={kappaRaw} onChange={setKappa} min={0.1} max={2000} step="any" />
        <ValidatedNumberInput label="dn/dT (10⁻⁶/K)" value={dndTRaw} onChange={setDndT} min={-100} max={100} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Zigzag angle θ" value={`${fmt(theta * DEG)}°`} subtext={`face incidence ${fmt(90 - theta * DEG)}°; critical ${fmt(Math.asin(1 / n) * DEG)}°`} tone={tir ? "blue" : "red"} />
        <ResultCard label="Zigzag path L/cos θ" value={`${fmt(pathLength * 1e3)} mm`} subtext={`aperture W t cos θ = ${fmt(area * 1e6)} mm²`} tone="cyan" />
        <ResultCard label="Threshold (absorbed pump)" value={`${fmt(pTh)} W`} subtext={`δ = ${fmt(delta * 100)} % round trip`} tone="orange" />
        <ResultCard label="Output power" value={tir ? `${fmt(pOut)} W` : "—"} subtext={tir ? `slope ${fmt(slope * 100)} %; P_sat = ${fmt(pSat)} W` : "no TIR: the zigzag beam leaks out of the faces"} tone="purple" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Heat density Q" value={`${fmt(Q / 1e6)} W/cm³`} subtext={`heat fraction × pump / W t L`} tone="yellow" />
        <ResultCard label="Centre temperature rise" value={`${fmt(dTCentre)} K`} subtext={`Q t²/(8κ); mean ${fmt((2 * dTCentre) / 3)} K`} tone="red" />
        <ResultCard label="Straight-through thermal lens" value={`${fmt(lens)} m`} subtext="κ/((dn/dT) Q L); the zigzag cancels it to first order" tone="green" />
      </div>

      {!tir && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The face incidence angle is below the critical angle: the beam leaks out of the faces instead of totally reflecting.
          Use fewer bounces or a longer slab.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>θ = atan(N t/L). Four-level gain: P_th = δ h c A/(2η_p σ τ λ_p), A = W t cos θ, δ = −ln R_oc + 2α_s L/cos θ; output from Rigrod
          with the mode filling the slab.</p>
        <p>ΔT(y) = Q(t²/4 − y²)/(2κ). A straight-through ray sees n(y) = n₀ − (dn/dT)Qy²/(2κ), a lens f = κ/((dn/dT)QL); each zigzag
          ray samples the whole profile, so this lens and its depolarisation cancel to first order (stress and end effects are not modelled).</p>
      </div>

      <div className="space-y-6">
        {powerCurve.length > 0 && <SimpleLineChart title="Output power versus absorbed pump power" xLabel="Absorbed pump power (W)" yLabel="Output power (W)" series={powerSeries} />}
        {profile.length > 0 && <SimpleLineChart title="Temperature across the slab thickness" xLabel="Height y (mm)" yLabel="Temperature rise (K)" series={profileSeries} />}
      </div>
    </>
  );
}
