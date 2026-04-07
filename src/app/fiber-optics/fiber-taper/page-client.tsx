"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function FiberTaperPage() {
  const [pullLength, setPullLength] = useURLState("pullLength", 5000); // μm total
  const [heaterWidth, setHeaterWidth] = useURLState("heaterWidth", 2); // mm
  const [initialDia, setInitialDia] = useURLState("initialDia", 125); // μm
  const [coreDia, setCoreDia] = useURLState("coreDia", 8.2); // μm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [taperType, setTaperType] = useState<"symmetric" | "asymmetric">("symmetric");

  const calc = useMemo(() => {
    const stretch = pullLength * 1e-3; // mm
    const L_hot = heaterWidth;
    // Conservation of volume: π r₀² L₀ = π r² L → r = r₀ √(L₀/L)
    const waistDia = initialDia * Math.sqrt(L_hot / (L_hot + stretch));
    const stretchRatio = (L_hot + stretch) / L_hot;
    const waistCoreDia = coreDia / Math.sqrt(stretchRatio);

    const NA = 0.12;
    const V_waist = (2 * Math.PI / (wavelength * 1e-3)) * (waistCoreDia / 2) * NA;

    // Evanescent field penetration depth at waist
    const n_eff = 1.45;
    const n_ext = 1.33; // water/air
    const d_p = (wavelength * 1e-3) / (2 * Math.PI * Math.sqrt(n_eff * n_eff - n_ext * n_ext));

    // Coupling coefficient for waist region
    const kappa = Math.PI / (2 * waistDia * 1e-3); // simplified, per mm
    const couplingLength = Math.PI / (2 * kappa); // half-beat length

    // Losses
    const excessLoss = waistDia < 5 ? 0.5 * Math.pow((5 - waistDia) / 5, 2) : 0;
    const transmission = Math.pow(10, -excessLoss / 10);

    return { waistDia, stretchRatio, waistCoreDia, V_waist, d_p, kappa, couplingLength, excessLoss, transmission };
  }, [pullLength, heaterWidth, initialDia, coreDia, wavelength, taperType]);

  const chartData = useMemo(() => {
    const pulls = Array.from({ length: 200 }, (_, i) => i * 50);
    const waists = pulls.map(p => {
      const s = p * 1e-3;
      return initialDia * Math.sqrt(heaterWidth / (heaterWidth + s));
    });
    const losses = waists.map(w => w < 5 ? 0.5 * Math.pow((5 - w) / 5, 2) : 0);

    return [
      { x: pulls, y: waists, type: "scatter" as const, mode: "lines" as const, name: "Waist Ø (μm)", line: { color: "#f87171" }, yaxis: "y" },
      { x: pulls, y: losses, type: "scatter" as const, mode: "lines" as const, name: "Excess Loss (dB)", line: { color: "#fbbf24" }, yaxis: "y2" },
    ];
  }, [initialDia, heaterWidth]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Taper Calculation" description="Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pull Length (μm)" value={pullLength} onChange={setPullLength} min={0} />
        <ValidatedNumberInput label="Heater Width (mm)" value={heaterWidth} onChange={setHeaterWidth} min={0.1} step="any" />
        <ValidatedNumberInput label="Initial Cladding Ø (μm)" value={initialDia} onChange={setInitialDia} min={1} />
        <ValidatedNumberInput label="Core Ø (μm)" value={coreDia} onChange={setCoreDia} min={0.1} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Waist Ø</p>
          <p className="text-xl font-bold text-red-400">{calc.waistDia.toFixed(1)} μm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stretch Ratio</p>
          <p className="text-xl font-bold text-blue-400">{calc.stretchRatio.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Evanescent Depth</p>
          <p className="text-xl font-bold text-green-400">{calc.d_p.toFixed(3)} μm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Excess Loss</p>
          <p className="text-xl font-bold text-yellow-400">{calc.excessLoss.toFixed(4)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Volume conservation: d_waist = d₀ × √(L₀ / (L₀ + ΔL))</p>
          <p>Evanescent depth: d_p = λ / (2π √(n_eff² - n_ext²))</p>
          <p>Coupling coeff: κ ≈ π / (2d_waist)</p>
          <p>Beat length: L_B = π / (2κ)</p>
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Pull Length (μm)", gridcolor: "#374151" },
        yaxis: { title: "Waist Diameter (μm)", gridcolor: "#374151" },
        yaxis2: { title: "Excess Loss (dB)", overlaying: "y", side: "right", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30, r: 60 },
      }} />
    </CalculatorShell>
  );
}
