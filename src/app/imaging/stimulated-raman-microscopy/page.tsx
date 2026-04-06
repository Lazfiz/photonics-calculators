import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Stimulated Raman Scattering Microscopy Calculator',
  description: 'Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.'
};

export default function Page() {
  return <PageClient />;
}
