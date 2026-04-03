"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";


export default function ClassificationPage() {
  const [power, setPower] = useState(10);
  const [wavelength, setWavelength] = useState(1550);
  const [emission, setEmission] = useState<"CW" | "pulse">("CW");
  const [pulseDuration, setPulseDuration] = useState(1e-3);

  const classification = useMemo(() => {
    const P_W = power / 1000;
    // Simplified IEC 60825-1 classification thresholds
    // Class 1: power below AEL for Class 1
    // Class 1M: safe with unaided eye but not with optics
    // Class 2: visible (400-700), CW < 1 mW
    // Class 2M: visible, safe unaided < 1 mW, but not with optics
    // Class 3R: < 5× Class 2 AEL (visible) or 5× Class 1 AEL (IR)
    // Class 3B: up to 500 mW
    // Class 4: > 500 mW
    const lam = wavelength;

    if (lam >= 400 && lam <= 700) {
      if (emission === "CW") {
        if (P_W <= 0.0004) return { cls: "Class 1", color: "text-green-400", detail: "Safe under all conditions" };
        if (P_W <= 0.001) return { cls: "Class 2", color: "text-yellow-400", detail: "Visible, ≤ 1 mW — blink reflex protects" };
        if (P_W <= 0.005) return { cls: "Class 3R", color: "text-orange-400", detail: "≤ 5 mW — hazardous with optics" };
        if (P_W <= 0.5) return { cls: "Class 3B", color: "text-red-400", detail: "≤ 500 mW — eye/skin hazard" };
        return { cls: "Class 4", color: "text-red-500", detail: "> 500 mW — fire hazard, diffuse reflection hazard" };
      }
    }

    // IR (700–1800 nm) simplified
    if (lam > 700 && lam <= 1800) {
      if (emission === "CW") {
        if (P_W <= 0.001) return { cls: "Class 1", color: "text-green-400", detail: "Safe under all conditions" };
        if (P_W <= 0.005) return { cls: "Class 3R", color: "text-orange-400", detail: "≤ 5 mW" };
        if (P_W <= 0.5) return { cls: "Class 3B", color: "text-red-400", detail: "≤ 500 mW" };
        return { cls: "Class 4", color: "text-red-500", detail: "> 500 mW" };
      }
    }

    return { cls: "Unknown", color: "text-gray-400", detail: "Check IEC 60825-1 for this wavelength" };
  }, [power, wavelength, emission]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Laser Classification" description="Simplified laser classification per IEC 60825-1. For educational use only.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Emission Type</span>
          <select value={emission} onChange={e => setEmission(e.target.value as "CW" | "pulse")} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="CW">CW</option><option value="pulse">Pulsed</option>
          </select></label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">Classification</p>
        <p className={`text-3xl font-bold ${classification.color}`}>{classification.cls}</p>
        <p className="text-sm text-gray-500 mt-1">{classification.detail}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm text-gray-400">
        <p className="font-semibold text-white mb-2">Class Reference (Simplified)</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><span className="text-green-400">Class 1</span> — Safe under all conditions of use</li>
          <li><span className="text-yellow-400">Class 2</span> — Visible ≤ 1 mW, blink reflex protection</li>
          <li><span className="text-orange-400">Class 3R</span> — Up to 5 mW, hazardous with optical instruments</li>
          <li><span className="text-red-400">Class 3B</span> — Up to 500 mW, direct viewing hazard</li>
          <li><span className="text-red-500">Class 4</span> — &gt; 500 mW, skin/fire/diffuse reflection hazard</li>
        </ul>
      </div>
    </CalculatorShell>
  );
}
