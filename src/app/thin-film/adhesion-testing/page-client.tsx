"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function AdhesionTestingPage() {
  const [testMethod, setTestMethod] = useState("scratch");
  const [filmMaterial, setFilmMaterial] = useState("SiO2");
  const [substrateMaterial, setSubstrateMaterial] = useState("glass");
  const [filmThickness, setFilmThickness] = useURLState("filmThickness", 100);
  const [criticalLoad, setCriticalLoad] = useURLState("criticalLoad", 10);
  const [scratchLength, setScratchLength] = useURLState("scratchLength", 3);
  const [tipRadius, setTipRadius] = useURLState("tipRadius", 200);
  const [peelForce, setPeelForce] = useURLState("peelForce", 5);
  const [tapeAdhesion, setTapeAdhesion] = useState("5B");
  const [bendRadius, setBendRadius] = useURLState("bendRadius", 5);

  const materials: Record<string, { n: number; hardness: number; modulus: number; name: string }> = {
    SiO2: { n: 1.46, hardness: 8, modulus: 70, name: "SiO₂" },
    TiO2: { n: 2.35, hardness: 8.5, modulus: 230, name: "TiO₂" },
    Ta2O5: { n: 2.1, hardness: 9, modulus: 150, name: "Ta₂O₅" },
    Al2O3: { n: 1.63, hardness: 9, modulus: 380, name: "Al₂O₃" },
    MgF2: { n: 1.38, hardness: 5, modulus: 80, name: "MgF₂" },
    ZrO2: { n: 2.1, hardness: 8.5, modulus: 200, name: "ZrO₂" },
    HfO2: { n: 2.05, hardness: 9, modulus: 200, name: "HfO₂" },
    Metal: { n: 2.0, hardness: 2, modulus: 70, name: "Metal (Al/Ag/Au)" },
  };

  const substrates: Record<string, { modulus: number; hardness: number; name: string }> = {
    glass: { modulus: 70, hardness: 6, name: "Glass (BK7)" },
    fusedSilica: { modulus: 72, hardness: 7, name: "Fused Silica" },
    silicon: { modulus: 170, hardness: 9, name: "Silicon" },
    sapphire: { modulus: 400, hardness: 20, name: "Sapphire" },
    polymer: { modulus: 2, hardness: 0.2, name: "Polymer" },
    metal: { modulus: 200, hardness: 2, name: "Metal Substrate" },
  };

  const tapeRatings: Record<string, { percentage: number; description: string }> = {
    "5B": { percentage: 100, description: "0% removed - Best" },
    "4B": { percentage: 95, description: "<5% removed" },
    "3B": { percentage: 90, description: "5-15% removed" },
    "2B": { percentage: 75, description: "15-35% removed" },
    "1B": { percentage: 50, description: "35-65% removed" },
    "0B": { percentage: 25, description: ">65% removed - Worst" },
  };

  const film = materials[filmMaterial];
  const sub = substrates[substrateMaterial];
  const tape = tapeRatings[tapeAdhesion];

  const results = useMemo(() => {
    const Lc = criticalLoad; // N
    const R = tipRadius * 1e-6; // m
    const t = filmThickness * 1e-9; // m
    const Ls = scratchLength * 1e-3; // m
    const Pf = peelForce; // N/m
    const rb = bendRadius * 1e-3; // m

    // Scratch test adhesion strength
    // Critical load relates to adhesion via: W_ad ≈ L_c / (π·R)
    const adhesionEnergy = Lc / (Math.PI * R); // J/m²
    const adhesionMPa = adhesionEnergy / t / 1e6; // MPa = W_ad / thickness

    // Interfacial shear strength
    const shearStrength = Lc / (Math.PI * R * R) * 1e-6; // MPa

    // Scratch hardness (from load and tip radius)
    const scratchArg = Math.max(2 * R * t - t * t, 0);
    const scratchHardness = scratchArg > 0 ? Lc / (2 * Math.PI * R * Math.sqrt(scratchArg)) * 1e-9 : 0; // GPa

    // Peel energy (for flexible films)
    const peelEnergy = Pf; // J/m² = N/m

    // Bending strain at failure
    const filmModulus = film.modulus * 1e9; // Pa
    const bendStrain = t / (2 * rb);

    // Buckling critical stress (Hutchinson & Suo): σ_cr = [2E_f·W²/((1-ν²)t³)]^(1/3)
    const buckleStress = (2 * filmModulus * adhesionEnergy ** 2 / ((1 - 0.25 ** 2) * t ** 3)) ** (1 / 3) / 1e6; // MPa

    // Pull-off force estimate (JKR model simplified)
    const W = adhesionEnergy; // J/m²
    const pullOffForce = 1.5 * Math.PI * R * W; // N

    // Von Mises stress under indenter
    const vmStress = 0.31 * Lc / (R * R) * 1e-6; // MPa

    return { adhesionEnergy, adhesionMPa, shearStrength, scratchHardness, peelEnergy, bendStrain, buckleStress, pullOffForce, vmStress };
  }, [testMethod, filmMaterial, substrateMaterial, filmThickness, criticalLoad, scratchLength, tipRadius, peelForce, tapeAdhesion, bendRadius]);

  const sweepData = useMemo(() => {
    const loads = Array.from({ length: 80 }, (_, i) => 0.5 + i * 29.5 / 80);
    const adhesion = loads.map(Lc => {
      const R = tipRadius * 1e-6;
      return Lc / (Math.PI * R) * 10;
    });
    const shear = loads.map(Lc => {
      const R = tipRadius * 1e-6;
      return Lc / (Math.PI * R * R) * 1e-6;
    });
    return [
      { x: loads, y: adhesion, type: "scatter" as const, mode: "lines" as const, name: "Adhesion (MPa)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: loads, y: shear, type: "scatter" as const, mode: "lines" as const, name: "Shear (MPa)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [tipRadius]);

  const thicknessEffect = useMemo(() => {
    const thicknesses = Array.from({ length: 60 }, (_, i) => 10 + i * 490 / 60);
    const adhesionEst = thicknesses.map(t => {
      const t_m = t * 1e-9;
      const R = tipRadius * 1e-6;
      const Lc = criticalLoad;
      return Lc / (Math.PI * R) * 10 * Math.sqrt(100 / t);
    });
    return [
      { x: thicknesses, y: adhesionEst, type: "scatter" as const, mode: "lines" as const, name: "Adhesion vs Thickness", line: { color: "#34d399" } },
    ];
  }, [criticalLoad, tipRadius]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Adhesion Testing" description="Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Test Method</span>
          <select value={testMethod} onChange={e => setTestMethod(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="scratch">Scratch Test</option>
            <option value="peel">Peel Test</option>
            <option value="tape">Tape Test (ASTM D3359)</option>
            <option value="bend">Bend Test</option>
          </select></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Film Material</span>
          <select value={filmMaterial} onChange={e => setFilmMaterial(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Substrate Material</span>
          <select value={substrateMaterial} onChange={e => setSubstrateMaterial(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(substrates).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select></label>
        <ValidatedNumberInput label="Film Thickness (nm)" value={filmThickness} onChange={setFilmThickness} step="5" />

        {(testMethod === "scratch" || testMethod === "all") && (
          <>
            <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Critical Load L<sub>c</sub> (N)</span>
              <ValidatedNumberInput label="Critical Load Lc (N)" value={criticalLoad} onChange={setCriticalLoad} step="0.5" /></label>
            <ValidatedNumberInput label="Stylus Tip Radius (μm)" value={tipRadius} onChange={setTipRadius} step="10" />
            <ValidatedNumberInput label="Scratch Length (mm)" value={scratchLength} onChange={setScratchLength} step="0.5" />
          </>
        )}

        {testMethod === "peel" && (
          <ValidatedNumberInput label="Peel Force (N/m)" value={peelForce} onChange={setPeelForce} step="0.1" />
        )}

        {testMethod === "tape" && (
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Tape Adhesion Rating</span>
            <select value={tapeAdhesion} onChange={e => setTapeAdhesion(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
              {Object.entries(tapeRatings).map(([k, v]) => <option key={k} value={k}>{k} - {v.description}</option>)}
            </select></label>
        )}

        {testMethod === "bend" && (
          <ValidatedNumberInput label="Bend Radius (mm)" value={bendRadius} onChange={setBendRadius} step="0.5" />
        )}
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        {testMethod === "scratch" && (
          <>
            <p className="text-gray-300">Adhesion Energy W<sub>ad</sub>: <span className="text-blue-400 font-mono">{results.adhesionEnergy.toFixed(3)} J/m²</span></p>
            <p className="text-gray-300">Adhesion Strength: <span className="text-blue-400 font-mono">{results.adhesionMPa.toFixed(1)} MPa</span></p>
            <p className="text-gray-300">Interfacial Shear Strength: <span className="text-blue-400 font-mono">{results.shearStrength.toFixed(2)} MPa</span></p>
            <p className="text-gray-300">Scratch Hardness: <span className="text-blue-400 font-mono">{results.scratchHardness.toFixed(2)} GPa</span></p>
            <p className="text-gray-300">Pull-off Force (JKR): <span className="text-blue-400 font-mono">{results.pullOffForce.toFixed(4)} N</span></p>
            <p className="text-gray-300">Von Mises Stress: <span className="text-blue-400 font-mono">{results.vmStress.toFixed(1)} MPa</span></p>
          </>
        )}
        {testMethod === "peel" && (
          <>
            <p className="text-gray-300">Peel Energy: <span className="text-blue-400 font-mono">{results.peelEnergy.toFixed(3)} J/m²</span></p>
            <p className="text-gray-300">Adhesion Strength: <span className="text-blue-400 font-mono">{(results.peelEnergy * 10).toFixed(1)} MPa (equiv.)</span></p>
            <p className="text-gray-300">Film/Adhesive Interface: <span className="text-blue-400 font-mono">{results.peelEnergy > 1 ? "Strong" : "Weak"}</span></p>
          </>
        )}
        {testMethod === "tape" && (
          <>
            <p className="text-gray-300">Tape Rating: <span className="text-blue-400 font-mono">{tapeAdhesion}</span></p>
            <p className="text-gray-300">Film Retained: <span className="text-blue-400 font-mono">{tape.percentage}%</span></p>
            <p className="text-gray-300">Qualitative Adhesion: <span className="text-blue-400 font-mono">{tape.description}</span></p>
          </>
        )}
        {testMethod === "bend" && (
          <>
            <p className="text-gray-300">Bending Strain: <span className="text-blue-400 font-mono">{(results.bendStrain * 100).toFixed(3)}%</span></p>
            <p className="text-gray-300">Buckling Critical Stress: <span className="text-blue-400 font-mono">{results.buckleStress.toFixed(1)} MPa</span></p>
            <p className="text-gray-300">Film Stress at Bend: <span className="text-blue-400 font-mono">{(film.modulus * results.bendStrain).toFixed(1)} MPa</span></p>
          </>
        )}
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>W<sub>ad</sub> = L<sub>c</sub> / (π·R) (adhesion energy from scratch test)</p>
        <p>τ = L<sub>c</sub> / (π·R²) (interfacial shear strength)</p>
        <p>H<sub>s</sub> = L / (2πR√(2Rt − t²)) (scratch hardness)</p>
        <p>ϵ<sub>bend</sub> = t / (2R) (bending strain)</p>
        <p>F<sub>pull</sub> = 1.5πRW (JKR pull-off force)</p>
      </div>

      {testMethod === "scratch" && (
        <>
          <h2 className="text-xl font-semibold mb-3 text-gray-200">Adhesion vs Critical Load</h2>
          <ChartPanel data={sweepData} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Critical Load (N)", gridcolor: "#374151" },
            yaxis: { title: "Adhesion (MPa)", gridcolor: "#374151", side: "left" },
            yaxis2: { title: "Shear (MPa)", gridcolor: "#374151", overlaying: "y", side: "right" },
            margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true, legend: { x: 0.01, y: 0.99 }
          }} />

          <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-200">Adhesion vs Film Thickness</h2>
          <ChartPanel data={thicknessEffect} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Film Thickness (nm)", gridcolor: "#374151" },
            yaxis: { title: "Adhesion (MPa)", gridcolor: "#374151" },
            margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
          }} />
        </>
      )}
    </CalculatorShell>
  );
}
