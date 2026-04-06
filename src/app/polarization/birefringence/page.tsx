import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Birefringence & Retardation',
  description: 'Phase retardation from crystal birefringence, thickness, and wavelength.'
};

export default function Page() {
  return <PageClient />;
}
