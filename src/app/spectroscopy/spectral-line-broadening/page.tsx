import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Spectral Line Broadening',
  description: 'Doppler, collisional, natural, and Voigt broadening mechanisms.'
};

export default function Page() {
  return <PageClient />;
}
