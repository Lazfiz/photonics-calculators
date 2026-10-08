"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  blueLightSmallSourceMaxDuration, blueLightSmallSourceRiskGroup, blueLightWeight, type RiskGroup,
} from "../../../physics/laser-safety/hazard-weighting";

const riskGroupLabel: Record<RiskGroup, string> = {
  Exempt: "Exempt (RG0)", RG1: "RG1 (Low Risk)", RG2: "RG2 (Moderate)", RG3: "RG3 (High Risk)",
};

const fmt = (v: number) => (v !== 0 && (Math.abs(v) < 0.01 || Math.abs(v) >= 1e5) ? v.toExponential(2) : v.toPrecision(3));

export default function BlueLightHazardPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 450); // nm
  const [power, setPower] = useURLState("power", 1); // W
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 2); // mm

  // B(λ), the small-source limits and the risk groups: src/physics/laser-safety/hazard-weighting.ts
  // (ICNIRP 2013, IEC 62471:2006). A laser beam viewed directly is a small source (α < 11 mrad).
  const results = useMemo(() => {
    const r = (beamDiam / 2) * 1e-3; // m
    const E = power / (Math.PI * r * r); // W/m², beam power spread over the beam area
    const B = blueLightWeight(wavelength * 1e-9);
    const EB = E * B; // W/m²: Σ E_λ B(λ) Δλ for a narrowband source
    return {
      irradiance: E / 1e4, // W/cm²
      B,
      EB,
      riskGroup: riskGroupLabel[blueLightSmallSourceRiskGroup(EB)],
      tMax: blueLightSmallSourceMaxDuration(EB),
    };
  }, [wavelength, power, beamDiam]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 401 }, (_, i) => 300 + i);
    const weights = wls.map((w) => blueLightWeight(w * 1e-9));
    return { wls, weights };
  }, []);

  return (
    <>
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="max-w-4xl mx-auto">

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>E = P / (π(d/2)²)  (corneal irradiance)</p>
            <p>E<sub>B</sub> = Σ E<sub>λ</sub> × B(λ) × Δλ = E × B(λ)  (single wavelength)</p>
            <p>B(λ): ICNIRP 2013 Table 2; 10<sup>(450−λ)/50</sup> for 500–600 nm, 0.001 for 600–700 nm</p>
            <p>Small source (α &lt; 11 mrad): E<sub>B</sub>·t ≤ 100 J/m² (0.25–100 s), E<sub>B</sub> ≤ 1 W/m² (t ≥ 100 s)</p>
            <p>Risk group (IEC 62471 Table 6.1, small source): Exempt ≤ 1 W/m², RG2 ≤ 400 W/m², RG3 above</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
            </div>
            <div>
              <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} step="0.1" />
            </div>
            <div>
              <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiam} onChange={setBeamDiam} step="0.1" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Corneal Irradiance", value: fmt(results.irradiance), unit: "W/cm²" },
              { label: "B(λ) Weight", value: fmt(results.B), unit: "" },
              { label: "Blue-weighted E_B", value: fmt(results.EB), unit: "W/m²" },
              { label: "Max Exposure", value: results.tMax === Infinity ? "no limit" : fmt(results.tMax), unit: results.tMax === Infinity ? "" : "s" },
              { label: "Risk Group", value: results.riskGroup, unit: "" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
          {results.tMax < 0.25 && (
            <p className="mt-4 text-sm text-amber-400">
              Below 0.25 s the retinal thermal limit governs, which this page doesn&apos;t evaluate.
            </p>
          )}
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Blue Light Hazard Function B(λ)</h2>
          <ChartPanel
            data={[
              {
                x: chartData.wls, y: chartData.weights, type: "scatter", mode: "lines",
                name: "B(λ)", line: { color: "#3b82f6", width: 2 },
              },
              ...(results.B > 0 ? [{
                x: [wavelength], y: [results.B], type: "scatter", mode: "markers",
                name: "Selected λ", marker: { color: "#ef4444", size: 12 },
              }] : []),
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#1f2937" },
              yaxis: { title: "B(λ)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, margin: { t: 30, r: 30, b: 50, l: 50 },
            }}
           
           
          />
        </div>
      </div>
    </>
  );
}
