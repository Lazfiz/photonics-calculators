"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function AtmosphericAttenuationPage() {
  const [wavelength, setWavelength] = useState(10600); // nm (CO2)
  const [distance, setDistance] = useState(1000); // m
  const [humidity, setHumidity] = useState(50); // %
  const [visibility, setVisibility] = useState(23); // km (standard)

  // Beer-Lambert: T = exp(-α * L)
  // α depends on wavelength, humidity (H2O absorption), and scattering
  const results = useMemo(() => {
    const wl = wavelength / 1000; // µm
    const L = distance; // m
    const H = humidity / 100;

    // Molecular absorption coefficient (simplified, per km)
    // Water vapor absorption peaks at ~0.94, 1.13, 1.38, 1.87, 2.7, 6.3 µm
    const h2oAbsorption = (wlMicron: number, h: number) => {
      const peaks = [
        { center: 0.94, width: 0.05, strength: 0.5 },
        { center: 1.13, width: 0.04, strength: 0.3 },
        { center: 1.38, width: 0.08, strength: 2.0 },
        { center: 1.87, width: 0.1, strength: 3.0 },
        { center: 2.7, width: 0.3, strength: 5.0 },
        { center: 6.3, width: 0.5, strength: 10.0 },
      ];
      let alpha = 0;
      for (const p of peaks) {
        alpha += p.strength * h * Math.exp(-((wlMicron - p.center) ** 2) / (2 * p.width ** 2));
      }
      return alpha; // km⁻¹
    };

    // CO2 absorption peak at 4.26 µm and 15 µm
    const co2Absorption = (wlMicron: number) => {
      const peaks = [
        { center: 4.26, width: 0.1, strength: 50 },
        { center: 15, width: 1, strength: 100 },
      ];
      let alpha = 0;
      for (const p of peaks) {
        alpha += p.strength * Math.exp(-((wlMicron - p.center) ** 2) / (2 * p.width ** 2));
      }
      return alpha;
    };

    // Rayleigh scattering (dominant at short wavelengths)
    const rayleigh = 0.0084 * Math.pow(wl, -4) * 0.001; // km⁻¹ (approx)

    // Mie scattering (aerosols) - simplified
    const visKm = visibility;
    const mie = 3.91 / visKm * Math.pow(0.55 / wl, 0.585); // km⁻¹

    const alphaH2O = h2oAbsorption(wl, H);
    const alphaCO2 = co2Absorption(wl);
    const alphaRayleigh = rayleigh;
    const alphaMie = mie;
    const alphaTotal = alphaH2O + alphaCO2 + alphaRayleigh + alphaMie;

    const transmission = Math.exp(-alphaTotal * L / 1000);
    const attenuation_dB = -10 * Math.log10(transmission);

    // Safe distance: where beam power drops to MPE level
    // For NOHD: r_NOHD = sqrt(4*P / (π * E_MPE)) (ignoring attenuation)
    // With attenuation: effective distance increases

    return {
      alphaH2O, alphaCO2, alphaRayleigh, alphaMie, alphaTotal,
      transmission, attenuation_dB, L,
    };
  }, [wavelength, distance, humidity, visibility]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 200 }, (_, i) => (i + 1) * (distance / 200));
    const transmission = distances.map(d => Math.exp(-results.alphaTotal * d / 1000));
    const dB = transmission.map(t => -10 * Math.log10(Math.max(t, 1e-10)));

    return [
      { x: distances, y: transmission.map(t => t * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", yaxis: "y", line: { color: "#60a5fa", width: 2 } },
      { x: distances, y: dB, type: "scatter" as const, mode: "lines" as const, name: "Attenuation (dB)", yaxis: "y2", line: { color: "#f87171", width: 2 } },
    ];
  }, [results, distance]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Atmospheric Attenuation" description="Calculates atmospheric beam attenuation using Beer-Lambert law with water vapor absorption, CO₂ absorption, Rayleigh and Mie scattering. Useful for outdoor laser safety NOHD calculations.">
            
      <LaserSafetyDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        <ValidatedNumberInput label="Distance (m)" value={distance} onChange={setDistance} min={1} />
        <ValidatedNumberInput label="Relative Humidity (%)" value={humidity} onChange={setHumidity} min={0} max={100} />
        <ValidatedNumberInput label="Visibility (km)" value={visibility} onChange={setVisibility} min={0.1} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-3xl font-bold text-blue-400">{(results.transmission * 100).toFixed(2)}%</p>
          <p className="text-sm text-gray-500 mt-1">at {distance} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Attenuation</p>
          <p className="text-3xl font-bold text-amber-400">{results.attenuation_dB.toFixed(2)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Total α</p>
          <p className="text-3xl font-bold text-green-400">{results.alphaTotal.toFixed(4)} km⁻¹</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">H₂O abs.</p>
          <p className="text-lg font-bold text-cyan-400">{results.alphaH2O.toFixed(3)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">CO₂ abs.</p>
          <p className="text-lg font-bold text-orange-400">{results.alphaCO2.toFixed(3)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">Rayleigh</p>
          <p className="text-lg font-bold text-purple-400">{results.alphaRayleigh.toFixed(6)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">Mie</p>
          <p className="text-lg font-bold text-pink-400">{results.alphaMie.toFixed(4)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (m)", gridcolor: "#374151" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", range: [0, 105] },
          yaxis2: { title: "Attenuation (dB)", gridcolor: "#374151", overlaying: "y", side: "right", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
          margin: { t: 30, r: 70, b: 50, l: 70 },
          legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>T = exp(−α<sub>total</sub> × L)</p>
          <p>α<sub>total</sub> = α<sub>H₂O</sub> + α<sub>CO₂</sub> + α<sub>Rayleigh</sub> + α<sub>Mie</sub></p>
          <p>α<sub>Mie</sub> = 3.91/V × (0.55/λ)<sup>0.585</sup> km⁻¹ (V = visibility in km)</p>
          <p>α<sub>Rayleigh</sub> ∝ λ<sup>−4</sup></p>
          <p>Attenuation (dB) = −10 log₁₀(T)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
