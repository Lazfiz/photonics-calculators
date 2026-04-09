import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/stray-light",
    title: 'Stray Light Rejection',
  description: 'Ghost order analysis and stray light estimation for grating-based spectrometers.'
};

export default function Page() {
  return <PageClient />;
}
