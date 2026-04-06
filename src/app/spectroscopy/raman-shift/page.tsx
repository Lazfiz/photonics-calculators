import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Raman Shift Calculator',
  description: 'Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.'
};

export default function Page() {
  return <PageClient />;
}
