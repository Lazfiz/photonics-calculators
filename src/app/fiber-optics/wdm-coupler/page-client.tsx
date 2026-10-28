"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { frequencyWidth } from "../../../physics/spectroscopy/wavenumber";
import { ituGrid, channelWavelengths, gaussianPassband, gaussianAdjacentIsolationDb } from "../../../physics/fiber-optics/wdm-channel-plan";

export default function WDMCouplerCalculator() {
  // Ranges keep the spectrum (0.05 nm steps × channels) small: up to 96 channels, CWDM's 20 nm spacing.
  const [channelCountRaw, setChannelCount] = useURLState("channelCount", 8, { min: 1, max: 96 });
  const [channelSpacing, setChannelSpacing] = useURLState("channelSpacing", 0.8, { min: 0.05, max: 20 }); // nm
  const [centerWavelength, setCenterWavelength] = useURLState("centerWavelength", 1550, { min: 800, max: 1700 }); // nm
  const [passbandWidth, setPassbandWidth] = useURLState("passbandWidth", 0.4, { min: 0.01, max: 20 }); // nm
  const [insertionLoss, setInsertionLoss] = useURLState("insertionLoss", 0.5, { min: 0, max: 30 }); // dB
  const channelCount = Math.round(channelCountRaw);

  // Channel plan (SI inside the physics module; nm at the boundary)
  const grid = useMemo(() => ituGrid(channelSpacing * 1e-9, centerWavelength * 1e-9), [channelSpacing, centerWavelength]);
  const channels = useMemo(
    () => channelWavelengths(channelCount, centerWavelength * 1e-9, channelSpacing * 1e-9, grid.equalFrequency).map((m) => m * 1e9),
    [channelCount, centerWavelength, channelSpacing, grid],
  );
  const planInvalid = channels.length === 0 || channels.some((ch) => !Number.isFinite(ch));
  const chMin = planInvalid ? NaN : Math.min(...channels);
  const chMax = planInvalid ? NaN : Math.max(...channels);
  const outOfRange = !planInvalid && (chMin < 800 || chMax > 1700);

  // Frequency spacing in GHz
  const freqSpacing = useMemo(() => {
    return frequencyWidth(centerWavelength * 1e-9, channelSpacing * 1e-9) / 1e9;
  }, [channelSpacing, centerWavelength]);

  const isolationDb = gaussianAdjacentIsolationDb(channelSpacing * 1e-9, passbandWidth * 1e-9);

  // Total bandwidth (first to last channel)
  const totalBandwidth = planInvalid ? NaN : chMax - chMin;

  // Composite spectral response
  const spectrum = useMemo(() => {
    if (planInvalid) return [];
    const wavelengths: number[] = [];
    const composite: number[] = [];
    const il = 10 ** (-insertionLoss / 10);
    const lo = Math.min(...channels);
    const hi = Math.max(...channels);

    const start = Math.max(lo - channelSpacing * 2, 1e-3);
    const end = hi + channelSpacing * 2;
    // Resolve narrow passbands (FWHM/10) but cap the sample count at 6000.
    const step = Math.max((end - start) / 6000, Math.min(0.05, passbandWidth / 10));

    for (let w = start; w <= end; w += step) {
      wavelengths.push(w);
      let maxResp = 0;
      for (const ch of channels) {
        maxResp = Math.max(maxResp, gaussianPassband(w - ch, passbandWidth));
      }
      composite.push(maxResp * il);
    }

    // Individual channels
    const channelTraces = channels.map((ch, i) => {
      const chWl: number[] = [];
      const chResp: number[] = [];
      // ±min(Δλ, 3·FWHM) around the channel, 201 points: resolves the passband without 96 × 20000-point traces.
      const half = Math.min(channelSpacing, 3 * passbandWidth);
      for (let k = 0; k <= 200; k++) {
        const w = ch - half + (k * 2 * half) / 200;
        chWl.push(w);
        chResp.push(gaussianPassband(w - ch, passbandWidth) * il);
      }
      return { x: chWl, y: chResp, type: "scatter" as const, mode: "lines" as const, name: `Ch ${i + 1} (${ch.toFixed(2)} nm)`, line: { color: "#60a5fa", width: 1, dash: "dot" }, showlegend: i < 4 };
    });

    return [
      { x: wavelengths, y: composite, type: "scatter" as const, mode: "lines" as const, name: "Composite", line: { color: "#f59e0b", width: 2.5 } },
      ...channelTraces,
    ];
  }, [channels, planInvalid, passbandWidth, insertionLoss, channelSpacing]);

  const layout = {
    title: `WDM ${channelCount}-Channel Spectral Response`,
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Transmission (norm.)", gridcolor: "#374151", range: [0, 1.1] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98, font: { size: 10 } }, height: 420,
  };

  return (
    <>
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <ValidatedNumberInput label="Number of Channels" value={channelCountRaw} onChange={setChannelCount} min={1} max={96} step="1" />
            </div>
            <div>
              <ValidatedNumberInput label="Channel Spacing (nm)" value={channelSpacing} onChange={setChannelSpacing} min={0.05} max={20} step="0.1" />
            </div>
            <div>
              <ValidatedNumberInput label="Center Wavelength (nm)" value={centerWavelength} onChange={setCenterWavelength} min={800} max={1700} />
            </div>
            <div>
              <ValidatedNumberInput label="Passband Width (nm)" value={passbandWidth} onChange={setPassbandWidth} min={0.01} max={20} step="0.05" />
            </div>
            <div>
              <ValidatedNumberInput label="Insertion Loss (dB)" value={insertionLoss} onChange={setInsertionLoss} min={0} max={30} step="0.1" />
            </div>
          </div>

          <div className="space-y-4">
            {planInvalid && (
              <div role="status" className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-300">
                No result: the plan runs below zero wavelength; reduce the channel count or spacing.
              </div>
            )}
            {outOfRange && (
              <div role="status" className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-300">
                Some channels fall outside 800–1700 nm, beyond the range of the centre-wavelength input and of typical WDM components.
              </div>
            )}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Channel Plan</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {channels.map((ch, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">Ch {i + 1}:</span>
                    <span className="font-mono">{ch.toFixed(2)} nm</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Grid type:</span><span className="font-mono text-yellow-400">{grid.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Frequency spacing:</span><span className="font-mono">{freqSpacing.toFixed(1)} GHz</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total bandwidth:</span><span className="font-mono">{planInvalid ? "n/a" : `${totalBandwidth.toFixed(1)} nm`}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Insertion loss:</span><span className="font-mono">{insertionLoss.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Adjacent-channel isolation (Gaussian passbands):</span><span className="font-mono">{isolationDb.toFixed(1)} dB</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">Δf = c·Δλ / λ²</p>
              <p className="font-mono text-sm mt-1">BW_total = λ_max − λ_min (≈ (N − 1)·Δλ)</p>
              <p className="font-mono text-sm mt-1">ISO = 10·log₁₀(e)·4 ln2·(Δλ/FWHM)² ≈ 12.04·(Δλ/FWHM)² dB</p>
              <p className="text-xs text-gray-400 mt-2">DWDM plans (G.694.1) are spaced equally in frequency, CWDM (G.694.2) in wavelength. Gaussian passbands are illustrative (thin-film filters are flat-topped with steeper skirts, Mach–Zehnder interleavers sin²). G.694.1 anchors channels at 193.1 THz + kΔν, so enter a grid frequency&apos;s wavelength as the centre for an on-grid plan.</p>
            </div>
          </div>
        </div>

        {!planInvalid && (
          <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={spectrum} layout={layout} />
          </div>
        )}
    </>
  );
}
