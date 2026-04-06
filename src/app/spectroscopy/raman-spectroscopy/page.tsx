import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Raman Spectroscopy',
  description: 'Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.'
};

export default function Page() {
  return <PageClient />;
}
