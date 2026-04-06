import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Coherent Raman Microscopy Calculator',
  description: 'Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.'
};

export default function Page() {
  return <PageClient />;
}
