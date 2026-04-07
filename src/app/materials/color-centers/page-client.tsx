"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
interface ColorCenter { name: string; crystal: string; peak_nm: number; fwhm_nm: number; sigma_abs: number; sigma_em: number; color: string; defect: string }

const COLOR_CENTERS: Record<string, ColorCenter> = {
  F_Center: { name: "F Center", crystal: "KCl", peak_nm: 560, fwhm_nm: 80, sigma_abs: 2e-16, sigma_em: 1e-16, color: "#f59e0b", defect: "Electron trapped at anion vacancy" },
  F2_Center: { name: "F₂ Center", crystal: "LiF", peak_nm: 670, fwhm_nm: 100, sigma_abs: 5e-16, sigma_em: 3e-16, color: "#f87171", defect: "Two adjacent F centers" },
  NV_Center: { name: "NV⁻ Center", crystal: "Diamond", peak_nm: 637, fwhm_nm: 120, sigma_abs: 3e-17, sigma_em: 3e-17, color: "#ec4899", defect: "N-V pair, negative charge state" },
  NV0_Center: { name: "NV⁰ Center", crystal: "Diamond", peak_nm: 575, fwhm_nm: 100, sigma_abs: 1e-17, sigma_em: 1e-17, color: "#e879f9", defect: "N-V pair, neutral charge state" },
  SiV_Center: { name: "SiV⁻ Center", crystal: "Diamond", peak_nm: 738, fwhm_nm: 5, sigma_abs: 1e-16, sigma_em: 5e-17, color: "#60a5fa", defect: "Si-V pair, narrow ZPL" },
  GR1: { name: "GR1 Center", crystal: "Diamond", peak_nm: 741, fwhm_nm: 30, sigma_abs: 1e-16, sigma_em: 5e-17, color: "#34d399", defect: "Neutral vacancy in diamond" },
  Cr3_Ruby: { name: "Cr³⁺ (Ruby)", crystal: "Al₂O₃", peak_nm: 694, fwhm_nm: 0.5, sigma_abs: 2e-20, sigma_em: 2.5e-19, color: "#f87171", defect: "Cr³⁺ substitutional in Al₂O₃" },
  Ti_Sapphire: { name: "Ti³⁺ (Ti:Sapph)", crystal: "Al₂O₃", peak_nm: 490, fwhm_nm: 200, sigma_abs: 5e-20, sigma_em: 4e-20, color: "#a78bfa", defect: "Ti³⁺ substitutional in Al₂O₃" },
  Nd_YAG: { name: "Nd³⁺ (YAG)", crystal: "Y₃Al₅O₁₂", peak_nm: 808, fwhm_nm: 5, sigma_abs: 6.5e-20, sigma_em: 8.8e-19, color: "#84cc16", defect: "Nd³⁺ substitutional in YAG" },
  Er_YAG: { name: "Er³⁺ (YAG)", crystal: "Y₃Al₅O₁₂", peak_nm: 1530, fwhm_nm: 50, sigma_abs: 6e-21, sigma_em: 1.7e-20, color: "#06b6d4", defect: "Er³⁺ substitutional in YAG" },
};

function gaussian(wl: number, peak: number, fwhm: number, sigma: number): number {
  const s = fwhm / 2.355;
  return sigma * Math.exp(-0.5 * Math.pow((wl - peak) / s, 2));
}

export default function ColorCentersPage() {
  const [selected, setSelected] = useState<string[]>(["NV_Center", "SiV_Center", "Ti_Sapphire", "Cr3_Ruby"]);
  const [concentration, setConcentration] = useURLState("concentration", 1e24);

  const toggle = (key: string) => setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const absData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 300 + i * 5);
    return selected.map(key => {
      const cc = COLOR_CENTERS[key];
      return { x: wls, y: wls.map(wl => gaussian(wl, cc.peak_nm, cc.fwhm_nm, cc.sigma_abs * 1e16)), type: "scatter" as const, mode: "lines" as const, name: cc.name + " abs", line: { color: cc.color, width: 2 } };
    });
  }, [selected]);

  const emData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 300 + i * 5);
    return selected.map(key => {
      const cc = COLOR_CENTERS[key];
      return { x: wls, y: wls.map(wl => gaussian(wl, cc.peak_nm, cc.fwhm_nm, cc.sigma_em * 1e16)), type: "scatter" as const, mode: "lines" as const, name: cc.name + " em", line: { color: cc.color, width: 2, dash: "dash" } };
    });
  }, [selected]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Color Centers in Crystals" description="Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.">
            
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(COLOR_CENTERS).map(([key, cc]) => (
          <button key={key} onClick={() => toggle(key)} className={`px-3 py-1.5 rounded text-xs border ${selected.includes(key) ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-gray-700 text-gray-500"}`}>{cc.name} ({cc.crystal.split(" ")[0]})</button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-1">Center Concentration: {concentration.toExponential(2)} m⁻³</label>
        <input type="range" min={1e20} max={1e27} step={1e22} value={concentration} onChange={e => setConcentration(+e.target.value)} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 border-b border-gray-800"><th className="text-left py-2">Center</th><th className="text-left py-2">Crystal</th><th className="text-right py-2">λ_peak (nm)</th><th className="text-right py-2">FWHM (nm)</th><th className="text-right py-2">σ_abs (cm²)</th><th className="text-right py-2">σ_em (cm²)</th></tr></thead>
          <tbody>
            {selected.map(key => { const cc = COLOR_CENTERS[key]; return <tr key={key} className="border-b border-gray-800/50"><td className="py-2">{cc.name}</td><td className="py-2">{cc.crystal}</td><td className="text-right py-2">{cc.peak_nm}</td><td className="text-right py-2">{cc.fwhm_nm}</td><td className="text-right py-2">{cc.sigma_abs.toExponential(1)}</td><td className="text-right py-2">{cc.sigma_em.toExponential(1)}</td></tr>; })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold mb-2">Absorption Spectra (solid) and Emission Spectra (dashed)</h3>
        <ChartPanel data={absData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "σ (×10⁻¹⁶ cm²)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.3, font: { size: 9 } }, margin: { t: 20, b: 80, l: 60, r: 20 } }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Emission Spectra</h3>
        <ChartPanel data={emData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "σ (×10⁻¹⁶ cm²)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.3, font: { size: 9 } }, margin: { t: 20, b: 80, l: 60, r: 20 } }} />
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">σ(λ) = σ_peak × exp(-(λ - λ0)² / 2σ²) | α = N × σ_abs</p>
        <p className="font-mono bg-gray-800 p-2 rounded">Quantum efficiency: η = σ_em / σ_abs | Radiative rate: R = N_excited / τ_rad</p>
        <div className="mt-3 text-xs">
          <p><strong>NV⁻ centers</strong> in diamond: spin qubits, single-photon sources. ZPL at 637 nm, zero-phonon line with phonon sideband.</p>
          <p><strong>SiV⁻ centers</strong>: ultra-narrow ZPL (~5 nm), high Debye-Waller factor (&gt;0.7).</p>
          <p><strong>Ti:Sapphire</strong>: broad vibronic band (660-1100 nm), tunable laser workhorse.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
