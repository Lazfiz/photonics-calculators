"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  FLUOROPHORES, bandAtWavelength, brightness, emissionFraction, fluorophoreByName, forsterOverlap, forsterRadius, fretEfficiency, relativeSignal,
} from "../../../physics/imaging/fluorophores";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

export default function FluorescenceSpectraPage() {
  const [dye1Name, setDye1] = useURLState("dye1", "EGFP");
  const [dye2Name, setDye2] = useURLState("dye2", "mCherry");
  const [laserRaw, setLaser] = useURLState("laser", 488); // nm
  const [centerRaw, setCenter] = useURLState("filterCenter", 525); // nm
  const [widthRaw, setWidth] = useURLState("filterBW", 50); // nm
  const [kappa2Raw, setKappa2] = useURLState("kappa2", 0.6667);
  const [nRaw, setN] = useURLState("n", 1.4);
  const [rRaw, setR] = useURLState("distance", 5); // nm
  const dye1 = fluorophoreByName(dye1Name);
  const dye2 = fluorophoreByName(dye2Name);
  const laser = clamp(laserRaw, 350, 800, 488) * 1e-9;
  const center = clamp(centerRaw, 350, 900, 525);
  const width = clamp(widthRaw, 1, 300, 50);
  const lo = (center - width / 2) * 1e-9;
  const hi = (center + width / 2) * 1e-9;
  const kappa2 = clamp(kappa2Raw, 0, 4, 2 / 3);
  const n = clamp(nRaw, 1, 2, 1.4);
  const r = clamp(rRaw, 0.5, 20, 5) * 1e-9;

  const dyes = [dye1, dye2].map((f) => ({
    f,
    ex: bandAtWavelength(f.ex, laser),
    inFilter: emissionFraction(f.em, lo, hi),
    signal: relativeSignal(f, [laser], lo, hi),
  }));
  const bleed = dyes[1].signal / dyes[0].signal;
  const J = forsterOverlap(dye1, dye2);
  const R0 = forsterRadius(J, dye1.quantumYield, kappa2, n);
  const E = fretEfficiency(r, R0);

  const wl = Array.from({ length: 451 }, (_, i) => 350 + i);
  const shape = (b: typeof dye1.ex) => wl.map((l) => bandAtWavelength(b, l * 1e-9));
  const integrand = wl.map((l) => bandAtWavelength(dye1.em, l * 1e-9) * bandAtWavelength(dye2.ex, l * 1e-9) * l ** 4);
  const integrandMax = Math.max(...integrand);
  const line = (x: number[], y: number[], name: string, color: string, dash?: string) => ({
    x, y, type: "scatter" as const, mode: "lines" as const, name, line: { color, width: 2, ...(dash ? { dash } : {}) },
  });
  const chart = [
    line(wl, shape(dye1.ex), `${dye1.name} excitation`, "#60a5fa", "dash"),
    line(wl, shape(dye1.em), `${dye1.name} emission`, "#4ade80"),
    line(wl, shape(dye2.ex), `${dye2.name} excitation`, "#fb923c", "dash"),
    line(wl, shape(dye2.em), `${dye2.name} emission`, "#f87171"),
    line(wl, wl.map((l) => (l >= center - width / 2 && l <= center + width / 2 ? 1 : 0)), "Emission filter", "#fbbf24", "dot"),
    line([laser * 1e9, laser * 1e9], [0, 1.05], "Laser line", "#e879f9"),
    line(wl, integrand.map((v) => (integrandMax > 0 ? v / integrandMax : 0)), "Förster integrand F_D ε_A λ⁴ (norm.)", "#a78bfa", "dot"),
  ];

  const select = (value: string, onChange: (v: string) => void, label: string) => (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
        {FLUOROPHORES.map((f) => (
          <option key={f.name} value={f.name}>{`${f.name}: ${f.exPeak_nm}/${f.emPeak_nm} nm, Φ ${f.quantumYield}`}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          {select(dye1.name, setDye1, "Fluorophore 1 (FRET donor)")}
          {select(dye2.name, setDye2, "Fluorophore 2 (FRET acceptor)")}
          <ValidatedNumberInput label="Laser line (nm)" value={laserRaw} onChange={setLaser} min={350} max={800} step="1" />
          <ValidatedNumberInput label="Emission filter centre (nm)" value={centerRaw} onChange={setCenter} min={350} max={900} step="1" />
          <ValidatedNumberInput label="Emission filter width (nm)" value={widthRaw} onChange={setWidth} min={1} max={300} step="1" />
          <ValidatedNumberInput label="Orientation factor κ²" value={kappa2Raw} onChange={setKappa2} min={0} max={4} step="0.01" />
          <ValidatedNumberInput label="Refractive index n" value={nRaw} onChange={setN} min={1} max={2} step="0.01" />
          <ValidatedNumberInput label="Donor–acceptor distance r (nm)" value={rRaw} onChange={setR} min={0.5} max={20} step="0.1" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {dyes.map(({ f, ex, inFilter }, i) => (
            <div key={i} className="space-y-2">
              <p className={`text-sm font-semibold ${i === 0 ? "text-green-400" : "text-red-400"}`}>{f.name}</p>
              {row("Ex/Em peak (FPbase)", `${f.exPeak_nm}/${f.emPeak_nm} nm`)}
              {row("ε, Φ, brightness εΦ", `${f.extinction.toLocaleString("en-US")} M⁻¹cm⁻¹, ${f.quantumYield}, ${brightness(f).toFixed(1)} mM⁻¹cm⁻¹`)}
              {row("Stokes shift", `${f.emPeak_nm - f.exPeak_nm} nm`)}
              {row("Excitation at the laser", fmt(ex * 100, 1, " % of peak"))}
              {row("Emission in the filter", fmt(inFilter * 100, 1, " %"))}
            </div>
          ))}
          {row(`${dye2.name} signal / ${dye1.name} signal in the filter`, fmt(bleed * 100, 2, " %"), "text-yellow-400")}
          {row("Förster overlap J", Number.isFinite(J) ? `${J.toExponential(3)} M⁻¹cm⁻¹nm⁴` : "—", "text-purple-400")}
          {row("Förster radius R₀", fmt(R0 * 1e9, 2, " nm"), "text-purple-400")}
          {row("FRET efficiency at r", fmt(E * 100, 1, " %"), "text-purple-400")}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Spectra</h2>
        <ChartPanel
          data={chart}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 60, r: 20, t: 20, b: 60 },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#333" }, yaxis: { title: "Normalised intensity", gridcolor: "#333", range: [0, 1.05] }, showlegend: true,
          }}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>f(ν) = exp(−(ln2/ln²ρ) ln²(1 + (ν − ν_m)(ρ² − 1)/(ρH)))</p>
          <p>signal ∝ ε f_ex(λ_laser) Φ ∫_filter F(λ)dλ / ∫F(λ)dλ</p>
          <p>J = ∫F_D ε_A λ⁴ dλ / ∫F_D dλ, R₀ = 0.02108 (κ² Φ_D n⁻⁴ J)^(1/6) nm, E = 1/(1 + (r/R₀)⁶)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Peaks, extinction coefficients and quantum yields come from FPbase. Each spectrum is a Siano–Metzler log-normal band
          fitted to the FPbase spectrum above 5 % of its peak (residuals 1–7 % of the peak); the excitation spectrum stands in for
          the absorption. A log-normal band ends at a cutoff, so the weak anti-Stokes tails (emission blue of the cutoff,
          excitation red of it) are zero here: bleed-through that comes only from those tails reads 0.
          The filter is an ideal top hat and the two dyes are compared at equal concentration and equal laser photon flux.
          Against the raw spectra the fits give Förster radii within 2.5 % and filter fractions within 6 percentage points. The
          orientation factor κ² = 2/3 assumes freely rotating dipoles, which fusion proteins often are not.
        </p>
      </div>
    </>
  );
}
