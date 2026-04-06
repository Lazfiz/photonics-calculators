import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'FCS Calculator',
  description: 'Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.'
};

export default function Page() {
  return <PageClient />;
}
