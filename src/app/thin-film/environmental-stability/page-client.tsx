"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function EnvironmentalStabilityPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [numPairs, setNumPairs] = useState(5);
  const [designWl, setDesignWl] = useState(550);
  const [humidityPct, setHumidityPct] = useState(50);
  const [tempC, setTempC] = useState(25);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 600 / 500);

    // Environmental effects on thin films:
    // 1. Water absorption changes n (typically +0.001 to +0.02 for porous films)
    // 2. Thermal expansion changes d (CTE ~ 5-10 ppm/°C)
    // 3. Temperature changes n (thermo-optic coefficient dn/dT ~ 1-5 × 10⁻⁵ /°C)

    // Model parameters
    const dn_dT_H = 2e-5; // thermo-optic for high-index (TiO₂)
    const dn_dT_L = 1e-5; // thermo-optic for low-index (SiO₂)
    const CTE_H = 8e-6; // CTE for TiO₂ (/°C)
    const CTE_L = 0.5e-6; // CTE for SiO₂ (/°C)

    // Humidity effect: water absorption changes n and d for porous films
    // Δn ≈ 0.02 × (RH/100) for SiO₂ (porous), negligible for dense TiO₂
    const dn_RH_L = 0.02 * (humidityPct / 100);
    const dn_RH_H = 0.002 * (humidityPct / 100);

    const deltaT = tempC - 25;

    const traces: any[] = [];
    const conditions = [
      { name: "Nominal (25°C, 0% RH)", dT: 0, rh: 0, color: "#60a5fa" },
      { name: `Humidity (${humidityPct}% RH)`, dT: 0, rh: humidityPct, color: "#34d399" },
      { name: `Temperature (${tempC}°C)`, dT: deltaT, rh: 0, color: "#fbbf24" },
      { name: `Combined (${tempC}°C, ${humidityPct}% RH)`, dT: deltaT, rh: humidityPct, color: "#f87171" },
    ];

    for (const cond of conditions) {
      const nH_eff = nH + cond.dT * dn_dT_H + dn_RH_H * (cond.rh / 100) * 100;
      const nL_eff = nL + cond.dT * dn_dT_L + dn_RH_L * (cond.rh / 100) * 100;

      const dH_base = designWl / (4 * nH);
      const dL_base = designWl / (4 * nL);
      const dH_eff = dH_base * (1 + cond.dT * CTE_H);
      const dL_eff = dL_base * (1 + cond.dT * CTE_L);

      // Transfer matrix
      const R = wls.map(wl => {
        let m11r = 1, m11i = 0, m12r = 0, m12i = 0;
        let m21r = 0, m21i = 0, m22r = 1, m22i = 0;

        for (let j = 0; j < numPairs * 2; j++) {
          const n = j % 2 === 0 ? nH_eff : nL_eff;
          const d = j % 2 === 0 ? dH_eff : dL_eff;
          const delta = (2 * Math.PI * n * d) / wl;
          const cosD = Math.cos(delta), sinD = Math.sin(delta);
          const new11r = m11r * cosD + m12r * (-n * sinD);
          const new11i = m11i * cosD + m12i * (-n * sinD);
          const new12r = m11r * (-sinD / n) + m12r * cosD;
          const new12i = m11i * (-sinD / n) + m12i * cosD;
          const new21r = m21r * cosD + m22r * (-n * sinD);
          const new21i = m21i * cosD + m22i * (-n * sinD);
          const new22r = m21r * (-sinD / n) + m22r * cosD;
          const new22i = m21i * (-sinD / n) + m22i * cosD;
          m11r = new11r; m11i = new11i; m12r = new12r; m12i = new12i;
          m21r = new21r; m21i = new21i; m22r = new22r; m22i = new22i;
        }

        const numR = m11r * nInc + m12r * nInc * nSub - m21r - m22r * nSub;
        const numI = m11i * nInc + m12i * nInc * nSub - m21i - m22i * nSub;
        const denR = m11r * nInc + m12r * nInc * nSub + m21r + m22r * nSub;
        const denI = m11i * nInc + m12i * nInc * nSub + m21i + m22i * nSub;
        return (numR * numR + numI * numI) / (denR * denR + denI * denI);
      });

      traces.push({
        x: wls, y: R, type: "scatter" as const, mode: "lines" as const,
        name: cond.name, line: { color: cond.color, width: 2 },
      });
    }

    // Wavelength shift vs temperature
    const tempRange = Array.from({ length: 200 }, (_, i) => -50 + i * 150 / 200);
    const shiftVsTemp = tempRange.map(t => {
      const dT = t - 25;
      const nH_eff = nH + dT * dn_dT_H;
      const nL_eff = nL + dT * dn_dT_L;
      const dH_eff = (designWl / (4 * nH)) * (1 + dT * CTE_H);
      const dL_eff = (designWl / (4 * nL)) * (1 + dT * CTE_L);
      // Approximate center wavelength shift: proportional to effective optical thickness change
      const otH = nH_eff * dH_eff;
      const otL = nL_eff * dL_eff;
      const otNom = nH * designWl / (4 * nH) + nL * designWl / (4 * nL);
      const otEff = otH + otL;
      return designWl * (otEff / otNom - 1);
    });

    return { mainTraces: traces, tempRange, shiftVsTemp };
  }, [nH, nL, nSub, nInc, numPairs, designWl, humidityPct, tempC]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Environmental Stability" description="Environmental factors shift thin film spectral performance. Temperature changes refractive index
        (thermo-optic effect, dn/dT) and layer thickness (thermal expansion, CTE). Humidity causes water
        absorption in porous layers (especially SiO₂), changing both n and d. Dense films (TiO₂, Ta₂O₅)
        are more environmentally stable. Understanding these shifts is critical for field deployment.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>H</sub> (e.g. TiO₂)</span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>L</sub> (e.g. SiO₂)</span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Number of pairs (N)</span>
          <input type="number" value={numPairs} onChange={e => setNumPairs(Math.max(1, +e.target.value))} min="1" max="20" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Design λ₀ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Temperature (°C)</span>
          <input type="number" value={tempC} onChange={e => setTempC(+e.target.value)} step="5" min="-50" max="200" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Relative Humidity (%)</span>
          <input type="number" value={humidityPct} onChange={e => setHumidityPct(Math.min(100, Math.max(0, +e.target.value)))} step="5" min="0" max="100" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300 text-xs">Thermo-optic: dn/dT = 2×10⁻⁵ /°C (TiO₂), 1×10⁻⁵ /°C (SiO₂)</p>
        <p className="text-gray-300 text-xs">CTE: 8×10⁻⁶ /°C (TiO₂), 0.5×10⁻⁶ /°C (SiO₂)</p>
        <p className="text-gray-300 text-xs">Humidity Δn: 0.02 × RH/100 (SiO₂ porous), 0.002 × RH/100 (TiO₂ dense)</p>
        <p className="text-gray-300 text-xs mt-1">Total center shift: Δλ/λ₀ ≈ (α + dn/dT·n⁻¹)·ΔT + humidity correction</p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance Under Environmental Conditions", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.tempRange, y: chartData.shiftVsTemp, type: "scatter" as const, mode: "lines" as const, name: "Δλ_center", line: { color: "#fb923c", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Center Wavelength Shift vs Temperature", font: { size: 13 } },
        xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Δλ (nm)", gridcolor: "#374151" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
