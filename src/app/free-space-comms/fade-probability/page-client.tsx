"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function FadeProbabilityPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [cn2, setCn2] = useURLState("cn2", 1e-15);
  const [range, setRange] = useURLState("range", 1000); // m
  const [fadeThreshold, setFadeThreshold] = useURLState("fadeThreshold", 10); // dB below mean
  const [rxDiameter, setRxDiameter] = useURLState("rxDiameter", 10); // cm
  const [numChannels, setNumChannels] = useURLState("numChannels", 1);

  // Fade probability based on log-normal model for weak turbulence
  // P(I < I_T) = 0.5 * erfc(σ_I² / (2√2)) for weak turbulence
  // Gamma-gamma model for moderate-strong turbulence (Andrews & Phillips)
  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const L = range;
    const D = rxDiameter * 1e-2;

    // Rytov variance
    const sigmaR2 = 1.23 * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);

    // Aperture averaging
    const fresnel = Math.sqrt(lambda * L);
    const ratio = D / fresnel;
    const FA = 1 / (1 + 1.062 * Math.pow(ratio, 7 / 6));
    const sigmaI2_eff = sigmaR2 * FA;

    // Gamma-gamma distribution parameters
    // α and β from Andrews & Phillips
    let alpha_gg: number, beta_gg: number;
    if (sigmaI2_eff < 0.3) {
      alpha_gg = 1 / (sigmaI2_eff);
      beta_gg = 1 / (sigmaI2_eff);
    } else {
      alpha_gg = 1 / (Math.exp(0.49 * sigmaI2_eff) - 1);
      beta_gg = 1 / (Math.exp(0.18 * sigmaI2_eff) - 1);
    }

    // Fade probability: P(I/I₀ < F_T) where F_T = 10^(-threshold/10)
    const FT = Math.pow(10, -fadeThreshold / 10);

    // Gamma-gamma CDF approximation
    // P(I < I_T) ≈ (αβ)/(α+β) * FT^β / Γ(β) * ₂F₁(...) (simplified)
    // Use log-normal approximation for comparison
    const sigma_ln = Math.sqrt(Math.log(1 + sigmaI2_eff));
    const mu_ln = -sigma_ln * sigma_ln / 2;
    const lnThreshold = Math.log(FT);
    // P = 0.5 * erfc(-(lnThreshold - mu_ln) / (sigma_ln * sqrt(2)))
    const arg = -(lnThreshold - mu_ln) / (sigma_ln * Math.SQRT2);
    const erfApprox = (x: number) => {
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
      const p = 0.3275911;
      const sign = x >= 0 ? 1 : -1;
      const t = 1 / (1 + p * Math.abs(x));
      const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return sign * y;
    };
    const Pfade_ln = 0.5 * (1 - erfApprox(arg));

    // Mean fade time (Burgemeister et al.)
    const V_wind = 5; // m/s
    const rho0 = Math.pow(1.46 * cn2 * k * k * L, -3 / 5);
    const tau_fade = rho0 / V_wind; // seconds

    // Diversity improvement (for multi-channel)
    const Pfade_diversity = numChannels > 1 ? Math.pow(Pfade_ln, numChannels) : Pfade_ln;

    // Mean time between fades
    const MTBF = numChannels > 1 ? tau_fade / Pfade_ln : tau_fade / Pfade_ln;

    return {
      sigmaR2, sigmaI2_eff, FA, alpha_gg, beta_gg,
      Pfade_ln, Pfade_diversity, tau_fade_ms: tau_fade * 1000,
      diversityGain: numChannels > 1 ? -10 * Math.log10(Math.max(Pfade_diversity / Pfade_ln, 1e-15)) : 0,
    };
  }, [wavelength, cn2, range, fadeThreshold, rxDiameter, numChannels]);

  const plotData = useMemo(() => {
    const thresholds = Array.from({ length: 100 }, (_, i) => i * 0.5); // 0-50 dB
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const D = rxDiameter * 1e-2;
    const sigmaR2 = 1.23 * cn2 * Math.pow(k, 7 / 6) * Math.pow(range, 11 / 6);
    const fresnel = Math.sqrt(lambda * range);
    const FA = 1 / (1 + 1.062 * Math.pow(D / fresnel, 7 / 6));
    const sigmaI2 = sigmaR2 * FA;
    const sigma_ln = Math.sqrt(Math.log(1 + sigmaI2));
    const mu_ln = -sigma_ln * sigma_ln / 2;

    const erfApprox = (x: number) => {
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
      const p = 0.3275911;
      const sign = x >= 0 ? 1 : -1;
      const t = 1 / (1 + p * Math.abs(x));
      return sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
    };

    const single = thresholds.map((th) => {
      const FT = Math.pow(10, -th / 10);
      const arg = -(Math.log(FT) - mu_ln) / (sigma_ln * Math.SQRT2);
      return 0.5 * (1 - erfApprox(arg));
    });

    const diversity = thresholds.map((th) => Math.pow(Math.max(single[thresholds.indexOf(th)], 1e-30), numChannels));

    return [
      { x: thresholds, y: single, type: "scatter", mode: "lines", name: "Single Channel", line: { color: "#06b6d4" } },
      { x: thresholds, y: diversity, type: "scatter", mode: "lines", name: `${numChannels}-Channel Diversity`, line: { color: "#f97316" } },
    ];
  }, [wavelength, cn2, range, rxDiameter, numChannels]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["C_n² (m⁻²ᐟ³)", cn2, setCn2, 1e-15],
            ["Range (m)", range, setRange],
            ["Fade Threshold (dB)", fadeThreshold, setFadeThreshold],
            ["RX Diameter (cm)", rxDiameter, setRxDiameter],
            ["Num Channels", numChannels, setNumChannels],
          ].map(([label, val, set, step]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={step as number | undefined}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Effective σ_I²</span><span>{calc.sigmaI2_eff.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Aperture Avg Factor</span><span>{calc.FA.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">γ-Gamma α, β</span><span>{calc.alpha_gg.toFixed(2)}, {calc.beta_gg.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Fade Prob (single)</span><span className="font-bold">{calc.Pfade_ln < 1e-6 ? calc.Pfade_ln.toExponential(2) : (calc.Pfade_ln * 100).toFixed(4) + "%"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Fade Prob (diversity)</span><span className="text-orange-400 font-bold">{calc.Pfade_diversity < 1e-6 ? calc.Pfade_diversity.toExponential(2) : (calc.Pfade_diversity * 100).toFixed(4) + "%"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Mean Fade Time</span><span>{calc.tau_fade_ms.toFixed(2)} ms</span></div>
              {numChannels > 1 && (
                <div className="flex justify-between"><span className="text-gray-400">Diversity Gain</span><span className="text-green-400">{calc.diversityGain.toFixed(2)} dB</span></div>
              )}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Fade Probability vs Threshold</h3>
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Fade Threshold (dB)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "P(fade)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
