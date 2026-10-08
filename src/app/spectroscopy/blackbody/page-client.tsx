"use client";

import { useMemo, useState } from "react";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import { useURLState } from "../../../hooks/use-url-state";
import { c, h, k_B, sigma_SB, b_Wien } from "../../../physics/constants";
const temperaturePresets = [300, 1200, 3000, 5778];

export default function BlackbodyPage() {
  const [temperature, setTemperature] = useURLState("temperature", 5778);

  const series = useMemo(() => {
    // Adaptive wavelength range: extends past Wien peak to show full spectrum shape
    const wienPeak = b_Wien * 1e9 / temperature;
    const wlMin = Math.max(10, Math.min(100, wienPeak * 0.05));
    const wlMax = Math.max(15000, wienPeak * 5);
    const numPoints = 500;
    const wls = Array.from({ length: numPoints }, (_, i) => wlMin + i * (wlMax - wlMin) / (numPoints - 1));
    const T = temperature;
    const spectralRadiance = wls.map((wl) => {
      const lam = wl * 1e-9;
      const exp = h * c / (lam * k_B * T);
      if (exp > 500) return 0;
      return (2 * h * c * c) / (Math.pow(lam, 5) * (Math.exp(exp) - 1)) * 1e-9;
    });
    return [{ name: `${T} K`, color: "#f87171", points: wls.map((x, i) => ({ x, y: spectralRadiance[i] })) }];
  }, [temperature]);

  const peakWavelength = b_Wien * 1e9 / temperature;
  const totalPower = sigma_SB * Math.pow(temperature, 4);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {temperaturePresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setTemperature(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${temperature === preset ? "border-orange-400 bg-orange-500/15 text-orange-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} K
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Temperature" value={temperature} onChange={setTemperature} min={100} max={40000} step={1} unit="K" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <ResultCard label="Peak wavelength (Wien)" value={`${peakWavelength.toFixed(1)} nm`} tone="yellow" />
        <ResultCard label="Total radiated power" value={`${totalPower.toExponential(2)} W/m²`} tone="red" />
        <ResultCard label="Temperature" value={`${temperature} K`} tone="blue" />
        <ResultCard label="Spectral model" value="Planck + Wien + Stefan-Boltzmann" tone="purple" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Planck’s law gives spectral radiance as a function of wavelength and temperature.</p>
        <p>Wien’s law sets the peak wavelength: λ<sub>peak</sub>T ≈ 2.898×10⁶ nm·K.</p>
        <p>Stefan–Boltzmann gives total exitance: M = σT⁴.</p>
      </div>

      <SimpleLineChart
        title="Spectral radiance vs wavelength"
        xLabel="Wavelength (nm)"
        yLabel="Spectral radiance (W/m²/sr/nm)"
        yScale="log"
        series={series}
      />
    </>
  );
}
