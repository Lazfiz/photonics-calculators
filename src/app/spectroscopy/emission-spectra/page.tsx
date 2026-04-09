import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/emission-spectra' },
    title: 'Emission Spectra Fitting',
  description: 'Model photoluminescence emission with asymmetric Gaussian line shapes.'
};

export default function Page() {
  return <PageClient />;
}
