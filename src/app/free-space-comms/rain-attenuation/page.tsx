"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function RainAttenuationPage() {
  const [rainRate, setRainRate] = useState(25);
  const [wavelength, setWavelength] = useState(1550);
  const [range, setRange] = useState(1);
  const [polarization, setPolarization] = useState<"h" | "v">("h");

  const calc = useMemo(() => {
    // Specific attenuation based on ITU-R P.838 simplified power-law
    const R = rainRate; // mm/h
    const f = (3e8 / (wavelength * 1e-9)) / 1e9; // frequency in GHz
    // Simplified coefficients for ~1550 nm (~193 THz) — rain scattering is negligible at optical
    // Use Marshall-Palmer drop size distribution approach
    // At optical wavelengths, rain attenuation is mainly from scattering (Mie)
    // Simplified: α ≈ k · R^α_coeff dB/km
    // For optical: k ≈ 0.01-0.1, α_coeff ≈ 0.6-0.8 depending on wavelength
    const k = 0.032 * Math.pow(wavelength / 1550, -0.2);
    const alphaCoeff = 0.67;
    const specificAtt = k * Math.pow(R, alphaCoeff); // dB/km
    const totalAtt = specificAtt * range;
    return { k, alphaCoeff, specificAtt, totalAtt, f };
  }, [rainRate, wavelength, range]);

  const plotData = useMemo(() => {
    const rates = Array.from({ length: 200 }, (_, i) => 0.5 + i * 0.5);
    const lambdas = [850, 1310, 1550];
    const colors = ["#f43f5e", "#06b6d4", "#a78bfa"];
    return lambdas.map((wl, idx) => {
      const attens = rates.map((r) => {
        const k = 0.032 * Math.pow(wl / 1550, -0.2);
        return k * Math.pow(r, 0.67) * range;
      });
      return { x: rates, y: attens, type: "scatter", mode: "lines", name: `${wl} nm`, line: { color: colors[idx] } };
    });
  }, [range]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
                <p className="text-cyan-300 mt-1 font-mono">α = k · R^α_coeff &nbsp; [dB/km], &nbsp; Total = α × L</p>
        <p className="text-gray-500 mt-1">R = rain rate (mm/h). k depends on wavelength.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Rain Rate (mm/h)", rainRate, setRainRate],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Link Range (km)", range, setRange],
          ].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
          <div className="text-xs text-gray-500 mt-2">
            Rain rate guide: Drizzle &lt;1, Light 1–4, Moderate 4–16, Heavy 16–50, Violent &gt;50 mm/h
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">k coefficient</span><span>{calc.k.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">α exponent</span><span>{calc.alphaCoeff.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Specific Attenuation</span><span>{calc.specificAtt.toFixed(3)} dB/km</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Attenuation</span><span className="text-red-400">{calc.totalAtt.toFixed(2)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Optical Frequency</span><span>{(calc.f / 1000).toFixed(0)} THz</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Rain Rate (mm/h)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Attenuation (dB)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
