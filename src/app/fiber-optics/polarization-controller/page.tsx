import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Polarization Controller',
  description: 'Interactive Polarization Controller calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
