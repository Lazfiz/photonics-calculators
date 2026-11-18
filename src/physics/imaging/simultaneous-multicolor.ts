/**
 * Simultaneous-multicolor page: spillover between channels, per-channel SNR with the bleed-through of the other dyes
 * as background, and the frame rates of simultaneous and sequential acquisition. Wavelengths in nm (the page's unit),
 * times in s, photon flux in photons/pixel/s. Model tier: textbook (ideal top-hat filters, equal photon flux per laser,
 * Gaussian shot noise). The spillover matrix is `spilloverMatrix` of `fluorophores.ts` (Roederer 2001,
 * doi:10.1002/1097-0320(20011101)45:3<194::AID-CYTO1163>3.0.CO;2-C; FPbase spectra, Lambert 2019,
 * doi:10.1038/s41592-019-0352-8); the camera noise is `cameraNoise` of `detectors/camera-snr.ts` (Janesick 2007).
 */

import { binnedReadNoise, cameraNoise } from "../detectors/camera-snr";
import { fluorophoreByName, spilloverMatrix } from "./fluorophores";

export type AcquisitionMode = "simultaneous" | "sequential";
export type BinMode = "charge" | "digital";

/** One detection channel: the dye, its laser line, and the emission filter (a top hat), all in nm. */
export interface Channel {
  dye: string;
  laser: number;
  center: number;
  width: number;
}

export interface MulticolorInputs {
  channels: readonly Channel[];
  mode: AcquisitionMode;
  /** Own-dye photon flux at the camera, photons/pixel/s. */
  flux: number;
  /** Exposure and readout time, s. */
  exposure: number;
  readout: number;
  /** Binning b (b × b pixels) and how the binned pixel is read. */
  binning: number;
  binMode: BinMode;
  /** Read noise, e⁻ rms; dark current, e⁻/pixel/s; quantum efficiency as a fraction. */
  readNoise: number;
  dark: number;
  qe: number;
}

export interface MulticolorSummary {
  /** Spillover L[i][j]: signal of dye j in channel i over its signal in its own channel j; NaN where dye j gives none. */
  spill: number[][];
  /** SNR of each channel with the bleed-through of the other dyes as background; NaN when a bleed term is NaN. */
  snr: number[];
  /** SNR of the own dye alone. */
  snrOwn: number;
  /** Frame rates, 1/s. */
  fpsSimultaneous: number;
  fpsSequential: number;
  /** Warnings about the filter and laser layout. */
  warnings: string[];
}

/** Warnings about the layout: no own-dye signal, overlapping filters, a laser inside a filter. */
export function layoutWarnings(channels: readonly Channel[], mode: AcquisitionMode, spill: readonly (readonly number[])[]): string[] {
  const warnings: string[] = [];
  channels.forEach((c, i) => {
    if (!Number.isFinite(spill[i][i])) {
      warnings.push(`Channel ${i + 1} detects none of its own dye ${c.dye}: ${mode === "sequential" ? `laser ${i + 1} doesn't excite it` : "no laser excites it"} or the filter misses its emission.`);
    }
    channels.forEach((d, j) => {
      if (j > i && Math.abs(c.center - d.center) < (c.width + d.width) / 2) warnings.push(`Filters ${i + 1} and ${j + 1} overlap: a dichroic can't split the same band twice.`);
    });
    channels.forEach((d, k) => {
      // Sequential: frame i has only laser i, so only that laser reaches filter i.
      if ((mode === "simultaneous" || k === i) && Math.abs(d.laser - c.center) <= c.width / 2) warnings.push(`Laser ${k + 1} (${d.laser} nm) lies inside filter ${i + 1}: it needs a notch filter.`);
    });
  });
  return warnings;
}

export function multicolorSummary(i: MulticolorInputs): MulticolorSummary {
  const lasers = i.channels.map((c) => c.laser * 1e-9);
  const bands = i.channels.map((c) => [(c.center - c.width / 2) * 1e-9, (c.center + c.width / 2) * 1e-9] as const);
  const spill = spilloverMatrix(i.channels.map((c) => fluorophoreByName(c.dye)), lasers, bands, i.mode);

  // Own-dye signal S and dark charge D per binned pixel; bleed-through from the other dyes as background shot noise.
  const pixels = i.binning * i.binning;
  const S = i.flux * i.exposure * i.qe * pixels;
  const D = i.dark * i.exposure * pixels;
  const read = binnedReadNoise(i.readNoise, i.binning, i.binMode);
  return {
    spill,
    snr: spill.map((row, c) => {
      const background = row.reduce((s, l, j) => (j === c ? s : s + l * S), 0);
      return S / cameraNoise({ signal: S, read, dark: D + background });
    }),
    snrOwn: S / cameraNoise({ signal: S, read, dark: D }),
    fpsSimultaneous: 1 / (i.exposure + i.readout),
    fpsSequential: 1 / (i.channels.length * (i.exposure + i.readout)),
    warnings: layoutWarnings(i.channels, i.mode, spill),
  };
}
