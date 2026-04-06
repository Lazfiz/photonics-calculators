"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";

const currentHref = "/spectroscopy/blackbody";
const temperaturePresets = [300, 1200, 3000, 5778];

export default function BlackbodyPage() {
  const [temperature, setTemperature] = useURLState("temperature", 5778);

  const series = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 100 + i * 4); // nm
    const h = 6.626e-34, c = 3e8, k = 1.381e-23;
    const T = temperature;
    const spectralRadiance = wls.map((wl) => {
      const lam = wl * 1e-9;
      const exp = h * c / (lam * k * T);
      if (exp > 500) return 0;
      return (2 * h * c * c) / (Math.pow(lam, 5) * (Math.exp(exp) - 1)) * 1e-9;
    });
    return [{ name: `${T} K`, color: "#f87171", points: wls.map((x, i) => ({ x, y: spectralRadiance[i] })) }];
  }, [temperature]);

  const peakWavelength = 2897771.955 / temperature;
  const totalPower = 5.67e-8 * Math.pow(temperature, 4);

  return (
    <CalculatorShell
      backHref="/spectroscopy"
      backLabel="Spectroscopy"
      title="Blackbody Radiation"
      description="Planck's law spectral radiance curve, Wien's displacement law, and Stefan-Boltzmann total power."
    >
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

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
