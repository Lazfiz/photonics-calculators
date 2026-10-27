"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { generationCurrent, generationCurrentAtBias, generationNoiseDensity } from "../../../physics/detectors/dark-current";
import { cutoffWavelength, ingaasAbsorption, ingaasIntrinsicDensity } from "../../../physics/detectors/ingaas";
import { photodiodeQe } from "../../../physics/detectors/photodiode-qe";
import { responsivity } from "../../../physics/detectors/responsivity";
import { ingaasBandGap } from "../../../physics/materials/bandgap";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtE = (x: number, digits = 3) => (Number.isFinite(x) ? x.toExponential(digits) : "—");

export default function IngaasParametersPage() {
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300);
  const [indiumFractionRaw, setIndiumFraction] = useURLState("indiumFraction", 0.53);
  const [thicknessRaw, setThickness] = useURLState("thickness", 3);
  const [areaRaw, setArea] = useURLState("area", 0.1);
  const [biasRaw, setBias] = useURLState("biasVoltage", -1);
  const [lifetimeRaw, setLifetime] = useURLState("genLifetime", 100);
  const [reflectanceRaw, setReflectance] = useURLState("reflectance", 2);
  const T = clamp(temperatureRaw, 200, 400, 300); // K
  const x = clamp(indiumFractionRaw, 0, 1, 0.53);
  const thickness = clamp(thicknessRaw, 0.1, 20, 3) * 1e-6; // m, fully depleted absorber
  const areaMm2 = clamp(areaRaw, 0.001, 100, 0.1);
  const area = areaMm2 * 1e-6; // m²
  const bias = clamp(biasRaw, -10, 0, -1); // V
  const lifetime = clamp(lifetimeRaw, 0.01, 1e4, 100) * 1e-6; // s
  const reflectance = clamp(reflectanceRaw, 0, 99, 2) / 100;

  const Eg = ingaasBandGap(x, T);
  const cutoff_nm = cutoffWavelength(Eg) * 1e9;
  const qeAt = (lambda_nm: number) =>
    photodiodeQe({ alpha: ingaasAbsorption(lambda_nm * 1e-9, Eg), reflectance, depletionWidth: thickness });
  const ni = ingaasIntrinsicDensity(x, T);
  const genCurrent = generationCurrent(ni, thickness, area, lifetime);
  const dark = generationCurrentAtBias(genCurrent, bias, T);
  const noise = generationNoiseDensity(genCurrent); // A/√Hz
  const r1550 = responsivity(qeAt(1550), 1550e-9);
  const nep1550 = r1550 > 0 ? noise / r1550 : NaN;
  const dStar1550 = Math.sqrt(areaMm2 * 1e-2) / nep1550; // cm·Hz^½/W

  const lambdaMax = Math.min(4000, Math.max(1800, Math.ceil((cutoff_nm + 300) / 100) * 100));
  const wl = Array.from({ length: 241 }, (_, i) => 950 + (i * (lambdaMax - 950)) / 240); // the α prefactor is fitted over 0.95–1.62 µm
  const spectralQE = [
    { x: wl, y: wl.map(w => qeAt(w) * 100), type: "scatter", mode: "lines", name: "QE (%)", line: { color: "#60a5fa", width: 2 } },
    { x: [cutoff_nm, cutoff_nm], y: [0, 100], type: "scatter", mode: "lines", name: `λ_c = ${cutoff_nm.toFixed(0)} nm`, line: { color: "#f87171", dash: "dash" } },
  ];
  const temps = Array.from({ length: 201 }, (_, i) => 200 + i);
  const genAt = (Tk: number) => generationCurrent(ingaasIntrinsicDensity(x, Tk), thickness, area, lifetime) * 1e9;
  const genVsTemp = [
    { x: temps, y: temps.map(genAt), type: "scatter", mode: "lines", name: "I_gen", line: { color: "#fbbf24", width: 2 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={200} max={400} step="5" />
        <ValidatedNumberInput label="Indium Fraction (x)" value={indiumFractionRaw} onChange={setIndiumFraction} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Absorber Thickness (µm)" value={thicknessRaw} onChange={setThickness} min={0.1} max={20} step="0.5" />
        <ValidatedNumberInput label="Area (mm²)" value={areaRaw} onChange={setArea} min={0.001} max={100} step="0.01" />
        <ValidatedNumberInput label="Bias (V, reverse < 0)" value={biasRaw} onChange={setBias} min={-10} max={0} step="0.1" />
        <ValidatedNumberInput label="Generation Lifetime τ_g (µs)" value={lifetimeRaw} onChange={setLifetime} min={0.01} max={1e4} step="10" />
        <ValidatedNumberInput label="Front Reflectance (%)" value={reflectanceRaw} onChange={setReflectance} min={0} max={99} step="0.5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Band Gap E_g" value={`${Eg.toFixed(4)} eV`} tone="blue" subtext={`Vurgaftman 2001, x = ${x.toFixed(2)}, ${T.toFixed(0)} K`} />
        <ResultCard label="Cutoff λ_c" value={`${cutoff_nm.toFixed(0)} nm`} tone="green" />
        <ResultCard label="QE @ 1300 / 1550 nm" value={`${(qeAt(1300) * 100).toFixed(1)} / ${(qeAt(1550) * 100).toFixed(1)} %`} tone="yellow" />
        <ResultCard label="R @ 1550 nm" value={`${r1550.toFixed(3)} A/W`} tone="purple" />
        <ResultCard label="Intrinsic Density n_i" value={`${fmtE(ni * 1e-6, 2)} cm⁻³`} tone="cyan" />
        <ResultCard label="Dark Current" value={`${fmtE(dark)} A`} tone="red" subtext={`generation limit ${fmtE(genCurrent)} A`} />
        <ResultCard label="NEP @ 1550 nm" value={`${fmtE(nep1550)} W/√Hz`} tone="orange" subtext={r1550 > 0 ? undefined : "1550 nm is beyond the cutoff"} />
        <ResultCard label="D* @ 1550 nm" value={`${fmtE(dStar1550)} cm·Hz^½/W`} tone="cyan" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>E_g(x, T) = (1−x)·E_g,GaAs(T) + x·E_g,InAs(T) − 0.477·x(1−x) eV, E_g(T) = E_g(0) − αT²/(T+β)</p>
        <p>α = 2.4×10⁴ cm⁻¹·√(E − E_g/eV), QE = (1 − R)·(1 − e^(−α·d))</p>
        <p>I_gen = q·n_i·d·A/τ_g, I_dark = I_gen·(1 − e^(qV/2k_BT)), i_n = √(2q·I_gen)</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={spectralQE} layout={{ xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "QE (%)", gridcolor: "#374151", range: [0, 100] } }} title="Spectral QE" />
        <ChartPanel data={genVsTemp} layout={{ xaxis: { title: "Temperature (K)", gridcolor: "#374151" }, yaxis: { title: "I_gen (nA)", type: "log", gridcolor: "#374151" } }} title="Reverse-Bias Generation Current vs Temperature" />
      </div>
    </>
  );
}
