"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function NonlinearEffectsPage() {
  const [power, setPower] = useState(10); // dBm launch power
  const [length, setLength] = useState(80); // km
  const [effectiveArea, setEffectiveArea] = useState(80); // µm²
  const [alpha, setAlpha] = useState(0.2); // dB/km attenuation
  const [gamma, setGamma] = useState(1.3); // W⁻¹km⁻¹ nonlinear coeff
  const [bitRate, setBitRate] = useState(10); // Gbps
  const [numChannels, setNumChannels] = useState(1);
  const [channelSpacing, setChannelSpacing] = useState(100); // GHz

  const calc = useMemo(() => {
    const P_lin = Math.pow(10, power / 10) * 1e-3; // W
    const alpha_lin = alpha / (10 * Math.log10(Math.E)) / 1e3; // 1/m → but let's use /km
    const alpha_km = alpha / (10 * Math.log10(Math.E)); // 1/km (Neper/km)
    const L_eff = (1 - Math.exp(-alpha_km * length)) / alpha_km; // km

    // SPM (Self-Phase Modulation)
    // Nonlinear phase shift: φ_NL = γ · P · L_eff
    const phiNL = gamma * P_lin * L_eff;
    const spmPenalty = Math.pow(phiNL / Math.PI, 2) * 0.5; // simplified

    // SPM-induced spectral broadening factor
    const spectralBroadening = Math.sqrt(1 + (4 * phiNL / 3) ** 2);

    // XPM (Cross-Phase Modulation) - for WDM
    const xpmPenalty = numChannels > 1 ? spmPenalty * (numChannels - 1) * 2 : 0;

    // FWM (Four-Wave Mixing) efficiency
    // η_FWM ∝ γ²·P²·L_eff² / (Δλ)²
    const deltaF = channelSpacing * 1e9; // Hz
    const D = 17; // ps/nm/km (SMF)
    const fwmEfficiency = (gamma * P_lin * L_eff) ** 2 / (1 + (D * 1e-6 * length * deltaF) ** 2);
    const fwmPenalty = numChannels > 2 ? fwmEfficiency * 1e-3 : 0; // simplified

    // SRS (Stimulated Raman Scattering) threshold
    const srsThreshold = 16 * effectiveArea / (gamma * length); // W (approximate)
    const srsThreshold_dBm = 10 * Math.log10(srsThreshold) + 30;
    const srsMargin = power - srsThreshold_dBm;

    // SBS (Stimulated Brillouin Scattering) threshold
    const linewidth = 10; // MHz typical laser
    const sbsThreshold = 21 * effectiveArea / (gamma * length) * Math.sqrt(1 + linewidth / 20);
    const sbsThreshold_dBm = 10 * Math.log10(sbsThreshold) + 30;
    const sbsMargin = power - sbsThreshold_dBm;

    // Total nonlinear penalty
    const totalPenalty = spmPenalty + xpmPenalty + fwmPenalty;

    // Optimal launch power
    const NLI_coeff = gamma * gamma / (2 * alpha_km); // 1/W
    const P_opt = 10 * Math.log10(-1 / NLI_coeff * 1e3) + 30; // dBm (very simplified)

    return {
      P_lin, L_eff, phiNL, spmPenalty, spectralBroadening,
      xpmPenalty, fwmPenalty, totalPenalty,
      srsThreshold_dBm, srsMargin, sbsThreshold_dBm, sbsMargin,
    };
  }, [power, length, effectiveArea, alpha, gamma, bitRate, numChannels, channelSpacing]);

  const powerData = useMemo(() => {
    const powers = Array.from({ length: 100 }, (_, i) => -5 + i * 0.2);
    const alpha_km = alpha / (10 * Math.log10(Math.E));
    const L_eff = (1 - Math.exp(-alpha_km * length)) / alpha_km;
    const spm = powers.map(p => {
      const P = Math.pow(10, p / 10) * 1e-3;
      return Math.pow(gamma * P * L_eff / Math.PI, 2) * 0.5;
    });
    const xpm = powers.map(p => {
      const P = Math.pow(10, p / 10) * 1e-3;
      return numChannels > 1 ? Math.pow(gamma * P * L_eff / Math.PI, 2) * 0.5 * (numChannels - 1) * 2 : 0;
    });
    const total = powers.map((_, i) => spm[i] + xpm[i]);
    return [
      { x: powers, y: spm, type: "scatter" as const, mode: "lines" as const, name: "SPM", line: { color: "#f87171", width: 2 } },
      { x: powers, y: xpm, type: "scatter" as const, mode: "lines" as const, name: "XPM", line: { color: "#60a5fa", width: 2 } },
      { x: powers, y: total, type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#22c55e", width: 2 } },
      { x: [calc.sbsThreshold_dBm, calc.sbsThreshold_dBm], y: [0, 10], type: "scatter" as const, mode: "lines" as const, name: "SBS Thresh", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [power, length, effectiveArea, alpha, gamma, numChannels, calc]);

  const lengthData = useMemo(() => {
    const lengths = Array.from({ length: 80 }, (_, i) => (i + 1) * 2);
    const alpha_km = alpha / (10 * Math.log10(Math.E));
    const P_lin = Math.pow(10, power / 10) * 1e-3;
    const phiNLs = lengths.map(l => {
      const L_eff = (1 - Math.exp(-alpha_km * l)) / alpha_km;
      return gamma * P_lin * L_eff;
    });
    return [{ x: lengths, y: phiNLs, type: "scatter" as const, mode: "lines" as const, name: "φ_NL (rad)", line: { color: "#a78bfa", width: 2 } }];
  }, [power, length, alpha, gamma]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Nonlinear Effects in Fiber</h1>
      <p className="text-gray-400 mb-8">Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Launch Power (dBm)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Fiber Length (km)</span>
          <input type="number" value={length} onChange={e => setLength(+e.target.value)} step="1" min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Effective Area A_eff (µm²)</span>
          <input type="number" value={effectiveArea} onChange={e => setEffectiveArea(+e.target.value)} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Attenuation (dB/km)</span>
          <input type="number" value={alpha} onChange={e => setAlpha(+e.target.value)} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">γ (W⁻¹km⁻¹)</span>
          <input type="number" value={gamma} onChange={e => setGamma(+e.target.value)} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">WDM Channels</span>
          <input type="number" value={numChannels} onChange={e => setNumChannels(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Channel Spacing (GHz)</span>
          <input type="number" value={channelSpacing} onChange={e => setChannelSpacing(+e.target.value)} step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bit Rate (Gbps)</span>
          <input type="number" value={bitRate} onChange={e => setBitRate(+e.target.value)} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nonlinear Phase φ_NL</p>
          <p className="text-xl font-bold text-purple-400">{calc.phiNL.toFixed(3)} rad</p>
          <p className="text-xs text-gray-500">{(calc.phiNL / Math.PI).toFixed(2)}π</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SPM Penalty</p>
          <p className={`text-xl font-bold ${calc.spmPenalty > 1 ? "text-red-400" : "text-green-400"}`}>{calc.spmPenalty.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">XPM Penalty ({numChannels}ch)</p>
          <p className="text-xl font-bold text-blue-400">{calc.xpmPenalty.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWM Penalty</p>
          <p className="text-xl font-bold text-yellow-400">{calc.fwmPenalty.toFixed(4)} dB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total NL Penalty</p>
          <p className={`text-xl font-bold ${calc.totalPenalty > 1 ? "text-red-400" : "text-green-400"}`}>{calc.totalPenalty.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">L_eff</p>
          <p className="text-xl font-bold text-cyan-400">{calc.L_eff.toFixed(1)} km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SBS Threshold</p>
          <p className={`text-xl font-bold ${calc.sbsMargin > 0 ? "text-red-400" : "text-green-400"}`}>{calc.sbsThreshold_dBm.toFixed(1)} dBm</p>
          <p className="text-xs text-gray-500">{calc.sbsMargin > 0 ? "⚠ Above!" : "✓ Below"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SRS Threshold</p>
          <p className={`text-xl font-bold ${calc.srsMargin > 0 ? "text-red-400" : "text-green-400"}`}>{calc.srsThreshold_dBm.toFixed(1)} dBm</p>
          <p className="text-xs text-gray-500">{calc.srsMargin > 0 ? "⚠ Above!" : "✓ Below"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Penalty vs Launch Power</h3>
          <Plot data={powerData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Launch Power (dBm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Penalty (dB)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 10 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">φ_NL vs Distance</h3>
          <Plot data={lengthData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Distance (km)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "φ_NL (rad)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>γ = 2π·n₂ / (λ·A_eff) [nonlinear coefficient]</p>
          <p>L_eff = (1 - e^(-αL)) / α [effective length]</p>
          <p>φ_NL = γ · P · L_eff [SPM phase shift]</p>
          <p>XPM penalty ≈ (N-1) × 2 × SPM penalty</p>
          <p>SBS threshold ≈ 21·A_eff / (γ·L) · √(1+Δν/20) [W]</p>
          <p>SRS threshold ≈ 16·A_eff / (γ·L) [W]</p>
          <p>Typical: γ=1.3 W⁻¹km⁻¹ (SMF), A_eff=80µm², n₂=2.6×10⁻²⁰ m²/W</p>
        </div>
      </div>
    </div>
  );
}
