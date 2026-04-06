import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Spectrophotometry',
  description: 'Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.'
};

export default function Page() {
  return <PageClient />;
}
