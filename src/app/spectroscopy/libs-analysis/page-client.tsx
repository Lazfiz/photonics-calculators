"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { m_u, q } from "../../../physics/constants";
import {
  dopplerFwhmFraction,
  electronDensityFromStark,
  gaussianProfile,
  lorentzianProfile,
  mcWhirterDensity,
  mostProbableSpeed,
  sahaRatio,
  starkFwhm,
  voigtFwhm,
  voigtProfile,
} from "../../../physics/spectroscopy/line-broadening";

// UI units: densities in cm⁻³ (1 cm⁻³ = 1e6 m⁻³), widths and wavelength in nm, mass in u, energies in eV.
const CM3 = 1e6;
const T_MIN = 1000, T_MAX = 50000, NE_MIN = 0.01, NE_MAX = 1e4, NE_REF = 1e16, W_MAX = 1, DL_MAX = 10, WL_MIN = 100, WL_MAX = 2000;
const M_MIN = 1, M_MAX = 300, CHI_MIN = 1, CHI_MAX = 30, U_MIN = 0.01, U_MAX = 100, INST_MAX = 1, DE_MIN = 0.1, DE_MAX = 20;
const SOLVE = ["width", "ne"] as const;
type Solve = (typeof SOLVE)[number];
const solveLabel: Record<Solve, string> = { width: "Stark width from nₑ", ne: "nₑ from measured Stark width" };
// First ionisation energies (eV) and standard atomic weights (u), NIST Atomic Spectra Database.
const elements: [string, number, number][] = [
  ["H", 1.008, 13.598], ["C", 12.011, 11.26], ["Na", 22.99, 5.139], ["Mg", 24.305, 7.646], ["Al", 26.982, 5.986],
  ["Si", 28.085, 8.152], ["Ca", 40.078, 6.113], ["Ti", 47.867, 6.828], ["Fe", 55.845, 7.902], ["Cu", 63.546, 7.726], ["Ar", 39.948, 15.76],
];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);
const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition ${active ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`;

export default function LibsAnalysisPage() {
  const [solveRaw, setSolve] = useURLState("solve", "width");
  const [temperatureRaw, setTemperature] = useURLState("temperature", 10000); // K
  const [ne16Raw, setNe16] = useURLState("ne16", 10); // nₑ in 10¹⁶ cm⁻³
  const [starkWRaw, setStarkW] = useURLState("starkW", 0.01); // nm, HWHM at 1e16 cm⁻³
  const [measuredWidthRaw, setMeasuredWidth] = useURLState("measuredWidth", 0.2); // nm, Lorentzian FWHM
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 500); // nm
  const [massRaw, setMass] = useURLState("mass", 40.078); // u
  const [chiRaw, setChi] = useURLState("chi", 6.113); // eV
  const [uRatioRaw, setURatio] = useURLState("uRatio", 1); // U⁺/U⁰
  const [instrumentRaw, setInstrument] = useURLState("instrument", 0.05); // nm, Gaussian FWHM
  const [deltaERaw, setDeltaE] = useURLState("deltaE", 3); // eV

  const solve: Solve = (SOLVE as readonly string[]).includes(solveRaw) ? (solveRaw as Solve) : "width";
  const temperature = clamp(temperatureRaw, T_MIN, T_MAX, 10000);
  const neIn = clamp(ne16Raw, NE_MIN, NE_MAX, 10) * NE_REF; // cm⁻³
  const starkW = clamp(starkWRaw, 0, W_MAX, 0.01);
  const measuredWidth = clamp(measuredWidthRaw, 0, DL_MAX, 0.2);
  const wavelength = clamp(wavelengthRaw, WL_MIN, WL_MAX, 500);
  const mass = clamp(massRaw, M_MIN, M_MAX, 40.078);
  const chi = clamp(chiRaw, CHI_MIN, CHI_MAX, 6.113);
  const uRatio = clamp(uRatioRaw, U_MIN, U_MAX, 1);
  const instrument = clamp(instrumentRaw, 0, INST_MAX, 0.05);
  const deltaE = clamp(deltaERaw, DE_MIN, DE_MAX, 3);

  // Densities go to the physics in m⁻³, widths in nm (the Stark law is linear, so any common unit works).
  const ne = solve === "ne" ? electronDensityFromStark(measuredWidth, starkW) / CM3 : neIn; // cm⁻³
  const stark = solve === "ne" ? measuredWidth : starkFwhm(starkW, neIn * CM3);
  const doppler = wavelength * dopplerFwhmFraction(temperature, mass * m_u);
  const gaussian = Math.hypot(doppler, instrument); // Gaussian widths add in quadrature
  const fV = voigtFwhm(gaussian, stark);
  const saha = sahaRatio(temperature, chi * q, uRatio) / CM3; // n⁺nₑ/n⁰ in cm⁻³
  const ionRatio = saha / ne;
  const ionFraction = saha / (saha + ne);
  const neLte = mcWhirterDensity(temperature, deltaE) / CM3;
  const solved = Number.isFinite(ne) && ne > 0;

  const n = 400;
  const X = 3 * fV;
  const xs = Number.isFinite(X) && X > 0 ? Array.from({ length: n + 1 }, (_, i) => -X + (2 * X * i) / n) : [];
  const series = [
    { name: "Doppler + instrument (Gaussian)", color: "#60a5fa", points: xs.map((x) => ({ x, y: gaussianProfile(x, gaussian) / gaussianProfile(0, gaussian) })) },
    ...(stark > 0 ? [{ name: "Stark (Lorentzian)", color: "#f87171", points: xs.map((x) => ({ x, y: lorentzianProfile(x, stark) / lorentzianProfile(0, stark) })) }] : []),
    { name: "Observed line (Voigt)", color: "#34d399", points: xs.map((x) => ({ x, y: voigtProfile(x, gaussian, stark) / voigtProfile(0, gaussian, stark) })) },
  ].map((s) => ({ ...s, points: s.points.map((p) => ({ x: p.x, y: Math.round(p.y * 1e6) / 1e6 })) })); // 6 decimals keep far-wing 1e-200s off the axis

  return (
    <>
      <div role="group" aria-label="Solve for" className="flex gap-2 mb-5 flex-wrap">
        {SOLVE.map((s) => (
          <button key={s} onClick={() => setSolve(s)} className={`px-3 py-1 rounded text-sm ${solve === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {solveLabel[s]}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Element presets">
        {elements.map(([name, m, x]) => (
          <button key={name} onClick={() => { setMass(m); setChi(x); }} className={chip(mass === m && chi === x)}>
            {name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Plasma temperature T (K)" value={temperatureRaw} onChange={setTemperature} min={T_MIN} max={T_MAX} step="any" />
        {solve === "width" ? (
          <ValidatedNumberInput label="Electron density nₑ (10¹⁶ cm⁻³)" value={ne16Raw} onChange={setNe16} min={NE_MIN} max={NE_MAX} step="any" />
        ) : (
          <ValidatedNumberInput label="Measured Stark FWHM (nm)" value={measuredWidthRaw} onChange={setMeasuredWidth} min={0} max={DL_MAX} step="any" />
        )}
        <ValidatedNumberInput label="Stark half-width w at 10¹⁶ cm⁻³ (nm)" value={starkWRaw} onChange={setStarkW} min={0} max={W_MAX} step="any" />
        <ValidatedNumberInput label="Line wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WL_MIN} max={WL_MAX} step="any" />
        <ValidatedNumberInput label="Emitter mass (u)" value={massRaw} onChange={setMass} min={M_MIN} max={M_MAX} step="any" />
        <ValidatedNumberInput label="Instrument FWHM (Gaussian, nm)" value={instrumentRaw} onChange={setInstrument} min={0} max={INST_MAX} step="any" />
        <ValidatedNumberInput label="Ionisation energy χ (eV)" value={chiRaw} onChange={setChi} min={CHI_MIN} max={CHI_MAX} step="any" />
        <ValidatedNumberInput label="Partition-function ratio U⁺/U⁰" value={uRatioRaw} onChange={setURatio} min={U_MIN} max={U_MAX} step="any" />
        <ValidatedNumberInput label="Largest level gap ΔE (eV, McWhirter)" value={deltaERaw} onChange={setDeltaE} min={DE_MIN} max={DE_MAX} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <ResultCard label="Doppler FWHM" value={`${fmt(doppler)} nm`} tone="blue" subtext={`v_p = ${fmt(mostProbableSpeed(temperature, mass * m_u))} m/s; with instrument ${fmt(gaussian)} nm`} />
        {solve === "width" ? (
          <ResultCard label="Stark FWHM" value={`${fmt(stark)} nm`} tone="red" subtext="Δλ_S = 2w · nₑ / 10¹⁶ cm⁻³" />
        ) : (
          <ResultCard label="Electron density nₑ" value={solved ? `${fmt(ne)} cm⁻³` : "—"} tone="red" subtext={solved ? "nₑ = 10¹⁶ cm⁻³ · Δλ_S / (2w)" : "set w above zero (and a width above zero)"} />
        )}
        <ResultCard label="Observed FWHM (Voigt, exact)" value={`${fmt(fV)} nm`} tone="green" subtext={`Gaussian ${fmt(gaussian)} nm ⊗ Lorentzian ${fmt(stark)} nm`} />
        <ResultCard label="Saha ratio n⁺/n⁰" value={solved ? fmt(ionRatio) : "—"} tone="purple" subtext={solved ? `ionised fraction ${fmt(ionFraction * 100, 3)} % (single ionisation)` : "needs nₑ"} />
        <ResultCard
          label="McWhirter LTE limit"
          value={`${fmt(neLte)} cm⁻³`}
          tone={solved && ne >= neLte ? "cyan" : "orange"}
          subtext={solved ? (ne >= neLte ? `nₑ is ${fmt(ne / neLte, 3)}× the limit: necessary condition met` : `nₑ is below the limit: LTE (and Saha) is doubtful`) : "nₑ ≥ 1.6e12 √T ΔE³"}
        />
      </div>
      <div className="mb-8 space-y-1 text-sm text-amber-300">
        {gaussian > stark && stark > 0 && <p>The Gaussian part is wider than the Stark part, so nₑ from this line depends strongly on the instrument function: deconvolve with a Voigt fit.</p>}
        {stark === 0 && <p>w = 0 gives no Stark broadening; take w for your line from a Stark-width table.</p>}
      </div>

      {xs.length > 0 && (
        <SimpleLineChart title="Line profile" xLabel="Offset from line centre (nm)" yLabel="Normalised intensity (each peak 1)" series={series} />
      )}

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">Δλ_D = λ₀ √(8 k_B T ln 2 / (m c²)), Δ_G = √(Δλ_D² + Δλ_inst²)</p>
        <p className="font-mono text-red-400">Δλ_S = 2w · nₑ / 10¹⁶ cm⁻³</p>
        <p className="font-mono text-purple-400">n⁺nₑ/n⁰ = 2 (U⁺/U⁰) (2π mₑ k_B T / h²)^(3/2) exp(−χ / k_B T)</p>
        <p className="font-mono text-cyan-400">nₑ ≥ 1.6×10¹² √T ΔE³ cm⁻³ (T in K, ΔE in eV)</p>
        <p>
          Electron-impact Stark broadening of an isolated line is Lorentzian with a width linear in nₑ; w is the tabulated
          electron-impact half-width at 10¹⁶ cm⁻³ for the chosen line and temperature (typically 0.001–0.1 nm; see the
          Konjević critical reviews), and ion broadening, a few percent for ionic lines, is neglected. Hydrogen Balmer lines
          follow the linear Stark effect instead (nₑ ∝ Δλ^(3/2)). The Saha ratio assumes LTE, single ionisation and no
          lowering of the ionisation energy; take U⁺/U⁰ from partition-function tables (the ground-state weights alone give
          ½ for Na, 2 for Ca and ⅙ for Al). The
          McWhirter criterion is necessary but not sufficient for LTE in a transient LIBS plasma.
        </p>
      </div>
    </>
  );
}
