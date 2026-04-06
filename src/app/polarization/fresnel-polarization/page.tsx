import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fresnel Polarization Calculator',
  description: 'Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.'
};

export default function Page() {
  return <PageClient />;
}
