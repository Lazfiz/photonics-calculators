import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Beam Diameter Conversion',
  description: 'Interactive Beam Diameter Conversion calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
