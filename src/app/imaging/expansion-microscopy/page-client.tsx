"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { expansionEffectiveResolution } from "../../../physics/imaging/super-resolution";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);
const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function ExpansionMicroscopyPage() {
  const [expansionRaw, setExpansion] = useURLState("magnification", 4);
  const [resolutionRaw, setResolution] = useURLState("originalRes", 250); // nm, the microscope's own resolution
  const [probeRaw, setProbe] = useURLState("probeSize", 10); // nm
  const [linkerRaw, setLinker] = useURLState("labelLinkerLen", 15); // nm
  const [labelling, setLabelling] = useURLState("labelling", "pre");
  const [gelRaw, setGel] = useURLState("gelThickness", 50); // µm before expansion

  const E = clamp(expansionRaw, 1, 20, 4);
  const d = clamp(resolutionRaw, 10, 2000, 250);
  const probe = clamp(probeRaw, 0, 100, 10);
  const linker = clamp(linkerRaw, 0, 100, 15);
  const gel = clamp(gelRaw, 1, 2000, 50);
  const mode = labelling === "post" ? "post" : "pre";
  const other = mode === "pre" ? "post" : "pre";

  const resAt = (e: number, m: "pre" | "post") => expansionEffectiveResolution(d * nm, e, probe * nm, linker * nm, m) / nm;
  const effective = resAt(E, mode);
  const L = Math.hypot(probe, linker);
  const labelTerm = mode === "post" ? L / E : L;

  const Es = Array.from({ length: 77 }, (_, i) => 1 + i * 0.25);
  const chart = [
    { x: Es, y: Es.map((e) => resAt(e, "pre")), type: "scatter" as const, mode: "lines" as const, name: "Pre-expansion labelling", line: { color: "#f87171" } },
    { x: Es, y: Es.map((e) => resAt(e, "post")), type: "scatter" as const, mode: "lines" as const, name: "Post-expansion labelling", line: { color: "#60a5fa" } },
    { x: Es, y: Es.map((e) => d / e), type: "scatter" as const, mode: "lines" as const, name: "d/E (no label size)", line: { color: "#9ca3af", dash: "dash" } },
    { x: [E], y: [effective], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 8 } },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Expansion factor E (×)" value={expansionRaw} onChange={setExpansion} min={1} max={20} />
          <ValidatedNumberInput label="Microscope resolution d (nm)" value={resolutionRaw} onChange={setResolution} min={10} max={2000} />
          <ValidatedNumberInput label="Probe size (nm)" value={probeRaw} onChange={setProbe} min={0} max={100} />
          <ValidatedNumberInput label="Label-linker length (nm)" value={linkerRaw} onChange={setLinker} min={0} max={100} />
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="exm-labelling">Labelling</label>
            <select id="exm-labelling" value={mode} onChange={(e) => setLabelling(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="pre">Before expansion (label expands with the sample)</option>
              <option value="post">After expansion (label binds the expanded sample)</option>
            </select>
          </div>
          <ValidatedNumberInput label="Gel thickness before expansion (µm)" value={gelRaw} onChange={setGel} min={1} max={2000} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results (pre-expansion units)</h2>
          {row("Optical term d/E", fmt(d / E, 1, " nm"))}
          {row("Label displacement √(probe² + linker²)", fmt(L, 1, " nm"))}
          {row(mode === "pre" ? "Label term (not reduced)" : "Label term L/E", fmt(labelTerm, 1, " nm"), "text-cyan-400")}
          {row("Effective resolution", fmt(effective, 1, " nm"), "text-blue-400")}
          {row(`With ${other}-expansion labelling`, fmt(resAt(E, other), 1, " nm"))}
          {row("Field of view (linear)", fmt(100 / E, 1, " %"), "text-purple-400")}
          {row("Field of view (area)", fmt(100 / (E * E), 2, " %"), "text-purple-400")}
          {row("Expanded gel thickness", fmt(gel * E, 0, " µm"), "text-red-400")}
          {row("Volume to image (× unexpanded)", fmt(E ** 3, 0, "×"))}
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>d_eff = √((d/E)² + L²) for labels applied before expansion; √((d/E)² + (L/E)²) for labels applied after it.</p>
            <p>Assumes isotropic expansion; distortion of a few per cent and incomplete labelling add to the error.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Effective resolution vs expansion factor</h2>
        <ChartPanel data={chart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Expansion factor E (×)", gridcolor: "#333" }, yaxis: { title: "Resolution (nm)", type: "log", gridcolor: "#333" }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </>
  );
}
