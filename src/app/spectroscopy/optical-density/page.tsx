import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/optical-density' },
    title: 'Optical Density',
  description: 'Convert optical density, transmission, and attenuation with interactive presets and slider-based exploration.'
};

export default function Page() {
  return <PageClient />;
}
