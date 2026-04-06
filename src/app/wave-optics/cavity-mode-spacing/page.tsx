import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Cavity Mode Spacing',
  description: 'Axial and transverse mode structure of optical resonators.'
};

export default function Page() {
  return <PageClient />;
}
