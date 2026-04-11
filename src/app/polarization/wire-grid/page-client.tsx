"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function WireGridPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1.55);
  const [wireSpacing, setWireSpacing] = useURLState("wireSpacing", 1.0);
  const [wireDiameter, setWireDiameter] = useURLState("wireDiameter", 0.2);
  const [wireConductivity, setWireConductivity] = useURLState("wireConductivity", 4.1e7);
  const [incidenceDeg, setIncidenceDeg] = useURLState("incidenceDeg", 0);

  const thetaI = incidenceDeg * Math.PI / 180;
  const period = wireSpacing * 1e-6; // m
  const wireR = wireDiameter * 1e-6 / 2;
  const lam = wavelength * 1e-6;

  // Simplified model: wire grid behaves like a conductive sheet for E parallel to wires
  // and like a capacitive grid for E perpendicular
  // Using the Marcuvitz/Chen model approximation

  const f = 3e8 / lam;
  const omega = 2 * Math.PI * f;
  const mu0 = 4 * Math.PI * 1e-7;
  const sigma = wireConductivity;
  const skinDepth = Math.sqrt(2 / (omega * mu0 * sigma));

  // Grid parameters
  const dutyCycle = wireDiameter / wireSpacing;
  const normalizedSpacing = wireSpacing / wavelength;
  const normalizedDiameter = wireDiameter / wavelength;

  // Simplified transmission model (Ulrich/Chen approximation)
  // For E parallel to wires (TE): highly reflective
  // For E perpendicular (TM): mostly transmissive

  const k0 = 2 * Math.PI / lam;
  const kx = k0 * Math.sin(thetaI);
  const kz = k0 * Math.cos(thetaI);

  // Parallel polarization (E along wires) - reflection dominated
  // Sheet impedance approximation
  const Z0 = 377;
  const Zs = 1 / (sigma * skinDepth); // surface impedance
  const ZgridParallel = Zs / dutyCycle; // effective impedance for E parallel

  // Perpendicular (E across wires) - capacitive grid
  // Ulrich, Infrared Physics 7, 37-55 (1967): log factor uses geometry not wavelength
  const ZgridPerp = Z0 / (Math.PI * normalizedSpacing * Math.log(2 * wireSpacing / (Math.PI * wireDiameter)));

  // Transmission coefficients (standard sheet impedance model)
  // TE (E ∥ wires): t = 2·Z₀·cosθ / (2·Z_s + Z₀·cosθ)
  // TM (E ⊥ wires): t = 2·Z₀ / (2·Z_s·cosθ + Z₀)
  const tParallel = 2 * Z0 * Math.cos(thetaI) / (2 * ZgridParallel + Z0 * Math.cos(thetaI));
  const tPerpendicular = 2 * Z0 / (2 * ZgridPerp * Math.cos(thetaI) + Z0);

  const Tparallel = Math.abs(tParallel) ** 2;
  const Tperpendicular = Math.abs(tPerpendicular) ** 2;
  const Rparallel = 1 - Tparallel;
  const Rperpendicular = 1 - Tperpendicular;

  const extinctionRatio = Tperpendicular > 1e-10 ? 10 * Math.log10(Tperpendicular / Math.max(Tparallel, 1e-10)) : 60;

  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 0.3 + (i / 400) * 5.7);
    const sD = Math.sqrt(2 / (2 * Math.PI * 3e8 / (wavelength * 1e-6) * 4 * Math.PI * 1e-7 * sigma));
    const zsp = (1 / (sigma * sD)) / dutyCycle;
    const zspCap = Z0 / (Math.PI * normalizedSpacing * Math.log(1 / (Math.PI * normalizedDiameter / 2)));

    const Ts = wls.map(w => {
      const kk = 2 * Math.PI / (w * 1e-6);
      const nsp = wireSpacing / w;
      const ndp = wireDiameter / w;
      const skd = Math.sqrt(2 / (2 * Math.PI * 3e8 / (w * 1e-6) * 4 * Math.PI * 1e-7 * sigma));
      const zp = (1 / (sigma * skd)) / dutyCycle;
      const zs = Z0 / (Math.PI * nsp * Math.log(1 / (Math.PI * ndp / 2)));
      const tp = Math.abs(2 * Z0 * Math.cos(thetaI) / (2 * zp + Z0 * Math.cos(thetaI))) ** 2;
      const ts = Math.abs(2 * Z0 / (2 * zs * Math.cos(thetaI) + Z0)) ** 2;
      return tp;
    });

    const Tp = wls.map(w => {
      const nsp = wireSpacing / w;
      const ndp = wireDiameter / w;
      const skd = Math.sqrt(2 / (2 * Math.PI * 3e8 / (w * 1e-6) * 4 * Math.PI * 1e-7 * sigma));
      const zp = (1 / (sigma * skd)) / dutyCycle;
      const zs = Z0 / (Math.PI * nsp * Math.log(1 / (Math.PI * ndp / 2)));
      const tp = Math.abs(2 * Z0 * Math.cos(thetaI) / (2 * zp + Z0 * Math.cos(thetaI))) ** 2;
      const ts = Math.abs(2 * Z0 / (2 * zs * Math.cos(thetaI) + Z0)) ** 2;
      return ts;
    });

    const ER = wls.map((w, i) => {
      const val = Tp[i] > 1e-10 ? 10 * Math.log10(Tp[i] / Math.max(Ts[i], 1e-10)) : 60;
      return Math.min(val, 60);
    });

    return [
      { x: wls, y: Ts, type: "scatter" as const, mode: "lines" as const, name: "T (E ∥ wires)", line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: Tp, type: "scatter" as const, mode: "lines" as const, name: "T (E ⊥ wires)", line: { color: "#f87171", width: 2 } },
      { x: wls, y: ER, type: "scatter" as const, mode: "lines" as const, name: "ER (dB)", line: { color: "#a78bfa", dash: "dash" } },
    ];
  }, [wavelength, wireSpacing, wireDiameter, wireConductivity, dutyCycle, thetaI, normalizedSpacing, normalizedDiameter]);

  const angularData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => (i / 200) * 89);
    const Ts = angles.map(a => {
      const th = a * Math.PI / 180;
      const skd = Math.sqrt(2 / (2 * Math.PI * 3e8 / lam * 4 * Math.PI * 1e-7 * sigma));
      const zp = (1 / (sigma * skd)) / dutyCycle;
      const zs = Z0 / (Math.PI * normalizedSpacing * Math.log(1 / (Math.PI * normalizedDiameter / 2)));
      return Math.abs(2 * zp / (2 * zp / Math.cos(th) + Z0)) ** 2;
    });
    const Tp = angles.map(a => {
      const th = a * Math.PI / 180;
      const zs = Z0 / (Math.PI * normalizedSpacing * Math.log(1 / (Math.PI * normalizedDiameter / 2)));
      return Math.abs(2 * zs / (2 * zs * Math.cos(th) + Z0)) ** 2;
    });
    return [
      { x: angles, y: Ts, type: "scatter" as const, mode: "lines" as const, name: "T (E ∥ wires)", line: { color: "#60a5fa", width: 2 } },
      { x: angles, y: Tp, type: "scatter" as const, mode: "lines" as const, name: "T (E ⊥ wires)", line: { color: "#f87171", width: 2 } },
    ];
  }, [lam, sigma, dutyCycle, normalizedSpacing, normalizedDiameter]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Wire Grid Polarizer Calculator" description="Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">E ∥ wires → reflected (conductive grid), E ⊥ wires → transmitted (capacitive grid)</p>
        <p className="text-gray-500 text-xs mt-1">Skin depth: δ = √(2/ωμ₀σ), Grid impedance from Marcuvitz/Chen model</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (μm)" value={wavelength} onChange={setWavelength} min={0.3} max={10} step="0.05" />
        <ValidatedNumberInput label="Wire Spacing (μm)" value={wireSpacing} onChange={setWireSpacing} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Wire Diameter (μm)" value={wireDiameter} onChange={setWireDiameter} min={0.01} max={5} step="0.05" />
        <ValidatedNumberInput label="Conductivity (S/m)" value={wireConductivity} onChange={setWireConductivity} step="1e5" />
        <ValidatedNumberInput label="Incidence Angle (°)" value={incidenceDeg} onChange={setIncidenceDeg} min={0} max={80} step="1" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setWireConductivity(4.1e7); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Aluminum</button>
        <button onClick={() => { setWireConductivity(5.96e7); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Copper</button>
        <button onClick={() => { setWireConductivity(6.17e7); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Silver</button>
        <button onClick={() => { setWireConductivity(1.0e6); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Nichrome</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T (E⊥ wires)</p>
          <p className="text-2xl font-bold text-green-400">{(Tperpendicular * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T (E∥ wires)</p>
          <p className="text-2xl font-bold text-red-400">{(Tparallel * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction Ratio</p>
          <p className="text-2xl font-bold text-yellow-400">{Math.min(extinctionRatio, 60).toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Skin Depth</p>
          <p className="text-2xl font-bold text-purple-400">{(skinDepth * 1e9).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Spectral Response</h3>
          <ChartPanel data={spectralData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (μm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission / ER", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Angular Response</h3>
          <ChartPanel data={angularData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
