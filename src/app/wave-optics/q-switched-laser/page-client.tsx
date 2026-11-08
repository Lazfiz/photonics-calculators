"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { peakPower, type PulseShape } from "../../../physics/laser-safety/peak-power";
import { qSwitchedLaser, qSwitchPulse, singlePassLoss } from "../../../physics/wave-optics/pulsed-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const SHAPES: Readonly<Record<string, PulseShape>> = { gaussian: "gaussian", sech2: "sech2", rectangular: "rectangular" };

export default function QSwitchedLaserPage() {
  const [repRateRaw, setRepRate] = useURLState("repRate", 10); // kHz
  const [energyRaw, setEnergy] = useURLState("pulseEnergy", 1); // mJ
  const [widthRaw, setWidth] = useURLState("pulseWidth", 10); // ns FWHM
  const [shapeRaw, setShape] = useURLState("shape", "gaussian");
  const [pumpMode, setPumpMode] = useURLState("pump", "ratio");
  const [ratioRaw, setRatio] = useURLState("inversionRatio", 3);
  const [g0lRaw, setG0l] = useURLState("g0l", 0.6);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1064); // nm
  const [sigmaRaw, setSigma] = useURLState("sigma", 2.8); // 1e-19 cm²
  const [diameterRaw, setDiameter] = useURLState("modeDiameter", 1); // mm
  const [rOcRaw, setROc] = useURLState("R_oc", 0.7);
  const [lossRaw, setLoss] = useURLState("internalLoss", 2); // % per pass
  const [cavityRaw, setCavity] = useURLState("cavityLength", 300); // mm
  const [rodRaw, setRod] = useURLState("rodLength", 50); // mm
  const [nRaw, setN] = useURLState("n_rod", 1.82);

  const repRate = clamp(repRateRaw, 1e-3, 1e5, 10) * 1e3;
  const energy = clamp(energyRaw, 1e-9, 1e6, 1) * 1e-3;
  const width = clamp(widthRaw, 1e-3, 1e6, 10) * 1e-9;
  const shape = SHAPES[shapeRaw] ?? "gaussian";
  const fixedGain = pumpMode === "gain";
  const g0lIn = clamp(g0lRaw, 1e-4, 20, 0.6);
  const lambda = clamp(wavelengthRaw, 200, 20000, 1064) * 1e-9;
  const sigma = clamp(sigmaRaw, 1e-4, 1e4, 2.8) * 1e-23; // m²
  const d = clamp(diameterRaw, 0.01, 100, 1) * 1e-3;
  const R_oc = clamp(rOcRaw, 0.01, 0.9999, 0.7);
  const loss = clamp(lossRaw, 0, 90, 2) / 100;
  const rod = clamp(rodRaw, 0.1, 1000, 50) * 1e-3;
  const cavity = Math.max(rod, clamp(cavityRaw, 1, 10000, 300) * 1e-3);
  const n = clamp(nRaw, 1, 4, 1.82);

  // Pulse train from the measured pulse.
  const pk = peakPower(energy, width, shape);
  const avg = energy * repRate;
  const duty = width * repRate;

  // Rate-equation pulse. One of r and g₀l is the input; the other follows from r = g₀l/γ.
  const op = qSwitchedLaser({
    fixedGain, g0l: g0lIn, ratio: clamp(ratioRaw, 1.01, 50, 3), lambda, sigma, modeDiameter: d, R_oc, internalLoss: loss,
    cavityLength: cavity, rodLength: rod, n,
  });
  const { gamma, gammaI, r, g0l, opticalLength, tauC, area, hv, pulse, wave, fwhm, fluence, opt, optTauC, optPulse } = op;
  const optNote = !(gammaI > 0)
    ? "No optimum without internal loss: the energy keeps rising as R → 0."
    : !(g0l > gammaI) ? "No lasing at any coupling: g₀l must exceed the internal loss γ_i."
    : opt.reflectance < 0.01 ? "The optimum R is below the 0.01 the input accepts; there the mean-field (uniform-intensity) model is poor anyway." : "";
  const rMin = Number.isFinite(opt.reflectance) ? Math.min(0.01, opt.reflectance / 2) : 0.01;
  const energyAt = (R: number) => qSwitchPulse(g0l / singlePassLoss(1, R, loss), hv, area, sigma, Math.log(1 / R), 1).energy;
  const couplingCurve = [
    {
      name: "Pulse energy at this g₀l",
      color: "#34d399",
      points: Array.from({ length: 200 }, (_, i) => rMin + (i / 199) * (0.999 - rMin))
        .map((R) => ({ x: round6(R), y: round6(energyAt(R) * 1e3) }))
        .filter((p) => Number.isFinite(p.y)),
    },
    { name: "This R", color: "#60a5fa", showPoints: true, points: Number.isFinite(pulse.energy) ? [{ x: round6(R_oc), y: round6(pulse.energy * 1e3) }] : [] },
    { name: "Optimum (Degnan)", color: "#f472b6", showPoints: true, points: Number.isFinite(opt.energy) ? [{ x: round6(opt.reflectance), y: round6(opt.energy * 1e3) }] : [] },
  ];

  const series = [{
    name: "Output power",
    color: "#60a5fa",
    points: wave.t.map((t, i) => ({ x: round6(t * tauC * 1e9), y: round6((wave.shape[i] * pulse.peak) / 1e3) })).filter((p) => Number.isFinite(p.y)),
  }];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Pulse train from a measured pulse</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Repetition rate (kHz)" value={repRateRaw} onChange={setRepRate} min={1e-3} max={1e5} step="any" />
        <ValidatedNumberInput label="Pulse energy (mJ)" value={energyRaw} onChange={setEnergy} min={1e-9} max={1e6} step="any" />
        <ValidatedNumberInput label="Pulse width, FWHM (ns)" value={widthRaw} onChange={setWidth} min={1e-3} max={1e6} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pulse shape</span>
          <select value={shape} onChange={(e) => setShape(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="gaussian">Gaussian (0.939 E/τ)</option>
            <option value="sech2">sech² (0.881 E/τ)</option>
            <option value="rectangular">Rectangular (E/τ)</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Peak power" value={`${fmt(pk / 1e3)} kW`} subtext={`${shape === "rectangular" ? "E/τ" : shape === "gaussian" ? "2√(ln2/π) E/τ" : "ln(1+√2) E/τ"}`} tone="purple" />
        <ResultCard label="Average power" value={`${fmt(avg)} W`} subtext="E × f" tone="orange" />
        <ResultCard label="Duty cycle" value={`${fmt(duty * 100)} %`} subtext={`τ × f; peak/average ${fmt(pk / avg)}`} tone="cyan" />
      </div>

      <p className="-mt-6 mb-8 text-sm text-gray-400">
        If the pulse period 1/f is shorter than the upper-state lifetime (≈ 230 µs in Nd:YAG), the inversion doesn&apos;t recover between
        pulses, so r and E fall at high rates.
      </p>

      <h2 className="text-lg font-semibold mb-3">Pulse from the cavity (rate equations, defaults: Nd:YAG)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pump given as</span>
          <select value={fixedGain ? "gain" : "ratio"} onChange={(e) => setPumpMode(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="ratio">Inversion ratio r (held when R changes)</option>
            <option value="gain">Small-signal gain g₀l (fixed pump)</option>
          </select>
        </label>
        {fixedGain ? (
          <ValidatedNumberInput label="Initial single-pass gain g₀l (ln of the gain)" value={g0lRaw} onChange={setG0l} min={1e-4} max={20} step="any" />
        ) : (
          <ValidatedNumberInput label="Initial inversion / threshold r" value={ratioRaw} onChange={setRatio} min={1.01} max={50} step="any" />
        )}
        <ValidatedNumberInput label="Laser wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Emission cross-section σ (10⁻¹⁹ cm²)" value={sigmaRaw} onChange={setSigma} min={1e-4} max={1e4} step="any" />
        <ValidatedNumberInput label="Mode diameter in the rod (mm, top hat)" value={diameterRaw} onChange={setDiameter} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Output coupler reflectance R (HR = 1)" value={rOcRaw} onChange={setROc} min={0.01} max={0.9999} step="any" />
        <ValidatedNumberInput label="Internal loss per pass (%)" value={lossRaw} onChange={setLoss} min={0} max={90} step="any" />
        <ValidatedNumberInput label="Mirror spacing L (mm)" value={cavityRaw} onChange={setCavity} min={1} max={10000} step="any" />
        <ValidatedNumberInput label="Rod length l (mm)" value={rodRaw} onChange={setRod} min={0.1} max={1000} step="any" />
        <ValidatedNumberInput label="Rod index n" value={nRaw} onChange={setN} min={1} max={4} step="any" />
      </div>
      {fixedGain && !(r > 1) && (
        <p className="mb-4 text-sm text-yellow-300" role="status">
          Below threshold: r = g₀l/γ = {fmt(r)}. Raise g₀l above the single-pass loss γ = {fmt(gamma)} or raise R.
        </p>
      )}
      {r > 50 && (
        <p className="mb-4 text-sm text-yellow-300" role="status">
          r = {fmt(r)} is above 50: the pulse shape and its FWHM aren&apos;t integrated; the width shown is the estimate E/P_p.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Pulse energy" value={`${fmt(pulse.energy * 1e3)} mJ`} subtext={`extraction η = ${fmt(pulse.extraction * 100)} %; ${fmt(fluence * 1e-4)} J/cm²`} tone="green" />
        <ResultCard label="Pulse width (FWHM)" value={`${fmt(fwhm * 1e9)} ns`} subtext={`${fmt(wave.fwhm)} τ_c; estimate E/P_p = ${fmt(pulse.widthEstimate * 1e9)} ns`} tone="cyan" />
        <ResultCard label="Peak power" value={`${fmt(pulse.peak / 1e3)} kW`} subtext={`average at this rate ${fmt(pulse.energy * repRate)} W`} tone="purple" />
        <ResultCard label="Photon lifetime τ_c" value={`${fmt(tauC * 1e9)} ns`} subtext={`L_e/(cγ), γ = ${fmt(gamma)} per pass, L_e = ${fmt(opticalLength * 1e3)} mm`} tone="blue" />
      </div>

      <h3 className="text-base font-semibold mb-3">Optimum output coupling at this pump (Degnan 1989)</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Optimum R_oc" value={fmt(opt.reflectance)} subtext={`z = g₀l/γ_i = ${fmt(opt.z)}; g₀l = ${fmt(g0l)}, ${fixedGain ? `r = ${fmt(r)} here` : "from r·γ"}`} tone="yellow" />
        <ResultCard label="Largest pulse energy" value={`${fmt(opt.energy * 1e3)} mJ`} subtext={`η = 1 − 1/z = ${fmt(opt.extraction * 100)} %; ${fmt(pulse.energy / opt.energy * 100)} % of it at this R`} tone="green" />
        <ResultCard label="Width at the optimum (estimate)" value={`${fmt(optPulse.widthEstimate * 1e9)} ns`} subtext={`E/P_p; r = z ln z/(z − 1) = ${fmt(opt.ratio)}`} tone="cyan" />
        <ResultCard label="Peak power at the optimum" value={`${fmt(optPulse.peak / 1e3)} kW`} subtext={`τ_c = ${fmt(optTauC * 1e9)} ns`} tone="purple" />
      </div>
      {optNote && <p className="mb-4 text-sm text-yellow-300" role="status">{optNote}</p>}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Peak power of a measured pulse: shape factor × E/τ, with τ the intensity FWHM.</p>
        <p>Rate equations (Wagner–Lengyel, Degnan), four-level medium with an instant switch: rη = −ln(1 − η), E = (hνA/2σ) ln(1/R) rη,
          P_p = (γ₂/2)(hνA/σ)(r − 1 − ln r)/τ_c with γ₂ = −ln R, γ = γ_i + γ₂/2 and τ_c = L_e/(cγ), L_e = L + (n − 1)l. The plotted
          shape is integrated numerically; the FWHM comes from it.</p>
        <p>With r as the input it stays fixed when you change R_oc. At a fixed pump the initial gain g₀l = rγ is fixed instead, so
          r = g₀l/γ falls as R_oc drops, and the energy peaks at Degnan&apos;s optimum: with z = g₀l/γ_i and γ_i = −ln(1 − internal loss),
          ln(1/R_opt) = 2γ_i(z − 1 − ln z)/ln z and E_max = (hνA/2σ)·2γ_i(z − 1 − ln z); the final inversion is then 1/z of the initial one.
          The optimum is computed from g₀l in both modes; the chart holds g₀l fixed.</p>
      </div>

      {couplingCurve[0].points.length > 0 && (
        <div className="mb-6">
          <SimpleLineChart title="Pulse energy vs output coupler at fixed g₀l" xLabel="Output coupler reflectance R" yLabel="Pulse energy (mJ)" series={couplingCurve} />
        </div>
      )}
      {series[0].points.length > 0 && <SimpleLineChart title="Q-switched pulse from the rate equations" xLabel="Time from the peak (ns)" yLabel="Output power (kW)" series={series} />}
    </>
  );
}
