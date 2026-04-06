import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'CARS Imaging Calculator',
  description: 'Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.'
};

export default function Page() {
  return <PageClient />;
}
