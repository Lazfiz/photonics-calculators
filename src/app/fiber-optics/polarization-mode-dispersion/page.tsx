import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Polarization Mode Dispersion (PMD)',
  description: 'Calculate PMD-induced differential group delay (DGD), system penalties, and PMD-limited reach using Maxwellian statistics.'
};

export default function Page() {
  return <PageClient />;
}
