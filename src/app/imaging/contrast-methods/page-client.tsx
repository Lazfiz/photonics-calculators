"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  dicContrast, dicShearPhase, objectPhase, zernikeContrast, zernikeContrastLinear,
} from "../../../physics/imaging/phase-contrast";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function ContrastMethodsPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const [naRaw, setNa] = useURLState("na", 1.4);
  const [thicknessRaw, setThickness] = useURLState("sampleThickness", 5); // µm
  const [dnRaw, setDn] = useURLState("dnSample", 0.005);
  const [ringRaw, setRing] = useURLState("ring", "positive");
  const [ringTRaw, setRingT] = useURLState("ringTransmission", 25); // %
  const [shearRaw, setShear] = useURLState("shearNm", 150); // nm
  const [edgeRaw, setEdge] = useURLState("edgeNm", 500); // nm
  const [biasRaw, setBias] = useURLState("biasWaves", 0.1); // waves
  const [strayRaw, setStray] = useURLState("strayPct", 0.1); // % of the parallel-polariser intensity
  const wavelength = clamp(wavelengthRaw, 300, 1100, 550);
  const na = clamp(naRaw, 0.05, 1.5, 1.4);
  const thickness = clamp(thicknessRaw, 0, 50, 5);
  const dn = clamp(dnRaw, -0.2, 0.2, 0.005);
  const ring = ringRaw === "negative" ? "negative" : "positive";
  const ringT = clamp(ringTRaw, 1, 100, 25) / 100;
  const shear = clamp(shearRaw, 0, 2000, 150);
  const edge = clamp(edgeRaw, 10, 10000, 500);
  const bias = clamp(biasRaw, 0, 0.5, 0.1);
  const stray = clamp(strayRaw, 0, 10, 0.1) / 100;

  const lambda = wavelength * 1e-9;
  const delta = ring === "positive" ? -Math.PI / 2 : Math.PI / 2;
  const Gamma = 2 * Math.PI * bias;
  const phi = objectPhase(dn, thickness * 1e-6, lambda);
  const pc = zernikeContrast(phi, delta, ringT);
  const pcLinear = zernikeContrastLinear(phi, delta, ringT);
  const dPhi = dicShearPhase(phi, shear * 1e-9, edge * 1e-9);
  const dicPlus = dicContrast(Gamma, dPhi, stray);
  const dicMinus = dicContrast(Gamma, -dPhi, stray);
  const resolution = (0.61 * wavelength) / na; // nm

  const warnings: string[] = [];
  const a = Math.sqrt(ringT);
  if (phi !== 0 && Math.sign(pc) !== Math.sign(pcLinear)) warnings.push(`Contrast reversal: tan(|φ|/2) = ${Math.tan(Math.abs(phi) / 2).toFixed(3)} exceeds the ring amplitude a = ${a.toFixed(3)}, so the object appears with the opposite sign to the ${ring} phase-contrast rule.`);
  else if (Math.abs(phi) > a / 2) warnings.push(`|φ| = ${Math.abs(phi).toFixed(3)} rad is not small next to the ring amplitude a = ${a.toFixed(3)}: the contrast is no longer proportional to φ and the small-φ limit is wrong.`);
  if (shear > resolution) warnings.push(`A shear of ${shear} nm exceeds the resolution ${resolution.toFixed(0)} nm: DIC shows a doubled image.`);
  if (bias === 0 && stray === 0) warnings.push("With zero bias and no stray light the background is black, so the relative contrast is undefined.");

  const tMax = Math.max(20, thickness);
  const ts = Array.from({ length: 201 }, (_, i) => (i * tMax) / 200);
  const phis = ts.map((t) => objectPhase(dn, t * 1e-6, lambda));
  const chart = [
    { x: ts, y: phis.map((p) => zernikeContrast(p, delta, ringT)), type: "scatter" as const, mode: "lines" as const, name: "Phase contrast", line: { color: "#60a5fa" } },
    { x: ts, y: phis.map((p) => zernikeContrastLinear(p, delta, ringT)), type: "scatter" as const, mode: "lines" as const, name: "Phase contrast, small-φ limit", line: { color: "#60a5fa", dash: "dash" } },
    { x: ts, y: phis.map((p) => dicContrast(Gamma, dicShearPhase(p, shear * 1e-9, edge * 1e-9), stray)), type: "scatter" as const, mode: "lines" as const, name: "DIC, +Δφ edge", line: { color: "#f87171" } },
    { x: ts, y: phis.map((p) => dicContrast(Gamma, -dicShearPhase(p, shear * 1e-9, edge * 1e-9), stray)), type: "scatter" as const, mode: "lines" as const, name: "DIC, −Δφ edge", line: { color: "#4ade80" } },
  ];

  const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
  const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)} %` : "—");

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Sample</h2>
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={1100} />
          <ValidatedNumberInput label="Objective NA" value={naRaw} onChange={setNa} min={0.05} max={1.5} step="0.05" />
          <ValidatedNumberInput label="Object thickness t (µm)" value={thicknessRaw} onChange={setThickness} min={0} max={50} step="0.5" />
          <ValidatedNumberInput label="Index step Δn (object − medium)" value={dnRaw} onChange={setDn} min={-0.2} max={0.2} step="0.001" />
          <h2 className="text-lg font-semibold pt-2">Phase contrast</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phase ring</label>
            <select value={ring} onChange={(e) => setRing(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="positive">Positive: direct light advanced λ/4 (denser objects dark)</option>
              <option value="negative">Negative: direct light retarded λ/4 (denser objects bright)</option>
            </select>
          </div>
          <ValidatedNumberInput label="Ring transmission (%)" value={ringTRaw} onChange={setRingT} min={1} max={100} />
          <h2 className="text-lg font-semibold pt-2">DIC</h2>
          <ValidatedNumberInput label="Shear s (nm)" value={shearRaw} onChange={setShear} min={0} max={2000} step="10" />
          <ValidatedNumberInput label="Edge width w (nm)" value={edgeRaw} onChange={setEdge} min={10} max={10000} step="10" />
          <ValidatedNumberInput label="Bias retardation Γ (waves)" value={biasRaw} onChange={setBias} min={0} max={0.5} step="0.01" />
          <ValidatedNumberInput label="Stray light I_c (% of parallel polarisers)" value={strayRaw} onChange={setStray} min={0} max={10} step="0.05" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Sample</h2>
          {row("Optical path difference Δn·t", fmt(dn * thickness * 1e3, 1, " nm"))}
          {row("Phase φ", `${fmt(phi, 4, " rad")} (${fmt((phi * 180) / Math.PI, 1, "°")})`, "text-yellow-400")}
          {row("Lateral resolution 0.61λ/NA", fmt(resolution, 0, " nm"))}
          <h2 className="text-lg font-semibold pt-2">Phase contrast</h2>
          {row("Contrast (I − I_bg)/I_bg", pct(pc), "text-blue-400")}
          {row("Small-φ limit 2φ sin δ/a", pct(pcLinear))}
          <h2 className="text-lg font-semibold pt-2">DIC</h2>
          {row("Phase difference across the shear Δφ", fmt(dPhi, 4, " rad"))}
          {row("Contrast, +Δφ edge", pct(dicPlus), "text-red-400")}
          {row("Contrast, −Δφ edge", pct(dicMinus), "text-green-400")}
          {warnings.map((w) => (
            <p key={w} className="text-yellow-400 text-sm">{w}</p>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Contrast vs object thickness</h2>
        <ChartPanel
          data={chart}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 },
            xaxis: { title: "Object thickness t (µm)", gridcolor: "#333" }, yaxis: { title: "Contrast (I − I_bg)/I_bg", gridcolor: "#333" }, showlegend: true,
          }}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>φ = 2π Δn t/λ</p>
          <p>Phase contrast: U = a e^(iδ) + e^(iφ) − 1, C = (|U|² − a²)/a², a² = ring transmission, δ = ∓π/2</p>
          <p>DIC: I/I_p = sin²((Γ ± Δφ)/2) + I_c, Δφ = φ·min(s, w)/w</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Zernike&apos;s (1942) ideal phase contrast: all of the direct light passes the ring and all of the diffracted light
          misses it, so halos and shade-off from the finite ring width are not modelled. For |φ| ≪ a the contrast is
          2φ sin δ/a; the attenuating ring raises it by 1/a, but the image reverses once tan(|φ|/2) &gt; a. DIC follows the sin² law of a de Sénarmont or biased Nomarski
          system (Salmon &amp; Tran 2007): the phase difference across the shear sets the contrast, so the two edges of an
          object come out bright and dark. The object edge is a linear phase ramp of width w; blurring by the optics is not
          included.
        </p>
      </div>
    </>
  );
}
