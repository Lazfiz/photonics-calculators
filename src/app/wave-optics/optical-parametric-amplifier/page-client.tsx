"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import {
  LOW_GAIN_BANDWIDTH_FACTOR, degeneracyLimits, detunedMismatch, parametricGain,
  pplnOpaParameters,
} from "../../../physics/wave-optics/three-wave";
import { opaModel } from "../../../physics/wave-optics/optical-parametric-amplifier";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const dB = (G: number) => 10 * Math.log10(G);
const fmtPower = (W: number) => !Number.isFinite(W)
  ? "—"
  : W >= 1e3 ? `${fmt(W * 1e-3)} kW` : W >= 1 ? `${fmt(W)} W` : W >= 1e-3 ? `${fmt(W * 1e3)} mW` : `${fmt(W * 1e6)} µW`;

export default function OPACalculator() {
  const [pumpRaw, setPump] = useURLState("pumpWavelength", 1064); // nm
  const [signalRaw, setSignal] = useURLState("signalWavelength", 1550); // nm
  const [lengthRaw, setLength] = useURLState("crystalLength", 20); // mm
  const [deffRaw, setDeff] = useURLState("dEff", 12.4); // pm/V, 2d₃₃/π of LiNbO₃ (Shoji 1997)
  const [nPumpRaw, setNPump] = useURLState("nPump", 2.1555);
  const [nSignalRaw, setNSignal] = useURLState("nSignal", 2.1376);
  const [nIdlerRaw, setNIdler] = useURLState("nIdler", 2.0814);
  const [peakPowerRaw, setPeakPower] = useURLState("peakPower", 50); // kW
  const [radiusRaw, setRadius] = useURLState("beamRadius", 300); // µm
  const [seedRaw, setSeed] = useURLState("seedPower", 1); // W
  const [deltaKRaw, setDeltaK] = useURLState("deltaK", 0); // rad/mm
  const [gvmRaw, setGvm] = useURLState("gvm", -97.7); // fs/mm

  const lambdaP = clamp(pumpRaw, 200, 20000, 1064) * 1e-9;
  const lambdaS = clamp(signalRaw, 200, 20000, 1550) * 1e-9;
  const L = clamp(lengthRaw, 0.01, 1000, 20) * 1e-3;
  const deff = clamp(deffRaw, 0.001, 1000, 12.4) * 1e-12;
  const nP = clamp(nPumpRaw, 1, 5, 2.1555);
  const nS = clamp(nSignalRaw, 1, 5, 2.1376);
  const nI = clamp(nIdlerRaw, 1, 5, 2.0814);
  const Pp = clamp(peakPowerRaw, 0, 1e9, 50) * 1e3;
  const w = clamp(radiusRaw, 1, 1e5, 300) * 1e-6;
  const Ps = clamp(seedRaw, 0, 1e9, 1);
  const deltaK0 = clamp(deltaKRaw, -1e4, 1e4, 0) * 1e3;
  const gvm = clamp(gvmRaw, -1e4, 1e4, -97.7) * 1e-12; // fs/mm → s/m

  const model = opaModel({
    lambdaPump: lambdaP, lambdaSignal: lambdaS, dEff: deff, nPump: nP, nSignal: nS, nIdler: nI,
    pumpPower: Pp, radius: w, seedPower: Ps, deltaK: deltaK0, gvm, length: L,
  });
  const { lambdaIdler: lambdaI, peakIntensity: I0, gamma, gain: G, signalOut, idlerOut, pumpDrawn, bandwidth, qpmPeriod } = model;
  const valid = Number.isFinite(lambdaI);
  const bandwidthNm = model.bandwidthWavelength;
  // Signal and idler swap roles at ν_p/2: the linear-GVM spectrum stays on the signal's side of it.
  const [detuneLo, detuneHi] = degeneracyLimits(lambdaP, lambdaS);
  // Signal detuned by Δν sees Δk₀ − 2πΔν δ_si; the gain peaks where that is zero.
  const peakDetuning = gvm !== 0 ? deltaK0 / (2 * Math.PI * gvm) : 0;
  const nuS = c / lambdaS;
  const toDegeneracy = c / (2 * lambdaP) - nuS;
  const reachesDegeneracy = valid && Number.isFinite(bandwidth) && toDegeneracy !== 0 && Math.abs(toDegeneracy - peakDetuning) < bandwidth / 2;
  // The indices and δ_si are inputs; the defaults are type-0 PPLN at 1064 → 1550 nm. Offer PPLN's values at other wavelengths.
  const ppln = pplnOpaParameters(lambdaP, lambdaS);
  const pplnValues = { nPump: Number(ppln.nPump.toFixed(4)), nSignal: Number(ppln.nSignal.toFixed(4)), nIdler: Number(ppln.nIdler.toFixed(4)), gvm: Number((ppln.gvm * 1e12).toFixed(1)) };
  const pplnDiffers = Number.isFinite(ppln.gvm) && (pplnValues.nPump !== nP || pplnValues.nSignal !== nS || pplnValues.nIdler !== nI || Math.abs(pplnValues.gvm - gvm * 1e12) > 1e-6);

  const warnings = [
    !valid && "The signal wavelength must be longer than the pump wavelength: the idler is at 1/λ_i = 1/λ_p − 1/λ_s.",
    valid && pumpDrawn > 0.1 * Pp && `The amplified signal and idler take ${fmt((100 * pumpDrawn) / Pp, 3)} % of the pump power (more than 10 %): the pump depletes and the gain saturates below this value.`,
    valid && !Number.isFinite(G) && "The gain overflows: the pump would be depleted long before this.",
    valid && gvm === 0 && "With zero group-velocity mismatch the bandwidth is set by group-velocity dispersion, which this model omits.",
    reachesDegeneracy && `The gain band reaches degeneracy (λ = 2λ_p = ${fmt(2 * lambdaP * 1e9, 5)} nm), where signal and idler merge: the linear δ_si model doesn't hold there (group-velocity dispersion sets the width), so the bandwidth is only indicative and the spectrum stops at degeneracy.`,
  ].filter(Boolean) as string[];

  const lengthCurve = valid && Number.isFinite(G) ? [{
    name: "Gain G(L)", color: "#00e5ff",
    points: Array.from({ length: 201 }, (_, i) => (i / 100) * L).map((l) => ({ x: round6(l * 1e3), y: round6(dB(parametricGain(gamma, deltaK0, l))) })),
  }] : [];
  const spectrum = valid && Number.isFinite(G) && Number.isFinite(bandwidth) && bandwidth > 0 ? [{
    name: "Gain spectrum", color: "#76ff03",
    points: Array.from({ length: 301 }, (_, i) => peakDetuning + ((i - 150) / 75) * bandwidth)
      .filter((dnu) => dnu > detuneLo && dnu < detuneHi)
      .map((dnu) => ({ x: round6((c / (nuS + dnu)) * 1e9), y: round6(dB(parametricGain(gamma, detunedMismatch(deltaK0, dnu, gvm), L))) }))
      .reverse(),
  }] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pump λ_p (nm)" value={pumpRaw} onChange={setPump} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Signal λ_s (nm)" value={signalRaw} onChange={setSignal} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="d_eff (pm/V)" value={deffRaw} onChange={setDeff} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Pump peak power (kW)" value={peakPowerRaw} onChange={setPeakPower} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Pump radius w, 1/e² (µm)" value={radiusRaw} onChange={setRadius} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Signal seed peak power (W)" value={seedRaw} onChange={setSeed} min={0} max={1e9} step="any" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="n_p at λ_p" value={nPumpRaw} onChange={setNPump} min={1} max={5} step="any" />
        <ValidatedNumberInput label="n_s at λ_s" value={nSignalRaw} onChange={setNSignal} min={1} max={5} step="any" />
        <ValidatedNumberInput label="n_i at λ_i" value={nIdlerRaw} onChange={setNIdler} min={1} max={5} step="any" />
        <ValidatedNumberInput label="Residual Δk at λ_s (rad/mm)" value={deltaKRaw} onChange={setDeltaK} min={-1e4} max={1e4} step="any" />
        <ValidatedNumberInput label="GVM δ_si = 1/v_gs − 1/v_gi (fs/mm)" value={gvmRaw} onChange={setGvm} min={-1e4} max={1e4} step="any" />
      </div>
      {pplnDiffers && (
        <p className="-mt-4 mb-6 text-sm text-gray-300">
          Type-0 PPLN (Zelmon 1997, extraordinary, 21 °C) at these wavelengths: n_p {pplnValues.nPump}, n_s {pplnValues.nSignal},
          n_i {pplnValues.nIdler}, δ_si {pplnValues.gvm} fs/mm.{" "}
          <button type="button" className="rounded border border-gray-700 px-2 py-0.5 text-xs text-gray-200 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-blue-400"
            onClick={() => { setNPump(pplnValues.nPump); setNSignal(pplnValues.nSignal); setNIdler(pplnValues.nIdler); setGvm(pplnValues.gvm); }}>
            Use these values
          </button>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Signal gain G" value={valid ? `${fmt(dB(G), 4)} dB` : "—"} subtext={`G = ${fmt(G)}; 1 + (Γ/g)² sinh²(gL), g² = Γ² − (Δk/2)²`} tone="green" />
        <ResultCard label="Gain coefficient Γ" value={`${fmt(gamma)} m⁻¹`} subtext={`ΓL = ${fmt(gamma * L, 3)}; on-axis pump ${fmt(I0 * 1e-10, 4)} MW/cm²`} tone="orange" />
        <ResultCard label="Output signal / idler" value={`${fmtPower(signalOut)} / ${fmtPower(idlerOut)}`} subtext={valid ? `idler at ${fmt(lambdaI * 1e9, 5)} nm, (λ_s/λ_i)(G − 1)P_s` : "needs λ_s > λ_p"} tone="blue" />
        <ResultCard label="Gain bandwidth (FWHM)" value={Number.isFinite(bandwidth) ? `${fmt(bandwidth * 1e-9, 4)} GHz` : "—"} subtext={Number.isFinite(bandwidth) ? `${fmt(bandwidthNm * 1e9, 3)} nm at λ_s; low-gain limit 0.886/(|δ|L) = ${fmt((LOW_GAIN_BANDWIDTH_FACTOR / (Math.abs(gvm) * L)) * 1e-9, 4)} GHz` : "needs δ_si ≠ 0"} tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>A strong pump at ω_p amplifies a signal at ω_s and generates the idler at ω_i = ω_p − ω_s. With the pump undepleted,
          Γ² = 2ω_sω_i d_eff² I_p/(n_pn_sn_i ε₀c³) and the signal grows by G = 1 + (Γ/g)² sinh²(gL), which is ≈ e^(2ΓL)/4 at high gain.
          A phase mismatch lowers g; beyond |Δk| = 2Γ the gain only oscillates. The gain is computed at the pump&apos;s on-axis
          intensity 2P/(πw²), so it is the peak gain of a Gaussian beam. Detuning the signal by Δν changes Δk by −2πΔν δ_si,
          where δ_si is the signal–idler group-velocity mismatch. That sets the gain bandwidth: 0.886/(|δ_si|L) at low gain, widening as √(ΓL)
          towards (2√ln2/π)√(Γ/L)/|δ_si| at high gain (Cerullo &amp; De Silvestri 2003). The spectrum stops at degeneracy 2λ_p, where signal and idler swap roles. The defaults are a 1064 nm-pumped PPLN
          amplifier for 1550 nm: indices and δ_si from the Zelmon Sellmeier (21 °C, extraordinary), first-order QPM period for the entered indices (when you change a wavelength, the line under the inputs offers PPLN&apos;s indices and δ_si){" "}
          {fmt(qpmPeriod * 1e6, 4)} µm, and d_eff = 2d₃₃/π = 12.4 pm/V
          from d₃₃ = 19.5 pm/V of congruent LiNbO₃ for SHG of 1.313 µm (Shoji et al. 1997; 25.2 pm/V at 1.064 µm).
          Miller&apos;s rule scales d by 0.87 for the 3.39 µm idler, to ≈ 10.8 pm/V.</p>
        {warnings.map((msg) => <p key={msg} className="text-yellow-400">{msg}</p>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {lengthCurve.length > 0 && (
          <SimpleLineChart title="Gain vs crystal length" xLabel="Crystal length (mm)" yLabel="Gain (dB)" series={lengthCurve} />
        )}
        {spectrum.length > 0 && spectrum[0].points.length > 1 && (
          <SimpleLineChart title="Gain spectrum (group-velocity mismatch)" xLabel="Signal wavelength (nm)" yLabel="Gain (dB)" series={spectrum} />
        )}
      </div>
    </>
  );
}
