import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/coherent-raman",
    title: 'Coherent Raman (CARS/SRS) Calculator',
  description: 'Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.'
};

export default function Page() {
  return <PageClient />;
}
