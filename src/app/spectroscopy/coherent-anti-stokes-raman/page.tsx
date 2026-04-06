import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Coherent Anti-Stokes Raman Scattering (CARS)',
  description: 'Four-wave mixing process for label-free vibrational imaging with chemical specificity.'
};

export default function Page() {
  return <PageClient />;
}
