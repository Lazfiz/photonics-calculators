"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, h, hc_eV_nm } from "../../../physics/constants";
import { focalIntensityRadius, mixedFocusFwhm } from "../../../physics/imaging/multiphoton-focus";
import {
  averageSfgPower, sfgCoefficient, sfgCoherenceLengths, sumFrequencyWavelength,
} from "../../../physics/imaging/second-harmonic-generation";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");
const sci = (x: number, unit: string) => (Number.isFinite(x) ? `${x.toExponential(2)} ${unit}` : "—");

/** Above this L/b the thin-slab result is shown with a warning; above 1 it is withheld. */
const XI_WARN = 0.1;

export default function SumFrequencyMicroscopyPage() {
  const [l1Raw, setL1] = useURLState("lambda1", 1040); // nm
  const [l2Raw, setL2] = useURLState("lambda2", 800); // nm
  const [naRaw, setNa] = useURLState("na", 0.8);
  const [nRaw, setN] = useURLState("n", 1.33);
  const [p1Raw, setP1] = useURLState("power1", 100); // mW
  const [p2Raw, setP2] = useURLState("power2", 50); // mW
  const [tauRaw, setTau] = useURLState("pulseWidth", 150); // fs FWHM
  const [frepRaw, setFrep] = useURLState("repRate", 80); // MHz
  const [deffRaw, setDeff] = useURLState("deff", 1); // pm/V
  const [thickRaw, setThick] = useURLState("thickness", 0.2); // µm
  const [dnRaw, setDn] = useURLState("deltaN", 0.01); // n(ω₃) − n

  const l1 = clamp(l1Raw, 400, 2000, 1040);
  const l2 = clamp(l2Raw, 400, 2000, 800);
  const na = clamp(naRaw, 0.1, 1.5, 0.8);
  const n = clamp(nRaw, 1, 1.8, 1.33);
  const p1 = clamp(p1Raw, 0, 1000, 100);
  const p2 = clamp(p2Raw, 0, 1000, 50);
  const tau = clamp(tauRaw, 10, 1000, 150);
  const frep = clamp(frepRaw, 0.1, 250, 80);
  const deff = clamp(deffRaw, 0, 100, 1);
  const thick = clamp(thickRaw, 0.001, 100, 0.2);
  const dn = clamp(dnRaw, -0.2, 0.2, 0.01);

  const focusOk = na < n; // the axial FWHM and the focus-derived power need NA < n

  const results = useMemo(() => {
    const lam1 = l1 * 1e-9, lam2 = l2 * 1e-9;
    const w1 = focalIntensityRadius(lam1, na), w2 = focalIntensityRadius(lam2, na);
    const sfg = sfgCoefficient({ lambda1: lam1, lambda2: lam2, length: thick * 1e-6, deff: deff * 1e-12, n, deltaN: dn, w1, w2 });
    const lc = sfgCoherenceLengths(sfg.lambda3, n, dn);
    const fwhm = mixedFocusFwhm([{ lambda: lam1, order: 1 }, { lambda: lam2, order: 1 }], n, na);
    const power = averageSfgPower(sfg.K, p1 * 1e-3, p2 * 1e-3, frep * 1e6, tau * 1e-15);
    return {
      sfgNm: sumFrequencyWavelength(lam1, lam2) * 1e9,
      w1: w1 * 1e6,
      w2: w2 * 1e6,
      lateralNm: focusOk ? fwhm.lateral * 1e9 : NaN,
      axialUm: focusOk ? fwhm.axial * 1e6 : NaN,
      xi: sfg.xi,
      bMinUm: thick / sfg.xi,
      forwardUm: lc.forward * 1e6,
      backwardNm: lc.backward * 1e9,
      power: sfg.xi <= 1 && focusOk ? power : NaN,
    };
  }, [l1, l2, na, n, focusOk, p1, p2, tau, frep, deff, thick, dn]);

  const wavelengthPlot = useMemo(() => {
    const lams2 = Array.from({ length: 161 }, (_, i) => 400 + i * 10);
    return [
      { x: lams2, y: lams2.map((l) => sumFrequencyWavelength(l1, l)), name: "SFG λ", line: { color: "#f472b6" }, type: "scatter", mode: "lines" },
      { x: [l2], y: [results.sfgNm], name: "Current", marker: { color: "#fbbf24", size: 11 }, type: "scatter", mode: "markers" },
    ];
  }, [l1, l2, results.sfgNm]);

  const thicknessPlot = useMemo(() => {
    const lam1 = l1 * 1e-9, lam2 = l2 * 1e-9;
    const w1 = focalIntensityRadius(lam1, na), w2 = focalIntensityRadius(lam2, na);
    const bMin = results.bMinUm;
    // Thin-slab law only: from b/1000 up to b.
    const start = Math.min(thick, bMin / 1000);
    const lengths = Array.from({ length: 61 }, (_, i) => start * (bMin / start) ** (i / 60));
    const at = (L: number) => {
      const K = sfgCoefficient({ lambda1: lam1, lambda2: lam2, length: L * 1e-6, deff: deff * 1e-12, n, deltaN: dn, w1, w2 }).K;
      const P = averageSfgPower(K, p1 * 1e-3, p2 * 1e-3, frep * 1e6, tau * 1e-15) * 1e12;
      return P > 0 && focusOk ? P : NaN;
    };
    return [
      { x: lengths, y: lengths.map(at), name: "Thin slab, L² sinc²(ΔkL/2)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      ...(results.xi <= 1 && focusOk ? [{ x: [thick], y: [at(thick)], name: "Current", marker: { color: "#fbbf24", size: 11 }, type: "scatter", mode: "markers" }] : []),
    ];
  }, [l1, l2, na, n, p1, p2, tau, frep, deff, dn, thick, results.bMinUm, results.xi, focusOk]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Beam 1 wavelength (nm)" value={l1Raw} onChange={setL1} min={400} max={2000} />
          <ValidatedNumberInput label="Beam 2 wavelength (nm)" value={l2Raw} onChange={setL2} min={400} max={2000} />
          <ValidatedNumberInput label="Numerical aperture" value={naRaw} onChange={setNa} min={0.1} max={1.5} step="0.01" />
          <ValidatedNumberInput label="Sample index n (both inputs)" value={nRaw} onChange={setN} min={1} max={1.8} step="0.01" />
          <ValidatedNumberInput label="Beam 1 average power (mW)" value={p1Raw} onChange={setP1} min={0} max={1000} />
          <ValidatedNumberInput label="Beam 2 average power (mW)" value={p2Raw} onChange={setP2} min={0} max={1000} />
          <ValidatedNumberInput label="Pulse width, FWHM, both beams (fs)" value={tauRaw} onChange={setTau} min={10} max={1000} />
          <ValidatedNumberInput label="Repetition rate (MHz)" value={frepRaw} onChange={setFrep} min={0.1} max={250} />
          <ValidatedNumberInput label="d_eff (pm/V)" value={deffRaw} onChange={setDeff} min={0} max={100} step="0.1" />
          <ValidatedNumberInput label="Layer thickness L (µm)" value={thickRaw} onChange={setThick} min={0.001} max={100} step="0.01" />
          <ValidatedNumberInput label="Index mismatch Δn = n(ω₃) − n" value={dnRaw} onChange={setDn} min={-0.2} max={0.2} step="0.001" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {results.xi > 1 && (
            <p className="text-sm text-yellow-300" role="status">The layer is thicker than the focus (L/b = {results.xi.toFixed(2)}): the thin-slab power doesn&apos;t apply, so it isn&apos;t shown.</p>
          )}
          {results.xi > XI_WARN && results.xi <= 1 && (
            <p className="text-sm text-yellow-300" role="status">L/b = {results.xi.toFixed(2)}: the thin-slab power overestimates the signal as L approaches the confocal parameter.</p>
          )}
          {!focusOk && (
            <p className="text-sm text-yellow-300" role="status">The NA must be below the index n for the focus size and the SFG power, so these aren&apos;t shown.</p>
          )}
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SFG wavelength</span><span className="font-mono text-pink-400">{fmt(results.sfgNm, 2, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SFG photon energy</span><span className="font-mono">{fmt(hc_eV_nm / results.sfgNm, 3, "eV")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Focus 1/e² radius, beam 1 / beam 2</span><span className="font-mono">{fmt(results.w1, 3, "")}/ {fmt(results.w2, 3, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral / axial FWHM of I₁·I₂</span><span className="font-mono text-green-400">{fmt(results.lateralNm, 0, "nm")} / {fmt(results.axialUm, 2, "µm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Smaller confocal parameter b</span><span className="font-mono">{fmt(results.bMinUm, 2, "µm")} (L/b = {results.xi.toFixed(3)})</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Coherence length, forward / backward</span><span className="font-mono text-blue-400">{fmt(results.forwardUm, 2, "µm")} / {fmt(results.backwardNm, 1, "nm")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Forward SFG power (thin layer)</span><span className="font-mono text-yellow-400">{sci(results.power * 1e12, "pW")}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SFG photons per second</span><span className="font-mono">{sci((results.power * results.sfgNm * 1e-9) / (h * c), "/s")}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>ω₃ = ω₁ + ω₂, so 1/λ₃ = 1/λ₁ + 1/λ₂ (energy conservation).</p>
            <p>I₃ = 8π² d_eff² I₁ I₂ L² sinc²(ΔkL/2)/(ε₀ c n² n₃ λ₃²), Δk = −2πΔn/λ₃ (Boyd, Nonlinear Optics, eq. 2.2.10 integrated), over the overlap ∫I₁I₂ dA = 2P₁P₂/(π(w₁² + w₂²)).</p>
            <p>Thin uniform layer (L ≪ b), synchronised Gaussian pulses of equal width: ⟨P₃⟩ = K·0.664·⟨P₁⟩⟨P₂⟩/(f τ). Thicker samples need the focused-beam (Boyd–Kleinman) treatment, where the Gouy phase suppresses the forward signal of a thick uniform medium; see the SHG calculator.</p>
            <p>Focus: Gaussian fit to each beam (Zipfel et al. 2003); w = 2ω_xy is the 1/e² intensity radius, not the Airy radius.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">SFG Wavelength vs Beam 2 Wavelength</h2>
          <ChartPanel data={wavelengthPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Beam 2 λ (nm)", gridcolor: "#333" }, yaxis: { title: "SFG λ (nm)", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">SFG Power vs Layer Thickness (up to b)</h2>
          <ChartPanel data={thicknessPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Layer thickness (µm)", type: "log", gridcolor: "#333" }, yaxis: { title: "SFG power (pW)", type: "log", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </>
  );
}
