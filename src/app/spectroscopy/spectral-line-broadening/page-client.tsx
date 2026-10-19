"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, m_u } from "../../../physics/constants";
import {
  dopplerFwhmFraction,
  gaussianProfile,
  lifetimeFromFwhmHz,
  lorentzianProfile,
  mostProbableSpeed,
  pseudoVoigtProfile,
  pseudoVoigtTch,
  voigtFwhm,
  voigtFwhmOlivero,
  voigtProfile,
} from "../../../physics/spectroscopy/line-broadening";

// UI units: wavelength in nm, wavenumber in cm⁻¹ (1 cm⁻¹ ↔ 100·c Hz), mass in u, pressure in atm.
const CM_HZ = 100 * c;
const WL_MIN = 100, WL_MAX = 1e5, T_MIN = 1, T_MAX = 1e5, M_MIN = 1, M_MAX = 1000, P_MAX = 100, G_MAX = 10, W_MAX = 1e6;
const MODES = ["gas", "widths"] as const;
type Mode = (typeof MODES)[number];
const modeLabel: Record<Mode, string> = { gas: "From gas conditions", widths: "From Gaussian and Lorentzian widths" };
const massPresets: [string, number][] = [["H", 1.008], ["He", 4.003], ["Ne", 20.18], ["Na", 22.99], ["CO₂", 44.01], ["Rb", 85.47], ["Cs", 132.91]];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(3);
const fmtHz = (f: number) =>
  !Number.isFinite(f) ? "—" : f >= 1e9 ? `${fmt(f / 1e9)} GHz` : f >= 1e6 ? `${fmt(f / 1e6)} MHz` : `${fmt(f / 1e3)} kHz`;
const fmtTime = (t: number) =>
  !Number.isFinite(t) ? "—" : t >= 1e-6 ? `${fmt(t * 1e6)} µs` : t >= 1e-9 ? `${fmt(t * 1e9)} ns` : `${fmt(t * 1e12)} ps`;
