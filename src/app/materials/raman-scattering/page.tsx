import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Raman Scattering',
  description: 'Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.'
};

export default function Page() {
  return <PageClient />;
}
