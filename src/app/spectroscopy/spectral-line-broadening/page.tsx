import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/spectral-line-broadening",
    title: 'Spectral Line Broadening',
  description: 'Doppler, collisional, natural, and Voigt broadening mechanisms.'
};

export default function Page() {
  return <PageClient />;
}
