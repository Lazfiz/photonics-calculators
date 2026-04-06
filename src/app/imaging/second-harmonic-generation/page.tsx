import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Second Harmonic Generation (SHG) Calculator',
  description: 'SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.'
};

export default function Page() {
  return <PageClient />;
}
