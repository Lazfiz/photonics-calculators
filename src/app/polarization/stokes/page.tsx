import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/stokes",
    title: 'Stokes Parameters',
  description: 'Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.'
};

export default function Page() {
  return <PageClient />;
}
