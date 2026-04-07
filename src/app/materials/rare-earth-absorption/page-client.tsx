"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
// Rare earth ions: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺
// Absorption cross-section data (simplified Gaussian peaks)
interface REPeak { wl: number; sigma: number; fwhm: number; transition: string }

const RARE_EARTHS: Record<string, { name: string; color: string; peaks: REPeak[] }> = {
  Er3: { name: "Er³⁺", color: "#34d399", peaks: [
    { wl: 980, sigma: 2.5e-25, fwhm: 30, transition: "⁴I₁₅/₂ → ⁴I₁₁/₂" },
    { wl: 1530, sigma: 6.0e-25, fwhm: 50, transition: "⁴I₁₅/₂ → ⁴I₁₃/₂" },
    { wl: 800, sigma: 0.5e-25, fwhm: 20, transition: "⁴I₁₅/₂ → ⁴I₉/₂" },
    { wl: 520, sigma: 1.0e-25, fwhm: 25, transition: "⁴I₁₅/₂ → ²H₁₁/₂" },
    { wl: 650, sigma: 0.8e-25, fwhm: 20, transition: "⁴I₁₅/₂ → ⁴F₉/₂" },
  ]},
  Nd3: { name: "Nd³⁺", color: "#60a5fa", peaks: [
    { wl: 808, sigma: 3.0e-25, fwhm: 20, transition: "⁴I₉/₂ → ⁴F₅/₂" },
    { wl: 880, sigma: 1.5e-25, fwhm: 25, transition: "⁴I₉/₂ → ⁴F₃/₂" },
    { wl: 1064, sigma: 4.0e-25, fwhm: 30, transition: "⁴I₉/₂ → ⁴F₃/₂ (em)" },
    { wl: 530, sigma: 1.0e-25, fwhm: 15, transition: "⁴I₉/₂ → ⁴G₇/₂" },
    { wl: 750, sigma: 0.5e-25, fwhm: 15, transition: "⁴I₉/₂ → ⁴F₇/₂" },
  ]},
  Yb3: { name: "Yb³⁺", color: "#f59e0b", peaks: [
    { wl: 975, sigma: 4.0e-25, fwhm: 35, transition: "²F₇/₂ → ²F₅/₂" },
    { wl: 910, sigma: 0.5e-25, fwhm: 40, transition: "²F₇/₂ → ²F₅/₂ (side)" },
  ]},
  Tm3: { name: "Tm³⁺", color: "#a78bfa", peaks: [
    { wl: 790, sigma: 3.0e-25, fwhm: 25, transition: "³H₆ → ³H₄" },
    { wl: 1210, sigma: 1.0e-25, fwhm: 40, transition: "³H₆ → ³H₅" },
    { wl: 1650, sigma: 1.5e-25, fwhm: 50, transition: "³H₆ → ³F₄" },
  ]},
  Ho3: { name: "Ho³⁺", color: "#f87171", peaks: [
    { wl: 1150, sigma: 0.8e-25, fwhm: 30, transition: "⁵I₈ → ⁵I₆" },
    { wl: 1950, sigma: 2.0e-25, fwhm: 60, transition: "⁵I₈ → ⁵I₇" },
    { wl: 540, sigma: 1.5e-25, fwhm: 20, transition: "⁵I₈ → ⁵S₂" },
    { wl: 640, sigma: 0.8e-25, fwhm: 20, transition: "⁵I₈ → ⁵F₅" },
  ]},
};

function absorptionCrossSection(wl: number, peaks: REPeak[]): number {
  let sigma = 0;
  for (const p of peaks) {
    const fwhm_sigma = p.fwhm / 2.355;
    sigma += p.sigma * Math.exp(-0.5 * Math.pow((wl - p.wl) / fwhm_sigma, 2));
  }
  return sigma;
}

export default function RareEarthAbsorptionPage() {
  const [selected, setSelected] = useState<string[]>(["Er3", "Nd3", "Yb3"]);
  const [concentration, setConcentration] = useState(1e25); // ions/m³
  const [pumpWl, setPumpWl] = useState(980);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 400 + i * 4);
    const traces: any[] = [];
    for (const key of selected) {
      const re = RARE_EARTHS[key];
      const sigmas = wls.map(wl => absorptionCrossSection(wl, re.peaks) * 1e25);
      traces.push({ x: wls, y: sigmas, type: "scatter" as const, mode: "lines" as const, name: re.name, line: { color: re.color, width: 2 } });
    }
    return traces;
  }, [selected]);

  const toggleIon = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const activeAbs = selected.reduce((sum, key) => sum + absorptionCrossSection(pumpWl, RARE_EARTHS[key].peaks), 0);
  const alpha = activeAbs * concentration;
  const absorptionPerCm = 1 - Math.exp(-alpha * 0.01);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Rare Earth Absorption Spectra" description="Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.">
            
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(RARE_EARTHS).map(([key, re]) => (
            <button key={key} onClick={() => toggleIon(key)} className={`px-3 py-1.5 rounded text-sm font-medium border ${selected.includes(key) ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-gray-700 text-gray-500"}`}>{re.name}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Concentration (ions/m³)</label>
          <input type="number" value={concentration} onChange={e => setConcentration(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" step={1e23} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Probe Wavelength (nm)</label>
          <input type="number" value={pumpWl} onChange={e => setPumpWl(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" step={10} />
        </div>
        <div className="flex items-end">
          <div className="bg-gray-900 rounded-lg p-3 w-full">
            <div className="text-xs text-gray-500">α at {pumpWl} nm</div>
            <div className="text-lg font-bold text-yellow-400">{(alpha * 100).toFixed(2)} m⁻¹</div>
            <div className="text-xs text-gray-500">Absorption/cm: {(absorptionPerCm * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <ChartPanel data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "σ_abs (×10⁻²⁵ m²)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.25 }, margin: { t: 30, b: 70, l: 60, r: 20 } }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-3">Transition Details</h2>
        {selected.map(key => {
          const re = RARE_EARTHS[key];
          return <div key={key} className="mb-4"><h3 className="text-sm font-bold mb-2">{re.name}</h3>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-gray-500 border-b border-gray-800"><th className="text-left py-1">λ (nm)</th><th className="text-left py-1">Transition</th><th className="text-right py-1">σ (×10⁻²⁵ m²)</th><th className="text-right py-1">FWHM (nm)</th></tr></thead>
              <tbody>{re.peaks.map(p => <tr key={p.wl} className="border-b border-gray-800/50"><td className="py-1">{p.wl}</td><td className="py-1">{p.transition}</td><td className="text-right py-1">{p.sigma * 1e25}</td><td className="text-right py-1">{p.fwhm}</td></tr>)}</tbody></table></div></div>;
        })}
        <div className="mt-4 text-sm text-gray-400 font-mono bg-gray-800 p-2 rounded">α = σ<sub>abs</sub>(λ) · N (m⁻¹) | Beer-Lambert: T = exp(−α · L)</div>
      </div>
    </CalculatorShell>
  );
}
