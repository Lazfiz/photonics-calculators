"use client";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { COLOR_CENTERS, stokesShift, type ColorCenterId } from "../../../physics/materials/color-centers";
import { dopantAbsorption } from "../../../physics/materials/dopant-absorption";
import { absorbanceFromNapierian } from "../../../physics/spectroscopy/lambert-beer-law";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const SIGMA_UNIT = 1e-21; // m² = 10⁻¹⁷ cm², the unit of the cross-section input
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const IDS = Object.keys(COLOR_CENTERS) as ColorCenterId[];
const nm = (x: number) => (x * 1e9).toFixed(1);

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function ColorCentersPage() {
  const [centerRaw, setCenter] = useURLState("center", "nv");
  const [absRaw, setAbs] = useURLState("absPeak", 0); // nm; 0 = the preset
  const [emRaw, setEm] = useURLState("emPeak", 0); // nm; 0 = the preset
  const [sigmaRaw, setSigma] = useURLState("sigmaA", 0); // 1e-17 cm²; 0 = the preset
  const [concRaw, setConc] = useURLState("concentration", 1e24); // m⁻³
  const [thickRaw, setThick] = useURLState("thickness", 0.5); // mm

  const id = IDS.find((k) => k === centerRaw) ?? "nv";
  const center = COLOR_CENTERS[id];
  const absInput = absRaw > 0 ? absRaw : Number(nm(center.absorptionPeak));
  const emInput = emRaw > 0 ? emRaw : Number(nm(center.emissionPeak));
  const presetSigma = Number((center.sigmaA / SIGMA_UNIT).toPrecision(6));
  const sigmaInput = sigmaRaw > 0 ? sigmaRaw : presetSigma;
  const absPeak = clamp(absInput, 100, 5000, 500) * 1e-9;
  const emPeak = clamp(emInput, 100, 5000, 600) * 1e-9;
  const sigmaA = Number.isFinite(sigmaInput) ? clamp(sigmaInput, 1e-6, 1e4, 1) * SIGMA_UNIT : NaN;
  const conc = clamp(concRaw, 0, 1e28, 1e24);
  const thickness = clamp(thickRaw, 1e-3, 1000, 0.5) * 1e-3;

  const s = stokesShift(absPeak, emPeak);
  const r = dopantAbsorption(sigmaA, conc, thickness);
  const od = absorbanceFromNapierian(r.alpha, thickness);
  const choose = (k: string) => { setCenter(k); setAbs(0); setEm(0); setSigma(0); };

  return (
    <>
      <div className="mb-6">
        <label htmlFor="center" className="block text-sm font-medium mb-2">Centre</label>
        <select id="center" value={id} onChange={(e) => choose(e.target.value)}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          {IDS.map((k) => <option key={k} value={k}>{COLOR_CENTERS[k].name} in {COLOR_CENTERS[k].host}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          Choosing a centre fills its band maxima at room temperature{Number.isFinite(center.sigmaA)
            ? ` and its absorption cross-section at ${nm(center.sigmaLambda)} nm`
            : "; no cross-section is cited for it, so enter one to get the absorption"}. Edit any value for another centre.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Absorption Peak (nm)" value={absInput} onChange={setAbs} min={100} max={5000} step="any" />
        <ValidatedNumberInput label="Emission Peak (nm)" value={emInput} onChange={setEm} min={100} max={5000} step="any" />
        <ValidatedNumberInput label="Absorption Cross-Section (×10⁻¹⁷ cm²)" value={Number.isFinite(sigmaInput) ? sigmaInput : 0} onChange={setSigma} min={0} max={10000} step="any" />
        <ValidatedNumberInput label="Centre Density (m⁻³)" value={concRaw} onChange={setConc} min={0} max={1e28} step="any" />
        <ValidatedNumberInput label="Thickness (mm)" value={thickRaw} onChange={setThick} min={0.001} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card label="Stokes Shift" value={show(s.energyEv, () => `${s.energyEv.toFixed(3)} eV`)}
          sub={show(s.wavenumber, () => `${(s.wavenumber / 100).toFixed(0)} cm⁻¹, ${((emPeak - absPeak) * 1e9).toFixed(1)} nm`)} tone="text-yellow-400" />
        <Card label="Quantum Defect" value={show(s.quantumDefect, () => `${(s.quantumDefect * 100).toFixed(1)} %`)}
          sub="1 − λ_abs/λ_em: energy left as heat per photon at unit quantum yield" tone="text-red-400" />
        <Card label="Zero-Phonon Line" value={absRaw > 0 || emRaw > 0 ? "—" : show(center.zpl, () => `${nm(center.zpl)} nm`)}
          sub={absRaw > 0 || emRaw > 0 ? "preset peaks edited" : Number.isFinite(center.zpl) ? "between the band maxima" : "not listed for this centre"} tone="text-gray-200" />
        <Card label="Absorption Coefficient α" value={show(r.alpha, () => `${(r.alpha / 100).toPrecision(4)} cm⁻¹`)}
          sub={Number.isFinite(sigmaA) ? "σN at the cross-section's wavelength" : "enter a cross-section"} tone="text-yellow-400" />
        <Card label="Optical Density" value={show(od, () => od.toPrecision(4))} sub="αd/ln 10" tone="text-gray-200" />
        <Card label="Transmitted" value={show(r.transmission, () => `${(r.transmission * 100).toPrecision(4)} %`)}
          sub="e^(−αd), no surface reflections" tone="text-green-400" />
      </div>
      {s.energyEv < 0 && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          The emission peak is below the absorption peak: an anti-Stokes shift, which band maxima of a single centre do
          not show. Check the two wavelengths.
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Preset Centres</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-1">Centre</th><th className="text-right py-1">Absorption (nm)</th>
              <th className="text-right py-1">ZPL (nm)</th><th className="text-right py-1">Emission (nm)</th>
              <th className="text-right py-1">Stokes (eV)</th><th className="text-right py-1">σ_a (×10⁻¹⁷ cm²)</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((k) => {
              const cc = COLOR_CENTERS[k];
              const ss = stokesShift(cc.absorptionPeak, cc.emissionPeak);
              return (
                <tr key={k} className="border-b border-gray-800/50">
                  <td className="py-1">{cc.name} ({cc.host})</td>
                  <td className="text-right py-1">{nm(cc.absorptionPeak)}</td>
                  <td className="text-right py-1">{show(cc.zpl, () => nm(cc.zpl))}</td>
                  <td className="text-right py-1">{nm(cc.emissionPeak)}</td>
                  <td className="text-right py-1">{ss.energyEv.toFixed(3)}</td>
                  <td className="text-right py-1">{show(cc.sigmaA, () => `${Number((cc.sigmaA / SIGMA_UNIT).toPrecision(3))} at ${nm(cc.sigmaLambda)} nm`)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>ΔE = hc(1/λ_abs − 1/λ_em)</p>
          <p>quantum defect = 1 − λ_abs/λ_em</p>
          <p>α = σN; OD = αd/ln 10; T = e^(−αd)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          The lattice relaxes after absorption, so a centre emits at lower energy than it absorbs: the Stokes shift
          between the band maxima. In the linear coupling model it is about 2Sħω, with S the Huang–Rhys factor and
          ħω the phonon energy, but that holds only approximately. Band maxima only; band shapes, their temperature
          dependence and the quantum yield are not modelled.
        </p>
      </div>
    </>
  );
}
