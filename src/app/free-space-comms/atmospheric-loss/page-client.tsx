"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function AtmosphericLossPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [visibility, setVisibility] = useURLState("visibility", 23); // km
  const [altitude, setAltitude] = useURLState("altitude", 0); // km
  const [humidity, setHumidity] = useURLState("humidity", 50); // %
  const [temperature, setTemperature] = useURLState("temperature", 20); // °C
  const [linkLength, setLinkLength] = useURLState("linkLength", 1); // km

  // Beer-Lambert atmospheric attenuation model
  // α = α_molecular + α_aerosol + α_haze
  // Kim model for visibility-dependent attenuation
  const calc = useMemo(() => {
    const V = Math.max(visibility, 0.1); // km
    const L = linkLength;
    const q = wavelength < 500 ? 1.6 : wavelength < 700 ? 1.3 : wavelength < 1500 ? 0.585 * Math.pow(V, 1 / 3) : 1.6;

    // Kim visibility attenuation (dB/km)
    const alphaVis = (3.91 / V) * Math.pow(550 / wavelength, q);

    // Molecular absorption (simplified CO2 + H2O bands)
    // Water vapor absorption peaks near 940nm, 1130nm, 1380nm
    const rho_w = (humidity / 100) * Math.exp(6.648 - 2632 / (temperature + 273.15)) * 1000; // g/m³
    let alphaH2O = 0;
    const waterPeaks = [940, 1130, 1380, 1870, 2660];
    for (const peak of waterPeaks) {
      const sigma = 30 + peak * 0.05;
      alphaH2O += 0.1 * rho_w * Math.exp(-0.5 * Math.pow((wavelength - peak) / sigma, 2));
    }

    // Altitude correction (exponential atmosphere)
    const H = 8.5; // scale height km
    const altFactor = Math.exp(-altitude / H);

    const alphaTotal = (alphaVis * altFactor + alphaH2O * altFactor * 0.01); // dB/km
    const totalLoss = alphaTotal * L;
    const transmittance = Math.pow(10, -totalLoss / 10);

    return { alphaTotal, totalLoss, transmittance, alphaVis: alphaVis * altFactor, alphaH2O: alphaH2O * altFactor * 0.01, q };
  }, [wavelength, visibility, altitude, humidity, temperature, linkLength]);

  const plotData = useMemo(() => {
    const wavelengths = Array.from({ length: 300 }, (_, i) => 300 + i * 5); // 300-1800 nm
    const V = Math.max(visibility, 0.1);
    const q = (wl: number) => wl < 500 ? 1.6 : wl < 700 ? 1.3 : wl < 1500 ? 0.585 * Math.pow(V, 1 / 3) : 1.6;
    const rho_w = (humidity / 100) * Math.exp(6.648 - 2632 / (temperature + 273.15)) * 1000;

    const total = wavelengths.map((wl) => {
      const qq = q(wl);
      const alphaVis = (3.91 / V) * Math.pow(550 / wl, qq);
      let alphaH2O = 0;
      const waterPeaks = [940, 1130, 1380, 1870, 2660];
      for (const peak of waterPeaks) {
        const sigma = 30 + peak * 0.05;
        alphaH2O += 0.1 * rho_w * Math.exp(-0.5 * Math.pow((wl - peak) / sigma, 2));
      }
      const altFactor = Math.exp(-altitude / 8.5);
      return (alphaVis + alphaH2O * 0.01) * altFactor;
    });

    // Mark common laser wavelengths
    const commonWavelengths = [532, 850, 980, 1064, 1310, 1550];

    return [
      { x: wavelengths, y: total, type: "scatter", mode: "lines", name: "Total α", line: { color: "#06b6d4" } },
      { x: commonWavelengths, y: commonWavelengths.map((wl) => {
        const qq = q(wl);
        const rho_w = (humidity / 100) * Math.exp(6.648 - 2632 / (temperature + 273.15)) * 1000;
        const alphaVis = (3.91 / V) * Math.pow(550 / wl, qq);
        let alphaH2O = 0;
        for (const peak of [940, 1130, 1380, 1870, 2660]) {
          const sigma = 30 + peak * 0.05;
          alphaH2O += 0.1 * rho_w * Math.exp(-0.5 * Math.pow((wl - peak) / sigma, 2));
        }
        return (alphaVis + alphaH2O * 0.01) * Math.exp(-altitude / 8.5);
      }), type: "scatter", mode: "markers", name: "Common λ", marker: { color: "#f97316", size: 8 } },
    ];
  }, [visibility, humidity, temperature, altitude]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Visibility (km)", visibility, setVisibility],
            ["Altitude (km)", altitude, setAltitude],
            ["Humidity (%)", humidity, setHumidity],
            ["Temperature (°C)", temperature, setTemperature],
            ["Link Length (km)", linkLength, setLinkLength],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Visibility α (dB/km)</span><span>{calc.alphaVis.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">H₂O α (dB/km)</span><span>{calc.alphaH2O.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total α (dB/km)</span><span className="font-bold">{calc.alphaTotal.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Loss (dB)</span><span className="text-orange-400 font-bold">{calc.totalLoss.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Transmittance</span><span>{(calc.transmittance * 100).toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Kim q parameter</span><span>{calc.q.toFixed(3)}</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Spectral Attenuation (dB/km)</h3>
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "α (dB/km)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
