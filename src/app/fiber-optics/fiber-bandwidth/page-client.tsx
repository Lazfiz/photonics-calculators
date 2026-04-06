"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function FiberBandwidthPage() {
  const [fiberType, setFiberType] = useState<"SMF" | "MM62_5" | "MM50">("SMF");
  const [length, setLength] = useState(10); // km
  const [wavelength, setWavelength] = useState(1310); // nm
  const [sourceLinewidth, setSourceLinewidth] = useState(0.1); // nm
  const [modalBW, setModalBW] = useState(500); // MHz·km for MMF

  const calc = useMemo(() => {
    // Chromatic dispersion coefficients
    const getSlope = (type: string) => type === "SMF" ? 0.092 : 0.1;
    const getLambda0 = (type: string) => type === "SMF" ? 1310 : 1290;

    const S0 = getSlope(fiberType);
    const lambda0 = getLambda0(fiberType);

    // Chromatic dispersion D (ps/nm/km)
    const D = (S0 / 4) * (wavelength - Math.pow(lambda0, 4) / Math.pow(wavelength, 3));

    // Chromatic dispersion bandwidth limit
    // B_CD = 0.44 / (D * L * Δλ) [Gbps] where Δλ in nm, D in ps/nm/km
    const D_total = D * length; // ps/nm
    const B_chromatic = Math.abs(D) > 0.001 ? 0.44 / (Math.abs(D_total) * sourceLinewidth * 1e-3) : Infinity; // GHz

    // Modal bandwidth (for MMF only)
    // B_modal = BW_modal / L
    const B_modal = fiberType !== "SMF" ? modalBW / length : Infinity; // MHz

    // Polarization mode dispersion (typical values)
    const PMD_coeff = fiberType === "SMF" ? 0.1 : 0.5; // ps/√km
    const DGD = PMD_coeff * Math.sqrt(length); // ps
    const B_PMD = 1 / (3 * DGD * 1e-3); // GHz (rule of thumb: bit period > 3*DGD)

    // Total bandwidth (inverse sum of squares for independent effects)
    const B_total = 1 / Math.sqrt(
      Math.pow(1 / Math.max(B_chromatic, 0.001), 2) +
      Math.pow(1 / Math.max(B_modal * 1e-3, 0.001), 2) +
      Math.pow(1 / Math.max(B_PMD, 0.001), 2)
    );

    // Effective modal bandwidth (EMB) for MMF with laser launch
    const EMB = fiberType !== "SMF" ? modalBW * Math.exp(-length / 50) : Infinity;

    // Bandwidth-length product
    const BWL_chromatic = B_chromatic * length; // GHz·km
    const BWL_modal = B_modal * length / 1000; // GHz·km

    // Maximum reach for different bit rates
    const maxReach_10G = Math.min(
      Math.pow(0.44 / (10 * Math.abs(D) * sourceLinewidth * 1e-3), 1),
      fiberType === "SMF" ? Infinity : modalBW / 10
    );
    const maxReach_40G = Math.min(
      Math.pow(0.44 / (40 * Math.abs(D) * sourceLinewidth * 1e-3), 1),
      fiberType === "SMF" ? Infinity : modalBW / 40
    );
    const maxReach_100G = Math.min(
      Math.pow(0.44 / (100 * Math.abs(D) * sourceLinewidth * 1e-3), 1),
      fiberType === "SMF" ? Infinity : modalBW / 100
    );

    return {
      D, B_chromatic, B_modal, B_PMD, B_total, DGD, EMB,
      BWL_chromatic, BWL_modal,
      maxReach_10G: Math.min(maxReach_10G, 1000),
      maxReach_40G: Math.min(maxReach_40G, 500),
      maxReach_100G: Math.min(maxReach_100G, 200),
    };
  }, [fiberType, length, wavelength, sourceLinewidth, modalBW]);

  const bwVsLengthData = useMemo(() => {
    const lengths = Array.from({ length: 100 }, (_, i) => (i + 1) * 0.5);
    const S0 = calc.D > 0 ? 0.092 : 0.1;
    const lambda0 = 1310;
    const D = (S0 / 4) * (wavelength - Math.pow(lambda0, 4) / Math.pow(wavelength, 3));

    return [
      {
        x: lengths, y: lengths.map(L => Math.abs(D) > 0.001 ? 0.44 / (Math.abs(D * L) * sourceLinewidth * 1e-3) : 1000),
        type: "scatter" as const, mode: "lines" as const, name: "Chromatic BW", line: { color: "#f87171" },
      },
      ...(fiberType !== "SMF" ? [{
        x: lengths, y: lengths.map(L => modalBW / L / 1000),
        type: "scatter" as const, mode: "lines" as const, name: "Modal BW", line: { color: "#34d399" },
      }] : []),
      {
        x: lengths, y: lengths.map(L => {
          const pmd = (fiberType === "SMF" ? 0.1 : 0.5) * Math.sqrt(L);
          return 1 / (3 * pmd * 1e-3);
        }),
        type: "scatter" as const, mode: "lines" as const, name: "PMD BW", line: { color: "#a78bfa" },
      },
      { x: [length, length], y: [0, 100], type: "scatter" as const, mode: "lines" as const, name: "Current L", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [fiberType, wavelength, sourceLinewidth, modalBW, length]);

  const reachData = useMemo(() => {
    const rates = [1, 2.5, 10, 25, 40, 50, 100, 200, 400];
    const S0 = 0.092; const lambda0 = 1310;
    const D = (S0 / 4) * (wavelength - Math.pow(lambda0, 4) / Math.pow(wavelength, 3));

    return [{
      x: rates,
      y: rates.map(R => {
        const cdReach = Math.abs(D) > 0.01 ? 0.44 / (R * Math.abs(D) * sourceLinewidth * 1e-3) : 1000;
        const modalReach = fiberType !== "SMF" ? modalBW / R : 1000;
        const pmdCoeff = fiberType === "SMF" ? 0.1 : 0.5;
        const pmdReach = Math.pow(1 / (3 * R * pmdCoeff * 1e-3), 2);
        return Math.min(cdReach, modalReach, pmdReach, 1000);
      }),
      type: "bar" as const, name: "Max Reach",
      marker: { color: rates.map(r => r <= calc.B_total ? "#34d399" : "#f87171") },
    }];
  }, [fiberType, wavelength, sourceLinewidth, modalBW, calc.B_total]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Bandwidth Calculation" description="Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber Type</span>
          <select value={fiberType} onChange={e => setFiberType(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="SMF">Single-Mode (G.652)</option>
            <option value="MM62_5">MMF 62.5/125 μm</option>
            <option value="MM50">MMF 50/125 μm (OM3/OM4)</option>
          </select>
        </label>
        <ValidatedNumberInput label="Length (km)" value={length} onChange={setLength} min={0.1} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={1700} />
        <ValidatedNumberInput label="Source Linewidth (nm)" value={sourceLinewidth} onChange={setSourceLinewidth} min={0.01} step="0.01" />
        {fiberType !== "SMF" && (
          <ValidatedNumberInput label="Modal BW (MHz·km)" value={modalBW} onChange={setModalBW} min={100} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Bandwidth</p>
          <p className="text-xl font-bold text-green-400">{calc.B_total.toFixed(1)} GHz</p>
          <p className="text-xs text-gray-500">{(calc.B_total * 1000).toFixed(0)} Mbps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Chromatic BW</p>
          <p className="text-xl font-bold text-red-400">{calc.B_chromatic > 1000 ? ">1000" : calc.B_chromatic.toFixed(1)} GHz</p>
        </div>
        {fiberType !== "SMF" && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Modal BW</p>
            <p className="text-xl font-bold text-yellow-400">{calc.B_modal.toFixed(0)} MHz</p>
          </div>
        )}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">PMD BW Limit</p>
          <p className="text-xl font-bold text-purple-400">{calc.B_PMD > 1000 ? ">1000" : calc.B_PMD.toFixed(1)} GHz</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">D (ps/nm/km)</p>
          <p className="text-lg font-bold text-blue-400">{calc.D.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max @ 10G</p>
          <p className="text-lg font-bold text-cyan-400">{calc.maxReach_10G.toFixed(1)} km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max @ 100G</p>
          <p className="text-lg font-bold text-orange-400">{calc.maxReach_100G.toFixed(1)} km</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Bandwidth vs Distance</h3>
        <ChartPanel data={bwVsLengthData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Bandwidth (GHz)", color: "#9ca3af", gridcolor: "#374151", range: [0, Math.min(calc.B_total * 2, 100)] },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 380,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Maximum Reach by Data Rate</h3>
        <ChartPanel data={reachData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Data Rate (Gbps)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Max Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          showlegend: false,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>B_CD = 0.44 / (|D| · L · Δλ) [chromatic dispersion BW]</p>
          <p>B_modal = BW_modal / L [modal BW for MMF]</p>
          <p>B_PMD = 1 / (3 · Δτ) [PMD bandwidth limit]</p>
          <p>1/B²_total = 1/B²_CD + 1/B²_modal + 1/B²_PMD</p>
          <p>D(λ) = S₀/4 · (λ - λ₀⁴/λ³)</p>
          <p>MMF standards: OM3=500MHz·km, OM4=4700MHz·km @ 850nm</p>
          <p>Rule: Δτ &lt; T_bit/3 for &lt;1dB penalty</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
