"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

/**
 * Laser Classification per IEC 60825-1:2014 (default)
 *
 * AEL formulas simplified for CW. Reference: IEC 60825-1:2014 Table 1-4.
 * All values are engineering approximations — not for compliance sign-off.
 *
 * Edition: IEC 60825-1:2014 (Ed. 3.0)
 * - Class 1: safe under all reasonably foreseeable conditions
 * - Class 1M: safe unaided eye, hazardous with optical instruments
 * - Class 2: visible CW ≤ 1 mW (aversion response)
 * - Class 2M: visible, safe unaided ≤ 1 mW, hazardous with optics
 * - Class 3R: ≤ 5× Class 1 (IR) or ≤ 5 mW (visible)
 * - Class 3B: ≤ 500 mW CW
 * - Class 4: > 500 mW CW
 */

// C_A correction for 700-1050 nm (IEC 60825-1:2014 §5.3)
function cA(wavelengthNm: number): number {
  if (wavelengthNm <= 700) return 1;
  if (wavelengthNm <= 1050) return Math.pow(10, 0.002 * (wavelengthNm - 700));
  return 1;
}

// C_B photochemical correction for 400-600 nm (IEC 60825-1:2014 §5.4)
function cB(wavelengthNm: number): number {
  if (wavelengthNm <= 400) return 1;
  if (wavelengthNm <= 600) return Math.pow(10, 0.6 * (600 - wavelengthNm) / 200);
  return 1;
}

type LaserClass = {
  cls: string;
  color: string;
  detail: string;
  ael?: number; // mW
};

