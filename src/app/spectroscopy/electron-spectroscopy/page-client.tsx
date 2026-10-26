"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { imfpTpp2m, kineticEnergy, plasmonEnergy, samplingDepth, TPP2M_MATERIALS, type Tpp2mMaterial } from "../../../physics/spectroscopy/photoemission";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);
const nm = 1e-9;

const SOURCES = [
  { name: "He I (UPS)", energy: 21.22 },
  { name: "He II (UPS)", energy: 40.81 },
  { name: "Mg Kα", energy: 1253.6 },
  { name: "Al Kα", energy: 1486.6 },
  { name: "Ag Lα", energy: 2984.3 },
];

export default function ElectronSpectroscopyPage() {
  const [photonRaw, setPhoton] = useURLState("photonEnergy", 1486.6);
  const [ebRaw, setEb] = useURLState("bindingEnergy", 284.5);
  const [phiRaw, setPhi] = useURLState("workFunction", 4.5);
  const [thetaRaw, setTheta] = useURLState("angle", 0);
  const [material, setMaterial] = useURLState("material", "c");
  const [rhoRaw, setRho] = useURLState("density", 2.2);
  const [nvRaw, setNv] = useURLState("valenceElectrons", 4);
  const [mRaw, setM] = useURLState("molarMass", 12.011);
  const [egRaw, setEg] = useURLState("bandGap", 0);

  const hv = clamp(photonRaw, 5, 20000, 1486.6);
  const Eb = clamp(ebRaw, 0, 20000, 284.5);
  const phi = clamp(phiRaw, 1, 7, 4.5);
  const thetaDeg = clamp(thetaRaw, 0, 85, 0);
  const theta = (thetaDeg * Math.PI) / 180;
  const custom = !Object.hasOwn(TPP2M_MATERIALS, material);
  const mat: Tpp2mMaterial = custom
    ? { rho: clamp(rhoRaw, 0.1, 25, 2.2), Nv: clamp(nvRaw, 0.1, 500, 4), M: clamp(mRaw, 1, 5000, 12.011), Eg: clamp(egRaw, 0, 15, 0) }
    : TPP2M_MATERIALS[material];

  const Ek = kineticEnergy(hv, Eb, phi);
  const emitted = Ek > 0;
  const lambda = emitted ? imfpTpp2m(hv - Eb, mat) : NaN; // TPP-2M energy is referred to the Fermi level
  const depth95 = samplingDepth(lambda, theta);
  const top1nm = -Math.expm1(-nm / (lambda * Math.cos(theta)));
  const belowFit = emitted && hv - Eb < 50, aboveFit = emitted && hv - Eb > 2000;
  const Ep = plasmonEnergy(mat);

  const energies = Array.from({ length: 200 }, (_, i) => 50 * 10 ** ((i / 199) * Math.log10(200))); // above E_F
  const imfpChart = [
    { x: energies.map(r6), y: energies.map((E) => r6(imfpTpp2m(E, mat) / nm)), type: "scatter", mode: "lines", name: "TPP-2M λ", line: { color: "#60a5fa", width: 2 } },
    ...(Number.isFinite(lambda) && hv - Eb <= 10000 ? [{ x: [r6(hv - Eb)], y: [r6(lambda / nm)], type: "scatter", mode: "markers", name: `hν − E_B = ${fmt(hv - Eb, 5)} eV`, line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } }] : []),
  ];
  const zMax = Number.isFinite(depth95) ? 1.5 * depth95 : 10 * nm;
  const zs = Array.from({ length: 200 }, (_, i) => (zMax * i) / 199);
  const depthChart = Number.isFinite(lambda) ? [
    { x: zs.map((z) => r6(z / nm)), y: zs.map((z) => r6(100 * -Math.expm1(-z / (lambda * Math.cos(theta))))), type: "scatter", mode: "lines", name: "Signal from depth < z", line: { color: "#34d399", width: 2 } },
    { x: [r6(depth95 / nm), r6(depth95 / nm)], y: [0, 95], type: "scatter", mode: "lines", name: "95 % depth, 3λ cos θ", line: { color: "#fbbf24", dash: "dash" } },
  ] : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Photon Energy hν (eV)" value={photonRaw} onChange={setPhoton} min={5} max={20000} step="0.1" />
        <ValidatedNumberInput label="Binding Energy E_B vs Fermi Level (eV)" value={ebRaw} onChange={setEb} min={0} max={20000} step="0.1" />
        <ValidatedNumberInput label="Spectrometer Work Function φ_sp (eV)" value={phiRaw} onChange={setPhi} min={1} max={7} step="0.01" />
        <ValidatedNumberInput label="Emission Angle θ from Normal (°)" value={thetaRaw} onChange={setTheta} min={0} max={85} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Material (TPP-2M)</span>
          <select value={custom ? "custom" : material} onChange={(e) => setMaterial(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(TPP2M_MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            <option value="custom">Custom material</option>
          </select>
        </label>
        {custom && <>
          <ValidatedNumberInput label="Density ρ (g/cm³)" value={rhoRaw} onChange={setRho} min={0.1} max={25} step="0.01" />
          <ValidatedNumberInput label="Valence Electrons N_v (per atom/molecule)" value={nvRaw} onChange={setNv} min={0.1} max={500} />
          <ValidatedNumberInput label="Atomic/Molecular Weight M (g/mol)" value={mRaw} onChange={setM} min={1} max={5000} step="0.01" />
          <ValidatedNumberInput label="Band Gap E_g (eV)" value={egRaw} onChange={setEg} min={0} max={15} step="0.1" />
        </>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ResultCard label="Kinetic Energy E_k" value={emitted ? `${fmt(Ek, 6)} eV` : "not emitted"} tone={emitted ? "blue" : "red"}
          subtext={emitted ? "hν − E_B − φ_sp" : `E_B above hν − φ_sp = ${fmt(hv - phi, 5)} eV: use a harder source`} />
        <ResultCard label="Inelastic Mean Free Path λ" value={`${fmt(lambda / nm, 3)} nm`} tone={belowFit ? "red" : aboveFit ? "orange" : "green"}
          subtext={belowFit ? "below 50 eV TPP-2M does not apply" : aboveFit ? "above the 50–2000 eV fit range: extrapolated" : `TPP-2M at hν − E_B, E_p = ${fmt(Ep, 3)} eV`} />
        <ResultCard label="95 % Sampling Depth" value={`${fmt(depth95 / nm, 3)} nm`} tone="yellow" subtext={`3λ cos θ at θ = ${thetaDeg}°`} />
        <ResultCard label="Signal from Top 1 nm" value={`${fmt(100 * top1nm, 3)} %`} tone="purple" subtext="1 − exp(−1 nm/(λ cos θ))" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Common Sources for E_B = {fmt(Eb, 5)} eV</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SOURCES.map((s) => {
            const ek = kineticEnergy(s.energy, Eb, phi);
            const l = ek > 0 ? imfpTpp2m(s.energy - Eb, mat) : NaN;
            return (
              <div key={s.name} className={`rounded p-2 text-sm ${ek > 0 ? "bg-gray-800" : "bg-red-900/30"}`}>
                <p className="text-green-400 font-semibold">{s.name}, {s.energy} eV</p>
                <p className="text-gray-300">{ek > 0 ? `E_k ${fmt(ek, 5)} eV` : "not reached"}</p>
                <p className="text-gray-400">{ek > 0 ? (Number.isFinite(l) ? `λ ${fmt(l / nm, 3)} nm${s.energy - Eb > 2000 ? " (extrapolated)" : ""}` : "λ: below 50 eV") : ""}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={imfpChart} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            title: { text: `IMFP in ${custom ? "Custom Material" : TPP2M_MATERIALS[material].label}`, font: { color: "white" } },
            xaxis: { title: "Electron energy above E_F (eV)", type: "log", gridcolor: "#374151" },
            yaxis: { title: "λ (nm)", type: "log", gridcolor: "#374151" },
            margin: { t: 40, r: 20, b: 50, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          {depthChart.length ? <ChartPanel data={depthChart} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            title: { text: "Where the Signal Comes From", font: { color: "white" } },
            xaxis: { title: "Depth z (nm)", gridcolor: "#374151" },
            yaxis: { title: "Signal from depth < z (%)", gridcolor: "#374151", range: [0, 100] },
            margin: { t: 40, r: 20, b: 50, l: 60 },
          }} /> : <p className="text-sm text-gray-400">No photoelectrons at these energies.</p>}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">{"E_k = hν − E_B − φ_sp,  λ = E/{E_p²[β ln(γE) − C/E + D/E²]} (TPP-2M),  I(z) ∝ e^(−z/(λ cos θ))"}</p>
        <p>A conducting sample in contact with the spectrometer shares its Fermi level, so the measured kinetic energy depends on the
          spectrometer&apos;s work function, not the sample&apos;s; E_B is referred to the Fermi level. In UPS the sample work function is
          hν minus the spectrum width (secondary-electron cutoff to Fermi edge). Insulators charge, which shifts every peak.</p>
        <p className="text-gray-400">TPP-2M (Tanuma, Powell &amp; Penn 1994) is fitted to IMFPs from optical data for 50–2000 eV, with an RMS deviation
          of about 11 %; it takes the energy above the Fermi level, hν − E_B (E_k + φ_sp), and fails below 50 eV, where UPS electrons sit
          (the universal curve puts their IMFP of order 0.5–1 nm). Elastic scattering makes the effective attenuation length 10–30 % shorter than λ, so the depths here are upper estimates.</p>
      </div>
    </>
  );
}
