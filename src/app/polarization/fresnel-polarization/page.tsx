import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/fresnel-polarization",
    title: 'Fresnel Polarization Calculator',
  description: 'Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.'
};

export default function Page() {
  return <PageClient />;
}
