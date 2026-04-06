import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Photon Counting',
  description: 'Interactive Photon Counting calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
