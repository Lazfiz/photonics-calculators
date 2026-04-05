import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: 'Detector Responsivity',
  description: 'Interactive detector responsivity calculator from quantum efficiency and wavelength, with wavelength sweeps and presets.',
};

export default function Page() {
  return <PageClient />;
}
