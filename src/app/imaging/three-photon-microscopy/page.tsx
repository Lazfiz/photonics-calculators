import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Three-Photon Microscopy Calculator',
  description: 'Calculate resolution, excitation volume, and depth penetration for three-photon excitation microscopy at 1300+ nm.'
};

export default function Page() {
  return <PageClient />;
}
