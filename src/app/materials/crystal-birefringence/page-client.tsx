"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

interface Crystal {
  name: string;
  crystalSystem: string;
  no: number; // ordinary index
  ne: number; // extraordinary index
  dn_ne: number; // |no - ne| birefringence
  lambda: number; // wavelength of measurement (nm)
  transparencyMin: number;
  transparencyMax: number;
  no2um: number;
  ne2um: number;
}

const crystals: Record<string, Crystal> = {
  "Calcite": {
    name: "Calcite", crystalSystem: "Trigonal (uniaxial -)",
    no: 1.658, ne: 1.486, dn_ne: 0.172, lambda: 589,
    transparencyMin: 0.2, transparencyMax: 3.5,
    no2um: 1.630, ne2um: 1.477,
  },
  "Quartz": {
    name: "Quartz", crystalSystem: "Trigonal (uniaxial +)",
    no: 1.544, ne: 1.553, dn_ne: 0.009, lambda: 589,
    transparencyMin: 0.15, transparencyMax: 4.5,
    no2um: 1.533, ne2um: 1.542,
  },
  "Sapphire": {
    name: "Sapphire (Al₂O₃)", crystalSystem: "Trigonal (uniaxial -)",
    no: 1.766, ne: 1.759, dn_ne: 0.007, lambda: 589,
    transparencyMin: 0.15, transparencyMax: 6.0,
    no2um: 1.746, ne2um: 1.739,
  },
  "BBO": {
    name: "BBO (β-BaB₂O₄)", crystalSystem: "Trigonal (uniaxial -)",
    no: 1.655, ne: 1.543, dn_ne: 0.112, lambda: 589,
    transparencyMin: 0.19, transparencyMax: 3.5,
    no2um: 1.640, ne2um: 1.537,
  },
  "LiNbO₃": {
    name: "LiNbO₃", crystalSystem: "Trigonal (uniaxial -)",
    no: 2.232, ne: 2.156, dn_ne: 0.076, lambda: 1064,
    transparencyMin: 0.33, transparencyMax: 5.5,
    no2um: 2.214, ne2um: 2.142,
  },
  "YVO₄": {
    name: "YVO₄", crystalSystem: "Tetragonal (uniaxial +)",
    no: 1.944, ne: 2.159, dn_ne: 0.215, lambda: 1064,
    transparencyMin: 0.4, transparencyMax: 5.0,
    no2um: 1.930, ne2um: 2.140,
  },
  "KDP": {
    name: "KDP (KH₂PO₄)", crystalSystem: "Tetragonal (uniaxial -)",
    no: 1.494, ne: 1.460, dn_ne: 0.034, lambda: 1064,
    transparencyMin: 0.18, transparencyMax: 1.7,
    no2um: 1.484, ne2um: 1.454,
  },
  "Calcium Tungstate": {
    name: "CaWO₄", crystalSystem: "Tetragonal (uniaxial +)",
    no: 1.920, ne: 1.937, dn_ne: 0.017, lambda: 589,
    transparencyMin: 0.25, transparencyMax: 5.0,
    no2um: 1.900, ne2um: 1.915,
  },
  "Rutile (TiO₂)": {
    name: "Rutile (TiO₂)", crystalSystem: "Tetragonal (uniaxial +)",
    no: 2.454, ne: 2.493, dn_ne: 0.039, lambda: 1064,
    transparencyMin: 0.43, transparencyMax: 6.0,
    no2um: 2.416, ne2um: 2.452,
  },
  "Vaterite": {
    name: "Vaterite (CaCO₃)", crystalSystem: "Hexagonal (uniaxial)",
    no: 1.550, ne: 1.650, dn_ne: 0.100, lambda: 589,
    transparencyMin: 0.3, transparencyMax: 2.5,
    no2um: 1.540, ne2um: 1.635,
  },
};

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7"];

export default function CrystalBirefringencePage() {
  const [selected, setSelected] = useState("Calcite");
  const [wavelength, setWavelength] = useURLState("wavelength", 589);

  const c = crystals[selected];

  const birefringenceBar = useMemo(() => {
    const entries = Object.entries(crystals).sort((a, b) => b[1].dn_ne - a[1].dn_ne);
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => cr.dn_ne),
      type: "bar" as const,
      marker: {
        color: entries.map(([k]) => k === selected ? "#3b82f6" : "#4b5563"),
      },
    }];
  }, [selected]);

  const noNeChart = useMemo(() => {
    const entries = Object.entries(crystals);
    return [
      {
        x: entries.map(([, cr]) => cr.name),
        y: entries.map(([, cr]) => cr.no),
        type: "bar" as const, name: "nₒ (ordinary)",
        marker: { color: "#22c55e" },
      },
      {
        x: entries.map(([, cr]) => cr.name),
        y: entries.map(([, cr]) => cr.ne),
        type: "bar" as const, name: "nₑ (extraordinary)",
        marker: { color: "#ef4444" },
      },
    ];
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Crystal Birefringence Data" description="Δn = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Crystal</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(crystals).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Reference Wavelength (nm)</label>
          <ValidatedNumberInput label="Reference Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">nₒ (ordinary)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{c.no.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">nₑ (extraordinary)</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{c.ne.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn (birefringence)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{c.dn_ne.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Crystal System</p>
          <p className="text-lg font-bold text-purple-400 mt-1">{c.crystalSystem}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">Transparency: <span className="text-cyan-400 font-bold">{c.transparencyMin}–{c.transparencyMax} μm</span></p>
        <p className="text-sm text-gray-400 mt-1">Retardation at {wavelength} nm for 1 mm: <span className="text-amber-400 font-bold">{(c.dn_ne * 1e6 / wavelength).toFixed(1)} waves</span></p>
      </div>

      <ChartPanel data={birefringenceBar}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Crystal", gridcolor: "#374151" },
          yaxis: { title: "Birefringence Δn", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 80, l: 60 },
        }}
       
       
      />

      <ChartPanel data={noNeChart}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Crystal", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 80, l: 60 },
          legend: { orientation: "h", y: -0.3 },
          barmode: "group",
        }}
       
       
      />
    </CalculatorShell>
  );
}
