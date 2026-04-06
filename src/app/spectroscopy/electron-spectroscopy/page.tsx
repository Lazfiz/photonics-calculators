import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Electron Spectroscopy (XPS/UPS)',
  description: 'Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.'
};

export default function Page() {
  return <PageClient />;
}
