import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Degree of Polarization',
  description: 'Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.'
};

export default function Page() {
  return <PageClient />;
}
