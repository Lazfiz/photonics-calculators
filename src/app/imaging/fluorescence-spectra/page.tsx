import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/fluorescence-spectra' },
    title: 'Fluorescence Spectra Overlap Calculator',
  description: 'Compare excitation/emission spectra, spectral overlap, and filter crosstalk.'
};

export default function Page() {
  return <PageClient />;
}
