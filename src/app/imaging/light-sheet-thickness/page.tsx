import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/light-sheet-thickness",
    title: 'Light Sheet Thickness Calculator',
  description: 'Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).',
};

export default function Page() {
  return <PageClient />;
}
