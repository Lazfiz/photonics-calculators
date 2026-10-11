"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import { goochTarryMinimum, lcTransmission } from "../../../physics/polarization/twisted-nematic";
import { extraordinaryIndex } from "../../../physics/polarization/uniaxial";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

interface Preset { label: string; cell: "twisted" | "va"; twist: number; polarizer: number; analyzer: number }
const PRESETS: Preset[] = [
  { label: "TN, normally white", cell: "twisted", twist: 90, polarizer: 0, analyzer: 90 },
  { label: "TN, normally black", cell: "twisted", twist: 90, polarizer: 0, analyzer: 0 },
  { label: "240° supertwist, polarizers ±45°", cell: "twisted", twist: 240, polarizer: 45, analyzer: -45 },
  { label: "ECB (no twist), crossed at 45°", cell: "twisted", twist: 0, polarizer: 45, analyzer: -45 },
  { label: "VA, crossed at 45°", cell: "va", twist: 0, polarizer: 45, analyzer: -45 },
];

export default function LiquidCrystalPolarizerPage() {
  const [cellInput, setCell] = useURLState("cell", "twisted");
  const [wavelengthNm, setWavelength] = useURLState("wavelength", 550);
  const [dnInput, setDn] = useURLState("neNo", 0.2);
  const [noInput, setNo] = useURLState("no", 1.5);
  const [thicknessUm, setThickness] = useURLState("cellThickness", 5);
  const [twistDeg, setTwist] = useURLState("twistAngle", 90);
  const [polarizerDeg, setPolarizer] = useURLState("polarizer", 0);
  const [analyzerDeg, setAnalyzer] = useURLState("analyzer", 0);
  const [tiltDeg, setTilt] = useURLState("tilt", 30);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const va = cellInput === "va";
  const lambda = clamp(wavelengthNm, 380, 780) * 1e-9;
  const dn = clamp(dnInput, 0.01, 0.5);
  const no = clamp(noInput, 1.3, 2);
  const d = clamp(thicknessUm, 0.5, 30) * 1e-6;
  const twist = va ? 0 : clamp(twistDeg, -360, 360) * DEG;
  const pol = clamp(polarizerDeg, -180, 180) * DEG;
  const ana = clamp(analyzerDeg, -180, 180) * DEG;
  const tilt = clamp(tiltDeg, 0, 90) * DEG;

  // VA: the director leans `tilt` from the cell normal; at normal incidence the wave sees n(tilt) − n_o.
  const dnE = va ? extraordinaryIndex(no, no + dn, tilt) - no : dn;
  const gamma = (2 * Math.PI * dnE * d) / lambda;
  const T = lcTransmission(twist, gamma, pol, ana);
  const firstMin = (goochTarryMinimum(1) * lambda) / dn;

  const applyPreset = (p: Preset) => {
    setCell(p.cell);
    setTwist(p.twist);
    setPolarizer(p.polarizer);
    setAnalyzer(p.analyzer);
    if (p.cell === "va") setTilt(0);
  };

  const spectral = useMemo(() => {
    const l = Array.from({ length: 300 }, (_, i) => 380 + (i * 400) / 299);
    return [{
      x: l, y: l.map((x) => lcTransmission(twist, (2 * Math.PI * dnE * d) / (x * 1e-9), pol, ana)),
      type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#60a5fa", width: 2 },
    }];
  }, [twist, pol, ana, dnE, d]);

  const second = useMemo(() => {
    if (va) {
      const t = Array.from({ length: 181 }, (_, i) => i * 0.5);
      const y = t.map((x) => {
        const g = (2 * Math.PI * (extraordinaryIndex(no, no + dn, x * DEG) - no) * d) / lambda;
        return lcTransmission(0, g, pol, ana);
      });
      return { x: t, y, title: "Director tilt from the normal (°)", minima: [] as number[] };
    }
    const r = Array.from({ length: 301 }, (_, i) => i * 0.01);
    const y = r.map((x) => lcTransmission(twist, 2 * Math.PI * x, pol, ana));
    const minima = Math.abs(Math.abs(twist) - Math.PI / 2) < 1e-9 ? [1, 2, 3].map(goochTarryMinimum) : [];
    return { x: r, y, title: "Δn·d/λ", minima };
  }, [va, no, dn, d, lambda, pol, ana, twist]);

  const layout = (x: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: "Transmission", gridcolor: "#374151", range: [-0.05, 1.05] },
    margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300, showlegend: false,
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>Γ = 2πΔn·d/λ, &nbsp;X = √(Φ² + (Γ/2)²), &nbsp;J = R(−Φ)·[cos X·I + (sin X/X)·[[−iΓ/2, Φ], [−Φ, iΓ/2]]]</p>
        <p>90° TN, polarizer along the entrance director, parallel analyzer: T∥ = sin²X/(1 + u²), u = 2Δn·d/λ (Gooch &amp; Tarry)</p>
        <p>VA: Δn<sub>eff</sub> = n(θ<sub>tilt</sub>) − n<sub>o</sub>, &nbsp;1/n(θ)² = cos²θ/n<sub>o</sub>² + sin²θ/n<sub>e</sub>²</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p)} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">
            {p.label}
          </button>
        ))}
        {!va && (
          <button onClick={() => setThickness(Number((firstMin * 1e6).toFixed(3)))} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">
            d at the first Gooch-Tarry minimum
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Cell</span>
          <select value={va ? "va" : "twisted"} onChange={(e) => setCell(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="twisted">Twisted or planar (director in the cell plane)</option>
            <option value="va">Vertically aligned (director tilted from the normal)</option>
          </select>
        </label>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelength} min={380} max={780} step="10" />
        <ValidatedNumberInput label="Δn = nₑ − nₒ" value={dnInput} onChange={setDn} min={0.01} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Cell thickness (μm)" value={thicknessUm} onChange={setThickness} min={0.5} max={30} step="0.1" />
        {va ? (
          <>
            <ValidatedNumberInput label="nₒ" value={noInput} onChange={setNo} min={1.3} max={2} step="0.01" />
            <ValidatedNumberInput label="Director tilt from normal (°)" value={tiltDeg} onChange={setTilt} min={0} max={90} step="1" />
          </>
        ) : (
          <ValidatedNumberInput label="Twist angle Φ (°)" value={twistDeg} onChange={setTwist} min={-360} max={360} step="10" />
        )}
        <ValidatedNumberInput label="Polarizer (° from entrance director)" value={polarizerDeg} onChange={setPolarizer} min={-180} max={180} step="5" />
        <ValidatedNumberInput label="Analyzer (° from entrance director)" value={analyzerDeg} onChange={setAnalyzer} min={-180} max={180} step="5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retardance Γ</p>
          <p className="text-2xl font-bold text-blue-400">{fix(gamma, 3)} rad</p>
          <p className="text-xs text-gray-500">{fix(gamma / (2 * Math.PI), 3)} waves{va ? `; Δn_eff = ${fix(dnE, 4)}` : ""}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn·d/λ</p>
          <p className="text-2xl font-bold text-green-400">{fix((dnE * d) / lambda, 3)}</p>
          {!va && Math.abs(Math.abs(twist) - Math.PI / 2) < 1e-9 && <p className="text-xs text-gray-500">first minimum at √3/2 = 0.866: d = {fix(firstMin * 1e6, 3)} μm</p>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-2xl font-bold text-yellow-400">{fix(T * 100, 2)} %</p>
          <p className="text-xs text-gray-500">of the light after the first polarizer</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Configuration</p>
          <p className="text-sm font-mono text-gray-200">{va ? `VA, tilt ${fix(tilt / DEG, 0)}°` : `twist ${fix(twist / DEG, 0)}°`}</p>
          <p className="text-sm font-mono text-gray-200">P {fix(pol / DEG, 0)}°, A {fix(ana / DEG, 0)}°</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmission against wavelength (Δn held constant)</h3>
          <ChartPanel data={spectral} layout={layout("Wavelength (nm)")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">{va ? "Transmission against director tilt" : "Transmission against Δn·d/λ"}</h3>
          <ChartPanel data={[
            { x: second.x, y: second.y, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#f87171", width: 2 } },
            ...(second.minima.length ? [{ x: second.minima, y: second.minima.map((x) => lcTransmission(twist, 2 * Math.PI * x, pol, ana)), type: "scatter" as const, mode: "markers" as const, name: "Gooch-Tarry points (√3/2, √15/2, √35/2)", marker: { color: "#fbbf24", size: 8 } }] : []),
          ]} layout={layout(second.title)} />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Angles are counter-clockwise looking into the beam, from the entrance director (VA: from the plane the director leans
        in). Not modelled: pretilt, the field-dependent director profile, dispersion of Δn, oblique viewing, reflections.
      </p>
    </>
  );
}
