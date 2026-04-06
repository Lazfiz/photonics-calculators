import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Wavelength Selection',
  description: 'Interactive Wavelength Selection calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