export default function ClassificationPage() {
  const [power, setPower] = useURLState("power", 10); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [emission, setEmission] = useState<"CW" | "pulse">("CW");
  const [pulseDuration, setPulseDuration] = useURLState("pulseDuration", 0.001); // s

  const classification = useMemo((): LaserClass => {
    const P_W = power / 1000;
    const P_mW = power;
    const lam = wavelength;
    const CA = cA(lam);
    const CB = cB(lam);

    if (emission === "CW") {
      // === Visible (400-700 nm) ===
      if (lam >= 400 && lam <= 700) {
        const ael1 = 0.00039; // Class 1: 0.39 mW (CW, visible, 0.25s)
        const ael2 = 0.001; // Class 2: 1 mW (aversion response)
        const ael3R = 0.005; // Class 3R: 5 mW
        const ael3B = 0.5; // Class 3B: 500 mW

        if (P_W <= ael1) return { cls: "Class 1", color: "text-green-400", detail: "Safe under all conditions. AEL = 0.39 mW", ael: 0.39 };
        // Class 1M: AEL = Class 2 (1 mW) but not safe with magnifying optics
        if (P_W <= ael2) return { cls: "Class 2", color: "text-yellow-400", detail: "≤ 1 mW — aversion response protects", ael: 1 };
        if (P_W <= ael3R) return { cls: "Class 3R", color: "text-orange-400", detail: `≤ 5 mW — hazardous with optical instruments`, ael: 5 };
        if (P_W <= ael3B) return { cls: "Class 3B", color: "text-red-400", detail: `≤ 500 mW — direct viewing hazard`, ael: 500 };
        return { cls: "Class 4", color: "text-red-500", detail: `> 500 mW — fire hazard, diffuse reflection hazard` };
      }

      // === Near-IR retinal hazard (700-1050 nm) ===
      if (lam > 700 && lam <= 1050) {
        const ael1 = 0.00039 * CA; // Class 1: 0.39 × C_A mW
        const ael3R = 5 * ael1; // Class 3R: 5× Class 1 AEL

        if (P_W <= ael1) return { cls: "Class 1", color: "text-green-400", detail: `AEL = ${(ael1 * 1000).toFixed(2)} mW (C_A = ${CA.toFixed(1)})`, ael: ael1 * 1000 };
        // Class 1M: between Class 1 and Class 3R, safe unaided eye
        if (P_W <= ael3R) return { cls: "Class 1M / 3R", color: "text-orange-400", detail: `AEL_3R = ${(ael3R * 1000).toFixed(1)} mW (C_A = ${CA.toFixed(1)})`, ael: ael3R * 1000 };
        if (P_W <= 0.5) return { cls: "Class 3B", color: "text-red-400", detail: `≤ 500 mW — direct viewing hazard`, ael: 500 };
        return { cls: "Class 4", color: "text-red-500", detail: `> 500 mW — fire hazard, diffuse reflection hazard` };
      }

      // === Near-IR retinal hazard (1050-1400 nm) ===
      if (lam > 1050 && lam <= 1400) {
        const ael1 = 0.00039 * CA; // C_A = 1 for >1050nm, so 0.39 mW
        const ael3R = 5 * ael1;

        if (P_W <= ael1) return { cls: "Class 1", color: "text-green-400", detail: `AEL = ${(ael1 * 1000).toFixed(2)} mW`, ael: ael1 * 1000 };
        if (P_W <= ael3R) return { cls: "Class 1M / 3R", color: "text-orange-400", detail: `AEL_3R = ${(ael3R * 1000).toFixed(1)} mW`, ael: ael3R * 1000 };
        if (P_W <= 0.5) return { cls: "Class 3B", color: "text-red-400", detail: `≤ 500 mW`, ael: 500 };
        return { cls: "Class 4", color: "text-red-500", detail: `> 500 mW` };
      }

      // === IR-B corneal (1400-2600 nm) ===
      if (lam > 1400 && lam <= 2600) {
        // AEL for CW: much higher, corneal hazard only
        const ael1 = 0.1; // ~100 mW (corneal MPE at 0.25s)
        if (P_W <= ael1) return { cls: "Class 1", color: "text-green-400", detail: `AEL ≈ 100 mW (corneal limit)`, ael: 100 };
        if (P_W <= 0.5) return { cls: "Class 3B", color: "text-red-400", detail: `≤ 500 mW`, ael: 500 };
        return { cls: "Class 4", color: "text-red-500", detail: `> 500 mW` };
      }

      // === IR-C corneal (>2600 nm, e.g. CO2 10600 nm) ===
      if (lam > 2600) {
        const ael1 = 0.1; // ~100 mW
        if (P_W <= ael1) return { cls: "Class 1", color: "text-green-400", detail: `AEL ≈ 100 mW (corneal limit)`, ael: 100 };
        if (P_W <= 0.5) return { cls: "Class 3B", color: "text-red-400", detail: `≤ 500 mW`, ael: 500 };
        return { cls: "Class 4", color: "text-red-500", detail: `> 500 mW` };
      }

      // === UV (180-400 nm) ===
      if (lam >= 180 && lam < 400) {
        const ael1 = 0.00039 * CB;
        if (P_W <= ael1) return { cls: "Class 1", color: "text-green-400", detail: `AEL = ${(ael1 * 1000).toFixed(2)} mW (C_B = ${CB.toFixed(1)})`, ael: ael1 * 1000 };
        if (P_W <= 0.5) return { cls: "Class 3B", color: "text-red-400", detail: `≤ 500 mW`, ael: 500 };
        return { cls: "Class 4", color: "text-red-500", detail: `> 500 mW` };
      }
    }

    // === Pulsed (simplified) ===
    if (emission === "pulse") {
      const t = pulseDuration;
      const t_us = t * 1e6;

      if (lam >= 400 && lam <= 700) {
        // Visible pulsed: Class 1 AEL = 0.2 µJ for t < 0.25s (single pulse)
        const ael1_uJ = t <= 0.25 ? 0.2 : 0.8;
        const energy_uJ = P_mW * t_us;
        if (energy_uJ <= ael1_uJ) return { cls: "Class 1", color: "text-green-400", detail: `AEL = ${ael1_uJ} µJ (t=${t_us.toFixed(1)}µs)` };
        return { cls: "Class 3B or 4", color: "text-red-400", detail: `Pulsed — requires pulse duration and PRF analysis` };
      }

      if (lam > 700 && lam <= 1400) {
        const ael1_uJ = (t <= 0.25 ? 0.2 : 0.8) * CA;
        const energy_uJ = P_mW * t_us;
        if (energy_uJ <= ael1_uJ) return { cls: "Class 1", color: "text-green-400", detail: `AEL = ${ael1_uJ.toFixed(2)} µJ (C_A = ${CA.toFixed(1)})` };
        return { cls: "Class 3B or 4", color: "text-red-400", detail: `Pulsed — requires pulse duration and PRF analysis` };
      }

      return { cls: "See IEC 60825-1", color: "text-gray-400", detail: `Pulsed analysis for ${lam} nm not simplified here` };
    }

    return { cls: "Unknown", color: "text-gray-400", detail: "Check IEC 60825-1:2014 for this wavelength" };
  }, [power, wavelength, emission, pulseDuration]);

  // C_A chart for IR-A region
  const caChartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 700 + i * 350 / 199);
    const ca = wls.map(w => cA(w));
    return [{
      x: wls, y: ca, type: "scatter" as const, mode: "lines" as const,
      name: "C_A", line: { color: "#f87171" }
    }];
  }, []);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Laser Classification (IEC 60825-1:2014)" description="Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and simplified pulsed AEL thresholds with C_A and C_B correction factors.">
      <LaserSafetyDisclaimer />

      <div className="bg-blue-950/50 border border-blue-800/50 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-blue-300">Standard: IEC 60825-1:2014 (Edition 3.0)</p>
        <p className="text-xs text-blue-400 mt-1">
          Educational reference only. Formal product classification requires accredited lab testing per IEC 60825-1 §9.
          The 2024 edition (Ed. 4.0) relaxed some Class 1 AEL thresholds — this calculator uses the more conservative 2014 values.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0} step={power < 1 ? "0.01" : power < 100 ? "0.5" : "10"} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={11000} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Emission Type</span>
          <select value={emission} onChange={e => setEmission(e.target.value as "CW" | "pulse")}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="CW">CW (continuous)</option>
            <option value="pulse">Pulsed (single)</option>
          </select>
        </label>
        {emission === "pulse" && (
          <ValidatedNumberInput label="Pulse Duration (s)" value={pulseDuration} onChange={setPulseDuration} min={1e-9} max={0.25} step="any" />
        )}
      </div>

      {/* Correction factors */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {wavelength > 700 && wavelength <= 1050 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">C_A (IR-A correction, 700-1050 nm)</p>
            <p className="text-xl font-bold text-orange-400">{cA(wavelength).toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">C_A = 10^(0.002(λ-700))</p>
          </div>
        )}
        {wavelength >= 400 && wavelength <= 600 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">C_B (photochemical, 400-600 nm)</p>
            <p className="text-xl font-bold text-cyan-400">{cB(wavelength).toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">C_B = 10^(0.6(600-λ)/200)</p>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">Classification</p>
        <p className={`text-3xl font-bold ${classification.color}`}>{classification.cls}</p>
        <p className="text-sm text-gray-500 mt-1">{classification.detail}</p>
        {classification.ael !== undefined && (
          <p className="text-xs text-gray-600 mt-2">Power: {power.toFixed(2)} mW vs AEL: {classification.ael.toFixed(2)} mW (ratio: {(power / classification.ael).toFixed(1)}×)</p>
        )}
      </div>

      {/* C_A chart */}
      {wavelength > 680 && wavelength <= 1100 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-8">
          <p className="text-xs text-gray-400 mb-2">C_A correction factor (700-1050 nm)</p>
          {/* ChartPanel async component */}
          <div className="min-h-[250px]" id="ca-chart" data-chart={JSON.stringify(caChartData)} data-layout={JSON.stringify({
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", range: [700, 1050] },
            yaxis: { title: "C_A", gridcolor: "#374151", range: [0, 10] },
            margin: { t: 20, r: 20, b: 40, l: 50 },
            showlegend: false,
          })} />
        </div>
      )}

      {/* Class reference table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm">
        <p className="font-semibold text-white mb-3">IEC 60825-1:2014 Class Reference (CW)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-400">
            <thead>
              <tr className="border-b border-gray-700 text-gray-300">
                <th className="text-left py-2 pr-4">Class</th>
                <th className="text-left py-2 pr-4">Visible (400-700 nm)</th>
                <th className="text-left py-2 pr-4">IR-A (700-1050 nm)</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="py-2 pr-4 text-green-400 font-medium">Class 1</td>
                <td className="py-2 pr-4">0.39 mW</td>
                <td className="py-2 pr-4">0.39 × C_A mW</td>
                <td className="py-2">Safe all conditions</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-green-400 font-medium">Class 1M</td>
                <td className="py-2 pr-4">Same as Class 2</td>
                <td className="py-2 pr-4">Same as Class 3R</td>
                <td className="py-2">Safe unaided eye only</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-yellow-400 font-medium">Class 2</td>
                <td className="py-2 pr-4">1 mW</td>
                <td className="py-2 pr-4">N/A (IR invisible)</td>
                <td className="py-2">Visible, aversion response</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-yellow-400 font-medium">Class 2M</td>
                <td className="py-2 pr-4">1 mW</td>
                <td className="py-2 pr-4">N/A</td>
                <td className="py-2">Safe unaided eye only</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-orange-400 font-medium">Class 3R</td>
                <td className="py-2 pr-4">5 mW</td>
                <td className="py-2 pr-4">5 × 0.39 × C_A mW</td>
                <td className="py-2">Hazardous with optics</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-red-400 font-medium">Class 3B</td>
                <td className="py-2 pr-4">500 mW</td>
                <td className="py-2 pr-4">500 mW</td>
                <td className="py-2">Direct viewing hazard</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-red-500 font-medium">Class 4</td>
                <td className="py-2 pr-4">&gt; 500 mW</td>
                <td className="py-2 pr-4">&gt; 500 mW</td>
                <td className="py-2">Fire / diffuse hazard</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          C_A = 10^(0.002(λ-700)) for 700-1050 nm. Values are CW simplified — pulsed, scan, and extended-source rules omitted.
        </p>
      </div>
    </CalculatorShell>
  );
}
