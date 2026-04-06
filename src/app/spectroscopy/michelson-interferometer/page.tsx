import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Michelson Interferometer',
  description: 'Interferogram spectrum via Fourier transform. Core of FTIR spectroscopy.'
};

export default function Page() {
  return <PageClient />;
}
