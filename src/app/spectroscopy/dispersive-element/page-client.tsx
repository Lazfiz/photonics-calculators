"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DispersiveElementPage() {
  const [grooveDensity, setGrooveDensity] = useState(1200); // lines/mm
  const [order, setOrder] = useState(1);
  const [incidentAngle, setIncidentAngle] = useState(45); // degrees
  const [wavelengthMin, setWavelengthMin] = useState(400); // nm
  const [wavelengthMax, setWavelengthMax] = useState(700); // nm
  const [blazeWavelength, setBlazeWavelength] = useState(550); // nm

  const chartData = useMemo(() => {
    const d = 1e6 / grooveDensity; // μm per groove
    const alpha = (incidentAngle * Math.PI) / 180;
    const wls = Array.from({ length: 300 }, (_, i) => wavelengthMin + (wavelengthMax - wavelengthMin) * (i / 299));

    // Grating equation: d(sinα + sinβ) = mλ → β = arcsin(mλ/d - sinα)
    const diffractionAngles = wls.map(wl => {
      const sinBeta = (order * wl / 1000) / d - Math.sin(alpha); // wl in nm → μm
      return Math.abs(sinBeta) <= 1 ? (Math.asin(sinBeta) * 180) / Math.PI : null;
    });

    // Angular dispersion: dβ/dλ = m / (d·cosβ)
    const angularDispersion = wls.map((wl, i) => {
      if (diffractionAngles[i] === null) return null;
      const beta = (diffractionAngles[i]! * Math.PI) / 180;
      return (order / (d * Math.cos(beta))) * 1000; // rad/nm → convert
    });

    // Linear dispersion at focal length f
    const f = 100; // mm focal length
    const linearDispersion = angularDispersion.map(ad => ad !== null ? f * ad : null); // mm/nm

    // Blaze efficiency (approximate triangular profile)
    const blazeEfficiency = wls.map(wl => {
      const ratio = Math.abs(wl - blazeWavelength) / (blazeWavelength * 0.5);
      return Math.max(0, 1 - ratio);
    });

    return [
      { x: wls, y: diffractionAngles, type: "scatter" as const, mode: "lines" as const, name: "Diffraction Angle β (°)", line: { color: "#60a5fa" } },
      { x: wls, y: linearDispersion, type: "scatter" as const, mode: "lines" as const, name: "Linear Dispersion (mm/nm)", line: { color: "#34d399" }, xaxis: "x2", yaxis: "y2" },
      { x: wls, y: blazeEfficiency.map(e => (e || 0) * 100), type: "scatter" as const, mode: "lines" as const, name: "Blaze Efficiency (%)", line: { color: "#f87171", dash: "dash" }, xaxis: "x3", yaxis: "y3" },
    ];
  }, [grooveDensity, order, incidentAngle, wavelengthMin, wavelengthMax, blazeWavelength]);

  const d = 1e6 / grooveDensity;
  const alpha = (incidentAngle * Math.PI) / 180;
  const blazeAngle = Math.asin(order * blazeWavelength / 1000 / (2 * d)) * 180 / Math.PI;
  const resolvingPower = order * grooveDensity * 10 * Math.cos(alpha); // per mm of grating width

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Dispersive Element Design" description="Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Groove Density (l/mm)</span>
          <input type="number" value={grooveDensity} onChange={e => setGrooveDensity(+e.target.value)} min={50} step={100} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Diffraction Order</span>
          <input type="number" value={order} onChange={e => setOrder(Math.max(1, +e.target.value))} min={1} max={10} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Incident Angle α (°)</span>
          <input type="number" value={incidentAngle} onChange={e => setIncidentAngle(+e.target.value)} min={0} max={89} step={1} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">λ Min (nm)</span>
          <input type="number" value={wavelengthMin} onChange={e => setWavelengthMin(+e.target.value)} min={100} step={50} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">λ Max (nm)</span>
          <input type="number" value={wavelengthMax} onChange={e => setWavelengthMax(+e.target.value)} min={100} step={50} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Blaze λ (nm)</span>
          <input type="number" value={blazeWavelength} onChange={e => setBlazeWavelength(+e.target.value)} min={100} step={50} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Groove Spacing</p>
          <p className="text-xl font-bold text-blue-400">{d.toFixed(4)} μm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Blaze Angle</p>
          <p className="text-xl font-bold text-green-400">{isNaN(blazeAngle) ? "N/A" : blazeAngle.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">R/mm grating width</p>
          <p className="text-xl font-bold text-yellow-400">{resolvingPower.toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">d(sinα + sinβ) = mλ</span> — grating equation</p>
        <p><span className="text-green-400 font-mono">dβ/dλ = m/(d·cosβ)</span> — angular dispersion</p>
        <p><span className="text-red-400 font-mono">R = m·N</span> — resolving power (N = illuminated grooves)</p>
        <p>Higher groove density → higher dispersion, but smaller free spectral range.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 3, columns: 1, pattern: "independent" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Angle (°)", gridcolor: "#374151" },
        xaxis2: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis2: { title: "mm/nm (f=100mm)", gridcolor: "#374151" },
        xaxis3: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis3: { title: "Efficiency (%)", gridcolor: "#374151", range: [0, 110] },
        height: 900, margin: { t: 30, b: 40 },
      }} />
    </CalculatorShell>
  );
}
