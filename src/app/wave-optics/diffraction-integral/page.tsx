"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DiffractionIntegralPage() {
  const [wavelength, setWavelength] = useState(632.8); // nm
  const [apertureType, setApertureType] = useState<"circular" | "slit">("circular");
  const [apertureSize, setApertureSize] = useState(100); // µm
  const [propDist, setPropDist] = useState(50); // mm
  const [observationSize, setObservationSize] = useState(500); // µm

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-3; // µm
    const z = propDist * 1000; // µm
    const N = 300;

    if (apertureType === "circular") {
      const a = apertureSize; // radius µm
      const rhoMax = observationSize;
      const rhos = Array.from({ length: N }, (_, i) => (rhoMax * i) / (N - 1));
      const k = 2 * Math.PI / lambda;

      // Fresnel number
      const Nf = a * a / (lambda * z);

      // Fraunhofer (far-field) approximation: Airy pattern
      const intensity = rhos.map(rho => {
        if (rho < 1e-10) return 1;
        const x = k * a * rho / z;
        const j1 = besselJ1(x);
        const airy = 2 * j1 / x;
        return airy * airy;
      });

      // Fresnel zone number at observation point
      const fresnelZones = rhos.map(rho => (a * a + rho * rho) / (lambda * z));

      // 2D Airy pattern
      const N2 = 150;
      const ext = observationSize;
      const xs = Array.from({ length: N2 }, (_, i) => -ext + (2 * ext * i) / (N2 - 1));
      const z2d: number[][] = [];
      for (let j = N2 - 1; j >= 0; j--) {
        const row: number[] = [];
        for (let i = 0; i < N2; i++) {
          const rho = Math.sqrt(xs[i] * xs[i] + xs[j] * xs[j]);
          if (rho < 1e-10) { row.push(1); continue; }
          const x = k * a * rho / z;
          const j1v = besselJ1(x);
          const airy = 2 * j1v / x;
          row.push(airy * airy);
        }
        z2d.push(row);
      }

      const firstZero = 1.22 * lambda * z / a;
      return { rhos, intensity, fresnelZones, z2d: z2d, xs, Nf, firstZero };
    }

    // Slit
    const a = apertureSize; // half-width µm
    const xMax = observationSize;
    const xs = Array.from({ length: N }, (_, i) => -xMax + (2 * xMax * i) / (N - 1));
    const k = 2 * Math.PI / lambda;
    const Nf = a * a / (lambda * z);

    const intensity = xs.map(x => {
      const beta = k * a * x / z;
      const sinc = Math.abs(beta) < 1e-10 ? 1 : Math.sin(beta) / beta;
      return sinc * sinc;
    });

    const firstZero = lambda * z / a;
    return { xs, intensity, Nf, firstZero };
  }, [wavelength, apertureType, apertureSize, propDist, observationSize]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Diffraction Integral Calculator" description="Fresnel/Kirchhoff diffraction patterns.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Aperture</span>
          <select value={apertureType} onChange={e => setApertureType(e.target.value as any)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="circular">Circular (radius)</option>
            <option value="slit">Single Slit (half-width)</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Aperture size (µm)</span>
          <input type="number" value={apertureSize} onChange={e => setApertureSize(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Propagation distance (mm)</span>
          <input type="number" value={propDist} onChange={e => setPropDist(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fresnel Number N<sub>F</sub></p>
          <p className="text-xl font-bold text-blue-400">{calc.Nf.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">First Zero</p>
          <p className="text-xl font-bold text-green-400">{calc.firstZero.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Regime</p>
          <p className="text-xl font-bold text-orange-400">{calc.Nf > 1 ? "Fresnel" : "Fraunhofer"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          {apertureType === "circular"
            ? "U(ρ) ∝ 2·J₁(kaρ/z) / (kaρ/z)  |  N_F = a²/(λz)"
            : "U(x) ∝ sin(kax/z) / (kax/z)  |  N_F = a²/(λz)"}
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <ChartPanel data={[{
          x: apertureType === "circular" ? (calc as any).rhos : (calc as any).xs,
          y: calc.intensity as number[],
          type: "scatter" as const, mode: "lines" as const,
          name: apertureType === "circular" ? "Airy pattern" : "Sinc²",
          line: { color: "#60a5fa" },
        }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: apertureType === "circular" ? "ρ (µm)" : "x (µm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>

      {apertureType === "circular" && (calc as any).z2d && (
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={[{ z: (calc as any).z2d, x: (calc as any).xs, y: (calc as any).xs, type: "heatmap" as const, colorscale: "Inferno" }]} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "x (µm)", gridcolor: "#374151" },
            yaxis: { title: "y (µm)", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
      )}
    </CalculatorShell>
  );
}

function besselJ1(x: number): number {
  if (Math.abs(x) < 1e-10) return 0;
  if (Math.abs(x) < 8) {
    let sum = x / 2, term = x / 2;
    for (let k = 1; k <= 25; k++) {
      term *= -(x * x) / (4 * k * (k + 1));
      sum += term;
      if (Math.abs(term) < 1e-15) break;
    }
    return sum;
  }
  const ax = Math.abs(x);
  return Math.sqrt(2 / (Math.PI * ax)) * Math.cos(ax - 3 * Math.PI / 4);
}
