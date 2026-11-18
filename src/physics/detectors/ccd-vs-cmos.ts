/**
 * Pixel SNR and dynamic range of four representative sensors (CCD, sCMOS, phone CMOS, EMCCD). Electrons per pixel.
 * Shot, dark and read noise: J. R. Janesick, Photon Transfer (SPIE 2007), doi:10.1117/3.725073; EM register excess
 * noise: Robbins & Hadwen, IEEE Trans. Electron Devices 50, 1227 (2003), doi:10.1109/TED.2003.813462 (see camera-snr.ts).
 * Kept apart from camera-snr.ts so the many pages that import that module do not ship this table.
 */

import { cameraSnr, dynamicRangeDb, EM_REGISTER_STAGES_CCD97, emExcessNoiseFactorSq, emMaxSignal } from "./camera-snr";

export interface Sensor {
  id: "ccd" | "scmos" | "phone" | "emccd";
  name: string;
  readNoise: number; // e⁻ rms at the output amplifier
  darkCurrent: number; // e⁻/pix/s
  wellCapacity: number; // e⁻, pixel
  registerWell?: number; // e⁻, EM gain register
  pixelSize: number; // µm
  qe: number;
  frameRate: number; // full frame, fps
}

// Representative values. EMCCD: Andor iXon Ultra 897 specifications (17 MHz EM amplifier, −100 °C).
export const SENSORS: Sensor[] = [
  { id: "ccd", name: "CCD", readNoise: 3, darkCurrent: 0.001, wellCapacity: 100000, pixelSize: 15, qe: 0.95, frameRate: 10 },
  { id: "scmos", name: "sCMOS", readNoise: 1.5, darkCurrent: 0.01, wellCapacity: 50000, pixelSize: 6.5, qe: 0.9, frameRate: 100 },
  { id: "phone", name: "Phone CMOS", readNoise: 2, darkCurrent: 5, wellCapacity: 6000, pixelSize: 1.2, qe: 0.65, frameRate: 60 },
  { id: "emccd", name: "EMCCD", readNoise: 89, darkCurrent: 0.00011, wellCapacity: 180000, registerWell: 800000, pixelSize: 16, qe: 0.95, frameRate: 56 },
];

/** Signal, SNR (NaN when saturated), noise floor and dynamic range of one sensor for N photons per pixel, exposure t (s), EM gain. */
export function evaluateSensor(s: Sensor, nPhotons: number, exposureTime: number, emGain: number) {
  const gain = s.registerWell ? emGain : 1;
  const signal = s.qe * nPhotons;
  const dark = s.darkCurrent * exposureTime;
  const maxSignal = s.registerWell ? emMaxSignal(s.wellCapacity, s.registerWell, gain) : s.wellCapacity;
  const excessNoiseFactorSq = s.registerWell ? emExcessNoiseFactorSq(gain, EM_REGISTER_STAGES_CCD97) : 1;
  const saturated = signal + dark > maxSignal;
  return {
    signal,
    saturated,
    snr: saturated ? NaN : cameraSnr({ signal, dark, read: s.readNoise, gain, excessNoiseFactorSq }),
    floor: s.readNoise / gain,
    dynamicRange: dynamicRangeDb(maxSignal, s.readNoise / gain),
  };
}
