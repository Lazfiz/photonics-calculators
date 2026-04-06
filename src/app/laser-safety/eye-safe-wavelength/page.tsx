import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Eye-Safe Wavelength Region',
  description: 'Identifies the eye-safe wavelength bands (1400–1500 nm, 1500–1800 nm) where corneal absorption protects the retina. Compare your laser\',s fluence against spectral MPE.'
};

export default function Page() {
  return <PageClient />;
}
