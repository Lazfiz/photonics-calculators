import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Photon Transfer',
  description: 'Interactive Photon Transfer calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
