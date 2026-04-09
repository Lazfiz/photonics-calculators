import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/wavenumber-converter' },
    title: 'Wavenumber Converter',
  description: 'Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.'
};

export default function Page() {
  return <PageClient />;
}
