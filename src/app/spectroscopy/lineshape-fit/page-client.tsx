"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function LineshapeFitPage() {
  const [profile, setProfile] = useState<"voigt" | "gaussian" | "lorentzian">("voigt");
  const [center, setCenter] = useURLState("center", 500);
  const [fwhmG, setFwhmG] = useURLState("fwhmG", 0.5);
  const [fwhmL, setFwhmL] = useURLState("fwhmL", 0.3);
  const [amplitude, setAmplitude] = useURLState("amplitude", 1.0);

  const gaussian = (x: number, x0: number, sigma: number) =>
    Math.exp(-0.5 * Math.pow((x - x0) / sigma, 2));

  const lorentzian = (x: number, x0: number, gamma: number) =>
    1 / (1 + Math.pow((x - x0) / gamma, 2));

  // Approximate Voigt via pseudo-Voigt
  const voigt = (x: number, x0: number, sigma: number, gamma: number) => {
    const fg = sigma / (sigma + gamma);
    const fl = gamma / (sigma + gamma);
    return fg * gaussian(x, x0, sigma) + fl * lorentzian(x, x0, gamma);
  };

  const sigma = fwhmG / (2 * Math.sqrt(2 * Math.LN2));
  const gamma = fwhmL / 2;

  const chartData = useMemo(() => {
    const x = Array.from({ length: 500 }, (_, i) => center - 3 + i * 6 / 500);
    const traces: any[] = [];

    if (profile === "voigt" || profile === "gaussian") {
      traces.push({
        x, y: x.map(xi => amplitude * gaussian(xi, center, sigma)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Gaussian", line: { color: "#60a5fa", dash: "dash" },
      });
    }
    if (profile === "voigt" || profile === "lorentzian") {
      traces.push({
        x, y: x.map(xi => amplitude * lorentzian(xi, center, gamma)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Lorentzian", line: { color: "#f87171", dash: "dash" },
      });
    }
    if (profile === "voigt") {
      traces.push({
        x, y: x.map(xi => amplitude * voigt(xi, center, sigma, gamma)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Voigt (pseudo)", line: { color: "#34d399", width: 2 },
      });
    } else if (profile === "gaussian") {
      traces.push({
        x, y: x.map(xi => amplitude * gaussian(xi, center, sigma)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Gaussian", line: { color: "#34d399", width: 2 },
      });
    } else {
      traces.push({
        x, y: x.map(xi => amplitude * lorentzian(xi, center, gamma)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Lorentzian", line: { color: "#34d399", width: 2 },
      });
    }
    return traces;
  }, [profile, center, fwhmG, fwhmL, amplitude, sigma, gamma]);

  const fwhmV = profile === "voigt"
    ? 0.5346 * fwhmL + Math.sqrt(0.2166 * fwhmL * fwhmL + fwhmG * fwhmG)
    : profile === "gaussian" ? fwhmG : fwhmL;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Lineshape Fitting" description="Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Profile</span>
          <select value={profile} onChange={e => setProfile(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="voigt">Voigt (pseudo-Voigt)</option>
            <option value="gaussian">Gaussian</option>
            <option value="lorentzian">Lorentzian</option>
          </select>
        </label>
        <ValidatedNumberInput label="Center (nm)" value={center} onChange={setCenter} />
        <ValidatedNumberInput label="Gaussian FWHM (nm)" value={fwhmG} onChange={setFwhmG} min={0.01} step="0.01" />
        <ValidatedNumberInput label="Lorentzian FWHM (nm)" value={fwhmL} onChange={setFwhmL} min={0.01} step="0.01" />
        <ValidatedNumberInput label="Amplitude" value={amplitude} onChange={setAmplitude} min={0.01} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gaussian σ</p>
          <p className="text-xl font-bold text-blue-400">{sigma.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lorentzian γ</p>
          <p className="text-xl font-bold text-red-400">{gamma.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM ({profile})</p>
          <p className="text-xl font-bold text-green-400">{fwhmV.toFixed(4)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">Gaussian:</span> G(ν) = exp(−½[(ν−ν₀)/σ]²), σ = FWHM<sub>G</sub> / (2√(2 ln2))</p>
        <p><span className="text-red-400">Lorentzian:</span> L(ν) = 1 / (1 + [(ν−ν₀)/γ]²), γ = FWHM<sub>L</sub> / 2</p>
        <p><span className="text-green-400">Pseudo-Voigt:</span> V(ν) = f<sub>G</sub>·G(ν) + f<sub>L</sub>·L(ν)</p>
        <p><span className="text-gray-400">FWHM<sub>V</sub> ≈ 0.5346·FWHM<sub>L</sub> + √(0.2166·FWHM<sub>L</sub>² + FWHM<sub>G</sub>²)</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} />
    </CalculatorShell>
  );
}
