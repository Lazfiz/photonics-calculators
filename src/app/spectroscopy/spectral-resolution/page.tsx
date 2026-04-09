import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/spectral-resolution' },
    title: 'Spectral Resolution Calculator',
  description: 'Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.'
};

export default function Page() {
  return <PageClient />;
}
