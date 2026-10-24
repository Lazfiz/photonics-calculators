"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { beta2FromD, beta3FromDS } from "../../../physics/fiber-optics/chromatic-dispersion";
import {
  SILICA_BRILLOUIN_GAIN, alphaFromDbPerKm, effectiveLength, fwmEfficiency, fwmPhaseMismatch, fwmProductRatio,
  nonlinearCoefficient, nonlinearPhase, ramanGainAt, sbsThreshold, spmRmsBroadening, srsThreshold, xpmPhaseMax,
} from "../../../physics/fiber-optics/fiber-nonlinear";

const toDb = (x: number) => {
  const v = 10 * Math.log10(x);
  return Number.isFinite(v) ? v : null;
};

export default function NonlinearEffectsPage() {
  const [power, setPower] = useURLState("power", 10); // dBm launch power per channel
  const [length, setLength] = useURLState("length", 80, { min: 0 }); // km
  const [effectiveArea, setEffectiveArea] = useURLState("effectiveArea", 80, { min: 1 }); // µm²
  const [alpha, setAlpha] = useURLState("alpha", 0.2, { min: 0 }); // dB/km attenuation
  const [n2, setN2] = useURLState("n2", 2.6, { min: 0 }); // ×1e-20 m²/W
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 1 }); // nm
  const [dispersion, setDispersion] = useURLState("dispersion", 17); // ps/(nm·km)
  const [slope, setSlope] = useURLState("slope", 0.058); // ps/(nm²·km)
  const [numChannels, setNumChannels] = useURLState("numChannels", 1, { min: 1 });
  const [channelSpacing, setChannelSpacing] = useURLState("channelSpacing", 100, { min: 0 }); // GHz

  const calc = useMemo(() => {
    const P = 10 ** (power / 10) * 1e-3; // W
    const L = Math.max(length, 1e-3) * 1e3;
    const Aeff = Math.max(effectiveArea, 1) * 1e-12;
    const a = alphaFromDbPerKm(Math.max(alpha, 0));
    const lambda = Math.max(wavelength, 1) * 1e-9;
    const N = Math.max(1, Math.round(numChannels));
    const df = Math.max(channelSpacing, 0.1) * 1e9;

    const gamma = nonlinearCoefficient(Math.max(n2, 0) * 1e-20, lambda, Aeff);
    const Leff = effectiveLength(a, L);
    const phiSPM = nonlinearPhase(gamma, P, Leff);
    const phiXPM = xpmPhaseMax(gamma, P, Leff, N - 1);

    // Nearest degenerate FWM products 2f₁ − f₂ and 2f₂ − f₁ (Δf_ik = Δf_jk = ∓Δf about f_k); β₃ makes them differ,
    // so take the larger efficiency. β₂, β₃ from D and S at λ.
    const D = dispersion * 1e-6; // s/m²
    const beta2 = beta2FromD(D, lambda);
    const beta3 = beta3FromDS(D, slope * 1e3, lambda); // S: ps/(nm²·km) → s/m³
    const etaAt = (spacing: number) => Math.max(
      fwmEfficiency(a, L, fwmPhaseMismatch(beta2, spacing, spacing, beta3)),
      fwmEfficiency(a, L, fwmPhaseMismatch(beta2, -spacing, -spacing, beta3)),
    );
    const fwmRatio = (spacing: number) => fwmProductRatio(etaAt(spacing), phiSPM, true);
    const eta = etaAt(df);

    // Worst cases: narrow-linewidth CW and co-polarized pump/Stokes (K = 1). See the SBS and SRS pages for K and linewidth.
    const sbs = sbsThreshold({ Aeff, gB: SILICA_BRILLOUIN_GAIN, Leff });
    const srs = srsThreshold(Aeff, ramanGainAt(lambda), Leff);

    const powers = Array.from({ length: 101 }, (_, i) => -5 + i * 0.25); // dBm
    const phaseVsPower = [
      { name: "φ_SPM", color: "#f87171", f: (p: number) => nonlinearPhase(gamma, p, Leff) },
      { name: `φ_XPM max (${N - 1} other ch.)`, color: "#60a5fa", f: (p: number) => xpmPhaseMax(gamma, p, Leff, N - 1) },
    ].map(({ name, color, f }) => ({
      x: powers, y: powers.map((p) => f(10 ** (p / 10) * 1e-3)),
      type: "scatter" as const, mode: "lines" as const, name, line: { color, width: 2 },
    }));

    const distances = Array.from({ length: 80 }, (_, i) => ((i + 1) / 80) * 2 * (L / 1e3)); // km
    const phaseVsDistance = [{
      x: distances, y: distances.map((d) => nonlinearPhase(gamma, P, effectiveLength(a, d * 1e3))),
      type: "scatter" as const, mode: "lines" as const, name: "φ_SPM (rad)", line: { color: "#a78bfa", width: 2 },
    }];

    const spacings = Array.from({ length: 96 }, (_, i) => 5 + i * 2); // GHz
    const fwmVsSpacing = [{
      x: spacings, y: spacings.map((s) => toDb(fwmRatio(s * 1e9))),
      type: "scatter" as const, mode: "lines" as const, name: "degenerate product / channel", line: { color: "#fbbf24", width: 2 },
    }];

    return {
      P, N, gamma, Leff, phiSPM, phiXPM, broadening: spmRmsBroadening(phiSPM), eta, fwmRatio: fwmRatio(df),
      sbsDbm: 10 * Math.log10(sbs * 1e3), srsDbm: 10 * Math.log10(srs * 1e3),
      phaseVsPower, phaseVsDistance, fwmVsSpacing,
    };
  }, [power, length, effectiveArea, alpha, n2, wavelength, dispersion, slope, numChannels, channelSpacing]);

  const sbsAbove = power > calc.sbsDbm;
  const srsAbove = power > calc.srsDbm;
  const fwmDb = calc.N >= 2 ? toDb(calc.fwmRatio) : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Launch Power per Channel (dBm)" value={power} onChange={setPower} step="0.5" />
        <ValidatedNumberInput label="Fiber Length (km)" value={length} onChange={setLength} min={0} step="1" />
        <ValidatedNumberInput label="Effective Area A_eff (µm²)" value={effectiveArea} onChange={setEffectiveArea} min={1} step="1" />
        <ValidatedNumberInput label="Attenuation (dB/km)" value={alpha} onChange={setAlpha} min={0} step="0.01" />
        <ValidatedNumberInput label="n₂ (×10⁻²⁰ m²/W)" value={n2} onChange={setN2} min={0} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={1} step="1" />
        <ValidatedNumberInput label="Dispersion D (ps/(nm·km))" value={dispersion} onChange={setDispersion} step="0.5" />
        <ValidatedNumberInput label="Dispersion Slope S (ps/(nm²·km))" value={slope} onChange={setSlope} step="0.001" />
        <ValidatedNumberInput label="WDM Channels" value={numChannels} onChange={setNumChannels} min={1} step="1" />
        <ValidatedNumberInput label="Channel Spacing (GHz)" value={channelSpacing} onChange={setChannelSpacing} min={0} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label="Nonlinear Coefficient γ" value={`${(calc.gamma * 1e3).toFixed(3)} /(W·km)`} sub="2πn₂/(λ·A_eff)" color="text-cyan-400" />
        <Card label="Effective Length L_eff" value={`${(calc.Leff / 1e3).toFixed(2)} km`} color="text-cyan-400" />
        <Card label="SPM Phase φ_SPM" value={`${calc.phiSPM.toFixed(3)} rad`} sub={`${(calc.phiSPM / Math.PI).toFixed(3)}π`} color="text-purple-400" />
        <Card label="SPM RMS Broadening" value={`× ${calc.broadening.toFixed(3)}`} sub="unchirped Gaussian, no dispersion" color="text-purple-400" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label={`XPM Phase, max (${calc.N - 1} other ch.)`} value={`${calc.phiXPM.toFixed(3)} rad`} sub="co-polarized, no walk-off" color="text-blue-400" />
        <Card label="FWM Efficiency η" value={calc.N >= 2 ? calc.eta.toExponential(3) : "—"} sub={calc.N >= 2 ? `nearest product, ${channelSpacing} GHz` : "needs ≥ 2 channels"} color="text-yellow-400" />
        <Card
          label="FWM Product / Channel"
          value={fwmDb === null ? "—" : `${fwmDb.toFixed(1)} dB`}
          sub={calc.N >= 3 ? "degenerate; non-degenerate +6.0 dB" : calc.N === 2 ? "falls on a channel only with ≥ 3 channels" : "needs ≥ 2 channels"}
          color="text-yellow-400"
        />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SBS / SRS Threshold</p>
          <p className="text-xl font-bold">
            <span className={sbsAbove ? "text-red-400" : "text-green-400"}>{calc.sbsDbm.toFixed(1)}</span>
            {" / "}
            <span className={srsAbove ? "text-red-400" : "text-green-400"}>{calc.srsDbm.toFixed(1)}</span> dBm
          </p>
          <p className="text-xs text-gray-500">
            narrow CW, co-polarized{sbsAbove ? " · launch is above SBS" : ""}{srsAbove ? " · above SRS" : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Nonlinear Phase vs Launch Power</h3>
          <ChartPanel data={calc.phaseVsPower} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Launch Power per Channel (dBm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Phase (rad)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 10 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">φ_SPM vs Distance</h3>
          <ChartPanel data={calc.phaseVsDistance} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Distance (km)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "φ_SPM (rad)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4 sm:col-span-2">
          <h3 className="text-lg font-semibold mb-3">FWM Product vs Channel Spacing</h3>
          <ChartPanel data={calc.fwmVsSpacing} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Channel Spacing (GHz)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Product / Channel Power (dB)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>γ = 2π·n₂ / (λ·A_eff),  L_eff = (1 − e^(−αL)) / α</p>
          <p>φ_SPM = γ·P·L_eff,  φ_XPM ≤ 2γ·P·L_eff·(N − 1)</p>
          <p>Δω_rms/Δω₀ = √(1 + 4φ²/(3√3))  [unchirped Gaussian]</p>
          <p>Δβ = −Δω²(β₂ ± β₃Δω),  η = α²/(α² + Δβ²)·[1 + 4e^(−αL) sin²(ΔβL/2)/(1 − e^(−αL))²]</p>
          <p>P_FWM / P_ch = η·(d/3)²·(γ·P·L_eff)²,  d = 3 degenerate, 6 non-degenerate</p>
          <p>P_SBS = 21·A_eff / (g_B·L_eff), g_B = 5×10⁻¹¹ m/W;  P_SRS = 16·A_eff / (g_R·L_eff), g_R ∝ 1/λ</p>
        </div>
      </div>
    </>
  );
}

function Card({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
