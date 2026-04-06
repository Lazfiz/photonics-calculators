import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fluorescence Spectra Overlap Calculator',
  description: 'Compare excitation/emission spectra, spectral overlap, and filter crosstalk.'
};

export default function Page() {
  return <PageClient />;
}
