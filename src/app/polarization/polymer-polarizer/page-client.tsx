"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function PolymerPolarizerPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [thickness, setThickness] = useURLState("thickness", 25); // μm
  const [dichroicRatio, setDichroicRatio] = useURLState("dichroicRatio", 40);
  const [absorptionCoeff, setAbsorptionCoeff] = useURLState("absorptionCoeff", 0.08); // μm⁻¹ for extraordinary
  const [iodineConc, setIodineConc] = useURLState("iodineConc", 1.0);

  // Dichroic ratio R = A_para / A_perp
  // Transmission of absorbed polarization: T_perp = exp(-A_perp * c * d)
  // Transmission of passed polarization: T_para = exp(-A_para * c * d)
  // T_para / T_perp = R (approximately, for thin films)
  const d = thickness; // μm
  const Apara = absorptionCoeff * iodineConc;
  const Aperp = Apara / dichroicRatio;

  const Tpara = Math.exp(-Apara * d);
  const Tperp = Math.exp(-Aperp * d);

  const transmission = (Tpara + Tperp) / 2; // unpolarized input
  const singlePassT = Tpara;
  const extinction = Tpara / Tperp;
  const extinctionDB = 10 * Math.log10(extinction);

  // Polarization efficiency: (T_para - T_perp) / (T_para + T_perp)
  const polEff = (Tpara - Tperp) / (Tpara + Tperp);

  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 380 + (i / 300) * 500);
    // Iodine-based polarizers peak in visible, absorption shifts with wavelength
    const specFactor = wls.map(w => {
      const peak = 520;
      return Math.exp(-((w - peak) ** 2) / (2 * 80 ** 2)) * 0.3 + 0.7;
    });
    const Tp = specFactor.map((sf, i) => {
      const wl = wls[i];
      const aP = absorptionCoeff * iodineConc * (wl < 400 ? 1.3 : wl > 700 ? 0.6 : 1.0) * sf;
      const aS = aP / dichroicRatio;
      return Math.exp(-aP * d);
    });
    const Ts = specFactor.map((sf, i) => {
      const wl = wls[i];
      const aP = absorptionCoeff * iodineConc * (wl < 400 ? 1.3 : wl > 700 ? 0.6 : 1.0) * sf;
      const aS = aP / dichroicRatio;
      return Math.exp(-aS * d);
    });
    return [
      { x: wls, y: Tp, type: "scatter" as const, mode: "lines" as const, name: "T∥ (passed)", line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: Ts, type: "scatter" as const, mode: "lines" as const, name: "T⊥ (blocked)", line: { color: "#f87171", width: 2 } },
      { x: [wavelength, wavelength], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "λ₀", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [absorptionCoeff, iodineConc, dichroicRatio, d, wavelength]);

  const thicknessData = useMemo(() => {
    const ths = Array.from({ length: 200 }, (_, i) => 5 + (i / 200) * 60);
    const Tp = ths.map(t => Math.exp(-Apara * t));
    const Ts = ths.map(t => Math.exp(-Aperp * t));
    const ext = ths.map(t => Math.exp(-(Apara - Aperp) * t));
    return [
      { x: ths, y: Tp, type: "scatter" as const, mode: "lines" as const, name: "T∥", line: { color: "#60a5fa", width: 2 } },
      { x: ths, y: Ts, type: "scatter" as const, mode: "lines" as const, name: "T⊥", line: { color: "#f87171", width: 2 } },
      { x: ths, y: ext, type: "scatter" as const, mode: "lines" as const, name: "Extinction", line: { color: "#a78bfa", width: 2 }, yaxis: "y2" },
    ];
  }, [Apara, Aperp]);

  const ratioData = useMemo(() => {
    const ratios = Array.from({ length: 200 }, (_, i) => 5 + (i / 200) * 95);
    const extDB = ratios.map(r => {
      const ap = Aperp;
      const aP = ap * r;
      return 10 * Math.log10(Math.exp(-(aP - ap) * d));
    });
    const polEffs = ratios.map(r => {
      const tp = Math.exp(-(Aperp * r) * d);
      const ts = Math.exp(-Aperp * d);
      return (tp - ts) / (tp + ts);
    });
    return [
      { x: ratios, y: extDB, type: "scatter" as const, mode: "lines" as const, name: "Extinction (dB)", line: { color: "#fbbf24", width: 2 } },
      { x: ratios, y: polEffs, type: "scatter" as const, mode: "lines" as const, name: "Pol. Efficiency", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
    ];
  }, [Aperp, d]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Polymer (Sheet) Polarizer" description="Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">T<sub>∥</sub> = exp(-α<sub>∥</sub> · c · d), T<sub>⊥</sub> = exp(-α<sub>⊥</sub> · c · d)</p>
        <p className="text-gray-300 text-sm font-mono">R = α<sub>∥</sub>/α<sub>⊥</sub> (dichroic ratio), Extinction = T<sub>∥</sub>/T<sub>⊥</sub></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={380} max={780} step="10" />
        <ValidatedNumberInput label="Thickness (μm)" value={thickness} onChange={setThickness} min={5} max={80} step="1" />
        <ValidatedNumberInput label="Dichroic Ratio" value={dichroicRatio} onChange={setDichroicRatio} min={2} max={100} step="5" />
        <ValidatedNumberInput label="Absorption Coeff (μm⁻¹)" value={absorptionCoeff} onChange={setAbsorptionCoeff} min={0.01} max={0.5} step="0.01" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setDichroicRatio(40); setAbsorptionCoeff(0.08); setThickness(25); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">H-Sheet (PVA-I₂)</button>
        <button onClick={() => { setDichroicRatio(10); setAbsorptionCoeff(0.04); setThickness(30); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">K-Sheet</button>
        <button onClick={() => { setDichroicRatio(80); setAbsorptionCoeff(0.1); setThickness(20); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">High-Extinction</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T∥ (passed)</p>
          <p className="text-2xl font-bold text-green-400">{(Tpara * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T⊥ (blocked)</p>
          <p className="text-2xl font-bold text-red-400">{(Tperp * 100).toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction Ratio (dB)</p>
          <p className="text-2xl font-bold text-yellow-400">{extinctionDB.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Polarization Efficiency</p>
          <p className="text-2xl font-bold text-purple-400">{(polEff * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Spectral Transmission</h3>
          <ChartPanel data={spectralData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151", range: [-0.05, 1.05] },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmission vs Thickness</h3>
          <ChartPanel data={thicknessData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Thickness (μm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151", range: [-0.05, 1.05] },
            yaxis2: { title: "Extinction", overlaying: "y", side: "right", gridcolor: "transparent" },
            margin: { t: 20, r: 60, b: 50, l: 50 }, height: 300,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Extinction & Polarization Efficiency vs Dichroic Ratio</h3>
        <ChartPanel data={ratioData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Dichroic Ratio", gridcolor: "#374151" },
          yaxis: { title: "Extinction (dB)", gridcolor: "#374151" },
          yaxis2: { title: "Pol. Efficiency", overlaying: "y", side: "right", gridcolor: "transparent", range: [0.9, 1.005] },
          margin: { t: 20, r: 60, b: 50, l: 60 },
        }} />
      </div>
    </CalculatorShell>
  );
}
