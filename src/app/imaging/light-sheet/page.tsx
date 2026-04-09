import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/light-sheet",
    title: 'Light Sheet Microscopy Calculator',
  description: 'Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.'
};

export default function Page() {
  return <PageClient />;
}
