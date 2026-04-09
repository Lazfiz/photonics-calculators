import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/two-photon-microscopy' },
    title: 'Two-Photon Microscopy Calculator',
  description: 'Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.'
};

export default function Page() {
  return <PageClient />;
}