const pct = (approx: number, exact: number) => `${(approx / exact - 1 >= 0 ? "+" : "")}${fmt((approx / exact - 1) * 100, 2)} %`;
const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition ${active ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`;

export default function SpectralLineBroadeningPage() {
  const [modeRaw, setMode] = useURLState("mode", "gas");
  const [centerWlRaw, setCenterWl] = useURLState("centerWl", 500); // nm
  const [temperatureRaw, setTemperature] = useURLState("temperature", 5000); // K
  const [molecularMassRaw, setMolecularMass] = useURLState("molecularMass", 20); // u
  const [pressureRaw, setPressure] = useURLState("pressure", 1); // atm
  const [gammaColRaw, setGammaCol] = useURLState("gammaCol", 0.1); // cm⁻¹/atm, HWHM
  const [naturalWidthRaw, setNaturalWidth] = useURLState("naturalWidth", 0.001); // cm⁻¹, FWHM
  const [fwhmGRaw, setFwhmG] = useURLState("fwhmG", 0.5);
  const [fwhmLRaw, setFwhmL] = useURLState("fwhmL", 0.3);

  const mode: Mode = (MODES as readonly string[]).includes(modeRaw) ? (modeRaw as Mode) : "gas";
  const centerWl = clamp(centerWlRaw, WL_MIN, WL_MAX, 500);
  const temperature = clamp(temperatureRaw, T_MIN, T_MAX, 5000);
  const molecularMass = clamp(molecularMassRaw, M_MIN, M_MAX, 20);
  const pressure = clamp(pressureRaw, 0, P_MAX, 1);
  const gammaCol = clamp(gammaColRaw, 0, G_MAX, 0.1);
  const naturalWidth = clamp(naturalWidthRaw, 0, G_MAX, 0.001);
  const fwhmGIn = clamp(fwhmGRaw, 0, W_MAX, 0.5);
  const fwhmLIn = clamp(fwhmLRaw, 0, W_MAX, 0.3);

  // Gas mode works in cm⁻¹; widths mode in whatever unit the two widths share.
  const sigma0 = 1e7 / centerWl; // cm⁻¹
  const fraction = dopplerFwhmFraction(temperature, molecularMass * m_u);
  const collisional = 2 * gammaCol * pressure;
  const fG = mode === "gas" ? sigma0 * fraction : fwhmGIn;
  const fL = mode === "gas" ? collisional + naturalWidth : fwhmLIn;
  const u = (x: number) => (mode === "gas" ? `${fmt(x)} cm⁻¹` : fmt(x));
  const hasWidth = fG + fL > 0;

  const fV = voigtFwhm(fG, fL);
  const fOlivero = voigtFwhmOlivero(fG, fL);
  const tch = pseudoVoigtTch(fG, fL);
  const toHz = (sigma: number) => sigma * CM_HZ;
  const toPm = (sigma: number) => (sigma / sigma0) * centerWl * 1e3; // Δλ = λ·Δσ/σ to first order
  const inGas = (sigma: number) => `= ${fmtHz(toHz(sigma))} = ${fmt(toPm(sigma))} pm`;
  const regime = !hasWidth ? "" : fL < 0.1 * fG ? "Doppler-dominated" : fL > 10 * fG ? "Lorentzian-dominated" : "mixed (Voigt) regime";

  // Profiles on ±3 Voigt widths. The Gaussian and Lorentzian are each scaled to peak 1; the exact and pseudo-Voigt
  // share one scale (the exact Voigt peak), so the pseudo-Voigt's error shows.
  const n = 400;
  const X = 3 * fV;
  const xs = hasWidth ? Array.from({ length: n + 1 }, (_, i) => -X + (2 * X * i) / n) : [];
  const v0 = voigtProfile(0, fG, fL);
  const vy = xs.map((x) => voigtProfile(x, fG, fL) / v0);
  const py = xs.map((x) => pseudoVoigtProfile(x, fG, fL) / v0);
  const maxDev = vy.reduce((m, v, i) => Math.max(m, Math.abs(py[i] - v)), 0);
  const series = [
    ...(fG > 0 ? [{ name: "Gaussian (Doppler), peak 1", color: "#60a5fa", points: xs.map((x) => ({ x, y: gaussianProfile(x, fG) / gaussianProfile(0, fG) })) }] : []),
    ...(fL > 0 ? [{ name: "Lorentzian (collisional + natural), peak 1", color: "#34d399", points: xs.map((x) => ({ x, y: lorentzianProfile(x, fL) / lorentzianProfile(0, fL) })) }] : []),
    { name: "Voigt (exact), peak 1", color: "#f87171", points: xs.map((x, i) => ({ x, y: vy[i] })) },
    { name: "TCH pseudo-Voigt, same scale", color: "#fbbf24", dashed: true, points: xs.map((x, i) => ({ x, y: py[i] })) },
  ].map((s) => ({ ...s, points: s.points.map((p) => ({ x: p.x, y: Math.round(p.y * 1e6) / 1e6 })) })); // 6 decimals keep far-wing 1e-200s off the axis

  return (
    <>
      <div role="group" aria-label="Input mode" className="flex gap-2 mb-5 flex-wrap">
        {MODES.map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 rounded text-sm ${mode === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {modeLabel[m]}
          </button>
        ))}
      </div>

      {mode === "gas" ? (
        <>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Mass presets">
            {massPresets.map(([name, mass]) => (
              <button key={name} onClick={() => setMolecularMass(mass)} className={chip(molecularMass === mass)}>
                {name} {mass} u
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <ValidatedNumberInput label="Centre wavelength λ₀ (nm)" value={centerWlRaw} onChange={setCenterWl} min={WL_MIN} max={WL_MAX} step="any" />
            <ValidatedNumberInput label="Temperature T (K)" value={temperatureRaw} onChange={setTemperature} min={T_MIN} max={T_MAX} step="any" />
            <ValidatedNumberInput label="Atomic or molecular mass (u)" value={molecularMassRaw} onChange={setMolecularMass} min={M_MIN} max={M_MAX} step="any" />
            <ValidatedNumberInput label="Pressure P (atm)" value={pressureRaw} onChange={setPressure} min={0} max={P_MAX} step="any" />
            <ValidatedNumberInput label="Pressure-broadening coefficient γ (HWHM, cm⁻¹/atm)" value={gammaColRaw} onChange={setGammaCol} min={0} max={G_MAX} step="any" />
            <ValidatedNumberInput label="Natural width (FWHM, cm⁻¹)" value={naturalWidthRaw} onChange={setNaturalWidth} min={0} max={G_MAX} step="any" />
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <ValidatedNumberInput label="Gaussian FWHM Δ_G (any unit)" value={fwhmGRaw} onChange={setFwhmG} min={0} max={W_MAX} step="any" />
          <ValidatedNumberInput label="Lorentzian FWHM Δ_L (same unit)" value={fwhmLRaw} onChange={setFwhmL} min={0} max={W_MAX} step="any" />
        </div>
      )}

      {hasWidth ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <ResultCard
            label="Gaussian FWHM Δ_G"
            value={u(fG)}
            tone="blue"
            subtext={mode === "gas" ? `${inGas(fG)}; v_p = ${fmt(mostProbableSpeed(temperature, molecularMass * m_u))} m/s` : `σ = Δ_G/(2√(2 ln 2)) = ${fmt(fG / (2 * Math.sqrt(2 * Math.LN2)))}`}
          />
          <ResultCard
            label="Lorentzian FWHM Δ_L"
            value={u(fL)}
            tone="green"
            subtext={mode === "gas"
              ? `collisional 2γP = ${fmt(collisional)} cm⁻¹; natural ${fmt(naturalWidth)} cm⁻¹ (τ = ${fmtTime(lifetimeFromFwhmHz(toHz(naturalWidth)))})`
              : `γ = Δ_L/2 = ${fmt(fL / 2)}`}
          />
          <ResultCard label="Voigt FWHM (exact)" value={u(fV)} tone="red" subtext={mode === "gas" ? `${inGas(fV)}; ${regime}` : regime} />
          <ResultCard
            label="Voigt FWHM approximations"
            value={u(fOlivero)}
            tone="yellow"
            subtext={`Olivero ${pct(fOlivero, fV)}; TCH ${fmt(tch.fwhm)} (${pct(tch.fwhm, fV)}), η = ${fmt(tch.eta, 3)}; TCH profile within ${fmt(maxDev * 100, 2)} % of the peak`}
          />
        </div>
      ) : (
        <p className="mb-4 text-sm text-amber-300">Both widths are zero, so there is no line shape to show: set a temperature, pressure or natural width above zero.</p>
      )}
      <p className="mb-8 text-sm text-gray-400">
        The Voigt width is not Δ_G + Δ_L: widths of the same kind add (Lorentzians linearly, Gaussians in quadrature), but
        a Gaussian and a Lorentzian combine by convolution.
      </p>

      {hasWidth && (
        <SimpleLineChart
          title="Line profiles"
          xLabel={mode === "gas" ? "Offset from line centre (cm⁻¹)" : "Offset from line centre (width unit)"}
          yLabel="Normalised intensity"
          series={series}
        />
      )}

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">Δ_G = σ̃₀ √(8 k_B T ln 2 / (m c²)), v_p = √(2 k_B T / m)</p>
        <p className="font-mono text-green-400">Δ_L = 2γP + Δ_nat, Δν_nat = 1/(2πτ)</p>
        <p className="font-mono text-red-400">V(x) = Re w((x + iΔ_L/2) / (σ√2)) / (σ√(2π)), σ = Δ_G / (2√(2 ln 2))</p>
        <p className="font-mono text-yellow-400">Δ_V ≈ 0.5346 Δ_L + √(0.2166 Δ_L² + Δ_G²)</p>
        <p>
          Thermal motion of a gas in equilibrium gives a Gaussian (inhomogeneous) line; the finite lifetime of the levels and
          collisions in the impact approximation give a Lorentzian (homogeneous) line. The Voigt profile is their exact
          convolution, computed here from the Faddeeva function w(z) (Weideman&apos;s 32-term expansion, ≈ 1e-13). The
          Olivero-Longbothum formula gives its width to 0.02 %; the Thompson-Cox-Hastings pseudo-Voigt mixes a Lorentzian
          and a Gaussian of one width f with weight η, which is cheap to fit but deviates by about 1 % of the peak. γ is the
          HWHM coefficient at the gas temperature (HITRAN lists it at 296 K, scaling as (296 K/T)ⁿ). Not modelled: Dicke
          narrowing, speed-dependent broadening, line mixing, and pressure shifts.
        </p>
      </div>
    </>
  );
}
