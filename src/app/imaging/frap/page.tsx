import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/frap",
    title: 'FRAP Diffusion Coefficient Calculator',
  description: 'Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.'
};

export default function Page() {
  return <PageClient />;
}
