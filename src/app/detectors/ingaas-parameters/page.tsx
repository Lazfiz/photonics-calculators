import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/ingaas-parameters' },
    title: 'InGaAs Detector Parameters',
  description: 'InₓGa₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors.'
};

export default function Page() {
  return <PageClient />;
}
