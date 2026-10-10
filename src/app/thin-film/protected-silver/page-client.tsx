"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { intervalStats } from "../../../physics/math";
import { coatingResponse, type CoatingLayer, type Substrate } from "../../../physics/thin-film/low-emissivity";

const NM = 1e-9;
const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");

export default function ProtectedSilverPage() {
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [agThickness, setAgThickness] = useURLState("agThickness", 80);
  const [nProtect, setNProtect] = useURLState("nProtect", 1.38);
  const [protectThick, setProtectThick] = useURLState("protectThick", 50);
  const [nAdhesion, setNAdhesion] = useURLState("nAdhesion", 2.35);
  const [adhesionThick, setAdhesionThick] = useURLState("adhesionThick", 10);

  const valid = nSub > 0 && nProtect > 0 && nAdhesion > 0 && agThickness >= 0 && protectThick >= 0 && adhesionThick >= 0;
  const substrate = useMemo<Substrate>(() => ({ material: "dielectric", n: nSub }), [nSub]);

  // Air | overcoat | Ag | adhesion layer | substrate, and the same Ag film with nothing on it for comparison.
  const stacks = useMemo(() => {
    const ag: CoatingLayer = { material: "Ag", thickness: agThickness * NM };
    const adhesion: CoatingLayer = { material: "dielectric", n: nAdhesion, thickness: adhesionThick * NM };
    return {
      protectedAg: [{ material: "dielectric", n: nProtect, thickness: protectThick * NM }, ag, adhesion] as CoatingLayer[],
      bare: [ag, adhesion],
    };
  }, [agThickness, nProtect, protectThick, nAdhesion, adhesionThick]);

  const results = useMemo(() => {
    if (!valid) return null;
    const R = (layers: CoatingLayer[]) => (lam: number) => coatingResponse(layers, substrate, lam).R;
    // Minimum of R over 300–1200 nm on a 1 nm grid (the Ag dip near 310 nm is a few nm wide).
    let min = { R: Infinity, wl: NaN };
    for (let w = 300; w <= 1200; w++) {
      const r = R(stacks.protectedAg)(w * NM);
      if (r < min.R) min = { R: r, wl: w };
    }
    return {
      vis: intervalStats(R(stacks.protectedAg), 400 * NM, 700 * NM, 300),
      nir: intervalStats(R(stacks.protectedAg), 700 * NM, 1200 * NM, 250),
      bareVis: intervalStats(R(stacks.bare), 400 * NM, 700 * NM, 300),
      min,
    };
  }, [valid, stacks, substrate]);

  const spectrum = useMemo(() => {
    if (!valid) return null;
    const x = Array.from({ length: 451 }, (_, i) => 300 + 2 * i);
    const resp = x.map((w) => coatingResponse(stacks.protectedAg, substrate, w * NM));
    const bare = x.map((w) => coatingResponse(stacks.bare, substrate, w * NM).R);
    return { x, R: resp.map((s) => s.R), T: resp.map((s) => s.T), A: resp.map((s) => s.A), bare };
  }, [valid, stacks, substrate]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Ag thickness (nm)" value={agThickness} onChange={setAgThickness} min={0} max={1000} step="1" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>overcoat</sub></>} value={nProtect} onChange={setNProtect} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Overcoat thickness (nm)" value={protectThick} onChange={setProtectThick} min={0} max={2000} step="1" />
        <ValidatedNumberInput label={<>n<sub>adhesion</sub> (under the Ag)</>} value={nAdhesion} onChange={setNAdhesion} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Adhesion layer (nm)" value={adhesionThick} onChange={setAdhesionThick} min={0} max={500} step="1" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set positive indices and non-negative thicknesses.</p>}

      {results && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Mean R, 400–700 nm</p>
            <p className="text-2xl font-bold text-blue-400">{pct(results.vis.mean)}</p>
            <p className="text-sm text-gray-500 mt-1">Without overcoat: {pct(results.bareVis.mean)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Mean R, 700–1200 nm</p>
            <p className="text-2xl font-bold text-green-400">{pct(results.nir.mean)}</p>
            <p className="text-sm text-gray-500 mt-1">Minimum in 400–700 nm: {pct(results.vis.min)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Lowest R, 300–1200 nm</p>
            <p className="text-2xl font-bold text-amber-400">{pct(results.min.R)}</p>
            <p className="text-sm text-gray-500 mt-1">at {results.min.wl} nm</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Silver model</h3>
        <p className="text-sm text-gray-300">
          Ag uses the n, k Yang et al. (2015) measured on template-stripped silver, which include the interband edge: R falls to about
          5 % near 310 nm and is under 80 % below about 345 nm, so silver is a poor UV mirror. The overcoat and adhesion layers are lossless with constant
          indices; under opaque Ag (≳ 50 nm) the adhesion layer hardly matters. Exact transfer matrix, normal incidence, back face ignored. Template-stripped silver is
          the best case: evaporated and sputtered films reflect a little less, and much less once they tarnish.
        </p>
      </div>

      {spectrum && (
        <ChartPanel title="Reflectance, transmittance and absorptance" data={[
          { x: spectrum.x, y: spectrum.R, type: "scatter", mode: "lines", name: "R, protected", line: { color: "#60a5fa" } },
          { x: spectrum.x, y: spectrum.bare, type: "scatter", mode: "lines", name: "R, bare Ag", line: { color: "#9ca3af", dash: "dash" } },
          { x: spectrum.x, y: spectrum.T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#34d399" } },
          { x: spectrum.x, y: spectrum.A, type: "scatter", mode: "lines", name: "Absorptance", line: { color: "#fbbf24" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T / A", gridcolor: "#374151", range: [0, 1.02] },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
