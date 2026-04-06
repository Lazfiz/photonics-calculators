import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Waveplate Order',
  description: 'Calculate waveplate order, retardation, and wavelength-dependent performance.'
};

export default function Page() {
  return <PageClient />;
}
