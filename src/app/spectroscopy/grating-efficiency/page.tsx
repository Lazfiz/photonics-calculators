import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Grating Efficiency Calculator',
  description: 'Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.'
};

export default function Page() {
  return <PageClient />;
}
