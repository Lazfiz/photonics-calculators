"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gradedIndexAt, gradedIndexLayers, type GradedProfile } from "../../../physics/thin-film/graded-index";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

export default function GradientIndexPage() {
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [nSurface, setNSurface] = useURLState("nSurface", 1.1);
  const [thickness, setThickness] = useURLState("thickness", 500);
  const [profile, setProfile] = useState<GradedProfile>("cosine");
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const tmm = useMemo(() => {
    // Staircase of homogeneous sublayers, sized for the shortest plotted wavelength (0.5 λ).
    const layers = gradedIndexLayers(profile, nSub, nSurface, thickness * 1e-9, 0.5 * designWl * 1e-9);
    const stack = { incident: nInc, layers, substrate: { n: nSub } };

    // Plot window 0.5–1.5 λ (401 points). Keep only finite points (invalid inputs give none).
    const wls: number[] = [];
    const R: number[] = [];
    const T: number[] = [];
    if (layers.length > 0) {
      for (let i = 0; i <= 400; i++) {
        const wl = designWl * (0.5 + i / 400);
        const response = stackResponse(stack, wl * 1e-9);
        if (Number.isFinite(response.R) && Number.isFinite(response.T)) {
          wls.push(wl);
          R.push(response.R);
          T.push(response.T);
        }
      }
    }
    // Exactly at the design wavelength (not a grid point)
    const design = layers.length > 0 ? stackResponse(stack, designWl * 1e-9) : { R: NaN, T: NaN };

    // Index profile for plotting: f = height / thickness
    const heights: number[] = [];
    const nProfile: number[] = [];
    for (let i = 0; i <= 100; i++) {
      const f = i / 100;
      const n = gradedIndexAt(profile, nSub, nSurface, f);
      if (!Number.isFinite(n)) continue;
      heights.push(thickness * f);
      nProfile.push(n);
    }

    return { wls, R, T, designR: design.R, designT: design.T, heights, nProfile };
  }, [nSub, nInc, nSurface, thickness, profile, designWl]);

  const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(2)}%` : "—");

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>surface</sub></>} value={nSurface} onChange={setNSurface} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Thickness (nm)" value={thickness} onChange={setThickness} min={1} />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} min={1} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Profile</span>
          <select value={profile} onChange={e => setProfile(e.target.value as GradedProfile)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="linear">Linear</option>
            <option value="cosine">Cosine</option>
            <option value="exponential">Exponential</option>
          </select></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">R at Design λ</p>
          <p className="text-3xl font-bold text-blue-400">{pct(tmm.designR)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">T at Design λ</p>
          <p className="text-3xl font-bold text-green-400">{pct(tmm.designT)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="space-y-1 text-sm text-gray-300 font-mono">
          <p>linear: n_s + (n_t − n_s)f</p>
          <p>cosine: n_s + (n_t − n_s)(1 − cos πf)/2</p>
          <p>exponential: n_s(n_t/n_s)^f</p>
          <p>f = height/thickness (n_s = n_substrate, n_t = n_surface)</p>
          <p>Staircase of ≥ 50 sublayers, each at its mid-height index.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Index Profile</p>
          <ChartPanel data={[{ x: tmm.nProfile, y: tmm.heights, type: "scatter", mode: "lines", line: { color: "#a78bfa" } }]} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 }, xaxis: { title: "Refractive Index", gridcolor: "#374151" },
            yaxis: { title: "Height above substrate (nm)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 55 }, height: 280,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Reflectance / Transmittance</p>
          <ChartPanel data={[
            { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "R", line: { color: "#f87171" } },
            { x: tmm.wls, y: tmm.T, type: "scatter", mode: "lines", name: "T", line: { color: "#60a5fa" } },
          ]} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 }, xaxis: { title: "λ (nm)", gridcolor: "#374151" },
            yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 20, r: 20, b: 40, l: 45 }, height: 280,
          }} />
        </div>
      </div>
    </>
  );
}
