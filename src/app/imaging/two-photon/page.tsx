import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Two-Photon Microscopy Calculator',
  description: 'Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.'
};

export default function Page() {
  return <PageClient />;
}
